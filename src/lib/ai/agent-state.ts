/**
 * AgentState - Typed agent state inspired by LangChain
 *
 * Based on: https://docs.langchain.com/oss/python/langchain/agents#memory
 *
 * Provides:
 * - Strict typing for variables
 * - Automatic validation
 * - Serialization/deserialization
 * - Factory functions to create initial states
 */

import { CoreMessage } from 'ai';

// ════════════════════════════════════════════════════════════════════
// MESSAGE TYPES (inspired by LangChain Messages)
// ════════════════════════════════════════════════════════════════════

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AgentMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: string;
    status: 'pending' | 'success' | 'error';
}

// ════════════════════════════════════════════════════════════════════
// TYPED VARIABLES WITH VALIDATION
// ════════════════════════════════════════════════════════════════════

export interface AgentVariables {
    name: string | null;
    email: string | null;
    phone: string | null;
    area: string | null;
    challenge: string | null;
    meeting_date: string | null;
    meeting_time: string | null;
    [key: string]: string | null | undefined;
}

// ════════════════════════════════════════════════════════════════════
// COMPLETE AGENT STATE
// ════════════════════════════════════════════════════════════════════

export interface AgentState {
    // Identifiers
    threadId: string;
    agentId: string;
    userId?: string;

    // Message history
    messages: AgentMessage[];

    // Extracted variables
    variables: AgentVariables;

    // Flow state
    currentStage: string;
    previousStage?: string;

    // Metadata
    metadata: {
        createdAt: Date;
        lastActivity: Date;
        messageCount: number;
        toolCallCount: number;
        summarized: boolean;
        summaryContent?: string;
    };

    // Pending tool calls
    pendingToolCalls: ToolCall[];
}

// ════════════════════════════════════════════════════════════════════
// VARIABLE VALIDATORS
// ════════════════════════════════════════════════════════════════════

/**
 * Normalizes text by removing accents and converting to lowercase
 */
export function normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * List of words that are NOT names
 */
const BLOCKED_AS_NAME = new Set([
    // Days of the week
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    // Times and dates
    'today', 'tomorrow', 'morning', 'afternoon', 'evening',
    // Confirmations
    'yes', 'no', 'ok', 'right', 'cool', 'sure', 'perfect', 'great',
    // Common words
    'at', 'hour', 'hours', 'day', 'days', 'can', 'be', 'that', 'for', 'with', 'is', 'this',
]);

/**
 * Validates if a value can be a name
 */
export function validateName(value: string): { valid: boolean; reason?: string } {
    const normalized = normalizeText(value);

    // Check if it is a blocked word
    if (BLOCKED_AS_NAME.has(normalized)) {
        return { valid: false, reason: 'Is a reserved word (day/time/confirmation)' };
    }

    // Check if it is a number
    if (/^\d+$/.test(value.trim())) {
        return { valid: false, reason: 'Is a number' };
    }

    // Check if it is a time format
    if (/^at\s*\d/.test(value) || /^\d{1,2}[h:]\d{0,2}$/.test(value.trim())) {
        return { valid: false, reason: 'Is a time format' };
    }

    // Check if it is an email
    if (/@/.test(value)) {
        return { valid: false, reason: 'Is an email' };
    }

    // Check if it is too short
    if (value.trim().length < 2) {
        return { valid: false, reason: 'Too short' };
    }

    // Check if it contains invalid characters for a name
    if (/[0-9@#$%^&*()_+=\[\]{}|\\:";'<>,.?\/]/.test(value)) {
        return { valid: false, reason: 'Contains invalid characters' };
    }

    return { valid: true };
}

/**
 * Validates if a value is a valid email
 */
export function validateEmail(value: string): { valid: boolean; reason?: string } {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

    if (!emailRegex.test(value.trim())) {
        return { valid: false, reason: 'Invalid email format' };
    }

    return { valid: true };
}

/**
 * Validates if a value is a valid time
 */
export function validateTime(value: string): { valid: boolean; reason?: string; normalized?: string } {
    // Try to extract hour/minute
    let hours: number | null = null;
    let minutes: string = '00';

    // Pattern: "at 16", "at 10", "at 10:30"
    const asMatch = value.match(/^at\s*(\d{1,2})(?:[h:](\d{2}))?$/i);
    if (asMatch) {
        hours = parseInt(asMatch[1]);
        minutes = asMatch[2] || '00';
    }

    // Pattern: "16h", "14h", "10h" (WITHOUT minutes)
    if (hours === null) {
        const hourOnlyMatch = value.match(/^(\d{1,2})h$/i);
        if (hourOnlyMatch) {
            hours = parseInt(hourOnlyMatch[1]);
            minutes = '00';
        }
    }

    // Pattern: "10:00", "10h30", "16h45" (WITH minutes)
    if (hours === null) {
        const timeMatch = value.match(/^(\d{1,2})[h:](\d{2})$/i);
        if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = timeMatch[2];
        }
    }

    // Pattern: pure number "16", "10"
    if (hours === null) {
        const pureNumber = value.match(/^(\d{1,2})$/);
        if (pureNumber) {
            hours = parseInt(pureNumber[1]);
            minutes = '00';
        }
    }

    if (hours === null) {
        return { valid: false, reason: 'Not a recognized time format' };
    }

    // Validate business hours
    if (hours < 6 || hours > 22) {
        return { valid: false, reason: 'Time outside of business hours (6am-10pm)' };
    }

    return { valid: true, normalized: `${hours}:${minutes}` };
}

/**
 * Validates if a value is a valid date
 */
export function validateDate(value: string): { valid: boolean; reason?: string; normalized?: string } {
    // Pattern: "22/12", "22-12"
    const dateMatch = value.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})$/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);

        if (day < 1 || day > 31) {
            return { valid: false, reason: 'Invalid day' };
        }
        if (month < 1 || month > 12) {
            return { valid: false, reason: 'Invalid month' };
        }

        return {
            valid: true,
            normalized: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`
        };
    }

    return { valid: false, reason: 'Unrecognized date format' };
}

// ════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Creates an initial state for the agent
 */
export function createInitialState(
    threadId: string,
    agentId: string,
    userId?: string
): AgentState {
    return {
        threadId,
        agentId,
        userId,
        messages: [],
        variables: {
            name: null,
            email: null,
            phone: null,
            area: null,
            challenge: null,
            meeting_date: null,
            meeting_time: null,
        },
        currentStage: 'initial',
        metadata: {
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0,
            toolCallCount: 0,
            summarized: false,
        },
        pendingToolCalls: [],
    };
}

/**
 * Creates an agent message
 */
export function createMessage(
    role: MessageRole,
    content: string,
    metadata?: Record<string, unknown>
): AgentMessage {
    return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        timestamp: new Date(),
        metadata,
    };
}

// ════════════════════════════════════════════════════════════════════
// MERGE VARIABLES WITH VALIDATION
// ════════════════════════════════════════════════════════════════════

/**
 * Merges variables protecting existing values
 */
export function mergeVariables(
    existing: AgentVariables,
    extracted: Partial<AgentVariables>,
    options: {
        protectExisting?: boolean;
        validateBeforeMerge?: boolean;
    } = {}
): AgentVariables {
    const { protectExisting = true, validateBeforeMerge = true } = options;

    const result = { ...existing };

    for (const [key, value] of Object.entries(extracted)) {
        if (value === null || value === undefined || value === '') continue;

        // Protect existing values
        if (protectExisting && existing[key] && String(existing[key]).trim() !== '') {
            console.log(`[AgentState] 🛡️ Protecting existing ${key}: "${existing[key]}"`);
            continue;
        }

        // Validate before merging
        if (validateBeforeMerge) {
            let validation: { valid: boolean; reason?: string } = { valid: true };

            switch (key) {
                case 'name':
                    validation = validateName(value);
                    break;
                case 'email':
                    validation = validateEmail(value);
                    break;
                case 'meeting_time':
                    validation = validateTime(value);
                    break;
                case 'meeting_date':
                    validation = validateDate(value);
                    break;
            }

            if (!validation.valid) {
                console.log(`[AgentState] ❌ Rejecting ${key}="${value}": ${validation.reason}`);
                continue;
            }
        }

        result[key] = value;
        console.log(`[AgentState] ✅ ${key} = "${value}"`);
    }

    return result;
}

// ════════════════════════════════════════════════════════════════════
// SERIALIZATION
// ════════════════════════════════════════════════════════════════════

/**
 * Converts AgentMessage[] to CoreMessage[] from the AI SDK
 */
export function toCoreMesages(messages: AgentMessage[]): CoreMessage[] {
    return messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
    }));
}

/**
 * Serializes the state for persistence
 */
export function serializeState(state: AgentState): string {
    return JSON.stringify({
        ...state,
        messages: state.messages.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
        })),
        metadata: {
            ...state.metadata,
            createdAt: state.metadata.createdAt.toISOString(),
            lastActivity: state.metadata.lastActivity.toISOString(),
        },
    });
}

/**
 * Deserializes the state
 */
export function deserializeState(json: string): AgentState {
    const parsed = JSON.parse(json);
    return {
        ...parsed,
        messages: parsed.messages.map((m: { timestamp: string | number | Date; }) => ({
            ...m,
            timestamp: new Date(m.timestamp),
        })),
        metadata: {
            ...parsed.metadata,
            createdAt: new Date(parsed.metadata.createdAt),
            lastActivity: new Date(parsed.metadata.lastActivity),
        },
    };
}
