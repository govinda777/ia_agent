/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CALENDAR SLOTS API - Listar horários disponíveis
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
    listAvailableSlots,
    formatSlotsForAgent,
    refreshAccessToken,
    type CalendarConfig
} from '@/server/services/google-calendar.service';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const config: CalendarConfig = {
            duration: body.duration || 30,
            searchWindowDays: body.searchWindowDays || 5,
            timeRangeStart: body.timeRangeStart || '09:00',
            timeRangeEnd: body.timeRangeEnd || '18:00',
            excludeWeekends: body.excludeWeekends ?? true,
            promptAdjustment: body.promptAdjustment,
            calendarId: body.calendarId || 'primary',
        };

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

        // Parse credenciais
        const credentials = JSON.parse(integration.credentials);
        let accessToken = credentials.accessToken;

        // Verificar se token expirou
        const expiresAt = new Date(credentials.expiresAt);
        if (expiresAt < new Date()) {
            // Refresh token
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

            // Atualizar token no banco
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

        // Buscar slots disponíveis
        const result = await listAvailableSlots(accessToken, config);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            slots: result.slots,
            formattedMessage: formatSlotsForAgent(result.slots, config.promptAdjustment),
        });
    } catch (error) {
        console.error('[Calendar Slots API] Error:', error);
        return NextResponse.json(
            { error: 'Erro interno' },
            { status: 500 }
        );
    }
}
