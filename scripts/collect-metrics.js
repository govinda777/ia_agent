#!/usr/bin/env node

/**
 * Coleta métricas do sistema para monitoramento
 * Uso: npm run metrics:collect
 */

const { createClient } = require('redis');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function collectMetrics() {
    console.log('🔍 Coletando métricas do sistema...\n');

    const metrics = {
        timestamp: new Date().toISOString(),
        system: {},
        database: {},
        redis: {},
        application: {}
    };

    // Métricas do Sistema
    metrics.system = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        loadAverage: require('os').loadavg()
    };

    // Métricas do Database
    try {
        const connectionString = process.env.DATABASE_URL;
        if (connectionString) {
            const client = postgres(connectionString);
            const db = drizzle(client);

            // Contagem de registros por tabela
            const tables = ['users', 'agents', 'threads', 'messages', 'whatsapp_instances'];
            for (const table of tables) {
                try {
                    const result = await client`SELECT COUNT(*) as count FROM ${client(table)}`;
                    metrics.database[table] = parseInt(result[0].count);
                } catch (error) {
                    metrics.database[table] = 'error';
                }
            }

            // Conexões ativas
            try {
                const connections = await client`
                    SELECT count(*) as active_connections 
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                `;
                metrics.database.activeConnections = parseInt(connections[0].active_connections);
            } catch (error) {
                metrics.database.activeConnections = 'error';
            }

            await client.end();
        }
    } catch (error) {
        metrics.database.error = error.message;
    }

    // Métricas do Redis
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redis = createClient({ url: redisUrl });
        
        await redis.connect();
        
        const info = await redis.info();
        const memory = await redis.info('memory');
        const clients = await redis.info('clients');
        
        metrics.redis = {
            connected: true,
            memory: parseRedisInfo(memory),
            clients: parseRedisInfo(clients),
            info: parseRedisInfo(info)
        };
        
        await redis.disconnect();
    } catch (error) {
        metrics.redis = { connected: false, error: error.message };
    }

    // Métricas da Aplicação (se Next.js está rodando)
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            const health = await response.json();
            metrics.application = {
                status: 'running',
                health: health
            };
        } else {
            metrics.application = { status: 'error', httpStatus: response.status };
        }
    } catch (error) {
        metrics.application = { status: 'stopped', error: error.message };
    }

    // Output formatado
    console.log('📊 RELATÓRIO DE MÉTRICAS');
    console.log('='.repeat(50));
    
    console.log('\n🖥️  Sistema:');
    console.log(`   Node.js: ${metrics.system.nodeVersion}`);
    console.log(`   Platform: ${metrics.system.platform} (${metrics.system.arch})`);
    console.log(`   Uptime: ${Math.floor(metrics.system.uptime / 60)}min`);
    console.log(`   Memory: ${Math.round(metrics.system.memory.heapUsed / 1024 / 1024)}MB / ${Math.round(metrics.system.memory.heapTotal / 1024 / 1024)}MB`);
    
    console.log('\n🗄️  Database:');
    if (metrics.database.error) {
        console.log(`   ❌ ${metrics.database.error}`);
    } else {
        console.log(`   Users: ${metrics.database.users || 0}`);
        console.log(`   Agents: ${metrics.database.agents || 0}`);
        console.log(`   Threads: ${metrics.database.threads || 0}`);
        console.log(`   Messages: ${metrics.database.messages || 0}`);
        console.log(`   Active Connections: ${metrics.database.activeConnections || 0}`);
    }
    
    console.log('\n🔴 Redis:');
    if (metrics.redis.connected) {
        console.log(`   Status: Connected`);
        console.log(`   Memory: ${metrics.redis.memory.used_memory_human}`);
        console.log(`   Clients: ${metrics.redis.clients.connected_clients}`);
        console.log(`   Keys: ${metrics.redis.info.db0?.split(',')[0]?.split('=')[1] || 'N/A'}`);
    } else {
        console.log(`   Status: Disconnected`);
        console.log(`   Error: ${metrics.redis.error}`);
    }
    
    console.log('\n⚡ Aplicação:');
    console.log(`   Status: ${metrics.application.status}`);
    if (metrics.application.health) {
        console.log(`   Health: ${metrics.application.health.status}`);
    }

    // Salvar métricas em arquivo (opcional)
    if (process.argv.includes('--save')) {
        const fs = require('fs');
        const path = require('path');
        const metricsFile = path.join(process.cwd(), 'metrics', `metrics-${Date.now()}.json`);
        
        fs.mkdirSync(path.dirname(metricsFile), { recursive: true });
        fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
        console.log(`\n💾 Métricas salvas em: ${metricsFile}`);
    }

    console.log('\n✅ Coleta de métricas concluída!');
}

function parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    for (const line of lines) {
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value) {
                result[key] = value;
            }
        }
    }
    
    return result;
}

// Executar coleta
collectMetrics().catch(console.error);
