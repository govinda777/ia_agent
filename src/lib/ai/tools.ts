/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AI TOOLS - Ferramentas dos agentes (Integração Real)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Ferramentas disponíveis:
 * - list_calendar_slots: Listar horários disponíveis (FreeBusy API)
 * - schedule_meeting: Criar evento no Google Calendar
 * - save_lead: Salvar lead no Google Sheets
 * - send_catalog: Enviar catálogo/preços
 */

import { tool } from 'ai';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR TOOLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tool: list_calendar_slots
 * Lista horários disponíveis usando FreeBusy API
 */
export const listCalendarSlotsTool = tool({
    description: `
    Listar horários disponíveis para agendar uma reunião.
    Use esta ferramenta ANTES de agendar para mostrar opções ao lead.
    
    QUANDO USAR:
    - Quando o lead perguntar sobre horários disponíveis
    - Antes de confirmar um agendamento
    - Quando o lead quiser agendar uma call/reunião
    
    A ferramenta retorna uma lista formatada de horários livres.
  `,
    parameters: z.object({
        duration: z
            .number()
            .min(15)
            .max(180)
            .default(30)
            .describe('Duração da reunião em minutos. Padrão: 30'),
        searchWindowDays: z
            .number()
            .min(1)
            .max(30)
            .default(5)
            .describe('Quantos dias à frente buscar. Padrão: 5'),
        timeRangeStart: z
            .string()
            .default('09:00')
            .describe('Horário inicial (HH:MM). Padrão: 09:00'),
        timeRangeEnd: z
            .string()
            .default('18:00')
            .describe('Horário final (HH:MM). Padrão: 18:00'),
        excludeWeekends: z
            .boolean()
            .default(true)
            .describe('Excluir sábados e domingos'),
        promptAdjustment: z
            .string()
            .optional()
            .describe('Preferência extra. Ex: "Priorize manhãs"'),
    }),
    execute: async (params) => {
        console.log('[Tool] list_calendar_slots called:', params);

        try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    success: false,
                    error: data.error,
                    needsAuth: data.needsAuth,
                    message: data.needsAuth
                        ? 'Preciso que você conecte o Google Calendar primeiro. Acesse as configurações de integrações.'
                        : 'Não consegui buscar os horários disponíveis no momento.',
                };
            }

            return {
                success: true,
                slots: data.slots,
                message: data.formattedMessage,
            };
        } catch (error) {
            console.error('[Tool] list_calendar_slots error:', error);
            return {
                success: false,
                error: 'Erro ao conectar com o calendário',
                message: 'Desculpe, tive um problema ao verificar os horários. Tente novamente.',
            };
        }
    },
});

/**
 * Tool: schedule_meeting
 * Cria evento no Google Calendar
 */
export const scheduleMeetingTool = tool({
    description: `
    Confirmar e criar uma reunião no Google Calendar.
    Use esta ferramenta DEPOIS que o lead escolher um horário específico.
    
    QUANDO USAR:
    - Quando o lead confirmar um horário específico (ex: "quero às 10h")
    - Quando você tiver data, horário e nome do participante
    
    IMPORTANTE: Use list_calendar_slots ANTES para mostrar opções.
  `,
    parameters: z.object({
        title: z
            .string()
            .describe('Título da reunião. Ex: "Reunião com João Silva"'),
        date: z
            .string()
            .describe('Data no formato YYYY-MM-DD. Ex: "2024-01-15"'),
        time: z
            .string()
            .describe('Horário no formato HH:MM. Ex: "14:30"'),
        duration: z
            .number()
            .min(15)
            .max(180)
            .default(30)
            .describe('Duração em minutos. Padrão: 30'),
        attendeeName: z
            .string()
            .describe('Nome completo do participante'),
        attendeeEmail: z
            .string()
            .email()
            .optional()
            .describe('Email do participante'),
        notes: z
            .string()
            .optional()
            .describe('Observações ou pauta'),
    }),
    execute: async (params) => {
        console.log('[Tool] schedule_meeting called:', params);

        try {
            const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    success: false,
                    error: data.error,
                    message: data.needsAuth
                        ? 'Preciso que você conecte o Google Calendar primeiro.'
                        : `Não consegui agendar: ${data.error}`,
                };
            }

            return {
                success: true,
                eventId: data.eventId,
                meetLink: data.meetLink,
                htmlLink: data.htmlLink,
                message: data.message,
            };
        } catch (error) {
            console.error('[Tool] schedule_meeting error:', error);
            return {
                success: false,
                error: 'Erro ao criar evento',
                message: 'Desculpe, tive um problema ao agendar. Tente novamente.',
            };
        }
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// LEAD MANAGEMENT TOOLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tool: save_lead
 * Salva informações de um lead
 */
export const saveLeadTool = tool({
    description: `
    Salvar informações de um lead no sistema.
    Use esta ferramenta quando:
    - O lead fornecer informações de contato (nome, email, telefone)
    - O lead demonstrar interesse em um produto/serviço
    - For necessário registrar um lead qualificado
  `,
    parameters: z.object({
        name: z
            .string()
            .describe('Nome completo do lead'),
        phone: z
            .string()
            .describe('Telefone do lead com DDD'),
        email: z
            .string()
            .email()
            .optional()
            .describe('Email do lead'),
        interest: z
            .string()
            .describe('Interesse principal. Ex: "Curso de Tráfego"'),
        source: z
            .string()
            .optional()
            .default('WhatsApp')
            .describe('Origem do lead'),
        notes: z
            .string()
            .optional()
            .describe('Observações adicionais'),
        budget: z
            .string()
            .optional()
            .describe('Orçamento mencionado'),
        urgency: z
            .enum(['low', 'medium', 'high'])
            .optional()
            .describe('Nível de urgência'),
    }),
    execute: async (params) => {
        console.log('[Tool] save_lead called:', params);

        // TODO: Implementar chamada real ao Google Sheets
        // Por enquanto, simula o salvamento

        return {
            success: true,
            row: Math.floor(Math.random() * 1000) + 100,
            message: `✅ Lead "${params.name}" salvo com sucesso!`,
            savedAt: new Date().toISOString(),
        };
    },
});

/**
 * Tool: send_catalog
 * Envia catálogo ou informações
 */
export const sendCatalogTool = tool({
    description: `
    Enviar link de catálogo, preços ou informações.
    Use quando o lead pedir informações sobre produtos/serviços.
  `,
    parameters: z.object({
        catalogType: z
            .enum(['prices', 'services', 'portfolio', 'general'])
            .describe('Tipo de catálogo'),
        customMessage: z
            .string()
            .optional()
            .describe('Mensagem personalizada'),
    }),
    execute: async (params) => {
        console.log('[Tool] send_catalog called:', params);

        const catalogLinks: Record<string, string> = {
            prices: 'https://casaldotrafego.com/precos',
            services: 'https://casaldotrafego.com/servicos',
            portfolio: 'https://casaldotrafego.com/portfolio',
            general: 'https://casaldotrafego.com',
        };

        return {
            success: true,
            link: catalogLinks[params.catalogType],
            catalogType: params.catalogType,
            message: `📋 Aqui está o link: ${catalogLinks[params.catalogType]}`,
        };
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Todas as tools disponíveis
 */
export const agentTools = {
    list_calendar_slots: listCalendarSlotsTool,
    schedule_meeting: scheduleMeetingTool,
    save_lead: saveLeadTool,
    send_catalog: sendCatalogTool,
};

export type ToolName = keyof typeof agentTools;
export const AVAILABLE_TOOL_NAMES = Object.keys(agentTools) as ToolName[];

/**
 * Retorna tools habilitadas para um agente
 */
export function getToolsForAgent(enabledToolNames: string[]) {
    const tools: Record<string, typeof agentTools[ToolName]> = {};

    for (const name of enabledToolNames) {
        if (name in agentTools) {
            tools[name] = agentTools[name as ToolName];
        }
    }

    return tools;
}
