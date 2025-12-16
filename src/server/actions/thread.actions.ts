'use server';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THREAD ACTIONS - Server Actions para gestão de threads (conversas)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { threads, messages } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { ThreadStatus } from '@/db/schema';

/**
 * Cria ou busca uma thread existente por external ID (telefone)
 * Usado no webhook para identificar/criar conversas
 */
export async function getOrCreateThreadAction(
    userId: string,
    agentId: string,
    externalId: string,
    contactName?: string
) {
    try {
        // Buscar thread existente
        const [existingThread] = await db
            .select()
            .from(threads)
            .where(
                and(
                    eq(threads.userId, userId),
                    eq(threads.externalId, externalId)
                )
            )
            .limit(1);

        if (existingThread) {
            // Atualizar last interaction
            await db
                .update(threads)
                .set({
                    lastInteractionAt: new Date(),
                    // Reativar se estava arquivada
                    status: existingThread.status === 'archived' ? 'active' : existingThread.status,
                })
                .where(eq(threads.id, existingThread.id));

            return { success: true, thread: existingThread, isNew: false };
        }

        // Criar nova thread
        const [newThread] = await db
            .insert(threads)
            .values({
                userId,
                agentId,
                externalId,
                contactName: contactName || null,
                status: 'active',
                messageCount: 0,
                firstInteractionAt: new Date(),
                lastInteractionAt: new Date(),
            })
            .returning();

        revalidatePath('/dashboard/threads');

        return { success: true, thread: newThread, isNew: true };
    } catch (error) {
        console.error('[getOrCreateThreadAction]', error);
        return { success: false, error: 'Erro ao criar/buscar thread' };
    }
}

/**
 * Atualiza o status de uma thread
 */
export async function updateThreadStatusAction(
    threadId: string,
    status: ThreadStatus
) {
    try {
        const [updated] = await db
            .update(threads)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(threads.id, threadId))
            .returning();

        if (!updated) {
            return { success: false, error: 'Thread não encontrada' };
        }

        revalidatePath('/dashboard/threads');

        return { success: true, thread: updated };
    } catch (error) {
        console.error('[updateThreadStatusAction]', error);
        return { success: false, error: 'Erro ao atualizar status' };
    }
}

/**
 * Atualiza informações do contato na thread
 */
export async function updateThreadContactAction(
    threadId: string,
    data: {
        contactName?: string;
        contactEmail?: string;
        contactMetadata?: Record<string, string>;
    }
) {
    try {
        const [updated] = await db
            .update(threads)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(threads.id, threadId))
            .returning();

        if (!updated) {
            return { success: false, error: 'Thread não encontrada' };
        }

        revalidatePath(`/dashboard/threads/${threadId}`);

        return { success: true, thread: updated };
    } catch (error) {
        console.error('[updateThreadContactAction]', error);
        return { success: false, error: 'Erro ao atualizar contato' };
    }
}

/**
 * Arquiva uma thread
 */
export async function archiveThreadAction(threadId: string) {
    return updateThreadStatusAction(threadId, 'archived');
}

/**
 * Arquiva threads inativas (job diário)
 */
export async function archiveInactiveThreadsAction(hoursInactive = 24) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursInactive);

        const updated = await db
            .update(threads)
            .set({
                status: 'archived',
                updatedAt: new Date(),
            })
            .where(
                and(
                    lt(threads.lastInteractionAt, cutoffDate),
                    eq(threads.status, 'active')
                )
            )
            .returning();

        revalidatePath('/dashboard/threads');

        return { success: true, archivedCount: updated.length };
    } catch (error) {
        console.error('[archiveInactiveThreadsAction]', error);
        return { success: false, error: 'Erro ao arquivar threads' };
    }
}

/**
 * Incrementa contagem de mensagens
 */
export async function incrementMessageCountAction(threadId: string) {
    try {
        const [current] = await db
            .select({ messageCount: threads.messageCount })
            .from(threads)
            .where(eq(threads.id, threadId));

        if (!current) {
            return { success: false, error: 'Thread não encontrada' };
        }

        await db
            .update(threads)
            .set({
                messageCount: current.messageCount + 1,
                lastInteractionAt: new Date(),
            })
            .where(eq(threads.id, threadId));

        return { success: true };
    } catch (error) {
        console.error('[incrementMessageCountAction]', error);
        return { success: false, error: 'Erro ao incrementar contador' };
    }
}

/**
 * Adiciona uma mensagem a uma thread
 */
export async function addMessageToThreadAction(
    threadId: string,
    data: {
        role: 'user' | 'assistant' | 'system';
        content: string;
        metadata?: Record<string, unknown>;
        isFromWebhook?: boolean;
    }
) {
    try {
        const [newMessage] = await db
            .insert(messages)
            .values({
                threadId,
                role: data.role,
                content: data.content,
                metadata: data.metadata || {},
                isFromWebhook: data.isFromWebhook || false,
            })
            .returning();

        // Incrementar contador e atualizar timestamp
        await incrementMessageCountAction(threadId);

        return { success: true, message: newMessage };
    } catch (error) {
        console.error('[addMessageToThreadAction]', error);
        return { success: false, error: 'Erro ao adicionar mensagem' };
    }
}
