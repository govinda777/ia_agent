/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THREAD QUERIES - Queries de leitura para threads (conversas)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { threads, messages } from '@/db/schema';
import { eq, desc, and, lt } from 'drizzle-orm';
import type { ThreadStatus } from '@/db/schema';

/**
 * Busca todas as threads de um usuário
 */
export async function getThreadsByUserId(
    userId: string,
    options?: {
        status?: ThreadStatus;
        limit?: number;
        offset?: number;
    }
) {
    const { status, limit = 50, offset = 0 } = options || {};

    let query = db.select().from(threads).where(eq(threads.userId, userId));

    if (status) {
        query = db
            .select()
            .from(threads)
            .where(and(eq(threads.userId, userId), eq(threads.status, status)));
    }

    return await query
        .orderBy(desc(threads.lastInteractionAt))
        .limit(limit)
        .offset(offset);
}

/**
 * Busca uma thread por ID
 */
export async function getThreadById(threadId: string) {
    const [thread] = await db
        .select()
        .from(threads)
        .where(eq(threads.id, threadId))
        .limit(1);

    return thread || null;
}

/**
 * Busca uma thread por external ID (telefone)
 */
export async function getThreadByExternalId(userId: string, externalId: string) {
    const [thread] = await db
        .select()
        .from(threads)
        .where(
            and(
                eq(threads.userId, userId),
                eq(threads.externalId, externalId)
            )
        )
        .limit(1);

    return thread || null;
}

/**
 * Busca thread com suas mensagens
 */
export async function getThreadWithMessages(
    threadId: string,
    messageLimit = 50
) {
    const thread = await getThreadById(threadId);

    if (!thread) return null;

    const threadMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, threadId))
        .orderBy(desc(messages.createdAt))
        .limit(messageLimit);

    return {
        ...thread,
        messages: threadMessages.reverse(), // Ordenar cronologicamente
    };
}

/**
 * Conta threads por status
 */
export async function countThreadsByStatus(userId: string) {
    const allThreads = await db
        .select()
        .from(threads)
        .where(eq(threads.userId, userId));

    const counts = {
        active: 0,
        pending: 0,
        qualified: 0,
        booked: 0,
        archived: 0,
        total: allThreads.length,
    };

    for (const thread of allThreads) {
        if (thread.status in counts) {
            counts[thread.status as keyof typeof counts]++;
        }
    }

    return counts;
}

/**
 * Busca threads inativas para arquivar
 */
export async function getInactiveThreads(hoursInactive: number) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursInactive);

    return await db
        .select()
        .from(threads)
        .where(
            and(
                lt(threads.lastInteractionAt, cutoffDate),
                // Não buscar threads já arquivadas
                eq(threads.status, 'active')
            )
        );
}

/**
 * Busca threads recentes para o dashboard
 */
export async function getRecentThreads(userId: string, limit = 5) {
    return await db
        .select()
        .from(threads)
        .where(
            and(
                eq(threads.userId, userId),
                // Excluir arquivadas
                eq(threads.status, 'active')
            )
        )
        .orderBy(desc(threads.lastInteractionAt))
        .limit(limit);
}
