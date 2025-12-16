/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MESSAGE QUERIES - Queries de leitura para mensagens
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { messages, toolCalls } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

/**
 * Busca mensagens de uma thread
 */
export async function getMessagesByThreadId(
    threadId: string,
    options?: {
        limit?: number;
        offset?: number;
    }
) {
    const { limit = 50, offset = 0 } = options || {};

    return await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset);
}

/**
 * Busca as últimas N mensagens para contexto
 * Usado no webhook para construir o histórico
 */
export async function getContextMessages(threadId: string, limit = 10) {
    const result = await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(desc(messages.createdAt))
        .limit(limit);

    // Retorna em ordem cronológica
    return result.reverse();
}

/**
 * Busca uma mensagem por ID
 */
export async function getMessageById(messageId: string) {
    const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

    return message || null;
}

/**
 * Busca mensagem com suas tool calls
 */
export async function getMessageWithToolCalls(messageId: string) {
    const message = await getMessageById(messageId);

    if (!message) return null;

    const calls = await db
        .select()
        .from(toolCalls)
        .where(eq(toolCalls.messageId, messageId));

    return {
        ...message,
        toolCalls: calls,
    };
}

/**
 * Conta mensagens de uma thread
 */
export async function countMessagesByThreadId(threadId: string) {
    const result = await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId));

    return result.length;
}

/**
 * Busca mensagens recentes (últimas 24h) de um usuário
 * Usado para métricas
 */
export async function getRecentMessagesCount(threadIds: string[]) {
    if (threadIds.length === 0) return 0;

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    let total = 0;
    for (const threadId of threadIds) {
        const result = await db
            .select()
            .from(messages)
            .where(
                and(
                    eq(messages.threadId, threadId),
                    gte(messages.createdAt, oneDayAgo)
                )
            );
        total += result.length;
    }

    return total;
}

/**
 * Busca tool calls de uma mensagem
 */
export async function getToolCallsByMessageId(messageId: string) {
    return await db
        .select()
        .from(toolCalls)
        .where(eq(toolCalls.messageId, messageId));
}

/**
 * Busca tool calls por status
 */
export async function getToolCallsByStatus(status: 'pending' | 'success' | 'failed') {
    return await db
        .select()
        .from(toolCalls)
        .where(eq(toolCalls.status, status))
        .orderBy(desc(toolCalls.createdAt));
}
