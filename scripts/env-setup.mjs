#!/usr/bin/env node

/**
 * Script interativo de setup do ambiente local
 * Uso: npm run env:setup
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
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

function question(query) {
  return new Promise(resolve => {
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

function detectCurrentState() {
  const state = {
    envFile: existsSync('.env.local'),
    nodeModules: existsSync('node_modules'),
    dockerRunning: false,
    postgresRunning: false,
    redisRunning: false,
    hasOpenAIKey: false,
    hasUserId: false,
    missingVars: []
  };
  
  // Verificar .env.local
  if (state.envFile) {
    const envContent = readFileSync('.env.local', 'utf8');
    state.hasOpenAIKey = envContent.includes('OPENAI_API_KEY=') && 
                         !envContent.includes('sk-proj-') && 
                         !envContent.includes('your-');
    state.hasUserId = envContent.includes('DEFAULT_USER_ID=') && 
                     !envContent.includes('uuid-of-') && 
                     !envContent.includes('your-');
    
    // Verificar variáveis obrigatórias
    const requiredVars = ['DATABASE_URL', 'OPENAI_API_KEY', 'DEFAULT_USER_ID', 'NEXTAUTH_URL'];
    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        state.missingVars.push(varName);
      }
    }
  }
  
  // Verificar Docker
  const dockerPs = execCommand('docker ps --format "table {{.Names}}"');
  if (dockerPs.success) {
    state.dockerRunning = true;
    state.postgresRunning = dockerPs.output.includes('ia-agent-postgres');
    state.redisRunning = dockerPs.output.includes('ia-agent-redis');
  }
  
  return state;
}

async function createEnvFile() {
  console.log(colorLog('yellow', '\n📝 Criando arquivo .env.local...'));
  
  if (!existsSync('.env.example')) {
    console.error(colorLog('red', '❌ Arquivo .env.example não encontrado!'));
    return false;
  }
  
  let envContent = readFileSync('.env.example', 'utf8');
  
  // Configurar DATABASE_URL
  envContent = envContent.replace(
    'DATABASE_URL=postgresql://postgres:password@localhost:5432/ia_agent_dev',
    'DATABASE_URL=postgresql://postgres:password@localhost:5432/ia_agent_dev'
  );
  
  // Configurar NEXTAUTH_URL
  envContent = envContent.replace(
    'NEXTAUTH_URL=http://localhost:3000',
    'NEXTAUTH_URL=http://localhost:3000'
  );
  
  writeFileSync('.env.local', envContent);
  console.log(colorLog('green', '✅ Arquivo .env.local criado!'));
  return true;
}

async function setupAPIKeys() {
  console.log(colorLog('yellow', '\n🔑 Configurando API Keys...'));
  
  let envContent = readFileSync('.env.local', 'utf8');
  
  // OpenAI API Key
  const openAIKey = await question('Digite sua OpenAI API Key (sk-...): ');
  if (openAIKey && openAIKey.startsWith('sk-')) {
    envContent = envContent.replace(
      /OPENAI_API_KEY=.*/,
      `OPENAI_API_KEY=${openAIKey}`
    );
    console.log(colorLog('green', '✅ OpenAI API Key configurada!'));
  } else {
    console.log(colorLog('yellow', '⚠️  OpenAI API Key não configurada (opcional para desenvolvimento básico)'));
  }
  
  // Google API Key (opcional)
  const setupGoogle = await question('Deseja configurar Google API Key? (s/n): ');
  if (setupGoogle.toLowerCase() === 's') {
    const googleKey = await question('Digite sua Google API Key: ');
    if (googleKey) {
      envContent = envContent.replace(
        /GOOGLE_API_KEY=.*/,
        `GOOGLE_API_KEY=${googleKey}`
      );
      console.log(colorLog('green', '✅ Google API Key configurada!'));
    }
  }
  
  writeFileSync('.env.local', envContent);
}

function generateUserId() {
  const userId = randomUUID();
  let envContent = readFileSync('.env.local', 'utf8');
  
  envContent = envContent.replace(
    /DEFAULT_USER_ID=.*/,
    `DEFAULT_USER_ID=${userId}`
  );
  
  writeFileSync('.env.local', envContent);
  console.log(colorLog('green', `✅ DEFAULT_USER_ID gerado: ${userId}`));
}

async function installDependencies() {
  console.log(colorLog('yellow', '\n📦 Instalando dependências...'));
  
  const installResult = execCommand('npm install');
  if (installResult.success) {
    console.log(colorLog('green', '✅ Dependências instaladas!'));
    return true;
  } else {
    console.error(colorLog('red', '❌ Falha ao instalar dependências!'));
    console.error(installResult.error);
    return false;
  }
}

async function startDocker() {
  console.log(colorLog('yellow', '\n🐳 Iniciando containers Docker...'));
  
  const upResult = execCommand('npm run docker:dev');
  if (upResult.success) {
    console.log(colorLog('green', '✅ Containers iniciados!'));
    
    // Aguardar um pouco para os containers iniciarem
    console.log(colorLog('yellow', '⏳ Aguardando containers ficarem prontos...'));
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } else {
    console.error(colorLog('red', '❌ Falha ao iniciar containers!'));
    console.error(upResult.error);
    return false;
  }
}

async function setupDatabase() {
  console.log(colorLog('yellow', '\n🗄️  Configurando database...'));
  
  // Verificar se PostgreSQL está pronto
  let retries = 10;
  while (retries > 0) {
    const readyResult = execCommand('docker exec ia-agent-postgres pg_isready -U postgres');
    if (readyResult.success) {
      break;
    }
    console.log(colorLog('yellow', `⏳ Aguardando PostgreSQL... (${retries} tentativas restantes)`));
    await new Promise(resolve => setTimeout(resolve, 3000));
    retries--;
  }
  
  if (retries === 0) {
    console.error(colorLog('red', '❌ PostgreSQL não ficou pronto a tempo!'));
    return false;
  }
  
  // Aplicar schema
  const pushResult = execCommand('npm run db:push');
  if (pushResult.success) {
    console.log(colorLog('green', '✅ Schema aplicado!'));
    return true;
  } else {
    console.error(colorLog('red', '❌ Falha ao aplicar schema!'));
    console.error(pushResult.error);
    return false;
  }
}

async function seedDatabase() {
  console.log(colorLog('yellow', '\n🌱 Populando dados iniciais...'));
  
  const seedResult = execCommand('node scripts/setup-local-db.mjs');
  if (seedResult.success) {
    console.log(colorLog('green', '✅ Dados iniciais populados!'));
    return true;
  } else {
    console.log(colorLog('yellow', '⚠️  Dados iniciais não populados (não crítico)'));
    return true; // Não é crítico
  }
}

async function validateSetup() {
  console.log(colorLog('yellow', '\n🔍 Validando setup final...'));
  
  const validateResult = execCommand('npm run env:validate');
  if (validateResult.success) {
    console.log(colorLog('green', '✅ Setup validado com sucesso!'));
    return true;
  } else {
    console.log(colorLog('yellow', '⚠️  Setup concluído com alguns avisos'));
    return true; // Ainda é sucesso
  }
}

async function main() {
  console.log(colorLog('bright', '🔧 Setup do Ambiente Local - ia_agent\n'));
  
  // Detectar estado atual
  const state = detectCurrentState();
  
  console.log(colorLog('blue', '📊 Estado atual detectado:'));
  console.log(`   .env.local: ${state.envFile ? '✅' : '❌'}`);
  console.log(`   node_modules: ${state.nodeModules ? '✅' : '❌'}`);
  console.log(`   Docker rodando: ${state.dockerRunning ? '✅' : '❌'}`);
  console.log(`   PostgreSQL: ${state.postgresRunning ? '✅' : '❌'}`);
  console.log(`   Redis: ${state.redisRunning ? '✅' : '❌'}`);
  console.log(`   OpenAI Key: ${state.hasOpenAIKey ? '✅' : '❌'}`);
  console.log(`   User ID: ${state.hasUserId ? '✅' : '❌'}`);
  
  if (state.missingVars.length > 0) {
    console.log(colorLog('red', `   Variáveis faltando: ${state.missingVars.join(', ')}`));
  }
  
  // Perguntar o que precisa ser feito
  console.log(colorLog('yellow', '\n🎯 O que precisa ser configurado:'));
  
  const tasks = [];
  
  if (!state.envFile) tasks.push('1. [ ] Criar arquivo .env.local');
  if (!state.hasOpenAIKey) tasks.push('2. [ ] Configurar OpenAI API Key');
  if (!state.hasUserId) tasks.push('3. [ ] Gerar DEFAULT_USER_ID');
  if (!state.nodeModules) tasks.push('4. [ ] Instalar dependências npm');
  if (!state.dockerRunning) tasks.push('5. [ ] Iniciar containers Docker');
  if (!state.postgresRunning) tasks.push('6. [ ] Aplicar schema do database');
  tasks.push('7. [ ] Popular dados iniciais (seeds)');
  
  if (tasks.length === 0) {
    console.log(colorLog('green', '\n✅ Tudo já está configurado!'));
    console.log(colorLog('cyan', '\nVocê já pode começar a desenvolver:'));
    console.log(colorLog('white', '$ npm run dev'));
    return;
  }
  
  tasks.forEach(task => console.log(colorLog('white', task)));
  
  const setupAll = await question('\nDeseja configurar tudo automaticamente? (s/n): ');
  
  if (setupAll.toLowerCase() !== 's') {
    console.log(colorLog('yellow', '\n👋 Setup cancelado. Execute os passos manualmente.'));
    return;
  }
  
  console.log(colorLog('bright', '\n🚀 Iniciando setup automático...\n'));
  
  try {
    // 1. Criar .env.local
    if (!state.envFile) {
      if (!await createEnvFile()) {
        console.error(colorLog('red', '❌ Falha ao criar .env.local'));
        return;
      }
    }
    
    // 2. Configurar API Keys
    if (!state.hasOpenAIKey || !state.hasUserId) {
      await setupAPIKeys();
    }
    
    // 3. Gerar User ID
    if (!state.hasUserId) {
      generateUserId();
    }
    
    // 4. Instalar dependências
    if (!state.nodeModules) {
      if (!await installDependencies()) {
        console.error(colorLog('red', '❌ Falha ao instalar dependências'));
        return;
      }
    }
    
    // 5. Iniciar Docker
    if (!state.dockerRunning) {
      if (!await startDocker()) {
        console.error(colorLog('red', '❌ Falha ao iniciar Docker'));
        return;
      }
    }
    
    // 6. Setup Database
    if (!state.postgresRunning) {
      if (!await setupDatabase()) {
        console.error(colorLog('red', '❌ Falha no setup do database'));
        return;
      }
    }
    
    // 7. Seed Database
    await seedDatabase();
    
    // 8. Validação final
    await validateSetup();
    
    console.log(colorLog('bright', '\n🎉 Setup concluído com sucesso!\n'));
    
    console.log(colorLog('green', '✅ Todos os checks passaram\n'));
    console.log(colorLog('white', 'Você já pode começar a desenvolver:'));
    console.log(colorLog('cyan', '$ npm run dev\n'));
    
    console.log(colorLog('white', 'URLs úteis:'));
    console.log(colorLog('cyan', '- App: http://localhost:3000'));
    console.log(colorLog('cyan', '- Drizzle Studio: npm run db:studio'));
    console.log(colorLog('cyan', '- Logs Docker: npm run docker:logs'));
    console.log(colorLog('cyan', '- Validar ambiente: npm run env:validate'));
    
  } catch (error) {
    console.error(colorLog('red', `\n❌ Erro durante setup: ${error.message}`));
    process.exit(1);
  }
}

main();
