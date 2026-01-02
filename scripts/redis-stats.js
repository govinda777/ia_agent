#!/usr/bin/env node

/**
 * Estatísticas detalhadas do Redis
 * Uso: npm run redis:stats
 */

const { createClient } = require('redis');

async function getRedisStats() {
    console.log('🔴 Coletando estatísticas do Redis...\n');

    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redis = createClient({ url: redisUrl });
        
        await redis.connect();
        console.log('✅ Conectado ao Redis\n');

        // 1. Informações básicas
        console.log('📊 INFORMAÇÕES GERAIS');
        console.log('-'.repeat(40));

        const info = await redis.info();
        const infoParsed = parseRedisInfo(info);

        console.log(`Versão: ${infoParsed.redis_version}`);
        console.log(`Uptime: ${Math.floor(infoParsed.uptime_in_seconds / 86400)} dias`);
        console.log(`OS: ${infoParsed.os}`);
        console.log(`Modo: ${infoParsed.redis_mode}`);
        console.log(`Process ID: ${infoParsed.process_id}`);

        // 2. Memória
        console.log('\n💾 MEMÓRIA');
        console.log('-'.repeat(40));

        const memoryInfo = await redis.info('memory');
        const memoryParsed = parseRedisInfo(memoryInfo);

        console.log(`Memória Usada: ${memoryParsed.used_memory_human}`);
        console.log(`Peak Memory: ${memoryParsed.used_memory_peak_human}`);
        console.log(`Fragmentation: ${memoryParsed.mem_fragmentation_ratio}`);
        console.log(`RSS: ${memoryParsed.used_memory_rss_human}`);

        // Barra visual de uso de memória
        const usedMB = parseInt(memoryParsed.used_memory_human);
        const maxMB = parseInt(memoryParsed.maxmemory_human) || 512; // Default 512MB
        const percentage = Math.min((usedMB / maxMB) * 100, 100);
        const barLength = 30;
        const filledLength = Math.round((barLength * percentage) / 100);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        
        console.log(`Uso: [${bar}] ${percentage.toFixed(1)}%`);

        // 3. Clientes conectados
        console.log('\n👥 CLIENTES CONECTADOS');
        console.log('-'.repeat(40));

        const clientInfo = await redis.info('clients');
        const clientParsed = parseRedisInfo(clientInfo);

        console.log(`Conectados: ${clientParsed.connected_clients}`);
        console.log(`Bloqueados: ${clientParsed.blocked_clients}`);
        console.log(`Max input buffer: ${clientParsed.client_recent_max_input_buffer}`);
        console.log(`Max output buffer: ${clientParsed.client_recent_max_output_buffer}`);

        // 4. Estatísticas de comandos
        console.log('\n⚡ ESTATÍSTICAS DE COMANDOS');
        console.log('-'.repeat(40));

        const statsInfo = await redis.info('stats');
        const statsParsed = parseRedisInfo(statsInfo);

        console.log(`Total Commands: ${parseInt(statsParsed.total_commands_processed).toLocaleString()}`);
        console.log(`Commands/sec: ${statsParsed.instantaneous_ops_per_sec}`);
        console.log(`Key Hits: ${parseInt(statsParsed.keyspace_hits).toLocaleString()}`);
        console.log(`Key Misses: ${parseInt(statsParsed.keyspace_misses).toLocaleString()}`);
        
        const hitRate = statsParsed.keyspace_hits && statsParsed.keyspace_misses 
            ? ((parseInt(statsParsed.keyspace_hits) / (parseInt(statsParsed.keyspace_hits) + parseInt(statsParsed.keyspace_misses))) * 100).toFixed(2)
            : 'N/A';
        console.log(`Hit Rate: ${hitRate}%`);

        // 5. Keyspaces
        console.log('\n🔑 KEYSPACES');
        console.log('-'.repeat(40));

        const keyspaceInfo = await redis.info('keyspace');
        const keyspaceParsed = parseRedisInfo(keyspaceInfo);

        for (const [key, value] of Object.entries(keyspaceParsed)) {
            if (key.startsWith('db')) {
                const [keys, expires, avg_ttl] = value.split(',');
                const keyCount = keys.split('=')[1];
                const expireCount = expires.split('=')[1];
                const avgTtl = avg_ttl ? avg_ttl.split('=')[1] : 'N/A';
                
                console.log(`${key.toUpperCase()}:`);
                console.log(`  Keys: ${keyCount}`);
                console.log(`  Expires: ${expireCount}`);
                if (avgTtl !== 'N/A') {
                    const ttlSeconds = parseInt(avgTtl);
                    const ttlHours = Math.floor(ttlSeconds / 3600);
                    const ttlMinutes = Math.floor((ttlSeconds % 3600) / 60);
                    console.log(`  Avg TTL: ${ttlHours}h ${ttlMinutes}m`);
                }
            }
        }

        // 6. Keys específicas da aplicação
        console.log('\n🎯 KEYS DA APLICAÇÃO');
        console.log('-'.repeat(40));

        const appKeys = [
            'whatsapp:*',
            'cache:*',
            'session:*',
            'queue:*',
            'metrics:*'
        ];

        for (const pattern of appKeys) {
            try {
                const keys = await redis.keys(pattern);
                console.log(`${pattern.padEnd(15)}: ${keys.length} keys`);
                
                // Mostrar alguns exemplos
                if (keys.length > 0 && keys.length <= 5) {
                    for (const key of keys.slice(0, 3)) {
                        const type = await redis.type(key);
                        const ttl = await redis.ttl(key);
                        const ttlStr = ttl > 0 ? `${ttl}s` : ttl === -1 ? 'no expire' : 'not found';
                        console.log(`  └─ ${key} (${type}, TTL: ${ttlStr})`);
                    }
                } else if (keys.length > 5) {
                    const sampleKeys = keys.slice(0, 3);
                    for (const key of sampleKeys) {
                        const type = await redis.type(key);
                        console.log(`  └─ ${key} (${type})`);
                    }
                    console.log(`  └─ ... e mais ${keys.length - 3} keys`);
                }
            } catch (error) {
                console.log(`${pattern.padEnd(15)}: Erro ao escanear`);
            }
        }

        // 7. Performance metrics
        console.log('\n📈 PERFORMANCE');
        console.log('-'.repeat(40));

        console.log(`Ops/sec (last sec): ${statsParsed.instantaneous_ops_per_sec}`);
        console.log(`Ops/sec (avg): ${Math.round(parseInt(statsParsed.total_commands_processed) / parseInt(infoParsed.uptime_in_seconds))}`);
        
        // Latência (se disponível)
        try {
            const latencyInfo = await redis.info('latency');
            const latencyParsed = parseRedisInfo(latencyInfo);
            
            if (latencyParsed.latency_monitor_last_event_time) {
                console.log(`Last latency event: ${new Date(parseInt(latencyParsed.latency_monitor_last_event_time) * 1000).toISOString()}`);
            }
        } catch (error) {
            // Latency monitor não habilitado
        }

        // 8. Health check
        console.log('\n🏥 HEALTH CHECK');
        console.log('-'.repeat(40));

        const healthChecks = [
            { name: 'Conexão', check: async () => await redis.ping() },
            { name: 'Set/Get', check: async () => {
                await redis.set('health:test', 'ok', { EX: 10 });
                return await redis.get('health:test');
            }},
            { name: 'Increment', check: async () => {
                await redis.del('health:counter');
                await redis.incr('health:counter');
                return await redis.get('health:counter');
            }}
        ];

        for (const healthCheck of healthChecks) {
            try {
                const result = await healthCheck.check();
                const status = result === 'ok' || result === '1' ? '✅' : '❌';
                console.log(`${status} ${healthCheck.name}: ${result}`);
            } catch (error) {
                console.log(`❌ ${healthCheck.name}: ${error.message}`);
            }
        }

        await redis.disconnect();
        console.log('\n✅ Estatísticas coletadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao coletar estatísticas:', error.message);
        process.exit(1);
    }
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

// Executar se chamado diretamente
if (require.main === module) {
    getRedisStats().catch(console.error);
}

module.exports = { getRedisStats };
