'use server';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TAKEOVER ACTIONS - Assumir/Devolver conversa
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Permite que um humano assuma uma conversa, pausando o agente.
 * Quando devolver, o agente retoma o atendimento.
 */

import { db } from '@/lib/db';
import { threads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface TakeoverResult {
    success: boolean;
    error?: string;
    isHumanTakeover?: boolean;
}

/**
 * Assumir uma conversa (pausar o agente)
 */
export async function takeoverThread(
    threadId: string,
    userId: string,
    reason?: string
): Promise<TakeoverResult> {
    try {
        await db.update(threads)
            .set({
                isHumanTakeover: true,
                takeoverAt: new Date(),
                takeoverBy: userId,
                takeoverReason: reason || 'Humano assumiu a conversa',
                updatedAt: new Date(),
            })
            .where(eq(threads.id, threadId));

        revalidatePath('/dashboard/threads');
        revalidatePath(`/dashboard/threads/${threadId}`);

        return { success: true, isHumanTakeover: true };
    } catch (error) {
        console.error('[Takeover] Erro ao assumir:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao assumir conversa'
        };
    }
}

/**
 * Devolver conversa ao agente (retomar automação)
 */
export async function releaseThread(threadId: string): Promise<TakeoverResult> {
    try {
        await db.update(threads)
            .set({
                isHumanTakeover: false,
                takeoverAt: null,
                takeoverBy: null,
                takeoverReason: null,
                updatedAt: new Date(),
            })
            .where(eq(threads.id, threadId));

        revalidatePath('/dashboard/threads');
        revalidatePath(`/dashboard/threads/${threadId}`);

        return { success: true, isHumanTakeover: false };
    } catch (error) {
        console.error('[Takeover] Erro ao devolver:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao devolver conversa'
        };
    }
}

/**
 * Verificar se uma conversa está em takeover
 */
export async function checkTakeoverStatus(threadId: string): Promise<{
    isHumanTakeover: boolean;
    takeoverAt?: Date;
    takeoverBy?: string;
    takeoverReason?: string;
}> {
    const thread = await db.query.threads.findFirst({
        where: eq(threads.id, threadId),
        columns: {
            isHumanTakeover: true,
            takeoverAt: true,
            takeoverBy: true,
            takeoverReason: true,
        },
    });

    if (!thread) {
        return { isHumanTakeover: false };
    }

    return {
        isHumanTakeover: thread.isHumanTakeover,
        takeoverAt: thread.takeoverAt || undefined,
        takeoverBy: thread.takeoverBy || undefined,
        takeoverReason: thread.takeoverReason || undefined,
    };
}
