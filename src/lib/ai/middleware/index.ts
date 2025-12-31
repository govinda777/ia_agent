/**
 * Middleware Barrel File
 * 
 * Exporta todos os middlewares e utilitários da arquitetura LangChain-inspired
 */

// Estado do Agente
export {
    type AgentState,
    type AgentVariables,
    type AgentMessage,
    type MessageRole,
    type ToolCall,
    createInitialState,
    createMessage,
    mergeVariables,
    validateName,
    validateEmail,
    validateTime,
    validateDate,
    normalizeText,
    toCoreMesages,
    serializeState,
    deserializeState,
} from '../agent-state';

// Sumarização
export {
    SummarizationMiddleware,
    createSummarizationMiddleware,
    type SummarizationConfig,
} from './summarization';

// Tratamento de Erros
export {
    ErrorHandlingMiddleware,
    createErrorHandlingMiddleware,
    type ErrorHandlingConfig,
    type ErrorContext,
    type ErrorHandler,
} from './error-handling';

// Executor de Ferramentas
export {
    ToolExecutor,
    createToolExecutor,
    saveLeadTool,
    scheduleMeetingTool,
    type ToolDefinition,
    type ToolResult,
} from './tool-executor';

// Streaming
export {
    StreamingMiddleware,
    createStreamingMiddleware,
    processStream,
    type StreamChunk,
    type StreamCallback,
    type StreamingConfig,
} from './streaming';
