const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// 6 estágios Zaia
const STAGES = [
    {
        name: 'Identificação',
        type: 'identify',
        order: 0,
        instructions: `## OBJETIVO
Conhecer o lead e criar rapport inicial.

## AÇÕES
1. Cumprimente de forma calorosa e natural
2. Pergunte o NOME do lead
3. Pergunte qual é a área de atuação/nicho de mercado
4. Seja genuinamente interessado

## COMPORTAMENTO
- Seja amigável mas profissional
- Use o nome da pessoa após ela se apresentar
- Faça uma pergunta por vez

## TRANSIÇÃO
Avance para Entendimento quando souber nome e área do lead.`,
        entry_condition: 'Estágio inicial - sempre começa aqui',
        required_variables: ['nome', 'area'],
    },
    {
        name: 'Entendimento',
        type: 'diagnosis',
        order: 1,
        instructions: `## OBJETIVO
Entender profundamente a dor e necessidade do lead.

## AÇÕES
1. Pergunte qual o MAIOR DESAFIO ou problema atual
2. Entenda há quanto tempo enfrenta esse problema
3. Pergunte o que já tentou para resolver
4. Explore o impacto desse problema no negócio

## COMPORTAMENTO
- Faça perguntas de aprofundamento
- Demonstre empatia genuína
- NÃO AVANCE até realmente entender a dor
- Repita/parafraseie para confirmar entendimento

## TRANSIÇÃO
Avance para Qualificação quando tiver dor clara e específica identificada.`,
        entry_condition: 'Lead identificado com nome e área conhecidos',
        required_variables: ['desafio', 'tempo_problema'],
    },
    {
        name: 'Qualificação',
        type: 'custom',
        order: 2,
        instructions: `## OBJETIVO
Verificar se o lead é perfil adequado para a solução.

## AÇÕES
1. Pergunte o faturamento aproximado ou tamanho da operação
2. Entenda a urgência em resolver o problema
3. Verifique se tem autonomia para decidir
4. Confirme interesse em conhecer uma solução

## COMPORTAMENTO
- Seja sutil nas perguntas de qualificação
- Não pareça um interrogatório
- Se não for perfil, seja educado e sugira alternativas

## TRANSIÇÃO
Se qualificado, avance para Apresentação. Se não, finalize educadamente.`,
        entry_condition: 'Dor identificada e compreendida',
        required_variables: ['faturamento', 'urgencia'],
    },
    {
        name: 'Apresentação',
        type: 'custom',
        order: 3,
        instructions: `## OBJETIVO
Apresentar a solução conectando com a dor do lead.

## AÇÕES
1. Conecte diretamente a dor com a solução
2. Apresente 2-3 benefícios mais relevantes para o caso
3. Use cases de sucesso similares se disponíveis
4. Gere curiosidade sobre como funciona na prática

## COMPORTAMENTO
- Personalize a apresentação com base no diagnóstico
- Não faça monólogos - mantenha interativo
- Responda dúvidas de forma objetiva
- Guie para o próximo passo naturalmente

## TRANSIÇÃO
Quando demonstrar interesse, avance para Agendamento.`,
        entry_condition: 'Lead qualificado e com perfil adequado',
        required_variables: [],
    },
    {
        name: 'Agendamento',
        type: 'schedule',
        order: 4,
        instructions: `## OBJETIVO
Agendar uma reunião de apresentação/diagnóstico aprofundado.

## AÇÕES
1. Proponha uma conversa rápida (15-30min) para mostrar na prática
2. Ofereça 2-3 HORÁRIOS ESPECÍFICOS próximos
3. Se houver objeção de tempo, reforce os mesmos horários
4. Use a tool schedule_meeting para confirmar

## COMPORTAMENTO CRÍTICO
- HORÁRIOS DEVEM SER CONSISTENTES
- NÃO mude os horários propostos se houver objeção
- Reforce o valor da reunião
- Seja flexível em dia, mas mantenha as opções claras

## TRANSIÇÃO
Após confirmação, avance para Confirmação.`,
        entry_condition: 'Lead interessado após apresentação',
        required_variables: ['data_reuniao', 'horario_reuniao'],
    },
    {
        name: 'Confirmação',
        type: 'handoff',
        order: 5,
        instructions: `## OBJETIVO
Confirmar agendamento e encerrar com excelência.

## AÇÕES
1. Confirme data, hora e dados de contato
2. Informe que enviará um lembrete
3. Pergunte se há algo específico para preparar para a reunião
4. Agradeça e gere expectativa positiva

## COMPORTAMENTO
- Seja caloroso no encerramento
- Deixe claro os próximos passos
- Reforce o valor que será entregue na reunião

## ENCERRAMENTO
Este é o estágio final. A conversa pode ser arquivada após confirmação.`,
        entry_condition: 'Reunião agendada com sucesso',
        required_variables: ['email', 'telefone'],
    },
];

async function addStagesToAgents() {
    try {
        console.log('🔍 Buscando agentes...');

        // Get all agents
        const agents = await sql`SELECT id, name FROM agents`;
        console.log(`📋 Encontrados ${agents.length} agentes:`, agents.map(a => a.name).join(', '));

        for (const agent of agents) {
            console.log(`\n🤖 Processando: ${agent.name} (${agent.id})`);

            // Check existing stages
            const existingStages = await sql`SELECT id FROM agent_stages WHERE agent_id = ${agent.id}`;

            if (existingStages.length > 0) {
                console.log(`  ⚠️ Já tem ${existingStages.length} estágios. Removendo...`);
                await sql`DELETE FROM agent_stages WHERE agent_id = ${agent.id}`;
            }

            // Insert new stages
            for (const stage of STAGES) {
                await sql`
                    INSERT INTO agent_stages (
                        agent_id, name, type, "order", instructions, 
                        entry_condition, required_variables, is_active
                    ) VALUES (
                        ${agent.id}, 
                        ${stage.name}, 
                        ${stage.type}, 
                        ${stage.order}, 
                        ${stage.instructions},
                        ${stage.entry_condition},
                        ${JSON.stringify(stage.required_variables)},
                        true
                    )
                `;
            }

            console.log(`  ✅ Adicionados 6 estágios Zaia!`);
        }

        console.log('\n🎉 Concluído! Todos os agentes agora têm os 6 estágios.');

    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
    process.exit(0);
}

addStagesToAgents();
