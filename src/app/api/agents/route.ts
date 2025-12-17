import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agents, users, agentStages } from '@/db/schema';

// 6 Estágios padrão Zaia
const DEFAULT_STAGES = [
    {
        name: 'Identificação',
        type: 'identify' as const,
        order: 0,
        instructions: `## OBJETIVO
Conhecer o lead e criar rapport inicial.

## AÇÕES
1. Cumprimente de forma calorosa e natural
2. Pergunte o NOME do lead
3. Pergunte qual é a área de atuação/nicho de mercado

## TRANSIÇÃO
Avance para Entendimento quando souber nome e área do lead.`,
        entryCondition: 'Estágio inicial - sempre começa aqui',
        requiredVariables: ['nome', 'area'],
    },
    {
        name: 'Entendimento',
        type: 'diagnosis' as const,
        order: 1,
        instructions: `## OBJETIVO
Entender profundamente a dor e necessidade do lead.

## AÇÕES
1. Pergunte qual o MAIOR DESAFIO ou problema atual
2. Entenda há quanto tempo enfrenta esse problema
3. Pergunte o que já tentou para resolver

## TRANSIÇÃO
Avance para Qualificação quando tiver dor clara identificada.`,
        entryCondition: 'Lead identificado com nome e área conhecidos',
        requiredVariables: ['desafio', 'tempo_problema'],
    },
    {
        name: 'Qualificação',
        type: 'custom' as const,
        order: 2,
        instructions: `## OBJETIVO
Verificar se o lead é perfil adequado para a solução.

## AÇÕES
1. Pergunte o faturamento aproximado ou tamanho da operação
2. Entenda a urgência em resolver o problema
3. Confirme interesse em conhecer uma solução

## TRANSIÇÃO
Se qualificado, avance para Apresentação.`,
        entryCondition: 'Dor identificada e compreendida',
        requiredVariables: ['faturamento', 'urgencia'],
    },
    {
        name: 'Apresentação',
        type: 'custom' as const,
        order: 3,
        instructions: `## OBJETIVO
Apresentar a solução conectando com a dor do lead.

## AÇÕES
1. Conecte diretamente a dor com a solução
2. Apresente 2-3 benefícios mais relevantes
3. Gere curiosidade sobre como funciona na prática

## TRANSIÇÃO
Quando demonstrar interesse, avance para Agendamento.`,
        entryCondition: 'Lead qualificado e com perfil adequado',
        requiredVariables: [],
    },
    {
        name: 'Agendamento',
        type: 'schedule' as const,
        order: 4,
        instructions: `## OBJETIVO
Agendar uma reunião de apresentação/diagnóstico aprofundado.

## AÇÕES
1. Proponha uma conversa rápida (15-30min) para mostrar na prática
2. Ofereça 2-3 HORÁRIOS ESPECÍFICOS próximos
3. Se houver objeção, mantenha os mesmos horários
4. Use a tool schedule_meeting para confirmar

## COMPORTAMENTO CRÍTICO
- HORÁRIOS DEVEM SER CONSISTENTES - NÃO mude os horários propostos

## TRANSIÇÃO
Após confirmação, avance para Confirmação.`,
        entryCondition: 'Lead interessado após apresentação',
        requiredVariables: ['data_reuniao', 'horario_reuniao'],
    },
    {
        name: 'Confirmação',
        type: 'handoff' as const,
        order: 5,
        instructions: `## OBJETIVO
Confirmar agendamento e encerrar com excelência.

## AÇÕES
1. Confirme data, hora e dados de contato
2. Informe que enviará um lembrete
3. Agradeça e gere expectativa positiva

## ENCERRAMENTO
Este é o estágio final.`,
        entryCondition: 'Reunião agendada com sucesso',
        requiredVariables: ['email', 'telefone'],
    },
];

/**
 * GET /api/agents - Listar todos os agentes
 */
export async function GET() {
    try {
        const allAgents = await db.query.agents.findMany({
            orderBy: (agents, { desc }) => [desc(agents.createdAt)],
        });

        // Formatar para a UI
        const formattedAgents = allAgents.map(agent => ({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            isActive: agent.isActive,
            isDefault: agent.isDefault,
            modelConfig: agent.modelConfig,
            messagesCount: 0,
            threadsCount: 0,
        }));

        return NextResponse.json({ agents: formattedAgents });
    } catch (error) {
        console.error('[API] Erro ao listar agentes:', error);
        return NextResponse.json(
            { error: 'Erro ao carregar agentes' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/agents - Criar novo agente com estágios padrão
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        let userId = body.userId || process.env.DEFAULT_USER_ID;

        // Fallback: Se não tem userId, busca o primeiro usuário do banco
        if (!userId) {
            const firstUser = await db.query.users.findFirst();
            if (firstUser) {
                userId = firstUser.id;
            } else {
                // Último caso: cria um usuário padrão se não existir nenhum
                const result = await db.insert(users).values({
                    name: 'Admin',
                    email: 'admin@ia-agent.com',
                }).returning();

                const newUser = result?.[0];
                if (newUser) {
                    userId = newUser.id;
                } else {
                    throw new Error('Não foi possível definir usuário para o agente.');
                }
            }
        }

        if (!userId) {
            throw new Error('UserId inválido ou inexistente.');
        }

        // 1. Criar o agente
        const [newAgent] = await db.insert(agents).values({
            name: body.name,
            description: body.description || null,
            systemPrompt: body.systemPrompt || 'Você é um assistente prestativo.',
            modelConfig: body.modelConfig || { model: 'gpt-4o', provider: 'openai', temperature: 0.7 },
            isActive: body.isActive ?? false,
            isDefault: body.isDefault ?? false,
            userId: userId,
        }).returning();

        // 2. Inserir os 6 estágios padrão Zaia
        if (newAgent) {
            try {
                await db.insert(agentStages).values(
                    DEFAULT_STAGES.map(stage => ({
                        agentId: newAgent.id,
                        name: stage.name,
                        type: stage.type,
                        order: stage.order,
                        instructions: stage.instructions,
                        entryCondition: stage.entryCondition,
                        requiredVariables: stage.requiredVariables,
                        isActive: true,
                    }))
                );
                console.log(`[API] ✅ Agente "${newAgent.name}" criado com 6 estágios padrão`);
            } catch (stageError) {
                console.error('[API] Erro ao inserir estágios:', stageError);
                // Agente foi criado, mas estágios falharam - não falha a request
            }
        }

        return NextResponse.json({ agent: newAgent }, { status: 201 });
    } catch (error) {
        console.error('[API] Erro ao criar agente:', error);
        return NextResponse.json(
            { error: 'Erro ao criar agente' },
            { status: 500 }
        );
    }
}
