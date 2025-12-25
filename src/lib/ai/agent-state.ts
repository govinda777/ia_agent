/**
 * AgentState - Estado tipado do agente inspirado em LangChain
 * 
 * Baseado em: https://docs.langchain.com/oss/python/langchain/agents#memory
 * 
 * Fornece:
 * - Tipagem estrita para variáveis
 * - Validação automática
 * - Serialização/deserialização
 * - Factory functions para criar estados iniciais
 */

import { CoreMessage } from 'ai';

// ════════════════════════════════════════════════════════════════════
// TIPOS DE MENSAGENS (inspirado em LangChain Messages)
// ════════════════════════════════════════════════════════════════════

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AgentMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface ToolCall {
    id: string;
    name: string;
    args: Record<string, any>;
    result?: string;
    status: 'pending' | 'success' | 'error';
}

// ════════════════════════════════════════════════════════════════════
// VARIÁVEIS TIPADAS COM VALIDAÇÃO
// ════════════════════════════════════════════════════════════════════

export interface AgentVariables {
    nome: string | null;
    email: string | null;
    telefone: string | null;
    area: string | null;
    desafio: string | null;
    data_reuniao: string | null;
    horario_reuniao: string | null;
    [key: string]: string | null | undefined;
}

// ════════════════════════════════════════════════════════════════════
// ESTADO COMPLETO DO AGENTE
// ════════════════════════════════════════════════════════════════════

export interface AgentState {
    // Identificadores
    threadId: string;
    agentId: string;
    userId?: string;

    // Histórico de mensagens
    messages: AgentMessage[];

    // Variáveis extraídas
    variables: AgentVariables;

    // Estado do fluxo
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

    // Tool calls pendentes
    pendingToolCalls: ToolCall[];
}

// ════════════════════════════════════════════════════════════════════
// VALIDADORES DE VARIÁVEIS
// ════════════════════════════════════════════════════════════════════

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 */
export function normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Lista de palavras que NÃO são nomes
 */
const BLOCKED_AS_NAME = new Set([
    // Dias da semana
    'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo',
    'segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira',
    // Horários e datas
    'hoje', 'amanha', 'manha', 'tarde', 'noite',
    // Confirmações
    'sim', 'nao', 'ok', 'certo', 'beleza', 'blz', 'fechado', 'combinado', 'perfeito', 'otimo',
    // Palavras comuns
    'as', 'hora', 'horas', 'dia', 'dias', 'pode', 'ser', 'que', 'para', 'com', 'esta', 'isso',
]);

/**
 * Valida se um valor pode ser um nome
 */
export function validateName(value: string): { valid: boolean; reason?: string } {
    const normalized = normalizeText(value);

    // Verifica se é palavra bloqueada
    if (BLOCKED_AS_NAME.has(normalized)) {
        return { valid: false, reason: 'É uma palavra reservada (dia/hora/confirmação)' };
    }

    // Verifica se é número
    if (/^\d+$/.test(value.trim())) {
        return { valid: false, reason: 'É um número' };
    }

    // Verifica se é formato de hora
    if (/^[aàá]s?\s*\d/.test(value) || /^\d{1,2}[h:]\d{0,2}$/.test(value.trim())) {
        return { valid: false, reason: 'É um formato de horário' };
    }

    // Verifica se é email
    if (/@/.test(value)) {
        return { valid: false, reason: 'É um email' };
    }

    // Verifica se é muito curto
    if (value.trim().length < 2) {
        return { valid: false, reason: 'Muito curto' };
    }

    // Verifica se contém caracteres inválidos para nome
    if (/[0-9@#$%^&*()_+=\[\]{}|\\:";'<>,.?\/]/.test(value)) {
        return { valid: false, reason: 'Contém caracteres inválidos' };
    }

    return { valid: true };
}

/**
 * Valida se um valor é um email válido
 */
export function validateEmail(value: string): { valid: boolean; reason?: string } {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

    if (!emailRegex.test(value.trim())) {
        return { valid: false, reason: 'Formato de email inválido' };
    }

    return { valid: true };
}

/**
 * Valida se um valor é um horário válido
 */
export function validateTime(value: string): { valid: boolean; reason?: string; normalized?: string } {
    // Tenta extrair hora/minuto
    let hours: number | null = null;
    let minutes: string = '00';

    // Padrão: "as 16", "às 10", "as 10:30"
    const asMatch = value.match(/^[aàá]s?\s*(\d{1,2})(?:[h:](\d{2}))?$/i);
    if (asMatch) {
        hours = parseInt(asMatch[1]);
        minutes = asMatch[2] || '00';
    }

    // Padrão: "16h", "14h", "10h" (SEM minutos)
    if (hours === null) {
        const hourOnlyMatch = value.match(/^(\d{1,2})h$/i);
        if (hourOnlyMatch) {
            hours = parseInt(hourOnlyMatch[1]);
            minutes = '00';
        }
    }

    // Padrão: "10:00", "10h30", "16h45" (COM minutos)
    if (hours === null) {
        const timeMatch = value.match(/^(\d{1,2})[h:](\d{2})$/i);
        if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = timeMatch[2];
        }
    }

    // Padrão: número puro "16", "10"
    if (hours === null) {
        const pureNumber = value.match(/^(\d{1,2})$/);
        if (pureNumber) {
            hours = parseInt(pureNumber[1]);
            minutes = '00';
        }
    }

    if (hours === null) {
        return { valid: false, reason: 'Não é um formato de horário reconhecido' };
    }

    // Valida horário comercial
    if (hours < 6 || hours > 22) {
        return { valid: false, reason: 'Horário fora do comercial (6h-22h)' };
    }

    return { valid: true, normalized: `${hours}:${minutes}` };
}

/**
 * Valida se um valor é uma data válida
 */
export function validateDate(value: string): { valid: boolean; reason?: string; normalized?: string } {
    // Padrão: "22/12", "22-12"
    const dateMatch = value.match(/^(\d{1,2})\s*[\/\-]\s*(\d{1,2})$/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);

        if (day < 1 || day > 31) {
            return { valid: false, reason: 'Dia inválido' };
        }
        if (month < 1 || month > 12) {
            return { valid: false, reason: 'Mês inválido' };
        }

        return {
            valid: true,
            normalized: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`
        };
    }

    return { valid: false, reason: 'Formato de data não reconhecido' };
}

// ════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Cria um estado inicial do agente
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
            nome: null,
            email: null,
            telefone: null,
            area: null,
            desafio: null,
            data_reuniao: null,
            horario_reuniao: null,
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
 * Cria uma mensagem do agente
 */
export function createMessage(
    role: MessageRole,
    content: string,
    metadata?: Record<string, any>
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
// MERGE DE VARIÁVEIS COM VALIDAÇÃO
// ════════════════════════════════════════════════════════════════════

/**
 * Faz merge de variáveis protegendo valores existentes
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

        // Proteger valores existentes
        if (protectExisting && existing[key] && String(existing[key]).trim() !== '') {
            console.log(`[AgentState] 🛡️ Protegendo ${key} existente: "${existing[key]}"`);
            continue;
        }

        // Validar antes de fazer merge
        if (validateBeforeMerge) {
            let validation: { valid: boolean; reason?: string } = { valid: true };

            switch (key) {
                case 'nome':
                    validation = validateName(value);
                    break;
                case 'email':
                    validation = validateEmail(value);
                    break;
                case 'horario_reuniao':
                    validation = validateTime(value);
                    break;
                case 'data_reuniao':
                    validation = validateDate(value);
                    break;
            }

            if (!validation.valid) {
                console.log(`[AgentState] ❌ Rejeitando ${key}="${value}": ${validation.reason}`);
                continue;
            }
        }

        result[key] = value;
        console.log(`[AgentState] ✅ ${key} = "${value}"`);
    }

    return result;
}

// ════════════════════════════════════════════════════════════════════
// SERIALIZAÇÃO
// ════════════════════════════════════════════════════════════════════

/**
 * Converte AgentMessage[] para CoreMessage[] do AI SDK
 */
export function toCoreMesages(messages: AgentMessage[]): CoreMessage[] {
    return messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
    }));
}

/**
 * Serializa o estado para persistência
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
 * Deserializa o estado
 */
export function deserializeState(json: string): AgentState {
    const parsed = JSON.parse(json);
    return {
        ...parsed,
        messages: parsed.messages.map((m: any) => ({
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
