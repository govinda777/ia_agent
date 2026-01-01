#!/usr/bin/env node

/**
 * Estatísticas detalhadas do banco de dados
 * Uso: npm run db:stats
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function getDatabaseStats() {
    console.log('📊 Coletando estatísticas do banco de dados...\n');

    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL não encontrada');
        }

        const client = postgres(connectionString);
        const db = drizzle(client);

        // 1. Estatísticas básicas das tabelas
        console.log('📋 TABELAS PRINCIPAIS');
        console.log('-'.repeat(40));

        const tables = [
            { name: 'users', desc: 'Usuários do sistema' },
            { name: 'agents', desc: 'Agentes de IA' },
            { name: 'threads', desc: 'Conversas' },
            { name: 'messages', desc: 'Mensagens trocadas' },
            { name: 'knowledge_base', desc: 'Base de conhecimento' },
            { name: 'integrations', desc: 'Integrações externas' },
            { name: 'whatsapp_instances', desc: 'Instâncias WhatsApp' },
            { name: 'sessions', desc: 'Sessões ativas' }
        ];

        for (const table of tables) {
            try {
                const result = await client`SELECT COUNT(*) as count FROM ${client(table.name)}`;
                const count = parseInt(result[0].count);
                console.log(`${table.name.padEnd(20)} | ${count.toString().padStart(8)} | ${table.desc}`);
            } catch (error) {
                console.log(`${table.name.padEnd(20)} | ${('ERROR').padStart(8)} | ${error.message}`);
            }
        }

        // 2. Tamanho das tabelas
        console.log('\n💾 TAMANHO DAS TABELAS');
        console.log('-'.repeat(40));

        const sizeQuery = `
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `;

        const sizeResults = await client.unsafe(sizeQuery);
        for (const row of sizeResults) {
            console.log(`${row.tablename.padEnd(20)} | ${row.size.padStart(10)} | ${formatBytes(row.size_bytes)}`);
        }

        // 3. Estatísticas de conexões
        console.log('\n🔌 CONEXÕES ATIVAS');
        console.log('-'.repeat(40));

        const connectionStats = await client`
            SELECT 
                state,
                COUNT(*) as count,
                AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_duration
            FROM pg_stat_activity 
            WHERE datname = current_database()
            GROUP BY state
            ORDER BY count DESC
        `;

        for (const stat of connectionStats) {
            const duration = stat.avg_duration ? `${Math.round(stat.avg_duration)}s` : 'N/A';
            console.log(`${stat.state.padEnd(15)} | ${stat.count.toString().padStart(5)} | Avg: ${duration}`);
        }

        // 4. Queries lentas (se pg_stat_statements estiver habilitado)
        console.log('\n🐌 QUERIES LENTAS (Top 10)');
        console.log('-'.repeat(40));

        try {
            const slowQueries = await client`
                SELECT 
                    query,
                    calls,
                    mean_time,
                    total_time,
                    rows
                FROM pg_stat_statements 
                ORDER BY mean_time DESC 
                LIMIT 10
            `;

            for (let i = 0; i < slowQueries.length; i++) {
                const query = slowQueries[i];
                const queryPreview = query.query.substring(0, 60) + (query.query.length > 60 ? '...' : '');
                console.log(`${(i + 1).toString().padStart(2)}. ${queryPreview}`);
                console.log(`    Calls: ${query.calls} | Avg: ${Math.round(query.mean_time)}ms | Total: ${Math.round(query.total_time)}ms`);
                console.log('');
            }
        } catch (error) {
            console.log('pg_stat_statements não disponível. Execute: CREATE EXTENSION pg_stat_statements;');
        }

        // 5. Estatísticas de mensagens (últimos 7 dias)
        console.log('📈 MENSAGENS (Últimos 7 dias)');
        console.log('-'.repeat(40));

        try {
            const messageStats = await client`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    role
                FROM messages 
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(created_at), role
                ORDER BY date DESC, role
            `;

            const dailyStats = {};
            for (const stat of messageStats) {
                const date = stat.date.toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = {};
                }
                dailyStats[date][stat.role] = stat.count;
            }

            for (const date of Object.keys(dailyStats).sort().reverse()) {
                const user = dailyStats[date].user || 0;
                const assistant = dailyStats[date].assistant || 0;
                const total = user + assistant;
                console.log(`${date} | ${total.toString().padStart(4)} total | User: ${user} | Assistant: ${assistant}`);
            }
        } catch (error) {
            console.log('Erro ao buscar estatísticas de mensagens:', error.message);
        }

        // 6. Agents ativos
        console.log('\n🤖 AGENTES ATIVOS');
        console.log('-'.repeat(40));

        try {
            const activeAgents = await client`
                SELECT 
                    name,
                    display_name,
                    is_active,
                    COUNT(t.id) as thread_count
                FROM agents a
                LEFT JOIN threads t ON a.id = t.agent_id
                GROUP BY a.id, a.name, a.display_name, a.is_active
                ORDER BY thread_count DESC
            `;

            for (const agent of activeAgents) {
                const status = agent.is_active ? '✅' : '❌';
                const displayName = agent.display_name || agent.name;
                console.log(`${status} ${displayName.padEnd(25)} | ${agent.thread_count.toString().padStart(4)} threads`);
            }
        } catch (error) {
            console.log('Erro ao buscar agentes:', error.message);
        }

        await client.end();
        console.log('\n✅ Estatísticas coletadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao coletar estatísticas:', error.message);
        process.exit(1);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Executar se chamado diretamente
if (require.main === module) {
    getDatabaseStats().catch(console.error);
}

module.exports = { getDatabaseStats };
