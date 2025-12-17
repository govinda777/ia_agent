/**
 * POST /api/integrations/google/disconnect - Desconectar integração Google
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

export async function POST() {
    try {
        // Desativar integração Google (não deletar, para manter histórico)
        await db.update(integrations)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(and(
                eq(integrations.userId, DEFAULT_USER_ID),
                eq(integrations.provider, 'google')
            ));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API Disconnect Google] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao desconectar' },
            { status: 500 }
        );
    }
}
