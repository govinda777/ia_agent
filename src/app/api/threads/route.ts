import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/threads - Listar todas as threads
 */
export async function GET() {
    try {
        const allThreads = await db.query.threads.findMany({
            orderBy: (threads, { desc }) => [desc(threads.lastInteractionAt)],
        });

        // Formatar para a UI
        const formattedThreads = allThreads.map(thread => ({
            id: thread.id,
            contactName: thread.contactName,
            contactPhone: thread.externalId,
            lastMessage: null, // TODO: Buscar última mensagem
            status: thread.status || 'pending',
            messageCount: 0, // TODO: Contar mensagens
            lastInteractionAt: thread.lastInteractionAt?.toISOString() || new Date().toISOString(),
        }));

        return NextResponse.json({ threads: formattedThreads });
    } catch (error) {
        console.error('[API] Erro ao listar threads:', error);
        return NextResponse.json(
            { error: 'Erro ao carregar conversas' },
            { status: 500 }
        );
    }
}
