/**
 * StreamingMiddleware - Suporte a streaming de respostas
 * 
 * Baseado em: https://docs.langchain.com/oss/python/langchain/streaming
 * 
 * Fornece:
 * - Chunks de texto para resposta progressiva
 * - Callbacks para UI updates
 * - Buffer de tokens
 */

import { AgentState, AgentMessage, createMessage } from '../agent-state';

// ════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════

export interface StreamChunk {
    type: 'text' | 'tool_start' | 'tool_end' | 'complete';
    content: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}

export type StreamCallback = (chunk: StreamChunk) => void;

export interface StreamingConfig {
    /** Tamanho mínimo do buffer antes de enviar chunk */
    bufferSize: number;
    /** Incluir metadata nos chunks */
    includeMetadata: boolean;
    /** Callback para cada chunk */
    onChunk?: StreamCallback;
    /** Callback quando streaming completa */
    onComplete?: (fullContent: string) => void;
    /** Callback para erros */
    onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: StreamingConfig = {
    bufferSize: 10,
    includeMetadata: false,
};

// ════════════════════════════════════════════════════════════════════
// MIDDLEWARE DE STREAMING
// ════════════════════════════════════════════════════════════════════

export class StreamingMiddleware {
    private config: StreamingConfig;
    private buffer: string = '';
    private chunks: StreamChunk[] = [];

    constructor(config: Partial<StreamingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Processa um texto adicionando ao buffer
     */
    pushText(text: string): void {
        this.buffer += text;

        if (this.buffer.length >= this.config.bufferSize) {
            this.flush();
        }
    }

    /**
     * Força o envio do buffer atual
     */
    flush(): void {
        if (this.buffer.length === 0) return;

        const chunk: StreamChunk = {
            type: 'text',
            content: this.buffer,
            timestamp: new Date(),
        };

        this.chunks.push(chunk);
        this.config.onChunk?.(chunk);
        this.buffer = '';
    }

    /**
     * Sinaliza início de execução de ferramenta
     */
    toolStart(toolName: string, args: Record<string, any>): void {
        this.flush(); // Envia qualquer texto pendente

        const chunk: StreamChunk = {
            type: 'tool_start',
            content: toolName,
            metadata: { args },
            timestamp: new Date(),
        };

        this.chunks.push(chunk);
        this.config.onChunk?.(chunk);
    }

    /**
     * Sinaliza fim de execução de ferramenta
     */
    toolEnd(toolName: string, result: string): void {
        const chunk: StreamChunk = {
            type: 'tool_end',
            content: result,
            metadata: { toolName },
            timestamp: new Date(),
        };

        this.chunks.push(chunk);
        this.config.onChunk?.(chunk);
    }

    /**
     * Finaliza o streaming
     */
    complete(): string {
        this.flush(); // Envia qualquer texto pendente

        const fullContent = this.chunks
            .filter(c => c.type === 'text')
            .map(c => c.content)
            .join('');

        const chunk: StreamChunk = {
            type: 'complete',
            content: fullContent,
            metadata: { chunkCount: this.chunks.length },
            timestamp: new Date(),
        };

        this.chunks.push(chunk);
        this.config.onChunk?.(chunk);
        this.config.onComplete?.(fullContent);

        return fullContent;
    }

    /**
     * Reseta o estado do middleware
     */
    reset(): void {
        this.buffer = '';
        this.chunks = [];
    }

    /**
     * Obtém todos os chunks gerados
     */
    getChunks(): StreamChunk[] {
        return [...this.chunks];
    }

    /**
     * Cria uma mensagem do assistente com o conteúdo completo
     */
    toMessage(): AgentMessage {
        const fullContent = this.chunks
            .filter(c => c.type === 'text')
            .map(c => c.content)
            .join('');

        return createMessage('assistant', fullContent, {
            streamed: true,
            chunkCount: this.chunks.length,
        });
    }
}

// ════════════════════════════════════════════════════════════════════
// HELPER PARA PROCESSAR STREAM DO AI SDK
// ════════════════════════════════════════════════════════════════════

/**
 * Processa um stream do AI SDK através do middleware
 */
export async function processStream(
    stream: AsyncIterable<string>,
    middleware: StreamingMiddleware
): Promise<string> {
    for await (const chunk of stream) {
        middleware.pushText(chunk);
    }

    return middleware.complete();
}

// ════════════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR
// ════════════════════════════════════════════════════════════════════

/**
 * Cria uma instância do middleware com callbacks
 */
export function createStreamingMiddleware(
    onChunk: StreamCallback,
    onComplete?: (fullContent: string) => void
): StreamingMiddleware {
    return new StreamingMiddleware({
        onChunk,
        onComplete,
    });
}
