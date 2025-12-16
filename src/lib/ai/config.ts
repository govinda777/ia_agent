/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI CONFIG - Configuração do Vercel AI SDK
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Este arquivo configura o cliente OpenAI e exporta funções utilitárias
 * para geração de texto com o Vercel AI SDK.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, type CoreMessage, type CoreTool } from 'ai';

// Validação de variável de ambiente
if (!process.env.OPENAI_API_KEY) {
    console.warn(
        '⚠️ OPENAI_API_KEY is not defined. AI features will not work.\n' +
        'Add it to your .env.local file.'
    );
}

/**
 * Cliente OpenAI configurado
 */
export const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    compatibility: 'strict', // Strict OpenAI API compatibility
});

/**
 * Modelos disponíveis com suas configurações
 */
export const AI_MODELS = {
    'gpt-4o': openai('gpt-4o'),
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4-turbo': openai('gpt-4-turbo'),
} as const;

export type AIModelId = keyof typeof AI_MODELS;

/**
 * Interface para configuração de geração
 */
export interface GenerateConfig {
    model: AIModelId;
    systemPrompt: string;
    messages: CoreMessage[];
    tools?: Record<string, CoreTool>;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Gera uma resposta de texto usando o modelo especificado.
 * Esta é a função principal para processar mensagens no webhook.
 * 
 * @example
 * const result = await generateAgentResponse({
 *   model: 'gpt-4o-mini',
 *   systemPrompt: 'Você é um assistente...',
 *   messages: [{ role: 'user', content: 'Olá!' }],
 * });
 */
export async function generateAgentResponse(config: GenerateConfig) {
    const {
        model,
        systemPrompt,
        messages,
        tools,
        temperature = 0.7,
        maxTokens = 1024,
    } = config;

    const startTime = Date.now();

    try {
        const result = await generateText({
            model: AI_MODELS[model],
            system: systemPrompt,
            messages,
            tools,
            temperature,
            maxTokens,
            // Configurações adicionais
            maxRetries: 2,
        });

        const latencyMs = Date.now() - startTime;

        return {
            success: true as const,
            text: result.text,
            toolCalls: result.toolCalls,
            toolResults: result.toolResults,
            usage: result.usage,
            finishReason: result.finishReason,
            metadata: {
                model,
                latencyMs,
                tokensUsed: result.usage?.totalTokens || 0,
            },
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;

        return {
            success: false as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: {
                model,
                latencyMs,
                tokensUsed: 0,
            },
        };
    }
}

/**
 * Verifica se a API key está configurada
 */
export function isAIConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
}
