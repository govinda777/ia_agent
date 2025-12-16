import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, threads, messages } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

/**
 * GET /api/dashboard/stats - Estatísticas do dashboard
 */
export async function GET() {
    try {
        // Count agents ativos
        const agentsResult = await db.select({ count: count() })
            .from(agents)
            .where(eq(agents.isActive, true));

        // Count total threads
        const threadsResult = await db.select({ count: count() })
            .from(threads);

        // Count total messages
        const messagesResult = await db.select({ count: count() })
            .from(messages);

        // Count agendamentos (threads com status 'booked')
        const scheduledResult = await db.select({ count: count() })
            .from(threads)
            .where(eq(threads.status, 'booked'));

        return NextResponse.json({
            agentsCount: agentsResult[0]?.count || 0,
            threadsCount: threadsResult[0]?.count || 0,
            messagesCount: messagesResult[0]?.count || 0,
            scheduledCount: scheduledResult[0]?.count || 0,
        });
    } catch (error) {
        console.error('[API] Erro ao carregar stats:', error);
        return NextResponse.json({
            agentsCount: 0,
            threadsCount: 0,
            messagesCount: 0,
            scheduledCount: 0,
        });
    }
}
