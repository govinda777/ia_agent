import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function analyzeData() {
    console.log('🔍 Analisando dados do knowledge base...\n');

    // Get all knowledge items
    const kb = await sql`SELECT id, agent_id, topic, content, content_type, created_at FROM knowledge_base ORDER BY created_at DESC`;
    console.log(`📚 Total de itens: ${kb.length}\n`);

    for (const item of kb) {
        console.log(`---`);
        console.log(`ID: ${item.id}`);
        console.log(`Agent ID: ${item.agent_id || 'NENHUM (Global)'}`);
        console.log(`Topic: ${item.topic}`);
        console.log(`Type: ${item.content_type}`);
        console.log(`Content preview: ${item.content?.substring(0, 200)}...`);
    }

    // Get all agents
    console.log('\n\n🤖 Agentes existentes:');
    const agents = await sql`SELECT id, name FROM agents`;
    for (const agent of agents) {
        console.log(`- ${agent.name}: ${agent.id}`);
    }
}

analyzeData();
