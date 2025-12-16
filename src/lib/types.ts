/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TYPES - Tipos TypeScript compartilhados
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
    Agent,
    KnowledgeBaseItem,
    Thread,
    Message,
    User,
} from '@/db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string; details?: unknown };

export type ActionResponse<T = void> =
    | { success: true } & (T extends void ? object : { data: T })
    | { success: false; error: string; details?: unknown };

// ─────────────────────────────────────────────────────────────────────────────
// Extended Types (com relações)
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentWithKnowledge extends Agent {
    knowledge: KnowledgeBaseItem[];
}

export interface ThreadWithMessages extends Thread {
    messages: Message[];
}

export interface ThreadWithAgent extends Thread {
    agent: Agent | null;
}

export interface ThreadComplete extends Thread {
    agent: Agent | null;
    messages: Message[];
}

export interface UserWithAgents extends User {
    agents: Agent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
    activeConversations: number;
    leadsCaptures: number;
    meetingsScheduled: number;
    averageResponseTime: number;
    changePercentages: {
        conversations: number;
        leads: number;
        meetings: number;
        responseTime: number;
    };
}

export interface ThreadPreview {
    id: string;
    contactName: string;
    contactPhone: string;
    lastMessage: string;
    status: Thread['status'];
    lastInteractionAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIContext {
    agent: Pick<Agent, 'name' | 'systemPrompt' | 'enabledTools' | 'modelConfig'>;
    knowledge: Pick<KnowledgeBaseItem, 'topic' | 'content'>[];
    history: Pick<Message, 'role' | 'content'>[];
    contact: {
        name?: string;
        phone?: string;
    };
}

export interface AIResponse {
    text: string;
    toolCalls?: Array<{
        toolName: string;
        args: Record<string, unknown>;
        result?: Record<string, unknown>;
    }>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentFormData {
    name: string;
    description: string;
    systemPrompt: string;
    model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
    temperature: number;
    maxTokens: number;
    enabledTools: string[];
    isActive: boolean;
}

export interface KnowledgeFormData {
    topic: string;
    content: string;
    keywords: string[];
    priority: number;
    isActive: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Types
// ─────────────────────────────────────────────────────────────────────────────

export interface IncomingMessage {
    from: string;
    fromName: string;
    messageId: string;
    timestamp: Date;
    text: string;
}

export interface OutgoingMessage {
    to: string;
    message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PageProps<TParams = Record<string, string>> {
    params: TParams;
    searchParams?: Record<string, string | string[] | undefined>;
}

export interface LayoutProps {
    children: React.ReactNode;
}

// Re-export schema types for convenience
export type {
    Agent,
    KnowledgeBaseItem,
    Thread,
    Message,
    Integration,
    User,
    NewAgent,
    NewKnowledgeBaseItem,
    NewThread,
    NewMessage,
    NewIntegration,
    NewUser,
    MessageRole,
    ThreadStatus,
    IntegrationProvider,
    ToolCallStatus,
} from '@/db/schema';
