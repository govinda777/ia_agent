/**
 * SummarizationMiddleware - Sumarização automática de conversas
 * 
 * Baseado em: https://docs.langchain.com/oss/python/langchain/short-term-memory#summarize-messages
 * 
 * Quando a conversa fica muito longa, automaticamente:
 * 1. Sumariza as mensagens antigas
 * 2. Mantém as últimas N mensagens intactas
 * 3. Substitui mensagens antigas por um resumo
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AgentMessage, AgentState, createMessage } from '../agent-state';

// ════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ════════════════════════════════════════════════════════════════════

export interface SummarizationConfig {
    /** Número máximo de mensagens antes de sumarizar */
    maxMessages: number;
    /** Número de mensagens recentes a manter intactas */
    keepRecent: number;
    /** Modelo a usar para sumarização (mais barato) */
    model: string;
    /** Tamanho máximo do resumo em tokens aproximados */
    maxSummaryTokens: number;
}

const DEFAULT_CONFIG: SummarizationConfig = {
    maxMessages: 20,
    keepRecent: 10,
    model: 'gpt-4o-mini',
    maxSummaryTokens: 500,
};

// ════════════════════════════════════════════════════════════════════
// PROMPT DE SUMARIZAÇÃO
// ════════════════════════════════════════════════════════════════════

const SUMMARIZATION_PROMPT = `Você é um assistente especializado em resumir conversas.

Resuma a conversa abaixo de forma concisa, mantendo:
1. Informações importantes sobre o cliente (nome, área, desafio)
2. Decisões tomadas
3. Próximos passos acordados
4. Tom emocional da conversa

Seja objetivo e mantenha o resumo em no máximo 3-4 frases.

CONVERSA:
{messages}

RESUMO:`;

// ════════════════════════════════════════════════════════════════════
// MIDDLEWARE DE SUMARIZAÇÃO
// ════════════════════════════════════════════════════════════════════

export class SummarizationMiddleware {
    private config: SummarizationConfig;

    constructor(config: Partial<SummarizationConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Verifica se a conversa precisa ser sumarizada
     */
    needsSummarization(state: AgentState): boolean {
        return state.messages.length > this.config.maxMessages;
    }

    /**
     * Processa o estado, sumarizando se necessário
     */
    async process(state: AgentState): Promise<AgentState> {
        if (!this.needsSummarization(state)) {
            return state;
        }

        console.log(`[SummarizationMiddleware] 📝 Sumarizando conversa (${state.messages.length} mensagens)`);

        // Separar mensagens para sumarizar e manter
        const messagesToSummarize = state.messages.slice(0, -this.config.keepRecent);
        const messagesToKeep = state.messages.slice(-this.config.keepRecent);

        // Gerar resumo
        const summary = await this.generateSummary(messagesToSummarize);

        // Criar mensagem de sistema com o resumo
        const summaryMessage = createMessage(
            'system',
            `[RESUMO DA CONVERSA ANTERIOR]\n${summary}`,
            { type: 'summary', originalCount: messagesToSummarize.length }
        );

        // Retornar novo estado com mensagens sumarizadas
        return {
            ...state,
            messages: [summaryMessage, ...messagesToKeep],
            metadata: {
                ...state.metadata,
                summarized: true,
                summaryContent: summary,
                lastActivity: new Date(),
            },
        };
    }

    /**
     * Gera o resumo das mensagens
     */
    private async generateSummary(messages: AgentMessage[]): Promise<string> {
        // Formatar mensagens para o prompt
        const formattedMessages = messages
            .filter(m => m.role !== 'system') // Ignorar mensagens de sistema
            .map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
            .join('\n');

        const prompt = SUMMARIZATION_PROMPT.replace('{messages}', formattedMessages);

        try {
            const result = await generateText({
                model: openai(this.config.model),
                prompt,
                maxTokens: this.config.maxSummaryTokens,
            });

            console.log(`[SummarizationMiddleware] ✅ Resumo gerado: ${result.text.slice(0, 100)}...`);
            return result.text;
        } catch (error) {
            console.error('[SummarizationMiddleware] ❌ Erro ao gerar resumo:', error);
            // Fallback: resumo simples baseado em variáveis
            return this.generateFallbackSummary(messages);
        }
    }

    /**
     * Gera um resumo simples quando a API falha
     */
    private generateFallbackSummary(messages: AgentMessage[]): string {
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');

        return `Conversa com ${userMessages.length} mensagens do cliente e ${assistantMessages.length} respostas do assistente. Última mensagem do cliente: "${userMessages[userMessages.length - 1]?.content.slice(0, 100) || 'N/A'}"`;
    }
}

// ════════════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR
// ════════════════════════════════════════════════════════════════════

/**
 * Cria uma instância do middleware com configurações padrão
 */
export function createSummarizationMiddleware(
    config?: Partial<SummarizationConfig>
): SummarizationMiddleware {
    return new SummarizationMiddleware(config);
}
