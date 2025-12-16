/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE CALENDAR SERVICE - Integração Completa (ZAIA-Style)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Features:
 * - OAuth2 token refresh
 * - FreeBusy API (listar horários livres)
 * - Create Event com configurações granulares
 * - Suporte a configurações de duração, janela, prompt adjustment
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarConfig {
    /** Duração da reunião em minutos */
    duration: number;
    /** Janela de busca em dias */
    searchWindowDays: number;
    /** Horário inicial permitido (HH:MM) */
    timeRangeStart: string;
    /** Horário final permitido (HH:MM) */
    timeRangeEnd: string;
    /** Excluir fins de semana */
    excludeWeekends: boolean;
    /** Ajuste de prompt (ex: "Priorize manhãs") */
    promptAdjustment?: string;
    /** Template do título do evento */
    eventTitleTemplate?: string;
    /** ID do calendário (default: primary) */
    calendarId?: string;
}

export interface TimeSlot {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    dateTime: Date;
    displayText: string; // "Segunda, 15 de Jan às 10:00"
}

export interface FreeBusyResult {
    success: boolean;
    slots: TimeSlot[];
    error?: string;
}

export interface CalendarEventParams {
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    duration: number; // minutos
    attendeeName: string;
    attendeeEmail?: string;
    attendeePhone?: string;
    notes?: string;
    calendarId?: string;
}

export interface CalendarEventResult {
    success: boolean;
    eventId?: string;
    meetLink?: string;
    htmlLink?: string;
    error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH2 HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
    try {
        const response = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        if (!response.ok) {
            console.error('[OAuth2] Token refresh failed');
            return null;
        }

        const data = await response.json();
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        return {
            accessToken: data.access_token,
            expiresAt,
        };
    } catch (error) {
        console.error('[OAuth2] Exception:', error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// FREEBUSY API - Listar Horários Disponíveis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca horários disponíveis usando FreeBusy API
 * 
 * Esta é a função principal para o agendamento estilo Zaia:
 * - Respeita duração configurada
 * - Respeita janela de dias
 * - Filtra por horário comercial
 * - Exclui fins de semana se configurado
 */
export async function listAvailableSlots(
    accessToken: string,
    config: CalendarConfig
): Promise<FreeBusyResult> {
    const {
        duration,
        searchWindowDays,
        timeRangeStart,
        timeRangeEnd,
        excludeWeekends,
        calendarId = 'primary',
    } = config;

    const now = new Date();
    const startTime = new Date(now);
    const endTime = new Date(now);
    endTime.setDate(endTime.getDate() + searchWindowDays);

    try {
        // 1. Buscar períodos ocupados via FreeBusy
        const freeBusyResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/freeBusy',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                    items: [{ id: calendarId }],
                }),
            }
        );

        if (!freeBusyResponse.ok) {
            const errorData = await freeBusyResponse.json();
            return {
                success: false,
                slots: [],
                error: errorData.error?.message || 'Erro ao buscar disponibilidade',
            };
        }

        const freeBusyData = await freeBusyResponse.json();
        const busyPeriods = freeBusyData.calendars?.[calendarId]?.busy || [];

        // 2. Gerar slots potenciais
        const slots = generatePotentialSlots({
            startDate: startTime,
            endDate: endTime,
            duration,
            timeRangeStart,
            timeRangeEnd,
            excludeWeekends,
        });

        // 3. Filtrar slots ocupados
        const availableSlots = slots.filter(slot => {
            const slotStart = slot.dateTime;
            const slotEnd = new Date(slotStart.getTime() + duration * 60000);

            // Verificar se conflita com algum período ocupado
            return !busyPeriods.some((busy: { start: string; end: string }) => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);

                // Há conflito se: slot começa antes do busy terminar E slot termina depois do busy começar
                return slotStart < busyEnd && slotEnd > busyStart;
            });
        });

        // 4. Limitar a 10 slots para não sobrecarregar
        const limitedSlots = availableSlots.slice(0, 10);

        return {
            success: true,
            slots: limitedSlots,
        };
    } catch (error) {
        console.error('[FreeBusy] Exception:', error);
        return {
            success: false,
            slots: [],
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

/**
 * Gera slots potenciais baseado nas configurações
 */
function generatePotentialSlots(params: {
    startDate: Date;
    endDate: Date;
    duration: number;
    timeRangeStart: string;
    timeRangeEnd: string;
    excludeWeekends: boolean;
}): TimeSlot[] {
    const { startDate, endDate, duration, timeRangeStart, timeRangeEnd, excludeWeekends } = params;

    const startParts = timeRangeStart.split(':').map(Number);
    const endParts = timeRangeEnd.split(':').map(Number);
    const startHour = startParts[0] ?? 9;
    const startMinute = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 18;
    const endMinute = endParts[1] ?? 0;

    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    // Começar do próximo horário comercial se já passou
    if (current.getHours() >= endHour) {
        current.setDate(current.getDate() + 1);
    }

    while (current < endDate && slots.length < 50) {
        // Pular fins de semana se configurado
        const dayOfWeek = current.getDay();
        if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        // Gerar slots para este dia
        const daySlots = generateDaySlots(current, startHour, startMinute, endHour, endMinute, duration);

        // Filtrar slots que já passaram
        const now = new Date();
        const validSlots = daySlots.filter(slot => slot.dateTime > now);

        slots.push(...validSlots);

        // Próximo dia
        current.setDate(current.getDate() + 1);
        current.setHours(startHour, startMinute, 0, 0);
    }

    return slots;
}

/**
 * Gera slots para um dia específico
 */
function generateDaySlots(
    date: Date,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
    duration: number
): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(date);
    current.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (current.getTime() + duration * 60000 <= endTime.getTime()) {
        const slot: TimeSlot = {
            date: formatDate(current),
            time: formatTime(current),
            dateTime: new Date(current),
            displayText: formatDisplayText(current),
        };
        slots.push(slot);

        // Próximo slot (incrementar pela duração, mínimo 30 min)
        current.setMinutes(current.getMinutes() + Math.max(duration, 30));
    }

    return slots;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE EVENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria um evento no Google Calendar
 */
export async function createCalendarEvent(
    accessToken: string,
    params: CalendarEventParams
): Promise<CalendarEventResult> {
    const {
        title,
        date,
        time,
        duration,
        attendeeName,
        attendeeEmail,
        notes,
        calendarId = 'primary',
    } = params;

    // Calcular data/hora de início e fim
    const dateParts = date.split('-').map(Number);
    const timeParts = time.split(':').map(Number);
    const year = dateParts[0] ?? 2024;
    const month = dateParts[1] ?? 1;
    const day = dateParts[2] ?? 1;
    const hour = timeParts[0] ?? 9;
    const minute = timeParts[1] ?? 0;

    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const event = {
        summary: title,
        description: `${notes || ''}\n\nContato: ${attendeeName}${attendeeEmail ? ` (${attendeeEmail})` : ''}`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'America/Sao_Paulo',
        },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 15 },
            ],
        },
    };

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Google Calendar] Erro:', errorData);
            return { success: false, error: errorData.error?.message || 'Erro ao criar evento' };
        }

        const data = await response.json();

        return {
            success: true,
            eventId: data.id,
            meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri,
            htmlLink: data.htmlLink,
        };
    } catch (error) {
        console.error('[Google Calendar] Exceção:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

/**
 * Cria evento usando template de título
 */
export async function createEventWithTemplate(
    accessToken: string,
    template: string,
    variables: Record<string, unknown>,
    slot: TimeSlot,
    duration: number,
    attendeeEmail?: string
): Promise<CalendarEventResult> {
    // Substituir variáveis no template
    let title = template;
    for (const [key, value] of Object.entries(variables)) {
        title = title.replace(`{{${key}}}`, String(value || ''));
    }

    return createCalendarEvent(accessToken, {
        title,
        date: slot.date,
        time: slot.time,
        duration,
        attendeeName: String(variables['data.nome'] || 'Cliente'),
        attendeeEmail,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0] ?? '';
}

function formatTime(date: Date): string {
    return date.toTimeString().substring(0, 5);
}

function formatDisplayText(date: Date): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const month = months[date.getMonth()];
    const time = formatTime(date);

    return `${dayName}, ${dayNum} de ${month} às ${time}`;
}

/**
 * Formata slots para exibição no chat do agente
 */
export function formatSlotsForAgent(slots: TimeSlot[], promptAdjustment?: string): string {
    if (slots.length === 0) {
        return 'Não encontrei horários disponíveis nos próximos dias.';
    }

    let message = 'Tenho os seguintes horários disponíveis:\n\n';

    slots.forEach((slot, index) => {
        message += `📅 ${index + 1}. ${slot.displayText}\n`;
    });

    message += '\nQual horário você prefere?';

    if (promptAdjustment) {
        message += `\n\n(${promptAdjustment})`;
    }

    return message;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY EXPORTS (backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export async function listCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    calendarId: string = 'primary'
) {
    try {
        const params = new URLSearchParams({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
        });

        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error?.message };
        }

        const data = await response.json();
        return { success: true, events: data.items };
    } catch (error) {
        console.error('[Google Calendar] Erro ao listar:', error);
        return { success: false, error: 'Erro ao listar eventos' };
    }
}

export async function checkAvailability(
    accessToken: string,
    date: string,
    time: string,
    duration: number
): Promise<boolean> {
    const dateParts = date.split('-').map(Number);
    const timeParts = time.split(':').map(Number);
    const year = dateParts[0] ?? 2024;
    const month = dateParts[1] ?? 1;
    const day = dateParts[2] ?? 1;
    const hour = timeParts[0] ?? 9;
    const minute = timeParts[1] ?? 0;

    const startDate = new Date(year, month - 1, day, hour, minute);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const result = await listCalendarEvents(accessToken, startDate, endDate);

    if (!result.success) return false;

    return result.events?.length === 0;
}

export async function cancelCalendarEvent(accessToken: string, eventId: string, calendarId: string = 'primary') {
    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        return { success: response.ok };
    } catch (error) {
        console.error('[Google Calendar] Erro ao cancelar:', error);
        return { success: false };
    }
}
