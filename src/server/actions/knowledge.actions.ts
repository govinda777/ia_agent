'use server';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KNOWLEDGE ACTIONS - Server Actions para CRUD de base de conhecimento
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { knowledgeBase } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema de validação
const createKnowledgeSchema = z.object({
    agentId: z.string().uuid(),
    topic: z.string().min(2, 'Tópico deve ter pelo menos 2 caracteres').max(255),
    content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
    keywords: z.array(z.string()).optional(),
    priority: z.number().int().min(0).max(100).optional(),
});

const updateKnowledgeSchema = createKnowledgeSchema.partial().extend({
    id: z.string().uuid(),
});

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;

/**
 * Cria um novo item de conhecimento
 */
export async function createKnowledgeAction(input: CreateKnowledgeInput) {
    try {
        const validated = createKnowledgeSchema.parse(input);

        const [newKnowledge] = await db
            .insert(knowledgeBase)
            .values({
                agentId: validated.agentId,
                topic: validated.topic,
                content: validated.content,
                keywords: validated.keywords || [],
                priority: validated.priority || 0,
                isActive: true,
            })
            .returning();

        revalidatePath('/dashboard/knowledge');
        revalidatePath(`/dashboard/agents/${validated.agentId}`);

        return { success: true, knowledge: newKnowledge };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Dados inválidos',
                details: error.errors,
            };
        }
        console.error('[createKnowledgeAction]', error);
        return { success: false, error: 'Erro ao criar conhecimento' };
    }
}

/**
 * Atualiza um item de conhecimento
 */
export async function updateKnowledgeAction(input: UpdateKnowledgeInput) {
    try {
        const validated = updateKnowledgeSchema.parse(input);
        const { id, ...updateData } = validated;

        const [updated] = await db
            .update(knowledgeBase)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(knowledgeBase.id, id))
            .returning();

        if (!updated) {
            return { success: false, error: 'Item não encontrado' };
        }

        revalidatePath('/dashboard/knowledge');

        return { success: true, knowledge: updated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Dados inválidos',
                details: error.errors,
            };
        }
        console.error('[updateKnowledgeAction]', error);
        return { success: false, error: 'Erro ao atualizar conhecimento' };
    }
}

/**
 * Deleta um item de conhecimento
 */
export async function deleteKnowledgeAction(knowledgeId: string) {
    try {
        const [deleted] = await db
            .delete(knowledgeBase)
            .where(eq(knowledgeBase.id, knowledgeId))
            .returning();

        if (!deleted) {
            return { success: false, error: 'Item não encontrado' };
        }

        revalidatePath('/dashboard/knowledge');

        return { success: true };
    } catch (error) {
        console.error('[deleteKnowledgeAction]', error);
        return { success: false, error: 'Erro ao deletar conhecimento' };
    }
}

/**
 * Alterna o status ativo/inativo
 */
export async function toggleKnowledgeStatusAction(knowledgeId: string) {
    try {
        const [current] = await db
            .select({ isActive: knowledgeBase.isActive })
            .from(knowledgeBase)
            .where(eq(knowledgeBase.id, knowledgeId));

        if (!current) {
            return { success: false, error: 'Item não encontrado' };
        }

        const [updated] = await db
            .update(knowledgeBase)
            .set({
                isActive: !current.isActive,
                updatedAt: new Date(),
            })
            .where(eq(knowledgeBase.id, knowledgeId))
            .returning();

        if (!updated) {
            return { success: false, error: 'Erro ao atualizar status' };
        }

        revalidatePath('/dashboard/knowledge');

        return { success: true, isActive: updated.isActive };
    } catch (error) {
        console.error('[toggleKnowledgeStatusAction]', error);
        return { success: false, error: 'Erro ao alterar status' };
    }
}

/**
 * Atualiza a prioridade de um item
 */
export async function updateKnowledgePriorityAction(
    knowledgeId: string,
    priority: number
) {
    try {
        const [updated] = await db
            .update(knowledgeBase)
            .set({
                priority,
                updatedAt: new Date(),
            })
            .where(eq(knowledgeBase.id, knowledgeId))
            .returning();

        if (!updated) {
            return { success: false, error: 'Item não encontrado' };
        }

        revalidatePath('/dashboard/knowledge');

        return { success: true, knowledge: updated };
    } catch (error) {
        console.error('[updateKnowledgePriorityAction]', error);
        return { success: false, error: 'Erro ao atualizar prioridade' };
    }
}

/**
 * Importa múltiplos itens de conhecimento de uma vez
 */
export async function bulkImportKnowledgeAction(
    agentId: string,
    items: Array<{ topic: string; content: string; keywords?: string[] }>
) {
    try {
        const insertData = items.map((item, index) => ({
            agentId,
            topic: item.topic,
            content: item.content,
            keywords: item.keywords || [],
            priority: items.length - index, // Maior prioridade para os primeiros
            isActive: true,
        }));

        const inserted = await db
            .insert(knowledgeBase)
            .values(insertData)
            .returning();

        revalidatePath('/dashboard/knowledge');
        revalidatePath(`/dashboard/agents/${agentId}`);

        return { success: true, count: inserted.length };
    } catch (error) {
        console.error('[bulkImportKnowledgeAction]', error);
        return { success: false, error: 'Erro ao importar conhecimento' };
    }
}
