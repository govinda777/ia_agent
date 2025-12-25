/**
 * ErrorHandlingMiddleware - Tratamento robusto de erros
 * 
 * Baseado em: https://docs.langchain.com/oss/python/langchain/agents#tool-error-handling
 * 
 * Fornece:
 * - Retry automático com backoff exponencial
 * - Fallback para respostas padrão
 * - Logging estruturado de erros
 * - Circuit breaker para APIs problemáticas
 */

import { AgentState, createMessage } from '../agent-state';

// ════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════

export interface ErrorHandlingConfig {
    /** Número máximo de tentativas */
    maxRetries: number;
    /** Tempo base para backoff exponencial (ms) */
    baseBackoffMs: number;
    /** Tempo máximo de espera (ms) */
    maxBackoffMs: number;
    /** Habilitar circuit breaker */
    enableCircuitBreaker: boolean;
    /** Número de falhas antes de abrir o circuito */
    circuitBreakerThreshold: number;
    /** Tempo para tentar fechar o circuito (ms) */
    circuitBreakerResetMs: number;
}

export interface ErrorContext {
    operation: string;
    error: Error;
    attempt: number;
    state: AgentState;
    metadata?: Record<string, any>;
}

export type ErrorHandler = (context: ErrorContext) => Promise<string | null>;

const DEFAULT_CONFIG: ErrorHandlingConfig = {
    maxRetries: 3,
    baseBackoffMs: 1000,
    maxBackoffMs: 10000,
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 5,
    circuitBreakerResetMs: 60000,
};

// ════════════════════════════════════════════════════════════════════
// RESPOSTAS DE FALLBACK
// ════════════════════════════════════════════════════════════════════

const FALLBACK_RESPONSES: Record<string, string> = {
    'scheduling': 'Desculpe, estou com dificuldades para acessar a agenda no momento. Posso tentar novamente em alguns segundos, ou você prefere que eu anote os dados e confirme depois?',
    'ai_generation': 'Peço desculpas, estou enfrentando uma instabilidade momentânea. Por favor, repita sua mensagem ou aguarde um instante.',
    'database': 'Estou com dificuldades técnicas temporárias. Suas informações estão seguras e continuaremos em breve.',
    'default': 'Desculpe, algo deu errado. Por favor, tente novamente em alguns segundos.',
};

// ════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ════════════════════════════════════════════════════════════════════

interface CircuitState {
    failures: number;
    lastFailure: Date | null;
    isOpen: boolean;
}

const circuitStates: Map<string, CircuitState> = new Map();

function getCircuitState(operation: string): CircuitState {
    if (!circuitStates.has(operation)) {
        circuitStates.set(operation, {
            failures: 0,
            lastFailure: null,
            isOpen: false,
        });
    }
    return circuitStates.get(operation)!;
}

// ════════════════════════════════════════════════════════════════════
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ════════════════════════════════════════════════════════════════════

export class ErrorHandlingMiddleware {
    private config: ErrorHandlingConfig;
    private customHandlers: Map<string, ErrorHandler> = new Map();

    constructor(config: Partial<ErrorHandlingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Registra um handler customizado para um tipo de operação
     */
    registerHandler(operation: string, handler: ErrorHandler): void {
        this.customHandlers.set(operation, handler);
    }

    /**
     * Verifica se o circuito está aberto para uma operação
     */
    isCircuitOpen(operation: string): boolean {
        if (!this.config.enableCircuitBreaker) return false;

        const state = getCircuitState(operation);

        // Verificar se já passou tempo suficiente para tentar fechar
        if (state.isOpen && state.lastFailure) {
            const elapsed = Date.now() - state.lastFailure.getTime();
            if (elapsed > this.config.circuitBreakerResetMs) {
                console.log(`[ErrorMiddleware] 🔄 Circuit breaker half-open para ${operation}`);
                state.isOpen = false;
                state.failures = 0;
            }
        }

        return state.isOpen;
    }

    /**
     * Registra uma falha para o circuit breaker
     */
    private recordFailure(operation: string): void {
        const state = getCircuitState(operation);
        state.failures++;
        state.lastFailure = new Date();

        if (state.failures >= this.config.circuitBreakerThreshold) {
            state.isOpen = true;
            console.log(`[ErrorMiddleware] 🔴 Circuit breaker ABERTO para ${operation}`);
        }
    }

    /**
     * Registra um sucesso para o circuit breaker
     */
    private recordSuccess(operation: string): void {
        const state = getCircuitState(operation);
        state.failures = 0;
        state.isOpen = false;
    }

    /**
     * Calcula o tempo de espera com backoff exponencial
     */
    private calculateBackoff(attempt: number): number {
        const backoff = this.config.baseBackoffMs * Math.pow(2, attempt);
        return Math.min(backoff, this.config.maxBackoffMs);
    }

    /**
     * Executa uma operação com retry e tratamento de erros
     */
    async execute<T>(
        operation: string,
        fn: () => Promise<T>,
        state: AgentState
    ): Promise<{ success: boolean; result?: T; fallbackResponse?: string }> {
        // Verificar circuit breaker
        if (this.isCircuitOpen(operation)) {
            console.log(`[ErrorMiddleware] ⛔ Circuit breaker aberto para ${operation}`);
            return {
                success: false,
                fallbackResponse: FALLBACK_RESPONSES[operation] || FALLBACK_RESPONSES['default'],
            };
        }

        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                const result = await fn();
                this.recordSuccess(operation);
                return { success: true, result };
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.log(`[ErrorMiddleware] ⚠️ Tentativa ${attempt + 1}/${this.config.maxRetries} falhou para ${operation}:`, lastError.message);

                // Tentar handler customizado
                if (this.customHandlers.has(operation)) {
                    const customResponse = await this.customHandlers.get(operation)!({
                        operation,
                        error: lastError,
                        attempt,
                        state,
                    });

                    if (customResponse) {
                        return { success: false, fallbackResponse: customResponse };
                    }
                }

                // Aguardar antes de tentar novamente
                if (attempt < this.config.maxRetries - 1) {
                    const backoff = this.calculateBackoff(attempt);
                    console.log(`[ErrorMiddleware] ⏳ Aguardando ${backoff}ms antes de tentar novamente...`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                }
            }
        }

        // Todas as tentativas falharam
        this.recordFailure(operation);
        console.log(`[ErrorMiddleware] ❌ Todas as tentativas falharam para ${operation}`);

        return {
            success: false,
            fallbackResponse: FALLBACK_RESPONSES[operation] || FALLBACK_RESPONSES['default'],
        };
    }
}

// ════════════════════════════════════════════════════════════════════
// FUNÇÃO AUXILIAR
// ════════════════════════════════════════════════════════════════════

/**
 * Cria uma instância do middleware com configurações padrão
 */
export function createErrorHandlingMiddleware(
    config?: Partial<ErrorHandlingConfig>
): ErrorHandlingMiddleware {
    return new ErrorHandlingMiddleware(config);
}
