import { StageMachine } from '@/server/engine/stage-machine';
import { db } from '@/lib/db';
import { agents, threads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const stageMachine = new StageMachine();

export async function POST(req: Request) {
    try {
        const { message, agentId, threadId: initialThreadId } = await req.json();

        // 1. Validar Agente
        const agent = await db.query.agents.findFirst({
            where: eq(agents.id, agentId)
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        // 2. Garantir Thread
        let currentThreadId = initialThreadId;
        if (!currentThreadId) {
            const [newThread] = await db.insert(threads).values({
                agentId,
                userId: agent.userId,
                externalId: `web_test_${Date.now()}`, // Identificador temporário para teste web
            }).returning();

            if (!newThread) {
                return NextResponse.json({ error: 'Falha ao criar thread' }, { status: 500 });
            }
            currentThreadId = newThread.id;
        }

        // 3. Processar mensagem na Stage Machine
        const responseText = await stageMachine.processMessage(
            agent.userId,
            agentId,
            currentThreadId,
            message
        );

        return NextResponse.json({
            response: responseText,
            threadId: currentThreadId
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar mensagem', details: String(error) },
            { status: 500 }
        );
    }
}
