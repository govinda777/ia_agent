/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CHAT PREVIEW API - Endpoint para testar agentes no dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Rota: /api/chat/preview
 * 
 * Este endpoint permite testar um agente diretamente no dashboard,
 * sem precisar de um telefone real conectado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentWithKnowledge } from '@/server/queries/agent.queries';
import { generateAgentResponse, buildSystemPrompt, getToolsForAgent } from '@/lib/ai';
import { z } from 'zod';

// Schema de validação
const requestSchema = z.object({
    agentId: z.string().uuid(),
    message: z.string().min(1),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
    })).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar request
        const validated = requestSchema.parse(body);
        const { agentId, message, history = [] } = validated;

        // Buscar agente com knowledge
        const agentData = await getAgentWithKnowledge(agentId);

        if (!agentData) {
            return NextResponse.json(
                { error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        // Construir System Prompt
        const systemPrompt = buildSystemPrompt({
            agent: {
                name: agentData.name,
                systemPrompt: agentData.systemPrompt,
                enabledTools: agentData.enabledTools || [],
            },
            knowledge: agentData.knowledge.map(k => ({
                topic: k.topic,
                content: k.content,
            })),
            threadContext: history.slice(-5),
            contactInfo: {
                name: 'Usuário de Teste',
            },
        });

        // Preparar mensagens
        const messages = [
            ...history,
            { role: 'user' as const, content: message },
        ];

        // Preparar tools
        const tools = agentData.enabledTools && agentData.enabledTools.length > 0
            ? getToolsForAgent(agentData.enabledTools)
            : undefined;

        // Chamar IA
        const result = await generateAgentResponse({
            model: agentData.modelConfig?.model || 'gpt-4o-mini',
            systemPrompt,
            messages,
            tools,
            temperature: agentData.modelConfig?.temperature || 0.7,
            maxTokens: agentData.modelConfig?.maxTokens || 1024,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            text: result.text,
            toolCalls: result.toolCalls,
            usage: result.usage,
            metadata: result.metadata,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }

        console.error('[Chat Preview API]', error);
        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}
