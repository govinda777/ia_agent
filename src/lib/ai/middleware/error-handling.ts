/**
 * ErrorHandlingMiddleware - Robust error handling
 *
 * Based on: https://docs.langchain.com/oss/python/langchain/agents#tool-error-handling
 *
 * Provides:
 * - Automatic retry with exponential backoff
 * - Fallback to default responses
 * - Structured error logging
 * - Circuit breaker for problematic APIs
 */

import { AgentState } from '../agent-state';

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

export interface ErrorHandlingConfig {
    /** Maximum number of retries */
    maxRetries: number;
    /** Base time for exponential backoff (ms) */
    baseBackoffMs: number;
    /** Maximum wait time (ms) */
    maxBackoffMs: number;
    /** Enable circuit breaker */
    enableCircuitBreaker: boolean;
    /** Number of failures before opening the circuit */
    circuitBreakerThreshold: number;
    /** Time to try closing the circuit (ms) */
    circuitBreakerResetMs: number;
}

export interface ErrorContext {
    operation: string;
    error: Error;
    attempt: number;
    state: AgentState;
    metadata?: Record<string, unknown>;
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
// FALLBACK RESPONSES
// ════════════════════════════════════════════════════════════════════

const FALLBACK_RESPONSES: Record<string, string> = {
    'scheduling': 'Sorry, I\'m having trouble accessing the calendar at the moment. Can I try again in a few seconds, or would you prefer I take down the details and confirm later?',
    'ai_generation': 'I apologize, I\'m experiencing a momentary instability. Please repeat your message or wait a moment.',
    'database': 'I\'m having temporary technical difficulties. Your information is safe and we will continue shortly.',
    'default': 'Sorry, something went wrong. Please try again in a few seconds.',
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
// ERROR HANDLING MIDDLEWARE
// ════════════════════════════════════════════════════════════════════

export class ErrorHandlingMiddleware {
    private config: ErrorHandlingConfig;
    private customHandlers: Map<string, ErrorHandler> = new Map();

    constructor(config: Partial<ErrorHandlingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Registers a custom handler for an operation type
     */
    registerHandler(operation: string, handler: ErrorHandler): void {
        this.customHandlers.set(operation, handler);
    }

    /**
     * Checks if the circuit is open for an operation
     */
    isCircuitOpen(operation: string): boolean {
        if (!this.config.enableCircuitBreaker) return false;

        const state = getCircuitState(operation);

        // Check if enough time has passed to try closing
        if (state.isOpen && state.lastFailure) {
            const elapsed = Date.now() - state.lastFailure.getTime();
            if (elapsed > this.config.circuitBreakerResetMs) {
                console.log(`[ErrorMiddleware] 🔄 Circuit breaker half-open for ${operation}`);
                state.isOpen = false;
                state.failures = 0;
            }
        }

        return state.isOpen;
    }

    /**
     * Records a failure for the circuit breaker
     */
    private recordFailure(operation: string): void {
        const state = getCircuitState(operation);
        state.failures++;
        state.lastFailure = new Date();

        if (state.failures >= this.config.circuitBreakerThreshold) {
            state.isOpen = true;
            console.log(`[ErrorMiddleware] 🔴 Circuit breaker OPEN for ${operation}`);
        }
    }

    /**
     * Records a success for the circuit breaker
     */
    private recordSuccess(operation: string): void {
        const state = getCircuitState(operation);
        state.failures = 0;
        state.isOpen = false;
    }

    /**
     * Calculates the wait time with exponential backoff
     */
    private calculateBackoff(attempt: number): number {
        const backoff = this.config.baseBackoffMs * Math.pow(2, attempt);
        return Math.min(backoff, this.config.maxBackoffMs);
    }

    /**
     * Executes an operation with retry and error handling
     */
    async execute<T>(
        operation: string,
        fn: () => Promise<T>,
        state: AgentState
    ): Promise<{ success: boolean; result?: T; fallbackResponse?: string }> {
        // Check circuit breaker
        if (this.isCircuitOpen(operation)) {
            console.log(`[ErrorMiddleware] ⛔ Circuit breaker open for ${operation}`);
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
                console.log(`[ErrorMiddleware] ⚠️ Attempt ${attempt + 1}/${this.config.maxRetries} failed for ${operation}:`, lastError.message);

                // Try custom handler
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

                // Wait before retrying
                if (attempt < this.config.maxRetries - 1) {
                    const backoff = this.calculateBackoff(attempt);
                    console.log(`[ErrorMiddleware] ⏳ Waiting ${backoff}ms before retrying...`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                }
            }
        }

        // All retries failed
        this.recordFailure(operation);
        console.log(`[ErrorMiddleware] ❌ All attempts failed for ${operation}`);

        return {
            success: false,
            fallbackResponse: FALLBACK_RESPONSES[operation] || FALLBACK_RESPONSES['default'],
        };
    }
}

// ════════════════════════════════════════════════════════════════════
// HELPER FUNCTION
// ════════════════════════════════════════════════════════════════════

/**
 * Creates an instance of the middleware with default settings
 */
export function createErrorHandlingMiddleware(
    config?: Partial<ErrorHandlingConfig>
): ErrorHandlingMiddleware {
    return new ErrorHandlingMiddleware(config);
}
