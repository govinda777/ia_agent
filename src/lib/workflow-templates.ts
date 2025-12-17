/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEFAULT WORKFLOW TEMPLATES
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Fluxos estratégicos padrão para novos agentes baseado na estrutura SonicIA:
 * 1. Identificação - Conhecer o lead
 * 2. Diagnóstico - Entender a dor/necessidade
 * 3. Agendamento - Propor reunião
 * 4. Handoff - Transferir para humano
 */

import { type StageConfig, type StageType } from '@/db/schema';

// Simple ID generator (uuid not needed for templates)
function generateId(): string {
    return `stage_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Template SonicIA - Fluxo de qualificação e agendamento
 */
export const SONIC_IA_WORKFLOW: StageConfig[] = [
    {
        id: generateId(),
        name: 'Identificação',
        type: 'identify' as StageType,
        order: 0,
        conditions: 'Estágio inicial - sempre começa aqui',
        prompt: `Objetivo: Conhecer o lead e criar rapport.

AÇÕES:
1. Cumprimente de forma calorosa e natural
2. Pergunte o NOME do lead
3. Pergunte a área de atuação/nicho

TRANSIÇÃO: Avance quando tiver nome e área do lead.`,
        requiredVariables: ['nome', 'area'],
    },
    {
        id: generateId(),
        name: 'Diagnóstico',
        type: 'diagnosis' as StageType,
        order: 1,
        conditions: 'Lead identificado com nome e área',
        prompt: `Objetivo: Entender a dor e necessidade do lead.

AÇÕES:
1. Pergunte qual o MAIOR DESAFIO atual
2. Entenda há quanto tempo enfrenta esse problema
3. Pergunte o que já tentou para resolver

NÃO AVANCE até realmente entender a dor. Faça perguntas de aprofundamento.

TRANSIÇÃO: Avance quando tiver dor clara identificada.`,
        requiredVariables: ['desafio'],
    },
    {
        id: generateId(),
        name: 'Agendamento',
        type: 'schedule' as StageType,
        order: 2,
        conditions: 'Lead qualificado com dor identificada',
        prompt: `Objetivo: Agendar uma reunião de diagnóstico aprofundado.

AÇÕES:
1. Proponha uma conversa para entender melhor a situação
2. Ofereça 2-3 HORÁRIOS ESPECÍFICOS
3. Se houver objeção, entenda e apresente os mesmos horários novamente

HORÁRIOS DEVEM SER CONSISTENTES - não mude os horários propostos.

Se o lead aceitar, use a tool schedule_meeting para agendar.

TRANSIÇÃO: Avance após confirmar agendamento.`,
        requiredVariables: ['data_reuniao', 'horario_reuniao'],
    },
    {
        id: generateId(),
        name: 'Handoff',
        type: 'handoff' as StageType,
        order: 3,
        conditions: 'Reunião agendada com sucesso',
        prompt: `Objetivo: Confirmar e encerrar com excelência.

AÇÕES:
1. Confirme os dados da reunião
2. Pergunte se há algo mais que precise saber antes
3. Agradeça e gere expectativa positiva

Este é o último estágio antes da reunião.`,
        requiredVariables: [],
    },
];

/**
 * Gera um novo workflow com IDs únicos
 * Usado para garantir que cada agente tenha seus próprios IDs de estágio
 */
export function generateDefaultWorkflow(): StageConfig[] {
    return SONIC_IA_WORKFLOW.map(stage => ({
        ...stage,
        id: generateId(), // Novo ID para cada agente
    }));
}

/**
 * Retorna template baseado no tipo de agente
 */
export function getWorkflowTemplate(agentType: string = 'default'): StageConfig[] {
    // Por enquanto só temos o template SonicIA
    // Futuramente pode ter: 'vendas', 'suporte', 'leads', etc.
    switch (agentType) {
        case 'vendas':
        case 'closer':
        case 'sdr':
        default:
            return generateDefaultWorkflow();
    }
}
