'use server';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AGENT ACTIONS - Persistir configurações do agente
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from '@/lib/db';
import { agents, type StageConfig, type WorkingHoursConfig, type WidgetConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Salvar workflow (estágios) de um agente
 */
export async function saveWorkflow(agentId: string, workflow: StageConfig[]) {
    try {
        await db.update(agents)
            .set({
                workflowConfig: workflow,
                updatedAt: new Date(),
            })
            .where(eq(agents.id, agentId));

        revalidatePath('/dashboard/agents');
        revalidatePath(`/dashboard/agents/${agentId}/builder`);

        return { success: true };
    } catch (error) {
        console.error('[Agent Actions] Erro ao salvar workflow:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao salvar workflow'
        };
    }
}

/**
 * Carregar workflow de um agente
 */
export async function loadWorkflow(agentId: string): Promise<StageConfig[]> {
    const agent = await db.query.agents.findFirst({
        where: eq(agents.id, agentId),
        columns: {
            workflowConfig: true,
        },
    });

    return agent?.workflowConfig || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONALITY & BRANDING ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonalitySettings {
    displayName?: string;
    personality?: string;
    tone?: string;
    useEmojis?: boolean;
    language?: string;
    avatarUrl?: string;
}

/**
 * Salvar configurações de personalidade
 */
export async function savePersonality(agentId: string, settings: PersonalitySettings) {
    try {
        await db.update(agents)
            .set({
                displayName: settings.displayName,
                personality: settings.personality,
                tone: settings.tone,
                useEmojis: settings.useEmojis,
                language: settings.language,
                avatarUrl: settings.avatarUrl,
                updatedAt: new Date(),
            })
            .where(eq(agents.id, agentId));

        revalidatePath('/dashboard/agents');
        revalidatePath(`/dashboard/agents/${agentId}/builder`);

        return { success: true };
    } catch (error) {
        console.error('[Agent Actions] Erro ao salvar personalidade:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao salvar personalidade'
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKING HOURS ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Salvar horário de funcionamento
 */
export async function saveWorkingHours(agentId: string, config: WorkingHoursConfig) {
    try {
        await db.update(agents)
            .set({
                workingHours: config,
                updatedAt: new Date(),
            })
            .where(eq(agents.id, agentId));

        revalidatePath('/dashboard/agents');
        revalidatePath(`/dashboard/agents/${agentId}/builder`);

        return { success: true };
    } catch (error) {
        console.error('[Agent Actions] Erro ao salvar horário:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao salvar horário'
        };
    }
}

/**
 * Verificar se o agente está dentro do horário de funcionamento
 */
export async function isWithinWorkingHours(agentId: string): Promise<{
    isOpen: boolean;
    message?: string;
}> {
    const agent = await db.query.agents.findFirst({
        where: eq(agents.id, agentId),
        columns: {
            workingHours: true,
        },
    });

    const config = agent?.workingHours as WorkingHoursConfig | undefined;

    // Se não tem config ou está desabilitado, sempre aberto
    if (!config || !config.enabled) {
        return { isOpen: true };
    }

    const now = new Date();

    // Converter para timezone configurado (simplificado - em produção usar date-fns-tz)
    const currentDay = now.getDay(); // 0 = Domingo
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // minutos desde meia-noite

    // Verificar se é dia ativo
    if (!config.days.includes(currentDay)) {
        return { isOpen: false, message: config.outsideMessage };
    }

    // Verificar horário
    const startParts = config.start.split(':').map(Number);
    const endParts = config.end.split(':').map(Number);
    const startHour = startParts[0] ?? 9;
    const startMinute = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 18;
    const endMinute = endParts[1] ?? 0;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (currentTime < startTime || currentTime > endTime) {
        return { isOpen: false, message: config.outsideMessage };
    }

    return { isOpen: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET CONFIG ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Salvar configuração do widget
 */
export async function saveWidgetConfig(agentId: string, config: WidgetConfig) {
    try {
        await db.update(agents)
            .set({
                widgetConfig: config,
                updatedAt: new Date(),
            })
            .where(eq(agents.id, agentId));

        revalidatePath('/dashboard/agents');

        return { success: true };
    } catch (error) {
        console.error('[Agent Actions] Erro ao salvar widget:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao salvar widget'
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL AGENT UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentUpdateData {
    name?: string;
    description?: string;
    systemPrompt?: string;
    companyProfile?: string;
    workflowConfig?: StageConfig[];
    displayName?: string;
    personality?: string;
    tone?: string;
    useEmojis?: boolean;
    language?: string;
    avatarUrl?: string;
    widgetConfig?: WidgetConfig;
    workingHours?: WorkingHoursConfig;
    isActive?: boolean;
}

/**
 * Atualizar múltiplos campos do agente de uma vez
 */
export async function updateAgent(agentId: string, data: AgentUpdateData) {
    try {
        await db.update(agents)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(agents.id, agentId));

        revalidatePath('/dashboard/agents');
        revalidatePath(`/dashboard/agents/${agentId}/builder`);

        return { success: true };
    } catch (error) {
        console.error('[Agent Actions] Erro ao atualizar agente:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao atualizar agente'
        };
    }
}
