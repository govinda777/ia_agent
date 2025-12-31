/**
 * ToolExecutor - Structured tool execution
 *
 * Based on: https://docs.langchain.com/oss/python/langchain/tools
 *
 * Provides:
 * - Registration of tools with typing
 * - Execution with parameter validation
 * - Structured logging
 * - Integration with ErrorHandlingMiddleware
 */

import { AgentState, ToolCall } from '../agent-state';
import { ErrorHandlingMiddleware, createErrorHandlingMiddleware } from './error-handling';

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

export interface ToolDefinition {
    /** Unique name of the tool */
    name: string;
    /** Description for the model to understand when to use it */
    description: string;
    /** JSON schema of the parameters */
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            required?: boolean;
        }>;
        required?: string[];
    };
    /** Execution function */
    execute: (args: Record<string, unknown>, state: AgentState) => Promise<string>;
}

export interface ToolResult {
    success: boolean;
    content: string;
    toolCallId: string;
    metadata?: Record<string, unknown>;
}

// ════════════════════════════════════════════════════════════════════
// TOOL EXECUTOR
// ════════════════════════════════════════════════════════════════════

export class ToolExecutor {
    private tools: Map<string, ToolDefinition> = new Map();
    private errorHandler: ErrorHandlingMiddleware;

    constructor(errorHandler?: ErrorHandlingMiddleware) {
        this.errorHandler = errorHandler || createErrorHandlingMiddleware();
    }

    /**
     * Registers a tool
     */
    register(tool: ToolDefinition): void {
        this.tools.set(tool.name, tool);
        console.log(`[ToolExecutor] 🔧 Tool registered: ${tool.name}`);
    }

    /**
     * Registers multiple tools
     */
    registerAll(tools: ToolDefinition[]): void {
        tools.forEach(tool => this.register(tool));
    }

    /**
     * Lists the available tools
     */
    list(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * Gets a tool by name
     */
    get(name: string): ToolDefinition | undefined {
        return this.tools.get(name);
    }

    /**
     * Validates a tool's parameters
     */
    validateParams(tool: ToolDefinition, args: Record<string, unknown>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const required = tool.parameters.required || [];

        // Check required parameters
        for (const param of required) {
            if (!(param in args) || args[param] === null || args[param] === undefined) {
                errors.push(`Missing required parameter: ${param}`);
            }
        }

        // Check types
        for (const [key, value] of Object.entries(args)) {
            const paramDef = tool.parameters.properties[key];
            if (paramDef) {
                const expectedType = paramDef.type;
                const actualType = typeof value;

                if (expectedType === 'string' && actualType !== 'string') {
                    errors.push(`Parameter ${key} should be a string, received ${actualType}`);
                }
                if (expectedType === 'number' && actualType !== 'number') {
                    errors.push(`Parameter ${key} should be a number, received ${actualType}`);
                }
                if (expectedType === 'boolean' && actualType !== 'boolean') {
                    errors.push(`Parameter ${key} should be a boolean, received ${actualType}`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Executes a tool
     */
    async execute(toolCall: ToolCall, state: AgentState): Promise<ToolResult> {
        const tool = this.tools.get(toolCall.name);

        if (!tool) {
            console.log(`[ToolExecutor] ❌ Tool not found: ${toolCall.name}`);
            return {
                success: false,
                content: `Error: Tool "${toolCall.name}" not found.`,
                toolCallId: toolCall.id,
            };
        }

        // Validate parameters
        const validation = this.validateParams(tool, toolCall.args);
        if (!validation.valid) {
            console.log(`[ToolExecutor] ❌ Invalid parameters:`, validation.errors);
            return {
                success: false,
                content: `Error: Invalid parameters - ${validation.errors.join(', ')}`,
                toolCallId: toolCall.id,
            };
        }

        console.log(`[ToolExecutor] 🔧 Executing ${toolCall.name}:`, toolCall.args);

        // Execute with error handling
        const result = await this.errorHandler.execute(
            `tool_${toolCall.name}`,
            () => tool.execute(toolCall.args, state),
            state
        );

        if (result.success) {
            console.log(`[ToolExecutor] ✅ ${toolCall.name} executed successfully`);
            return {
                success: true,
                content: result.result!,
                toolCallId: toolCall.id,
            };
        } else {
            console.log(`[ToolExecutor] ⚠️ ${toolCall.name} failed, using fallback`);
            return {
                success: false,
                content: result.fallbackResponse!,
                toolCallId: toolCall.id,
                metadata: { fallback: true },
            };
        }
    }

    /**
     * Executes multiple tools in parallel
     */
    async executeAll(toolCalls: ToolCall[], state: AgentState): Promise<ToolResult[]> {
        return Promise.all(toolCalls.map(tc => this.execute(tc, state)));
    }

    /**
     * Generates the schema of the tools for the model
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
// DEFAULT TOOLS
// ════════════════════════════════════════════════════════════════════

/**
 * Tool to save a lead in the CRM
 */
export const saveLeadTool: ToolDefinition = {
    name: 'save_lead',
    description: 'Saves the lead\'s data in the CRM system',
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Lead\'s name' },
            email: { type: 'string', description: 'Lead\'s email' },
            phone: { type: 'string', description: 'Lead\'s phone number' },
            area: { type: 'string', description: 'Lead\'s area/niche' },
            challenge: { type: 'string', description: 'Main challenge' },
        },
        required: ['name'],
    },
    execute: async (args, _state) => {
        // Example implementation - integrate with your CRM
        console.log('[save_lead] Saving lead:', args);
        return `Lead ${args.name} saved successfully.`;
    },
};

/**
 * Tool to schedule a meeting
 */
export const scheduleMeetingTool: ToolDefinition = {
    name: 'schedule_meeting',
    description: 'Schedules a meeting in Google Calendar',
    parameters: {
        type: 'object',
        properties: {
            email: { type: 'string', description: 'Participant\'s email' },
            date: { type: 'string', description: 'Meeting date (DD/MM)' },
            time: { type: 'string', description: 'Meeting time (HH:MM)' },
            name: { type: 'string', description: 'Participant\'s name' },
        },
        required: ['email', 'date', 'time'],
    },
    execute: async (args, _state) => {
        // Example implementation - integrate with Google Calendar
        console.log('[schedule_meeting] Scheduling meeting:', args);
        return `Meeting scheduled for ${args.date} at ${args.time} with ${args.name || 'participant'}.`;
    },
};

// ════════════════════════════════════════════════════════════════════
// HELPER FUNCTION
// ════════════════════════════════════════════════════════════════════

/**
 * Creates an instance of the executor with default tools
 */
export function createToolExecutor(
    customTools?: ToolDefinition[],
    errorHandler?: ErrorHandlingMiddleware
): ToolExecutor {
    const executor = new ToolExecutor(errorHandler);

    // Register default tools
    executor.register(saveLeadTool);
    executor.register(scheduleMeetingTool);

    // Register custom tools
    if (customTools) {
        executor.registerAll(customTools);
    }

    return executor;
}
