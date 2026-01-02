#!/usr/bin/env node

/**
 * Script para limpar completamente o ambiente local
 * Uso: npm run env:clean
 */

import { existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';

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

function question(query) {
  return new Promise(resolve => {
    const { createInterface } = require('readline');
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(colorLog('cyan', query), answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function cleanNodeModules() {
  console.log(colorLog('yellow', '📦 Limpando node_modules...'));
  
  if (existsSync('node_modules')) {
    try {
      rmSync('node_modules', { recursive: true, force: true });
      console.log(colorLog('green'), '✅ node_modules removido');
    } catch (error) {
      console.error(colorLog('red'), `❌ Erro ao remover node_modules: ${error.message}`);
      return false;
    }
  } else {
    console.log(colorLog('yellow'), '⚠️  node_modules não encontrado');
  }
  
  // Remover package-lock.json
  if (existsSync('package-lock.json')) {
    try {
      rmSync('package-lock.json');
      console.log(colorLog('green'), '✅ package-lock.json removido');
    } catch (error) {
      console.error(colorLog('red'), `❌ Erro ao remover package-lock.json: ${error.message}`);
    }
  }
  
  return true;
}

async function cleanDocker() {
  console.log(colorLog('yellow'), '🐳 Limpando containers e volumes Docker...'));
  
  // Parar containers do projeto
  const downResult = execCommand('npm run docker:down');
  if (downResult.success) {
    console.log(colorLog('green'), '✅ Containers do projeto parados');
  } else {
    console.log(colorLog('yellow'), '⚠️  Nenhum container do projeto para parar');
  }
  
  // Remover containers relacionados ao projeto
  const removeResult = execCommand('docker ps -a --filter "name=ia-agent-" -q | xargs -r docker rm');
  if (removeResult.success) {
    console.log(colorLog('green'), '✅ Containers do projeto removidos');
  }
  
  // Remover volumes do projeto
  const volumeResult = execCommand('docker volume ls -q --filter name=ia-agent- | xargs -r docker volume rm');
  if (volumeResult.success) {
    console.log(colorLog('green'), '✅ Volumes do projeto removidos');
  }
  
  // Limpar volumes órfãos
  const pruneVolumesResult = execCommand('docker volume prune -f');
  if (pruneVolumes.success) {
    console.log(colorLog('green'), '✅ Volumes órfãos limpos');
  }
  
  // Limpar imagens não usadas
  const pruneImagesResult = execCommand('docker image prune -f');
  if (pruneImagesResult.success) {
    console.log(colorLog('green'), '✅ Imagens não usadas limpas');
  }
  
  // Limpar networks não usados
  const pruneNetworksResult = execCommand('docker network prune -f');
  if (pruneNetworksResult.success) {
    console.log(colorLog('green'), '✅ Networks não usados limpos');
  }
  
  return true;
}

async function cleanCache() {
  console.log(colorLog('yellow'), '🗄️  Limpando caches...'));
  
  // Limpar cache npm
  const npmCacheResult = execCommand('npm cache clean --force');
  if (npmCacheResult.success) {
    console.log(colorLog('green'), '✅ Cache npm limpo');
  } else {
    console.log(colorLog('yellow'), '⚠️  Erro ao limpar cache npm');
  }
  
  // Limpar cache do Next.js
  if (existsSync('.next')) {
    try {
      rmSync('.next', { recursive: true, force: true });
      console.log(colorLog('green'), '✅ Cache Next.js limpo');
    } catch (error) {
      console.error(colorLog('red'), `❌ Erro ao limpar cache Next.js: ${error.message}`);
    }
  }
  
  // Limpar build artifacts
  const buildDirs = ['dist', 'build', '.turbo'];
  for (const dir of buildDirs) {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
        console.log(colorLog('green'), `✅ Diretório ${dir} removido`);
      } catch (error) {
        console.error(colorLog('red'), `❌ Erro ao remover ${dir}: ${error.message}`);
      }
    }
  }
  
  return true;
}

async function cleanTempFiles() {
  console.log(colorLog('yellow'), '🗑️  Limpando arquivos temporários...'));
  
  const tempFiles = [
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.tmp',
    '.env.local',
    '.env.test',
    '.env.production',
    '.env.development',
    '*.pid',
    '.setup-progress.json'
  ];
  
  for (const pattern of tempFiles) {
    try {
      const result = execCommand(`find . -name "${pattern}" -type f -delete 2>/dev/null || true`);
      // Não mostrar erro para arquivos não encontrados
    } catch (error) {
      // Ignorar erros de arquivos não encontrados
    }
  }
  
  console.log(colorLog('green'), '✅ Arquivos temporários limpos');
  return true;
}

async function cleanVSCode() {
  console.log(colorLog('yellow'), '💻 Limpando configurações VSCode...'));
  
  const vscodeDirs = ['.vscode/settings.json', '.vscode/launch.json', '.vscode/extensions.json'];
  
  for (const file of vscodeDirs) {
    if (existsSync(file)) {
      try {
        rmSync(file);
        console.log(colorLog('green'), `✅ ${file} removido`);
      } catch (error) {
        console.error(colorLog('red'), `❌ Erro ao remover ${file}: ${error.message}`);
      }
    }
  }
  
  return true;
}

async function cleanLogs() {
  console.log(colorLog('yellow'), '📋 Limpando logs...'));
  
  const logFiles = [
    'logs',
    '*.log',
    '.npm/_logs',
    '.npm/_cacache',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*'
  ];
  
  for (const pattern of logFiles) {
    try {
      const result = execCommand(`find . -name "${pattern}" -type d -exec rm -rf {} + 2>/dev/null || find . -name "${pattern}" -type f -delete 2>/dev/null || true`);
    } catch (error) {
      // Ignorar erros
    }
  }
  
  console.log(colorLog('green'), '✅ Logs limpos');
  return true;
}

async function cleanDatabase() {
  console.log(colorLog('yellow'), '🗄️  Limpando dados do database...'));
  
  // Verificar se PostgreSQL está rodando
  const psResult = execCommand('docker ps --filter "name=ia-agent-postgres" --format "{{.Names}}"');
  if (psResult.success && psResult.output.includes('ia-agent-postgres')) {
    // Deletar database
    const dropResult = execCommand('docker exec ia-agent-postgres psql -U postgres -c "DROP DATABASE IF EXISTS ia_agent_dev;"');
    if (dropResult.success) {
      console.log(colorLog('green'), '✅ Database ia_agent_dev removido');
    }
    
    // Recriar database vazio
    const createResult = execCommand('docker exec ia-agent-postgres psql -U postgres -c "CREATE DATABASE ia_agent_dev;"');
    if (createResult.success) {
      console.log(colorLog('green'), '✅ Database ia_agent_dev recriado vazio');
    }
  } else {
    console.log(colorLog('yellow'), '⚠️  PostgreSQL não está rodando');
  }
  
  return true;
}

async function cleanRedis() {
  console.log(colorLog('yellow'), '🔴 Limpando dados do Redis...'));
  
  // Verificar se Redis está rodando
  const psResult = execCommand('docker ps --filter "name=ia-agent-redis" --format "{{.Names}}"');
  if (psResult.success && psResult.output.includes('ia-agent-redis')) {
    // Limpar todos os dados
    const flushResult = execCommand('docker exec ia-agent-redis redis-cli flushall');
    if (flushResult.success) {
      console.log(colorLog('green'), '✅ Redis limpo');
    }
  } else {
    console.log(colorLog('yellow'), '⚠️  Redis não está rodando');
  }
  
  return true;
}

async function main() {
  console.log(colorLog('bright'), '🧹 LIMPEZA COMPLETA DO AMBIENTE - ia_agent\n');
  
  console.log(colorLog('red'), '⚠️  ATENÇÃO: Esta operação irá:');
  console.log(colorLog('white'), '   ❌ Remover node_modules');
  console.log(colorLog('white'), '   ❌ Remover package-lock.json');
  console.log(colorLog('white'), '   ❌ Parar e remover containers Docker');
  console.log(colorLog('white'), '   ❌ Remover volumes Docker');
  console.log(colorLog('white'), '   ❌ Limpar caches');
  console.log(colorLog('white'), '   ❌ Remover arquivos temporários');
  console.log(colorLog('white'), '   ❌ Limpar dados do database');
  console.log(colorLog('white'), '   ❌ Limpar dados do Redis');
  console.log(colorLog('white'), '   ❌ Remover .env.local');
  
  const confirm = await question('\nTem certeza que deseja continuar? (digite "sim" para confirmar): ');
  
  if (confirm.toLowerCase() !== 'sim') {
    console.log(colorLog('yellow'), '\n👋 Operação cancelada.');
    return;
  }
  
  console.log(colorLog('bright'), '\n🚀 Iniciando limpeza completa...\n');
  
  const operations = [
    { name: 'Node Modules', func: cleanNodeModules },
    { name: 'Docker', func: cleanDocker },
    { name: 'Cache', func: cleanCache },
    { name: 'Arquivos Temporários', func: cleanTempFiles },
    { name: 'VSCode', func: cleanVSCode },
    { name: 'Logs', func: cleanLogs },
    { name: 'Database', func: cleanDatabase },
    { name: 'Redis', func: cleanRedis }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const operation of operations) {
    console.log(colorLog('cyan'), `\n🔧 ${operation.name}:`);
    
    try {
      const success = await operation.func();
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(colorLog('red'), `❌ Erro em ${operation.name}: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(colorLog('bright'), '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(colorLog('green'), `✅ Operações bem-sucedidas: ${successCount}`);
  if (failCount > 0) {
    console.log(colorLog('red'), `❌ Operações com falha: ${failCount}`);
  }
  
  console.log(colorLog('bright'), '\n🎉 Lpeza concluída!');
  console.log(colorLog('white'), '\nSeu ambiente está completamente limpo.');
  console.log(colorLog('cyan'), '\nPara configurar novamente, execute:');
  console.log(colorLog('white'), '$ npm run env:setup');
  console.log(colorLog('cyan'), '\nOu para um setup rápido:');
  console.log(colorLog('white'), '$ npm install');
  console.log(colorLog('white'), '$ npm run docker:dev');
  console.log(colorLog('white'), '$ npm run db:push');
  console.log(colorLog('white'), '$ cp .env.example .env.local');
  console.log(colorLog('white'), '# Edite .env.local com suas chaves');
}

main().catch(error => {
  console.error(colorLog('red'), `Erro fatal: ${error.message}`);
  process.exit(1);
});
