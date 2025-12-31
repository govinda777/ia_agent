/**
 * StreamingMiddleware - Support for streaming responses
 *
 * Based on: https://docs.langchain.com/oss/python/langchain/streaming
 *
 * Provides:
 * - Text chunks for progressive response
 * - Callbacks for UI updates
 * - Token buffer
 */

import { AgentMessage, createMessage } from '../agent-state';

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

export interface StreamChunk {
    type: 'text' | 'tool_start' | 'tool_end' | 'complete';
    content: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

export type StreamCallback = (chunk: StreamChunk) => void;

export interface StreamingConfig {
    /** Minimum buffer size before sending a chunk */
    bufferSize: number;
    /** Include metadata in chunks */
    includeMetadata: boolean;
    /** Callback for each chunk */
    onChunk?: StreamCallback;
    /** Callback when streaming is complete */
    onComplete?: (fullContent: string) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: StreamingConfig = {
    bufferSize: 10,
    includeMetadata: false,
};

// ════════════════════════════════════════════════════════════════════
// STREAMING MIDDLEWARE
// ════════════════════════════════════════════════════════════════════

export class StreamingMiddleware {
    private config: StreamingConfig;
    private buffer: string = '';
    private chunks: StreamChunk[] = [];

    constructor(config: Partial<StreamingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Processes text by adding it to the buffer
     */
    pushText(text: string): void {
        this.buffer += text;

        if (this.buffer.length >= this.config.bufferSize) {
            this.flush();
        }
    }

    /**
     * Forces the current buffer to be sent
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
     * Signals the start of a tool execution
     */
    toolStart(toolName: string, args: Record<string, unknown>): void {
        this.flush(); // Send any pending text

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
     * Signals the end of a tool execution
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
     * Finalizes the streaming
     */
    complete(): string {
        this.flush(); // Send any pending text

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
     * Resets the middleware's state
     */
    reset(): void {
        this.buffer = '';
        this.chunks = [];
    }

    /**
     * Gets all generated chunks
     */
    getChunks(): StreamChunk[] {
        return [...this.chunks];
    }

    /**
     * Creates an assistant message with the full content
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
// HELPER TO PROCESS STREAM FROM AI SDK
// ════════════════════════════════════════════════════════════════════

/**
 * Processes a stream from the AI SDK through the middleware
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
// HELPER FUNCTION
// ════════════════════════════════════════════════════════════════════

/**
 * Creates an instance of the middleware with callbacks
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
