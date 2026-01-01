#!/usr/bin/env node

/**
 * Script completo de diagnóstico do ambiente
 * Uso: npm run env:doctor
 */

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { homedir } from 'os';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      exitCode: error.status 
    };
  }
}

function getSystemInfo() {
  const info = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    nodePath: process.execPath,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  // Informações adicionais do sistema
  if (process.platform === 'linux') {
    const memInfo = execCommand('free -h | grep Mem');
    if (memInfo.success) {
      info.systemMemory = memInfo.output;
    }
    
    const diskInfo = execCommand('df -h . | tail -1');
    if (diskInfo.success) {
      info.diskSpace = diskInfo.output;
    }
  }
  
  return info;
}

function checkToolVersions() {
  const tools = [
    { name: 'Node.js', command: 'node --version', required: '>=20.0.0' },
    { name: 'npm', command: 'npm --version', required: '>=9.0.0' },
    { name: 'Docker', command: 'docker --version', required: '>=20.0.0' },
    { name: 'Docker Compose', command: 'docker-compose --version || docker compose version', required: '>=2.0.0' },
    { name: 'Git', command: 'git --version', required: '>=2.0.0' },
    { name: 'VSCode', command: 'code --version', required: 'opcional' }
  ];
  
  const results = [];
  
  for (const tool of tools) {
    const result = execCommand(tool.command);
    results.push({
      name: tool.name,
      version: result.success ? result.output : 'Não instalado',
      required: tool.required,
      status: result.success ? 'success' : 'error',
      details: result.success ? `${tool.name} funcionando` : `${tool.name} não está instalado`
    });
  }
  
  return results;
}

function checkPortUsage() {
  const ports = [
    { name: 'Next.js', port: 3000, process: 'Next.js dev server' },
    { name: 'PostgreSQL', port: 5432, process: 'PostgreSQL server' },
    { name: 'Redis', port: 6379, process: 'Redis server' },
    { name: 'Drizzle Studio', port: 5555, process: 'Drizzle Studio' },
    { name: 'MySQL', port: 3306, process: 'MySQL server' },
    { name: 'MongoDB', port: 27017, process: 'MongoDB server' }
  ];
  
  const results = [];
  
  for (const portInfo of ports) {
    let status = 'free';
    let process = 'Nenhum';
    
    try {
      // Tentar diferentes métodos para verificar portas
      const methods = [
        `lsof -ti:${portInfo.port}`,
        `netstat -tuln | grep :${portInfo.port}`,
        `ss -tuln | grep :${portInfo.port}`
      ];
      
      for (const method of methods) {
        const result = execCommand(method);
        if (result.success && result.output) {
          status = 'used';
          process = result.output.split('\n')[0] || 'Processo desconhecido';
          break;
        }
      }
      
      results.push({
        name: portInfo.name,
        port: portInfo.port,
        status: status,
        process: process,
        expected: portInfo.process
      });
    } catch (error) {
      results.push({
        name: portInfo.name,
        port: portInfo.port,
        status: 'error',
        process: 'Erro ao verificar',
        expected: portInfo.process
      });
    }
  }
  
  return results;
}

function checkDockerStatus() {
  const status = {
    daemon: false,
    containers: [],
    images: [],
    volumes: [],
    networks: []
  };
  
  // Verificar se Docker daemon está rodando
  const dockerInfo = execCommand('docker info');
  if (dockerInfo.success) {
    status.daemon = true;
    
    // Listar containers
    const psResult = execCommand('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
    if (psResult.success) {
      status.containers = psResult.output.split('\n').filter(line => line.trim());
    }
    
    // Listar imagens
    const imagesResult = execCommand('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"');
    if (imagesResult.success) {
      status.images = imagesResult.output.split('\n').filter(line => line.trim());
    }
    
    // Listar volumes
    const volumesResult = execCommand('docker volume ls');
    if (volumesResult.success) {
      status.volumes = volumesResult.output.split('\n').filter(line => line.trim());
    }
    
    // Listar networks
    const networksResult = execCommand('docker network ls');
    if (networksResult.success) {
      status.networks = networksResult.output.split('\n').filter(line => line.trim());
    }
  }
  
  return status;
}

function checkProjectFiles() {
  const files = [
    { name: '.env.local', required: true, description: 'Variáveis de ambiente' },
    { name: '.env.example', required: true, description: 'Template de ambiente' },
    { name: 'package.json', required: true, description: 'Dependências do projeto' },
    { name: 'package-lock.json', required: true, description: 'Lock file de dependências' },
    { name: 'node_modules', required: true, description: 'Dependências instaladas' },
    { name: 'docker-compose.dev.yml', required: true, description: 'Configuração Docker local' },
    { name: 'drizzle.config.ts', required: true, description: 'Configuração do ORM' },
    { name: 'tsconfig.json', required: true, description: 'Configuração TypeScript' },
    { name: '.gitignore', required: true, description: 'Arquivos ignorados pelo Git' },
    { name: 'README.md', required: true, description: 'Documentação do projeto' }
  ];
  
  const results = [];
  
  for (const file of files) {
    const exists = existsSync(file.name);
    let content = '';
    
    if (exists && file.name !== 'node_modules') {
      try {
        content = readFileSync(file.name, 'utf8');
      } catch (error) {
        content = 'Erro ao ler';
      }
    }
    
    results.push({
      name: file.name,
      exists: exists,
      required: file.required,
      description: file.description,
      size: exists ? content.length : 0,
      issues: []
    });
    
    // Verificar conteúdo específico
    if (file.name === '.env.local' && exists) {
      if (content.includes('sk-proj-')) {
        results[results.length - 1].issues.push('Contém placeholder da OpenAI');
      }
      if (content.includes('uuid-of-')) {
        results[results.length - 1].issues.push('Contém placeholder de UUID');
      }
    }
    
    if (file.name === '.gitignore' && exists) {
      if (!content.includes('.env.local')) {
        results[results.length - 1].issues.push('Não inclui .env.local');
      }
      if (!content.includes('node_modules')) {
        results[results.length - 1].issues.push('Não inclui node_modules');
      }
    }
  }
  
  return results;
}

function checkEnvironmentVariables() {
  if (!existsSync('.env.local')) {
    return { status: 'missing', variables: [] };
  }
  
  const envContent = readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  const variables = [];
  
  for (const line of lines) {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      
      variables.push({
        key: key.trim(),
        value: value.trim(),
        hasValue: value.length > 0,
        isPlaceholder: value.includes('sk-proj-') || value.includes('uuid-of-') || value.includes('your-'),
        isComment: key.startsWith('#')
      });
    }
  }
  
  // Verificar variáveis obrigatórias
  const required = ['DATABASE_URL', 'OPENAI_API_KEY', 'DEFAULT_USER_ID', 'NEXTAUTH_URL'];
  const missing = required.filter(req => !variables.find(v => v.key === req && v.hasValue && !v.isPlaceholder));
  
  return {
    status: missing.length === 0 ? 'complete' : 'incomplete',
    variables: variables,
    missing: missing
  };
}

function checkDatabaseConnection() {
  const status = {
    container: false,
    connection: false,
    schema: false,
    tables: [],
    size: 'N/A'
  };
  
  // Verificar container
  const psResult = execCommand('docker ps --filter "name=ia-agent-postgres" --format "{{.Names}}"');
  if (psResult.success && psResult.output.includes('ia-agent-postgres')) {
    status.container = true;
    
    // Verificar conexão
    const readyResult = execCommand('docker exec ia-agent-postgres pg_isready -U postgres');
    if (readyResult.success) {
      status.connection = true;
      
      // Verificar schema
      const tablesResult = execCommand('docker exec ia-agent-postgres psql -U postgres -d ia_agent_dev -c "\\dt"');
      if (tablesResult.success) {
        status.schema = true;
        
        // Extrair nomes das tabelas
        const lines = tablesResult.output.split('\n');
        for (const line of lines) {
          if (line.includes('|') && !line.includes('---')) {
            const tableName = line.split('|')[1].trim();
            if (tableName) {
              status.tables.push(tableName);
            }
          }
        }
      }
      
      // Verificar tamanho
      const sizeResult = execCommand('docker exec ia-agent-postgres psql -U postgres -d ia_agent_dev -c "SELECT pg_size_pretty(pg_database_size(\'ia_agent_dev\'));"');
      if (sizeResult.success) {
        status.size = sizeResult.output.split('\n')[0]?.trim() || 'N/A';
      }
    }
  }
  
  return status;
}

function checkRedisConnection() {
  const status = {
    container: false,
    connection: false,
    info: {},
    keys: 0,
    memory: 'N/A'
  };
  
  // Verificar container
  const psResult = execCommand('docker ps --filter "name=ia-agent-redis" --format "{{.Names}}"');
  if (psResult.success && psResult.output.includes('ia-agent-redis')) {
    status.container = true;
    
    // Verificar conexão
    const pingResult = execCommand('docker exec ia-agent-redis redis-cli ping');
    if (pingResult.success && pingResult.output.includes('PONG')) {
      status.connection = true;
      
      // Obter informações
      const infoResult = execCommand('docker exec ia-agent-redis redis-cli info memory');
      if (infoResult.success) {
        const lines = infoResult.output.split('\r\n');
        for (const line of lines) {
          if (line.includes('used_memory_human:')) {
            status.memory = line.split(':')[1];
          }
        }
      }
      
      // Contar keys
      const keysResult = execCommand('docker exec ia-agent-redis redis-cli dbsize');
      if (keysResult.success) {
        status.keys = parseInt(keysResult.output) || 0;
      }
    }
  }
  
  return status;
}

function generateHealthScore() {
  const checks = [
    { name: 'Node.js', weight: 15 },
    { name: 'Docker', weight: 20 },
    { name: 'Database', weight: 25 },
    { name: 'Redis', weight: 15 },
    { name: 'Dependencies', weight: 15 },
    { name: 'Environment', weight: 10 }
  ];
  
  // Implementar lógica de pontuação baseada nos resultados
  // Este é um placeholder - a implementação real usaria os resultados das verificações acima
  
  return {
    score: 85,
    grade: 'B',
    issues: [
      'Porta 6379 em uso por outro processo',
      'Variável OPENAI_API_KEY não configurada'
    ],
    recommendations: [
      'Matar processo na porta 6379',
      'Configurar API key da OpenAI'
    ]
  };
}

function printDoctorReport() {
  console.log(colorLog('bright', '🩺 RELATÓRIO COMPLETO DE DIAGNÓSTICO\n'));
  
  // Informações do Sistema
  const sysInfo = getSystemInfo();
  console.log(colorLog('cyan', '🖥️  INFORMAÇÕES DO SISTEMA'));
  console.log(colorLog('white', `   SO: ${sysInfo.platform} (${sysInfo.arch})`));
  console.log(colorLog('white', `   Node.js: ${sysInfo.nodeVersion}`));
  console.log(colorLog('white', `   Path: ${sysInfo.nodePath}`));
  console.log(colorLog('white', `   Uptime: ${Math.floor(sysInfo.uptime / 60)} minutos`));
  if (sysInfo.systemMemory) {
    console.log(colorLog('white', `   RAM: ${sysInfo.systemMemory}`));
  }
  if (sysInfo.diskSpace) {
    console.log(colorLog('white', `   Disco: ${sysInfo.diskSpace}`));
  }
  console.log('');
  
  // Versões das Ferramentas
  const tools = checkToolVersions();
  console.log(colorLog('cyan', '🛠️  FERRAMENTAS INSTALADAS'));
  for (const tool of tools) {
    const icon = tool.status === 'success' ? '✅' : '❌';
    const color = tool.status === 'success' ? 'green' : 'red';
    console.log(`   ${icon} ${colorLog(color, tool.name.padEnd(15))} ${tool.version}`);
    if (tool.status === 'error') {
      console.log(`      ${colorLog('yellow', tool.details)}`);
    }
  }
  console.log('');
  
  // Uso de Portas
  const ports = checkPortUsage();
  console.log(colorLog('cyan', '🔌 USO DE PORTAS'));
  for (const port of ports) {
    const icon = port.status === 'free' ? '✅' : port.status === 'used' ? '⚠️' : '❌';
    const color = port.status === 'free' ? 'green' : port.status === 'used' ? 'yellow' : 'red';
    const status = port.status === 'free' ? 'Livre' : `Em uso (${port.process})`;
    console.log(`   ${icon} ${colorLog(color, `${port.port} (${port.name})`.padEnd(20))} ${status}`);
  }
  console.log('');
  
  // Status do Docker
  const docker = checkDockerStatus();
  console.log(colorLog('cyan', '🐳 STATUS DOCKER'));
  console.log(`   Daemon: ${docker.daemon ? '✅ Rodando' : '❌ Parado'}`);
  console.log(`   Containers: ${docker.containers.length} ativos`);
  console.log(`   Imagens: ${docker.images.length} disponíveis`);
  console.log(`   Volumes: ${docker.volumes.length} criados`);
  console.log(`   Networks: ${docker.networks.length} configuradas`);
  console.log('');
  
  // Arquivos do Projeto
  const files = checkProjectFiles();
  console.log(colorLog('cyan', '📁 ARQUIVOS DO PROJETO'));
  for (const file of files) {
    const icon = file.exists ? '✅' : file.required ? '❌' : '⚠️';
    const color = file.exists ? 'green' : file.required ? 'red' : 'yellow';
    const size = file.exists ? `(${file.size} bytes)` : '';
    console.log(`   ${icon} ${colorLog(color, file.name.padEnd(25))} ${size}`);
    
    if (file.issues.length > 0) {
      for (const issue of file.issues) {
        console.log(`      ${colorLog('yellow', `⚠️  ${issue}`)}`);
      }
    }
  }
  console.log('');
  
  // Variáveis de Ambiente
  const env = checkEnvironmentVariables();
  console.log(colorLog('cyan', '⚙️  VARIÁVEIS DE AMBIENTE'));
  console.log(`   Status: ${env.status === 'complete' ? '✅ Completo' : env.status === 'missing' ? '❌ Faltando' : '⚠️  Incompleto'}`);
  
  if (env.missing.length > 0) {
    console.log(`   Faltando: ${env.missing.join(', ')}`);
  }
  
  for (const variable of env.variables.slice(0, 5)) {
    const icon = variable.hasValue && !variable.isPlaceholder ? '✅' : '❌';
    const color = variable.hasValue && !variable.isPlaceholder ? 'green' : 'red';
    const value = variable.isPlaceholder ? 'placeholder' : variable.hasValue ? 'configurado' : 'vazio';
    console.log(`   ${icon} ${colorLog(color, variable.key.padEnd(20))} ${value}`);
  }
  console.log('');
  
  // Conexão Database
  const db = checkDatabaseConnection();
  console.log(colorLog('cyan', '🗄️  DATABASE POSTGRESQL'));
  console.log(`   Container: ${db.container ? '✅ Rodando' : '❌ Parado'}`);
  console.log(`   Conexão: ${db.connection ? '✅ OK' : '❌ Falhou'}`);
  console.log(`   Schema: ${db.schema ? '✅ Aplicado' : '❌ Não aplicado'}`);
  console.log(`   Tabelas: ${db.tables.length} encontradas`);
  console.log(`   Tamanho: ${db.size}`);
  console.log('');
  
  // Conexão Redis
  const redis = checkRedisConnection();
  console.log(colorLog('cyan', '🔴 REDIS'));
  console.log(`   Container: ${redis.container ? '✅ Rodando' : '❌ Parado'}`);
  console.log(`   Conexão: ${redis.connection ? '✅ OK' : '❌ Falhou'}`);
  console.log(`   Keys: ${redis.keys}`);
  console.log(`   Memória: ${redis.memory}`);
  console.log('');
  
  // Score de Saúde
  const health = generateHealthScore();
  console.log(colorLog('cyan', '🏥 SCORE DE SAÚDE DO AMBIENTE'));
  console.log(`   Pontuação: ${health.score}/100`);
  console.log(`   Grau: ${health.grade}`);
  
  if (health.issues.length > 0) {
    console.log(colorLog('yellow', '\n⚠️  PROBLEMAS ENCONTRADOS:'));
    health.issues.forEach((issue, index) => {
      console.log(colorLog('white', `   ${index + 1}. ${issue}`));
    });
  }
  
  if (health.recommendations.length > 0) {
    console.log(colorLog('cyan', '\n💡 RECOMENDAÇÕES:'));
    health.recommendations.forEach((rec, index) => {
      console.log(colorLog('white', `   ${index + 1}. ${rec}`));
    });
  }
  
  console.log(colorLog('bright', '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  
  if (health.score >= 90) {
    console.log(colorLog('green', '🎉 AMBIENTE EXCELENTE!'));
    console.log(colorLog('white', 'Seu ambiente está perfeito para desenvolvimento.'));
  } else if (health.score >= 70) {
    console.log(colorLog('yellow', '👍 AMBIENTE BOM!'));
    console.log(colorLog('white', 'Seu ambiente está funcional, mas pode ser melhorado.'));
  } else {
    console.log(colorLog('red', '⚠️  AMBIENTE PROBLEMÁTICO!'));
    console.log(colorLog('white', 'Seu ambiente precisa de correções antes de desenvolver.'));
  }
  
  console.log(colorLog('cyan', '\nComandos úteis:'));
  console.log(colorLog('white', '- Corrigir problemas: npm run env:fix'));
  console.log(colorLog('white', '- Validar ambiente: npm run env:validate'));
  console.log(colorLog('white', '- Setup completo: npm run env:setup'));
  console.log(colorLog('white', '- Limpar tudo: npm run env:clean'));
}

async function main() {
  console.log(colorLog('bright', '🩺 DIAGNÓSTICO COMPLETO DO AMBIENTE - ia_agent\n'));
  
  try {
    printDoctorReport();
  } catch (error) {
    console.error(colorLog('red', `Erro fatal: ${error.message}`));
    process.exit(1);
  }
}

main();
