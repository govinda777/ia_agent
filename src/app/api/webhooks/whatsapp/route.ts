/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WHATSAPP WEBHOOK - Endpoint principal para receber mensagens
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Rota: /api/webhooks/whatsapp
 * 
 * Este webhook recebe mensagens da Meta API e processa com o agente de IA.
 * 
 * Fluxo:
 * 1. Validação do Webhook (assinatura)
 * 2. Identificação/Criação da Thread
 * 3. Carregamento de Contexto (últimas mensagens)
 * 4. RAG - Injeção de Knowledge Base
 * 5. Processamento com IA (generateText + tools)
 * 6. Persistência da resposta
 * 7. Envio para WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    verifyWebhookSignature,
    extractMessagesFromPayload,
    sendWhatsAppMessage,
    markMessageAsRead,
    isWebhookVerification,
    handleWebhookVerification,
    type WhatsAppWebhookPayload,
} from '@/server/services/meta-whatsapp.service';
import { getOrCreateThreadAction, addMessageToThreadAction } from '@/server/actions/thread.actions';
import { getDefaultAgent } from '@/server/queries/agent.queries';
import { getActiveKnowledgeByAgentId } from '@/server/queries/knowledge.queries';
import { getContextMessages } from '@/server/queries/message.queries';
import { generateAgentResponse, buildSystemPrompt, getToolsForAgent, FALLBACK_RESPONSE } from '@/lib/ai';
import { db } from '@/lib/db';
import { toolCalls } from '@/db/schema';

// ID do usuário padrão (em produção, seria dinâmico baseado no número de telefone)
// TODO: Implementar multi-tenancy
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';

/**
 * GET - Verificação do Webhook (Challenge)
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    if (isWebhookVerification(searchParams)) {
        const result = handleWebhookVerification(searchParams);

        if (result.verified) {
            console.log('[Webhook] Verificação bem-sucedida');
            return new NextResponse(result.challenge, { status: 200 });
        }

        console.error('[Webhook] Verificação falhou');
        return new NextResponse('Forbidden', { status: 403 });
    }

    return new NextResponse('OK', { status: 200 });
}

/**
 * POST - Receber mensagens
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // 1. Ler e validar payload
        const rawBody = await request.text();
        const signature = request.headers.get('x-hub-signature-256');

        // Validar assinatura (desabilitar em desenvolvimento se necessário)
        if (process.env.NODE_ENV === 'production' && signature) {
            if (!verifyWebhookSignature(rawBody, signature)) {
                console.error('[Webhook] Assinatura inválida');
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);

        // 2. Extrair mensagens de texto
        const incomingMessages = extractMessagesFromPayload(payload);

        if (incomingMessages.length === 0) {
            // Pode ser um status update ou outro tipo de evento
            return new NextResponse('OK', { status: 200 });
        }

        // Processar cada mensagem (normalmente só uma por request)
        for (const incoming of incomingMessages) {
            await processIncomingMessage(incoming);
        }

        console.log(`[Webhook] Processado em ${Date.now() - startTime}ms`);
        return new NextResponse('OK', { status: 200 });

    } catch (error) {
        console.error('[Webhook] Erro:', error);
        // Retornar 200 para evitar retry infinito da Meta
        return new NextResponse('OK', { status: 200 });
    }
}

/**
 * Processa uma mensagem individual
 */
async function processIncomingMessage(message: {
    from: string;
    fromName: string;
    messageId: string;
    timestamp: Date;
    text: string;
}) {
    const { from, fromName, messageId, text } = message;

    console.log(`[Webhook] Mensagem de ${from}: ${text.substring(0, 50)}...`);

    try {
        // 1. Buscar agente padrão
        const agent = await getDefaultAgent(DEFAULT_USER_ID);

        if (!agent) {
            console.error('[Webhook] Nenhum agente configurado');
            await sendWhatsAppMessage({
                to: from,
                message: 'Desculpe, nosso assistente está temporariamente indisponível. Tente novamente mais tarde.',
            });
            return;
        }

        // 2. Criar/buscar thread
        const threadResult = await getOrCreateThreadAction(
            DEFAULT_USER_ID,
            agent.id,
            from,
            fromName
        );

        if (!threadResult.success || !threadResult.thread) {
            console.error('[Webhook] Erro ao criar thread');
            return;
        }

        const thread = threadResult.thread;

        // 3. Salvar mensagem do usuário
        await addMessageToThreadAction(thread.id, {
            role: 'user',
            content: text,
            metadata: { waMessageId: messageId },
            isFromWebhook: true,
        });

        // 4. Marcar como lida
        await markMessageAsRead(messageId);

        // 5. Carregar contexto (últimas mensagens)
        const contextMessages = await getContextMessages(thread.id, 10);

        // 6. Carregar knowledge base
        const knowledge = await getActiveKnowledgeByAgentId(agent.id);

        // 7. Construir System Prompt
        const systemPrompt = buildSystemPrompt({
            agent: {
                name: agent.name,
                systemPrompt: agent.systemPrompt,
                enabledTools: agent.enabledTools || [],
            },
            knowledge: knowledge.map(k => ({
                topic: k.topic,
                content: k.content,
            })),
            threadContext: contextMessages.slice(-5).map(m => ({
                role: m.role,
                content: m.content,
            })),
            contactInfo: {
                name: thread.contactName || fromName,
                phone: from,
            },
        });

        // 8. Preparar mensagens para a IA
        const aiMessages = contextMessages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
        }));

        // Adicionar mensagem atual
        aiMessages.push({ role: 'user' as const, content: text });

        // 9. Preparar tools
        const tools = agent.enabledTools && agent.enabledTools.length > 0
            ? getToolsForAgent(agent.enabledTools)
            : undefined;

        // 10. Chamar IA
        const aiResult = await generateAgentResponse({
            model: agent.modelConfig?.model || 'gpt-4o-mini',
            systemPrompt,
            messages: aiMessages,
            tools,
            temperature: agent.modelConfig?.temperature || 0.7,
            maxTokens: agent.modelConfig?.maxTokens || 1024,
        });

        let responseText: string;

        if (aiResult.success) {
            responseText = aiResult.text || FALLBACK_RESPONSE;

            // Salvar tool calls se houver
            if (aiResult.toolCalls && aiResult.toolCalls.length > 0) {
                // Primeiro salvar a mensagem do assistant
                const messageResult = await addMessageToThreadAction(thread.id, {
                    role: 'assistant',
                    content: responseText,
                    metadata: aiResult.metadata,
                    isFromWebhook: true,
                });

                // Depois salvar os tool calls
                if (messageResult.success && messageResult.message) {
                    for (const toolCall of aiResult.toolCalls) {
                        await db.insert(toolCalls).values({
                            messageId: messageResult.message.id,
                            toolName: toolCall.toolName,
                            input: toolCall.args as Record<string, unknown>,
                            output: null, // Será preenchido pelo resultado
                            status: 'success',
                        });
                    }
                }
            } else {
                // Salvar resposta simples
                await addMessageToThreadAction(thread.id, {
                    role: 'assistant',
                    content: responseText,
                    metadata: aiResult.metadata,
                    isFromWebhook: true,
                });
            }
        } else {
            console.error('[Webhook] Erro na IA:', aiResult.error);
            responseText = FALLBACK_RESPONSE;

            await addMessageToThreadAction(thread.id, {
                role: 'assistant',
                content: responseText,
                metadata: { error: aiResult.error },
                isFromWebhook: true,
            });
        }

        // 11. Enviar resposta para WhatsApp
        const sendResult = await sendWhatsAppMessage({
            to: from,
            message: responseText,
        });

        if (!sendResult.success) {
            console.error('[Webhook] Erro ao enviar resposta:', sendResult.error);
        }

    } catch (error) {
        console.error('[Webhook] Erro no processamento:', error);

        // Tentar enviar mensagem de fallback
        await sendWhatsAppMessage({
            to: from,
            message: FALLBACK_RESPONSE,
        });
    }
}
