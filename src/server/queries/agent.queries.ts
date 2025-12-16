/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AGENT QUERIES - Queries de leitura para agentes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { agents, knowledgeBase } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Busca todos os agentes de um usuário
 */
export async function getAgentsByUserId(userId: string) {
    return await db
        .select()
        .from(agents)
        .where(eq(agents.userId, userId))
        .orderBy(desc(agents.createdAt));
}

/**
 * Busca um agente específico por ID
 */
export async function getAgentById(agentId: string) {
    const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

    return agent || null;
}

/**
 * Busca o agente ativo/padrão de um usuário
 */
export async function getDefaultAgent(userId: string) {
    // Primeiro tenta buscar o agente marcado como padrão
    let [agent] = await db
        .select()
        .from(agents)
        .where(
            and(
                eq(agents.userId, userId),
                eq(agents.isDefault, true),
                eq(agents.isActive, true)
            )
        )
        .limit(1);

    // Se não encontrar, busca qualquer agente ativo
    if (!agent) {
        [agent] = await db
            .select()
            .from(agents)
            .where(
                and(
                    eq(agents.userId, userId),
                    eq(agents.isActive, true)
                )
            )
            .orderBy(desc(agents.createdAt))
            .limit(1);
    }

    return agent || null;
}

/**
 * Busca um agente com sua base de conhecimento
 */
export async function getAgentWithKnowledge(agentId: string) {
    const agent = await getAgentById(agentId);

    if (!agent) return null;

    const knowledge = await db
        .select()
        .from(knowledgeBase)
        .where(
            and(
                eq(knowledgeBase.agentId, agentId),
                eq(knowledgeBase.isActive, true)
            )
        )
        .orderBy(desc(knowledgeBase.priority));

    return {
        ...agent,
        knowledge,
    };
}

/**
 * Conta o número de agentes de um usuário
 */
export async function countAgentsByUserId(userId: string) {
    const result = await db
        .select()
        .from(agents)
        .where(eq(agents.userId, userId));

    return result.length;
}
