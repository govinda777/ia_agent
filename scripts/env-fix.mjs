#!/usr/bin/env node

/**
 * Script automático de correção de problemas comuns
 * Uso: npm run env:fix
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

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

function checkPort(port) {
  try {
    const result = execCommand(`netstat -tuln | grep :${port} || lsof -ti:${port} || echo "free"`);
    return result.output.includes('free') || result.output === '';
  } catch {
    return true;
  }
}

function killPort(port) {
  try {
    // Tentar diferentes métodos para matar processos na porta
    const methods = [
      `lsof -ti:${port} | xargs kill -9`,
      `netstat -tulpn | grep :${port} | awk '{print $7}' | cut -d'/' -f1 | xargs kill -9`,
      `ss -tulpn | grep :${port} | awk '{print $7}' | cut -d'/' -f1 | xargs kill -9`
    ];
    
    for (const method of methods) {
      const result = execCommand(method);
      if (result.success) {
        console.log(colorLog('green', `✅ Processos na porta ${port} finalizados`));
        return true;
      }
    }
    
    console.log(colorLog('yellow', `⚠️  Nenhum processo encontrado na porta ${port}`));
    return true;
  } catch (error) {
    console.log(colorLog('yellow', `⚠️  Não foi possível liberar porta ${port}: ${error.message}`));
    return false;
  }
}

function recreateEnvFile() {
  console.log(colorLog('yellow', '📝 Recriando arquivo .env.local...'));
  
  if (!existsSync('.env.example')) {
    console.error(colorLog('red', '❌ Arquivo .env.example não encontrado!'));
    return false;
  }
  
  let envContent = readFileSync('.env.example', 'utf8');
  
  // Gerar DEFAULT_USER_ID se for placeholder
  if (envContent.includes('uuid-of-default-user')) {
    envContent = envContent.replace(
      'DEFAULT_USER_ID=uuid-of-default-user',
      `DEFAULT_USER_ID=${randomUUID()}`
    );
    console.log(colorLog('green', '✅ DEFAULT_USER_ID gerado'));
  }
  
  writeFileSync('.env.local', envContent);
  console.log(colorLog('green', '✅ Arquivo .env.local recriado'));
  return true;
}

function reinstallDependencies() {
  console.log(colorLog('yellow', '📦 Reinstalando dependências...'));
  
  // Limpar node_modules e package-lock.json
  try {
    execSync('rm -rf node_modules package-lock.json', { stdio: 'pipe' });
    console.log(colorLog('green', '✅ node_modules e package-lock.json removidos'));
  } catch (error) {
    console.log(colorLog('yellow', '⚠️  Erro ao remover node_modules: ' + error.message));
  }
  
  // Reinstalar
  const installResult = execCommand('npm install');
  if (installResult.success) {
    console.log(colorLog('green', '✅ Dependências reinstaladas'));
    return true;
  } else {
    console.error(colorLog('red', '❌ Falha ao reinstalar dependências'));
    return false;
  }
}

function rebuildDockerContainers() {
  console.log(colorLog('yellow', '🐳 Reconstruindo containers Docker...'));
  
  // Parar e remover containers
  const downResult = execCommand('npm run docker:down');
  if (downResult.success) {
    console.log(colorLog('green', '✅ Containers parados'));
  }
  
  // Limpar volumes órfãos
  const cleanResult = execCommand('docker volume prune -f');
  if (cleanResult.success) {
    console.log(colorLog('green', '✅ Volumes órfãos limpos'));
  }
  
  // Limpar imagens não usadas
  const imageCleanResult = execCommand('docker image prune -f');
  if (imageCleanResult.success) {
    console.log(colorLog('green', '✅ Imagens não usadas limpas'));
  }
  
  // Reconstruir e iniciar
  const upResult = execCommand('npm run docker:dev');
  if (upResult.success) {
    console.log(colorLog('green', '✅ Containers reconstruídos e iniciados'));
    
    // Aguardar containers ficarem prontos
    console.log(colorLog('yellow', '⏳ Aguardando containers ficarem prontos...'));
    setTimeout(() => {}, 10000);
    
    return true;
  } else {
    console.error(colorLog('red', '❌ Falha ao reconstruir containers'));
    return false;
  }
}

function reapplyMigrations() {
  console.log(colorLog('yellow', '🗄️  Reaplicando migrations...'));
  
  // Esperar PostgreSQL ficar pronto
  let retries = 10;
  while (retries > 0) {
    const readyResult = execCommand('docker exec ia-agent-postgres pg_isready -U postgres');
    if (readyResult.success) {
      break;
    }
    console.log(colorLog('yellow', `⏳ Aguardando PostgreSQL... (${retries} tentativas restantes)`));
    setTimeout(() => {}, 3000);
    retries--;
  }
  
  if (retries === 0) {
    console.error(colorLog('red', '❌ PostgreSQL não ficou pronto a tempo!'));
    return false;
  }
  
  // Reaplicar schema
  const pushResult = execCommand('npm run db:push');
  if (pushResult.success) {
    console.log(colorLog('green', '✅ Schema reaplicado'));
    return true;
  } else {
    console.error(colorLog('red', '❌ Falha ao reaplicar schema'));
    return false;
  }
}

function cleanRedis() {
  console.log(colorLog('yellow', '🔴 Limpando Redis...'));
  
  // Verificar se Redis está rodando
  const redisResult = execCommand('docker exec ia-agent-redis redis-cli ping');
  if (redisResult.success && redisResult.output.includes('PONG')) {
    // Limpar todos os dados
    const flushResult = execCommand('docker exec ia-agent-redis redis-cli flushall');
    if (flushResult.success) {
      console.log(colorLog('green', '✅ Redis limpo'));
      return true;
    } else {
      console.error(colorLog('red', '❌ Falha ao limpar Redis'));
      return false;
    }
  } else {
    console.log(colorLog('yellow', '⚠️  Redis não está rodando'));
    return false;
  }
}

function fixPermissions() {
  console.log(colorLog('yellow', '🔧 Corrigindo permissões...'));
  
  try {
    // Permissões do Docker (Linux/Mac)
    if (process.platform !== 'win32') {
      execCommand('sudo usermod -aG docker $USER');
      console.log(colorLog('green', '✅ Usuário adicionado ao grupo docker'));
      console.log(colorLog('yellow', '⚠️  Faça logout e login novamente para aplicar as permissões'));
    }
    
    // Permissões dos arquivos
    execCommand('chmod +x scripts/*.mjs');
    console.log(colorLog('green', '✅ Permissões dos scripts corrigidas'));
    
    return true;
  } catch (error) {
    console.error(colorLog('red', '❌ Erro ao corrigir permissões: ' + error.message));
    return false;
  }
}

async function main() {
  console.log(colorLog('bright', '🔧 Correção Automática de Problemas - ia_agent\n'));
  
  // Detectar problemas
  const problems = [];
  
  // Verificar portas em uso
  const ports = [
    { name: 'Next.js', port: 3000 },
    { name: 'PostgreSQL', port: 5432 },
    { name: 'Redis', port: 6379 },
    { name: 'Drizzle Studio', port: 5555 }
  ];
  
  for (const portInfo of ports) {
    if (!checkPort(portInfo.port)) {
      problems.push({
        type: 'port',
        description: `Porta ${portInfo.port} (${portInfo.name}) em uso`,
        fix: () => killPort(portInfo.port)
      });
    }
  }
  
  // Verificar .env.local
  if (!existsSync('.env.local')) {
    problems.push({
      type: 'env',
      description: 'Arquivo .env.local não existe',
      fix: recreateEnvFile
    });
  } else {
    const envContent = readFileSync('.env.local', 'utf8');
    if (envContent.includes('uuid-of-') || envContent.includes('sk-proj-')) {
      problems.push({
        type: 'env',
        description: '.env.local contém placeholders',
        fix: recreateEnvFile
      });
    }
  }
  
  // Verificar node_modules
  if (!existsSync('node_modules')) {
    problems.push({
      type: 'deps',
      description: 'node_modules não existe',
      fix: reinstallDependencies
    });
  }
  
  // Verificar Docker
  const dockerPs = execCommand('docker ps');
  if (!dockerPs.success) {
    problems.push({
      type: 'docker',
      description: 'Docker não está rodando',
      fix: () => {
        console.log(colorLog('yellow', '🐳 Iniciando Docker...'));
        console.log(colorLog('cyan', 'Por favor, inicie o Docker Desktop manualmente'));
        return false;
      }
    });
  }
  
  // Verificar containers
  const containersRunning = execCommand('docker ps --format "table {{.Names}}"');
  if (containersRunning.success) {
    if (!containersRunning.output.includes('ia-agent-postgres')) {
      problems.push({
        type: 'containers',
        description: 'Container PostgreSQL não está rodando',
        fix: rebuildDockerContainers
      });
    }
    
    if (!containersRunning.output.includes('ia-agent-redis')) {
      problems.push({
        type: 'containers',
        description: 'Container Redis não está rodando',
        fix: rebuildDockerContainers
      });
    }
  }
  
  // Mostrar problemas encontrados
  if (problems.length === 0) {
    console.log(colorLog('green', '✅ Nenhum problema encontrado!'));
    console.log(colorLog('cyan', '\nSeu ambiente está saudável.'));
    return;
  }
  
  console.log(colorLog('yellow', `🔍 Encontrados ${problems.length} problemas:\n`));
  
  problems.forEach((problem, index) => {
    console.log(colorLog('white', `${index + 1}. ${problem.description}`));
  });
  
  const fixAll = await question('\nDeseja corrigir todos os problemas automaticamente? (s/n): ');
  
  if (fixAll.toLowerCase() !== 's') {
    console.log(colorLog('yellow', '\n👋 Correção cancelada.'));
    return;
  }
  
  console.log(colorLog('bright', '\n🚀 Iniciando correção automática...\n'));
  
  let fixedCount = 0;
  let failedCount = 0;
  
  for (const problem of problems) {
    console.log(colorLog('yellow', `🔧 Corrigindo: ${problem.description}`));
    
    try {
      const success = await problem.fix();
      if (success) {
        console.log(colorLog('green', `✅ Corrigido: ${problem.description}\n`));
        fixedCount++;
      } else {
        console.log(colorLog('red', `❌ Falha ao corrigir: ${problem.description}\n`));
        failedCount++;
      }
    } catch (error) {
      console.log(colorLog('red', `❌ Erro ao corrigir: ${problem.description} - ${error.message}\n`));
      failedCount++;
    }
  }
  
  console.log(colorLog('bright', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  
  console.log(colorLog('green', `✅ Problemas corrigidos: ${fixedCount}`));
  if (failedCount > 0) {
    console.log(colorLog('red', `❌ Falhas: ${failedCount}`));
  }
  
  if (fixedCount > 0) {
    console.log(colorLog('yellow', '\n⏳ Aguardando 5 segundos para estabilizar...'));
    setTimeout(() => {}, 5000);
    
    console.log(colorLog('cyan', '\n🔍 Validando ambiente após correções...'));
    const validateResult = execCommand('npm run env:validate');
    
    if (validateResult.success) {
      console.log(colorLog('green', '\n🎉 Ambiente corrigido e validado!'));
      console.log(colorLog('cyan', '\nVocê já pode começar a desenvolver:'));
      console.log(colorLog('white', '$ npm run dev'));
    } else {
      console.log(colorLog('yellow', '\n⚠️  Alguns problemas persistem. Execute:'));
      console.log(colorLog('cyan', '$ npm run env:validate'));
      console.log(colorLog('cyan', '$ npm run env:doctor'));
    }
  }
  
  console.log(colorLog('white', '\nComandos úteis:'));
  console.log(colorLog('cyan', '- Validar ambiente: npm run env:validate'));
  console.log(colorLog('cyan', '- Diagnóstico completo: npm run env:doctor'));
  console.log(colorLog('cyan', '- Limpar tudo: npm run env:clean'));
  console.log(colorLog('cyan', '- Reset completo: npm run env:reset'));
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

main().catch(error => {
  console.error(colorLog('red', `Erro fatal: ${error.message}`));
  process.exit(1);
});
