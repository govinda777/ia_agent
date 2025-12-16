import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/agents/[agentId] - Buscar agente específico
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        const agent = await db.query.agents.findFirst({
            where: eq(agents.id, agentId),
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ agent });
    } catch (error) {
        console.error('[API] Erro ao buscar agente:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar agente' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/agents/[agentId] - Atualizar agente
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const body = await request.json();

        const updated = await db.update(agents)
            .set({
                ...body,
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
        console.error('[API] Erro ao atualizar agente:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar agente' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/agents/[agentId] - Excluir agente
 */
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        await db.delete(agents).where(eq(agents.id, agentId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Erro ao excluir agente:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir agente' },
            { status: 500 }
        );
    }
}
