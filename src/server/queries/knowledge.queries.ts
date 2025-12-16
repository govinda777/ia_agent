/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KNOWLEDGE QUERIES - Queries de leitura para base de conhecimento
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { knowledgeBase } from '@/db/schema';
import { eq, desc, and, ilike, or } from 'drizzle-orm';

/**
 * Busca todos os itens de conhecimento de um agente
 */
export async function getKnowledgeByAgentId(agentId: string) {
    return await db
        .select()
        .from(knowledgeBase)
        .where(eq(knowledgeBase.agentId, agentId))
        .orderBy(desc(knowledgeBase.priority), desc(knowledgeBase.createdAt));
}

/**
 * Busca um item de conhecimento por ID
 */
export async function getKnowledgeById(knowledgeId: string) {
    const [item] = await db
        .select()
        .from(knowledgeBase)
        .where(eq(knowledgeBase.id, knowledgeId))
        .limit(1);

    return item || null;
}

/**
 * Busca knowledge base ativa de um agente
 */
export async function getActiveKnowledgeByAgentId(agentId: string) {
    return await db
        .select()
        .from(knowledgeBase)
        .where(
            and(
                eq(knowledgeBase.agentId, agentId),
                eq(knowledgeBase.isActive, true)
            )
        )
        .orderBy(desc(knowledgeBase.priority));
}

/**
 * Busca knowledge relevante baseado em keywords
 * Usado para RAG no webhook
 */
export async function getRelevantKnowledge(agentId: string, query: string) {
    // Busca simples por termo no tópico ou conteúdo
    // TODO: Implementar busca vetorial para RAG mais sofisticado
    const searchTerm = `%${query.toLowerCase()}%`;

    return await db
        .select()
        .from(knowledgeBase)
        .where(
            and(
                eq(knowledgeBase.agentId, agentId),
                eq(knowledgeBase.isActive, true),
                or(
                    ilike(knowledgeBase.topic, searchTerm),
                    ilike(knowledgeBase.content, searchTerm)
                )
            )
        )
        .orderBy(desc(knowledgeBase.priority))
        .limit(5);
}

/**
 * Busca knowledge por tópico específico
 */
export async function getKnowledgeByTopic(agentId: string, topic: string) {
    const [item] = await db
        .select()
        .from(knowledgeBase)
        .where(
            and(
                eq(knowledgeBase.agentId, agentId),
                ilike(knowledgeBase.topic, topic)
            )
        )
        .limit(1);

    return item || null;
}

/**
 * Conta o número de itens de conhecimento de um agente
 */
export async function countKnowledgeByAgentId(agentId: string) {
    const result = await db
        .select()
        .from(knowledgeBase)
        .where(eq(knowledgeBase.agentId, agentId));

    return result.length;
}
