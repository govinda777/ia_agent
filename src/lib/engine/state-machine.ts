/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STATE MACHINE ENGINE - Orquestração de Estágios (Zaia-Style)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Este módulo implementa a lógica de máquina de estados para os agentes IA.
 * 
 * Fluxo:
 * 1. Recebe mensagem do usuário
 * 2. Identifica o estágio atual
 * 3. Valida variáveis obrigatórias
 * 4. Executa ações do estágio (se configuradas)
 * 5. Transiciona para próximo estágio (se requisitos cumpridos)
 * 6. Gera resposta contextualizada
 */

import type { StageConfig, Session, Agent } from '@/db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkflowState {
    currentStage: StageConfig | null;
    previousStage: StageConfig | null;
    variables: Record<string, unknown>;
    stageHistory: string[];
    isComplete: boolean;
    pendingVariables: string[];
}

export interface TransitionResult {
    shouldTransition: boolean;
    nextStage: StageConfig | null;
    reason: string;
}

export interface StagePromptContext {
    stage: StageConfig;
    variables: Record<string, unknown>;
    missingVariables: string[];
    companyProfile: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE MACHINE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class StateMachine {
    private workflow: StageConfig[];
    private companyProfile: string | null;

    constructor(agent: Pick<Agent, 'workflowConfig' | 'companyProfile'>) {
        this.workflow = (agent.workflowConfig as StageConfig[]) || [];
        this.companyProfile = agent.companyProfile || null;
    }

    /**
     * Obtém o estágio inicial do workflow
     */
    getInitialStage(): StageConfig | null {
        if (this.workflow.length === 0) return null;

        // Ordenar por 'order' e pegar o primeiro
        const sorted = [...this.workflow].sort((a, b) => a.order - b.order);
        return sorted[0] || null;
    }

    /**
     * Obtém um estágio pelo ID
     */
    getStageById(stageId: string): StageConfig | null {
        return this.workflow.find(s => s.id === stageId) || null;
    }

    /**
     * Calcula o estado atual do workflow baseado na sessão
     */
    calculateState(session: Partial<Session>): WorkflowState {
        const currentStageId = session.currentStageId;
        const previousStageId = session.previousStageId;
        const variables = (session.variables as Record<string, unknown>) || {};
        const stageHistory = (session.stageHistory as string[]) || [];

        const currentStage = currentStageId
            ? this.getStageById(currentStageId)
            : this.getInitialStage();

        const previousStage = previousStageId
            ? this.getStageById(previousStageId)
            : null;

        const pendingVariables = currentStage
            ? this.getMissingVariables(currentStage, variables)
            : [];

        const isComplete = currentStage?.nextStageId === null && pendingVariables.length === 0;

        return {
            currentStage,
            previousStage,
            variables,
            stageHistory,
            isComplete,
            pendingVariables,
        };
    }

    /**
     * Verifica quais variáveis obrigatórias estão faltando
     */
    getMissingVariables(
        stage: StageConfig,
        variables: Record<string, unknown>
    ): string[] {
        return stage.requiredVariables.filter(varName => {
            const value = variables[varName];
            return value === undefined || value === null || value === '';
        });
    }

    /**
     * Verifica se pode transicionar para o próximo estágio
     */
    canTransition(stage: StageConfig, variables: Record<string, unknown>): TransitionResult {
        const missing = this.getMissingVariables(stage, variables);

        if (missing.length > 0) {
            return {
                shouldTransition: false,
                nextStage: null,
                reason: `Variáveis pendentes: ${missing.join(', ')}`,
            };
        }

        if (!stage.nextStageId) {
            return {
                shouldTransition: false,
                nextStage: null,
                reason: 'Fim do fluxo',
            };
        }

        const nextStage = this.getStageById(stage.nextStageId);

        if (!nextStage) {
            return {
                shouldTransition: false,
                nextStage: null,
                reason: `Próximo estágio não encontrado: ${stage.nextStageId}`,
            };
        }

        return {
            shouldTransition: true,
            nextStage,
            reason: 'Todos os requisitos cumpridos',
        };
    }

    /**
     * Constrói o prompt dinâmico para o estágio atual
     */
    buildStagePrompt(context: StagePromptContext): string {
        const { stage, variables, missingVariables, companyProfile } = context;

        const parts: string[] = [];

        // Perfil da empresa
        if (companyProfile) {
            parts.push(`## Contexto da Empresa\n${companyProfile}`);
        }

        // Estágio atual
        parts.push(`## Estágio Atual: ${stage.name}`);
        parts.push(`Tipo: ${stage.type}`);

        if (stage.description) {
            parts.push(`Descrição: ${stage.description}`);
        }

        // Condições do estágio
        if (stage.conditions) {
            parts.push(`\n## Condições\n${stage.conditions}`);
        }

        // Prompt específico do estágio
        if (stage.prompt) {
            parts.push(`\n## Instruções do Estágio\n${stage.prompt}`);
        }

        // Variáveis coletadas
        const collectedVars = Object.entries(variables)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n');

        if (collectedVars) {
            parts.push(`\n## Informações Já Coletadas\n${collectedVars}`);
        }

        // Variáveis pendentes
        if (missingVariables.length > 0) {
            parts.push(`\n## IMPORTANTE: Informações Pendentes`);
            parts.push(`Você DEVE coletar as seguintes informações antes de avançar:`);
            missingVariables.forEach(v => {
                parts.push(`- ${v}`);
            });
            parts.push(`\nNão prossiga sem ter todas essas informações.`);
        }

        // Ação configurada
        if (stage.actionConfig) {
            parts.push(`\n## Ação Disponível`);
            parts.push(`Quando tiver todos os dados, você pode usar a ferramenta de ${stage.actionConfig.action}.`);

            if (stage.actionConfig.settings.promptAdjustment) {
                parts.push(`Preferência: ${stage.actionConfig.settings.promptAdjustment}`);
            }
        }

        return parts.join('\n');
    }

    /**
     * Retorna todos os estágios ordenados
     */
    getAllStages(): StageConfig[] {
        return [...this.workflow].sort((a, b) => a.order - b.order);
    }

    /**
     * Verifica se o workflow está vazio
     */
    isEmpty(): boolean {
        return this.workflow.length === 0;
    }

    /**
     * Obtém o perfil da empresa
     */
    getCompanyProfile(): string | null {
        return this.companyProfile;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria uma nova instância de StateMachine a partir de um agente
 */
export function createStateMachine(
    agent: Pick<Agent, 'workflowConfig' | 'companyProfile'>
): StateMachine {
    return new StateMachine(agent);
}

/**
 * Gera um ID único para um novo estágio
 */
export function generateStageId(): string {
    return `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cria um estágio padrão vazio
 */
export function createDefaultStage(order: number): StageConfig {
    return {
        id: generateStageId(),
        type: 'custom',
        name: `Estágio ${order + 1}`,
        description: '',
        conditions: '',
        requiredVariables: [],
        prompt: '',
        order,
        nextStageId: null,
    };
}

/**
 * Cria o workflow padrão (Identificar -> Diagnosticar -> Agendar)
 */
export function createDefaultWorkflow(): StageConfig[] {
    const stages: StageConfig[] = [
        {
            id: 'stage_identify',
            type: 'identify',
            name: 'Identificação',
            description: 'Coletar informações básicas do lead',
            conditions: 'Início da conversa ou quando não temos o nome do lead.',
            requiredVariables: ['data.nome'],
            prompt: `Seu objetivo neste estágio é:
1. Cumprimentar o lead de forma cordial
2. Perguntar o nome dele de forma natural
3. Entender brevemente o que ele procura

Seja simpático mas profissional. Não seja robótico.`,
            order: 0,
            nextStageId: 'stage_diagnosis',
        },
        {
            id: 'stage_diagnosis',
            type: 'diagnosis',
            name: 'Diagnóstico',
            description: 'Entender as necessidades e qualificar o lead',
            conditions: 'Quando já sabemos o nome e precisamos entender a necessidade.',
            requiredVariables: ['data.interesse', 'data.email'],
            prompt: `Seu objetivo neste estágio é:
1. Usar o nome do lead para personalizar a conversa
2. Fazer perguntas para entender:
   - O que ele está buscando
   - Qual problema precisa resolver
   - Qual o orçamento disponível (se aplicável)
3. Coletar o email para enviar materiais

Seja consultivo, não vendedor.`,
            order: 1,
            nextStageId: 'stage_schedule',
        },
        {
            id: 'stage_schedule',
            type: 'schedule',
            name: 'Agendamento',
            description: 'Agendar uma reunião com o lead qualificado',
            conditions: 'Quando o lead está qualificado e pronto para reunião.',
            requiredVariables: [],
            prompt: `Seu objetivo neste estágio é:
1. Oferecer agendar uma reunião/call
2. Listar horários disponíveis
3. Confirmar o agendamento

Use a ferramenta de agendamento quando o lead aceitar.`,
            order: 2,
            nextStageId: null,
            actionConfig: {
                provider: 'google_calendar',
                action: 'list_slots',
                settings: {
                    duration: 30,
                    searchWindowDays: 5,
                    timeRangeStart: '09:00',
                    timeRangeEnd: '18:00',
                    excludeWeekends: true,
                    promptAdjustment: 'Priorize horários pela manhã',
                    eventTitleTemplate: 'Reunião com {{data.nome}}',
                },
            },
        },
    ];

    return stages;
}
