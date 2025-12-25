/**
 * ToolExecutor - Execução estruturada de ferramentas
 * 
 * Baseado em: https://docs.langchain.com/oss/python/langchain/tools
 * 
 * Fornece:
 * - Registro de ferramentas com tipagem
 * - Execução com validação de parâmetros
 * - Logging estruturado
 * - Integração com ErrorHandlingMiddleware
 */

import { AgentState, ToolCall } from '../agent-state';
import { ErrorHandlingMiddleware, createErrorHandlingMiddleware } from './error-handling';

// ════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════

export interface ToolDefinition {
    /** Nome único da ferramenta */
    name: string;
    /** Descrição para o modelo entender quando usar */
    description: string;
    /** Schema JSON dos parâmetros */
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            required?: boolean;
        }>;
        required?: string[];
    };
    /** Função de execução */
    execute: (args: Record<string, any>, state: AgentState) => Promise<string>;
}

export interface ToolResult {
    success: boolean;
    content: string;
    toolCallId: string;
    metadata?: Record<string, any>;
}

// ════════════════════════════════════════════════════════════════════
// EXECUTOR DE FERRAMENTAS
// ════════════════════════════════════════════════════════════════════

export class ToolExecutor {
    private tools: Map<string, ToolDefinition> = new Map();
    private errorHandler: ErrorHandlingMiddleware;

    constructor(errorHandler?: ErrorHandlingMiddleware) {
        this.errorHandler = errorHandler || createErrorHandlingMiddleware();
    }

    /**
     * Registra uma ferramenta
     */
    register(tool: ToolDefinition): void {
        this.tools.set(tool.name, tool);
        console.log(`[ToolExecutor] 🔧 Ferramenta registrada: ${tool.name}`);
    }

    /**
     * Registra múltiplas ferramentas
     */
    registerAll(tools: ToolDefinition[]): void {
        tools.forEach(tool => this.register(tool));
    }

    /**
     * Lista as ferramentas disponíveis
     */
    list(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * Obtém uma ferramenta pelo nome
     */
    get(name: string): ToolDefinition | undefined {
        return this.tools.get(name);
    }

    /**
     * Valida os parâmetros de uma ferramenta
     */
    validateParams(tool: ToolDefinition, args: Record<string, any>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const required = tool.parameters.required || [];

        // Verificar parâmetros obrigatórios
        for (const param of required) {
            if (!(param in args) || args[param] === null || args[param] === undefined) {
                errors.push(`Parâmetro obrigatório ausente: ${param}`);
            }
        }

        // Verificar tipos
        for (const [key, value] of Object.entries(args)) {
            const paramDef = tool.parameters.properties[key];
            if (paramDef) {
                const expectedType = paramDef.type;
                const actualType = typeof value;

                if (expectedType === 'string' && actualType !== 'string') {
                    errors.push(`Parâmetro ${key} deve ser string, recebido ${actualType}`);
                }
                if (expectedType === 'number' && actualType !== 'number') {
                    errors.push(`Parâmetro ${key} deve ser number, recebido ${actualType}`);
                }
                if (expectedType === 'boolean' && actualType !== 'boolean') {
                    errors.push(`Parâmetro ${key} deve ser boolean, recebido ${actualType}`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Executa uma ferramenta
     */
    async execute(toolCall: ToolCall, state: AgentState): Promise<ToolResult> {
        const tool = this.tools.get(toolCall.name);

        if (!tool) {
            console.log(`[ToolExecutor] ❌ Ferramenta não encontrada: ${toolCall.name}`);
            return {
                success: false,
                content: `Erro: Ferramenta "${toolCall.name}" não encontrada.`,
                toolCallId: toolCall.id,
            };
        }

        // Validar parâmetros
        const validation = this.validateParams(tool, toolCall.args);
        if (!validation.valid) {
            console.log(`[ToolExecutor] ❌ Parâmetros inválidos:`, validation.errors);
            return {
                success: false,
                content: `Erro: Parâmetros inválidos - ${validation.errors.join(', ')}`,
                toolCallId: toolCall.id,
            };
        }

        console.log(`[ToolExecutor] 🔧 Executando ${toolCall.name}:`, toolCall.args);

        // Executar com tratamento de erros
        const result = await this.errorHandler.execute(
            `tool_${toolCall.name}`,
            () => tool.execute(toolCall.args, state),
            state
        );

        if (result.success) {
            console.log(`[ToolExecutor] ✅ ${toolCall.name} executado com sucesso`);
            return {
                success: true,
                content: result.result!,
                toolCallId: toolCall.id,
            };
        } else {
            console.log(`[ToolExecutor] ⚠️ ${toolCall.name} falhou, usando fallback`);
            return {
                success: false,
                content: result.fallbackResponse!,
                toolCallId: toolCall.id,
                metadata: { fallback: true },
            };
        }
    }

    /**
     * Executa múltiplas ferramentas em paralelo
     */
    async executeAll(toolCalls: ToolCall[], state: AgentState): Promise<ToolResult[]> {
        return Promise.all(toolCalls.map(tc => this.execute(tc, state)));
    }

    /**
     * Gera o schema das ferramentas para o modelo
     */
    getToolSchemas(): Array<{
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: ToolDefinition['parameters'];
        };
    }> {
        return this.list().map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            },
        }));
    }
}

// ════════════════════════════════════════════════════════════════════
// FERRAMENTAS PADRÃO
// ════════════════════════════════════════════════════════════════════

/**
 * Ferramenta para salvar lead no CRM
 */
export const saveLeadTool: ToolDefinition = {
    name: 'save_lead',
    description: 'Salva os dados do lead no sistema CRM',
    parameters: {
        type: 'object',
        properties: {
            nome: { type: 'string', description: 'Nome do lead' },
            email: { type: 'string', description: 'Email do lead' },
            telefone: { type: 'string', description: 'Telefone do lead' },
            area: { type: 'string', description: 'Área/nicho do lead' },
            desafio: { type: 'string', description: 'Desafio principal' },
        },
        required: ['nome'],
    },
    execute: async (args, state) => {
        // Implementação de exemplo - integrar com seu CRM
        console.log('[save_lead] Salvando lead:', args);
        return `Lead ${args.nome} salvo com sucesso.`;
    },
};

/**
 * Ferramenta para agendar reunião
 */
export const scheduleMeetingTool: ToolDefinition = {
    name: 'schedule_meeting',
    description: 'Agenda uma reunião no Google Calendar',
    parameters: {
        type: 'object',
        properties: {
            email: { type: 'string', description: 'Email do participante' },
            data: { type: 'string', description: 'Data da reunião (DD/MM)' },
            horario: { type: 'string', description: 'Horário da reunião (HH:MM)' },
            nome: { type: 'string', description: 'Nome do participante' },
        },
        required: ['email', 'data', 'horario'],
    },
    execute: async (args, state) => {
        // Implementação de exemplo - integrar com Google Calendar
        console.log('[schedule_meeting] Agendando reunião:', args);
        return `Reunião agendada para ${args.data} às ${args.horario} com ${args.nome || 'participante'}.`;
    },
};

// ════════════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR
// ════════════════════════════════════════════════════════════════════

/**
 * Cria uma instância do executor com ferramentas padrão
 */
export function createToolExecutor(
    customTools?: ToolDefinition[],
    errorHandler?: ErrorHandlingMiddleware
): ToolExecutor {
    const executor = new ToolExecutor(errorHandler);

    // Registrar ferramentas padrão
    executor.register(saveLeadTool);
    executor.register(scheduleMeetingTool);

    // Registrar ferramentas customizadas
    if (customTools) {
        executor.registerAll(customTools);
    }

    return executor;
}
