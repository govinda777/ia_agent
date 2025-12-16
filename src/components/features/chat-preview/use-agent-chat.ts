'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useAgentChat - Hook para preview de chat com agente
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Este hook gerencia o estado de uma conversa de teste com o agente.
 * Usado no componente de preview para testar configurações do agente.
 */

import { useState, useCallback, useTransition } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    toolCalls?: Array<{
        name: string;
        input: Record<string, unknown>;
        result?: Record<string, unknown>;
    }>;
    isLoading?: boolean;
    error?: string;
}

interface UseAgentChatOptions {
    agentId: string;
    onError?: (error: Error) => void;
}

interface UseAgentChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearMessages: () => void;
    retryLastMessage: () => Promise<void>;
}

/**
 * Hook para gerenciar chat com agente
 * 
 * @example
 * const { messages, sendMessage, isLoading } = useAgentChat({ agentId: '123' });
 * 
 * await sendMessage('Olá, quais são os preços?');
 */
export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
    const { agentId, onError } = options;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending] = useTransition();
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Gera um ID único para mensagens
     */
    const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Envia uma mensagem para o agente
     */
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        setError(null);

        // Adiciona mensagem do usuário
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        // Adiciona placeholder de loading para resposta
        const assistantPlaceholder: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
        setIsLoading(true);

        try {
            // Chama API para processar mensagem
            const response = await fetch('/api/chat/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentId,
                    message: content,
                    history: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }

            const data = await response.json();

            // Atualiza mensagem com resposta real
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantPlaceholder.id
                        ? {
                            ...msg,
                            content: data.text,
                            toolCalls: data.toolCalls,
                            isLoading: false,
                        }
                        : msg
                )
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

            // Atualiza placeholder com erro
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantPlaceholder.id
                        ? {
                            ...msg,
                            content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
                            isLoading: false,
                            error: errorMessage,
                        }
                        : msg
                )
            );

            setError(errorMessage);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    }, [agentId, messages, onError]);

    /**
     * Limpa todas as mensagens
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    /**
     * Tenta reenviar a última mensagem do usuário
     */
    const retryLastMessage = useCallback(async () => {
        // Encontra a última mensagem do usuário
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

        if (lastUserMessage) {
            // Remove a última resposta com erro
            setMessages(prev => {
                // Encontra a última mensagem do assistente manualmente para compatibilidade
                let lastAssistantIndex = -1;
                for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i]?.role === 'assistant') {
                        lastAssistantIndex = i;
                        break;
                    }
                }

                if (lastAssistantIndex > -1 && prev[lastAssistantIndex]?.error) {
                    return prev.slice(0, lastAssistantIndex);
                }
                return prev;
            });

            // Reenvia
            await sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage]);

    return {
        messages,
        isLoading: isLoading || isPending,
        error,
        sendMessage,
        clearMessages,
        retryLastMessage,
    };
}

/**
 * Hook simplificado para status de conexão
 */
export function useAIStatus() {
    const [isConnected, setIsConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkConnection = useCallback(async () => {
        setIsChecking(true);
        try {
            const response = await fetch('/api/health/ai');
            setIsConnected(response.ok);
        } catch {
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    return {
        isConnected,
        isChecking,
        checkConnection,
    };
}
