#!/usr/bin/env node

/**
 * Script para resetar o ambiente para estado inicial limpo
 * Uso: npm run env:reset
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

async function resetEnvironment() {
  console.log(colorLog('bright'), '🔄 RESET DO AMBIENTE - ia_agent\n');
  
  console.log(colorLog('yellow'), 'Este script irá:');
  console.log(colorLog('white'), '   1. Limpar ambiente atual');
  console.log(colorLog('white'), '   2. Reinstalar dependências');
  console.log(colorLog('white'), '   3. Recriar .env.local');
  console.log(colorLog('white'), '   4. Iniciar containers Docker');
  console.log(colorLog('white'), '   5. Aplicar schema do database');
  console.log(colorLog('white'), '   6. Popular dados iniciais');
  
  const confirm = await question('\nDeseja continuar? (s/n): ');
  
  if (confirm.toLowerCase() !== 's') {
    console.log(colorLog('yellow'), '\n👋 Reset cancelado.');
    return;
  }
  
  console.log(colorLog('bright'), '\n🚀 Iniciando reset do ambiente...\n');
  
  try {
    // 1. Limpar ambiente atual
    console.log(colorLog('cyan'), '1️⃣  Limpando ambiente atual...');
    
    // Parar containers
    execCommand('npm run docker:down');
    console.log(colorLog('green'), '   ✅ Containers parados');
    
    // Limpar node_modules
    if (existsSync('node_modules')) {
      execCommand('rm -rf node_modules package-lock.json');
      console.log(colorLog('green'), '   ✅ node_modules removido');
    }
    
    // Limpar caches
    execCommand('npm cache clean --force');
    if (existsSync('.next')) {
      execCommand('rm -rf .next');
    }
    console.log(colorLog('green'), '   ✅ Caches limpos');
    
    // 2. Reinstalar dependências
    console.log(colorLog('cyan'), '\n2️⃣  Reinstalando dependências...');
    
    const installResult = execCommand('npm install');
    if (installResult.success) {
      console.log(colorLog('green'), '   ✅ Dependências reinstaladas');
    } else {
      throw new Error('Falha ao reinstalar dependências');
    }
    
    // 3. Recriar .env.local
    console.log(colorLog('cyan'), '\n3️⃣  Recriando .env.local...');
    
    if (!existsSync('.env.example')) {
      throw new Error('Arquivo .env.example não encontrado');
    }
    
    let envContent = readFileSync('.env.example', 'utf8');
    
    // Substituir placeholders
    envContent = envContent.replace(
      'DEFAULT_USER_ID=uuid-of-default-user',
      `DEFAULT_USER_ID=${randomUUID()}`
    );
    
    writeFileSync('.env.local', envContent);
    console.log(colorLog('green'), '   ✅ .env.local recriado com UUID gerado');
    
    // 4. Iniciar containers Docker
    console.log(colorLog('cyan'), '\n4️⃣  Iniciando containers Docker...');
    
    const upResult = execCommand('npm run docker:dev');
    if (upResult.success) {
      console.log(colorLog('green'), '   ✅ Containers iniciados');
    } else {
      throw new Error('Falha ao iniciar containers Docker');
    }
    
    // Aguardar containers ficarem prontos
    console.log(colorLog('yellow'), '   ⏳ Aguardando containers ficarem prontos...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // 5. Aplicar schema do database
    console.log(colorLog('cyan'), '\n5️⃣  Aplicando schema do database...');
    
    // Verificar se PostgreSQL está pronto
    let retries = 10;
    while (retries > 0) {
      const readyResult = execCommand('docker exec ia-agent-postgres pg_isready -U postgres');
      if (readyResult.success) {
        break;
      }
      console.log(colorLog('yellow'), `   ⏳ Aguardando PostgreSQL... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries--;
    }
    
    if (retries === 0) {
      throw new Error('PostgreSQL não ficou pronto a tempo');
    }
    
    const pushResult = execCommand('npm run db:push');
    if (pushResult.success) {
      console.log(colorLog('green'), '   ✅ Schema aplicado');
    } else {
      throw new Error('Falha ao aplicar schema');
    }
    
    // 6. Popular dados iniciais
    console.log(colorLog('cyan'), '\n6️⃣  Populando dados iniciais...');
    
    const seedResult = execCommand('node scripts/setup-local-db.mjs');
    if (seedResult.success) {
      console.log(colorLog('green'), '   ✅ Dados iniciais populados');
    } else {
      console.log(colorLog('yellow'), '   ⚠️  Dados iniciais não populados (não crítico)');
    }
    
    // 7. Validação final
    console.log(colorLog('cyan'), '\n7️⃣  Validando ambiente resetado...');
    
    const validateResult = execCommand('npm run env:validate');
    if (validateResult.success) {
      console.log(colorLog('green'), '   ✅ Ambiente validado com sucesso');
    } else {
      console.log(colorLog('yellow'), '   ⚠️  Ambiente validado com avisos');
    }
    
    console.log(colorLog('bright'), '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(colorLog('green'), '🎉 Reset do ambiente concluído com sucesso!');
    console.log(colorLog('white'), '\nSeu ambiente está pronto para desenvolvimento:');
    console.log(colorLog('cyan'), '$ npm run dev');
    console.log(colorLog('white'), '\nURLs úteis:');
    console.log(colorLog('cyan'), '- App: http://localhost:3000');
    console.log(colorLog('cyan'), '- Drizzle Studio: npm run db:studio');
    console.log(colorLog('cyan'), '- Logs Docker: npm run docker:logs');
    console.log(colorLog('cyan'), '- Validar ambiente: npm run env:validate');
    
    console.log(colorLog('white'), '\nPróximos passos recomendados:');
    console.log(colorLog('yellow'), '1. Configure suas API keys no .env.local');
    console.log(colorLog('yellow'), '2. Execute: npm run dev');
    console.log(colorLog('yellow'), '3. Acesse: http://localhost:3000');
    
  } catch (error) {
    console.error(colorLog('red'), `\n❌ Erro durante reset: ${error.message}`));
    console.log(colorLog('yellow'), '\nSugestões:');
    console.log(colorLog('white'), '- Verifique se Docker está rodando');
    console.log(colorLog('white'), '- Verifique se as portas 3000, 5432, 6379 estão livres');
    console.log(colorLog('white'), '- Execute: npm run env:doctor para diagnóstico completo');
    console.log(colorLog('white'), '- Execute: npm run env:fix para tentar corrigir automaticamente');
    
    process.exit(1);
  }
}

async function main() {
  try {
    await resetEnvironment();
  } catch (error) {
    console.error(colorLog('red'), `Erro fatal: ${error.message}`);
    process.exit(1);
  }
}

main();
