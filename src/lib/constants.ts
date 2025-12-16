/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONSTANTS - Constantes globais da aplicação
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Configurações de modelos de IA disponíveis
 */
export const AI_MODELS = {
    'gpt-4o': {
        name: 'GPT-4o',
        description: 'Mais inteligente, ideal para conversas complexas',
        maxTokens: 4096,
        costPer1kTokens: 0.015,
    },
    'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        description: 'Rápido e econômico, ideal para alto volume',
        maxTokens: 4096,
        costPer1kTokens: 0.00015,
    },
    'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'Contexto maior, ideal para documentos longos',
        maxTokens: 8192,
        costPer1kTokens: 0.01,
    },
} as const;

/**
 * Ferramentas disponíveis para os agentes
 */
export const AVAILABLE_TOOLS = {
    schedule_meeting: {
        name: 'Agendar Reunião',
        description: 'Cria eventos no Google Calendar',
        icon: 'Calendar',
        requiredIntegration: 'google',
    },
    save_lead: {
        name: 'Salvar Lead',
        description: 'Adiciona lead na planilha do Google Sheets',
        icon: 'FileSpreadsheet',
        requiredIntegration: 'google',
    },
} as const;

/**
 * Status de threads com cores e labels
 */
export const THREAD_STATUS_CONFIG = {
    active: {
        label: 'Ativo',
        color: 'bg-emerald-100 text-emerald-700',
        dotColor: 'bg-emerald-500',
    },
    pending: {
        label: 'Aguardando',
        color: 'bg-amber-100 text-amber-700',
        dotColor: 'bg-amber-500',
    },
    qualified: {
        label: 'Qualificado',
        color: 'bg-blue-100 text-blue-700',
        dotColor: 'bg-blue-500',
    },
    booked: {
        label: 'Agendado',
        color: 'bg-violet-100 text-violet-700',
        dotColor: 'bg-violet-500',
    },
    archived: {
        label: 'Arquivado',
        color: 'bg-slate-100 text-slate-500',
        dotColor: 'bg-slate-400',
    },
} as const;

/**
 * Configurações de integração
 */
export const INTEGRATIONS_CONFIG = {
    google: {
        name: 'Google',
        description: 'Calendar e Sheets',
        icon: 'Chrome',
        scopes: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    },
    meta: {
        name: 'Meta',
        description: 'WhatsApp Business',
        icon: 'MessageCircle',
        scopes: [],
    },
} as const;

/**
 * Navegação do Sidebar
 */
export const SIDEBAR_NAVIGATION = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
    },
    {
        name: 'Agentes',
        href: '/dashboard/agents',
        icon: 'Bot',
    },
    {
        name: 'Conhecimento',
        href: '/dashboard/knowledge',
        icon: 'BookOpen',
    },
    {
        name: 'Conversas',
        href: '/dashboard/threads',
        icon: 'MessageSquare',
    },
    {
        name: 'Analytics',
        href: '/dashboard/analytics',
        icon: 'BarChart3',
    },
    {
        name: 'Integrações',
        href: '/dashboard/integrations',
        icon: 'Plug',
    },
] as const;

/**
 * Configurações padrão
 */
export const DEFAULTS = {
    // Número máximo de mensagens a carregar para contexto
    MAX_CONTEXT_MESSAGES: 10,

    // Tempo de inatividade para arquivar thread (em horas)
    THREAD_ARCHIVE_HOURS: 24,

    // Temperature padrão para novos agentes
    DEFAULT_TEMPERATURE: 0.7,

    // Max tokens padrão
    DEFAULT_MAX_TOKENS: 1024,
} as const;
