import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/agents/[agentId]/toggle - Toggle status ativo/inativo
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const body = await request.json();

        const updated = await db.update(agents)
            .set({
                isActive: body.isActive,
                updatedAt: new Date(),
            })
            .where(eq(agents.id, agentId))
            .returning();

        if (!updated.length) {
            return NextResponse.json(
                { error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ agent: updated[0] });
    } catch (error) {
        console.error('[API] Erro ao toggle agente:', error);
        return NextResponse.json(
            { error: 'Erro ao alterar status' },
            { status: 500 }
        );
    }
}
