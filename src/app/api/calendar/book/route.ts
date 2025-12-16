/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CALENDAR BOOK API - Criar evento no calendário
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
    createCalendarEvent,
    refreshAccessToken,
} from '@/server/services/google-calendar.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { date, time, duration, title, attendeeName, attendeeEmail, notes } = body;

        if (!date || !time) {
            return NextResponse.json(
                { error: 'Data e horário são obrigatórios' },
                { status: 400 }
            );
        }

        // Buscar integração do Google
        const integration = await db.query.integrations.findFirst({
            where: and(
                eq(integrations.userId, DEFAULT_USER_ID),
                eq(integrations.provider, 'google'),
                eq(integrations.isActive, true)
            ),
        });

        if (!integration) {
            return NextResponse.json(
                { error: 'Google Calendar não conectado', needsAuth: true },
                { status: 401 }
            );
        }

        // Parse e refresh de credenciais
        const credentials = JSON.parse(integration.credentials);
        let accessToken = credentials.accessToken;

        const expiresAt = new Date(credentials.expiresAt);
        if (expiresAt < new Date()) {
            const refreshResult = await refreshAccessToken(
                credentials.refreshToken,
                GOOGLE_CLIENT_ID,
                GOOGLE_CLIENT_SECRET
            );

            if (!refreshResult) {
                return NextResponse.json(
                    { error: 'Token expirado, reconecte o Google', needsAuth: true },
                    { status: 401 }
                );
            }

            accessToken = refreshResult.accessToken;

            await db.update(integrations)
                .set({
                    credentials: JSON.stringify({
                        ...credentials,
                        accessToken: refreshResult.accessToken,
                        expiresAt: refreshResult.expiresAt.toISOString(),
                    }),
                    updatedAt: new Date(),
                })
                .where(eq(integrations.id, integration.id));
        }

        // Criar evento
        const result = await createCalendarEvent(accessToken, {
            title: title || `Reunião com ${attendeeName || 'Cliente'}`,
            date,
            time,
            duration: duration || 30,
            attendeeName: attendeeName || 'Cliente',
            attendeeEmail,
            notes,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            eventId: result.eventId,
            meetLink: result.meetLink,
            htmlLink: result.htmlLink,
            message: `✅ Reunião agendada para ${date} às ${time}${result.meetLink ? `\n\n🔗 Link do Meet: ${result.meetLink}` : ''}`,
        });
    } catch (error) {
        console.error('[Calendar Book API] Error:', error);
        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}
