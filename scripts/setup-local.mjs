#!/usr/bin/env node

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SETUP AUTOMÁTICO - IA Agent (Cross-Platform)
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Script universal para configurar ambiente de desenvolvimento local
 * Compatible com: Windows, macOS, Linux
 * 
 * USO:
 * node scripts/setup-local.mjs
 * npm run setup:local
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

// Cores para terminal (cross-platform)
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`PASSO ${step}: ${message}`, 'bright');
    log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Detectar SO
function detectOS() {
    const platform = process.platform;
    if (platform === 'win32') return 'windows';
    if (platform === 'darwin') return 'macos';
    if (platform === 'linux') return 'linux';
    return 'unknown';
}

// Executar comando cross-platform
function runCommand(command, description) {
    try {
        logInfo(`Executando: ${command}`);
        execSync(command, { 
            stdio: 'inherit',
            cwd: projectRoot,
            shell: true
        });
        logSuccess(`${description} concluído`);
        return true;
    } catch (error) {
        logError(`Erro ao executar: ${description}`);
        logError(error.message);
        return false;
    }
}

// Verificar se arquivo existe
function fileExists(path) {
    return existsSync(join(projectRoot, path));
}

// Ler arquivo
function readFile(path) {
    try {
        return readFileSync(join(projectRoot, path), 'utf8');
    } catch (error) {
        return null;
    }
}

// Escrever arquivo
function writeFile(path, content) {
    try {
        writeFileSync(join(projectRoot, path), content, 'utf8');
        return true;
    } catch (error) {
        logError(`Erro ao escrever arquivo ${path}: ${error.message}`);
        return false;
    }
}

// Verificar Node.js
function checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion < 20) {
        logError(`Node.js v${majorVersion} detectado. Versão mínima requerida: v20.0.0`);
        logInfo('Por favor, atualize o Node.js: https://nodejs.org/');
        return false;
    }
    
    logSuccess(`Node.js v${version} compatível`);
    return true;
}

// Verificar se npm está disponível
function checkNpm() {
    try {
        execSync('npm --version', { stdio: 'pipe' });
        logSuccess('npm disponível');
        return true;
    } catch (error) {
        logError('npm não encontrado. Por favor, instale o Node.js com npm');
        return false;
    }
}

// Criar .env.local
function createEnvFile() {
    if (fileExists('.env.local')) {
        logWarning('.env.local já existe');
        return true;
    }

    const envTemplate = `# ─────────────────────────────────────────────────────────────────────────────
# VARIÁVEIS DE AMBIENTE - IA Agent (Desenvolvimento Local)
# ─────────────────────────────────────────────────────────────────────────────

# Database (OBRIGATÓRIO)
# Para desenvolvimento local, use Docker ou PostgreSQL local
DATABASE_URL=postgresql://postgres:password@localhost:5432/ia_agent_dev

# OpenAI (OBRIGATÓRIO)
# Get your key: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Google Calendar (OPCIONAL)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# Default User ID (será gerado automaticamente)
DEFAULT_USER_ID=

# NextAuth
NEXTAUTH_URL=http://localhost:3000

# Flags de desenvolvimento
USE_MOCK_AI=false
USE_LOCAL_DB=true
LOG_LEVEL=debug
`;

    if (writeFile('.env.local', envTemplate)) {
        logSuccess('.env.local criado');
        logInfo('Por favor, edite o arquivo com suas credenciais');
        return true;
    }
    
    return false;
}

// Criar .env.example
function createEnvExample() {
    if (fileExists('.env.example')) {
        logWarning('.env.example já existe');
        return true;
    }

    const envExample = `# Database (Required)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# OpenAI (Required)
OPENAI_API_KEY=sk-proj-...

# Google Calendar (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# Default User ID (Required)
DEFAULT_USER_ID=uuid-of-default-user

# NextAuth
NEXTAUTH_URL=http://localhost:3000
`;

    if (writeFile('.env.example', envExample)) {
        logSuccess('.env.example criado');
        return true;
    }
    
    return false;
}

// Criar docker-compose para desenvolvimento
function createDockerCompose() {
    if (fileExists('docker-compose.dev.yml')) {
        logWarning('docker-compose.dev.yml já existe');
        return true;
    }

    const dockerCompose = `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ia-agent-postgres
    environment:
      POSTGRES_DB: ia_agent_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ia-agent-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`;

    if (writeFile('docker-compose.dev.yml', dockerCompose)) {
        logSuccess('docker-compose.dev.yml criado');
        return true;
    }
    
    return false;
}

// Criar script de init do banco
function createDbInitScript() {
    if (fileExists('scripts/init-db.sql')) {
        logWarning('scripts/init-db.sql já existe');
        return true;
    }

    const initScript = `-- Inicialização do banco PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Criar banco se não existir (já é feito pelo POSTGRES_DB)
`;

    if (writeFile('scripts/init-db.sql', initScript)) {
        logSuccess('scripts/init-db.sql criado');
        return true;
    }
    
    return false;
}

// Adicionar scripts ao package.json
function addPackageScripts() {
    const packagePath = join(projectRoot, 'package.json');
    const packageContent = readFile('package.json'); // Usar caminho relativo
    
    if (!packageContent) {
        logError('package.json não encontrado');
        return false;
    }

    const packageJson = JSON.parse(packageContent);
    const newScripts = {
        'setup:local': 'node scripts/setup-local.mjs',
        'setup:db': 'node scripts/setup-local-db.mjs',
        'docker:dev': 'docker-compose -f docker-compose.dev.yml up -d',
        'docker:down': 'docker-compose -f docker-compose.dev.yml down',
        'docker:logs': 'docker-compose -f docker-compose.dev.yml logs -f',
        'db:reset': 'npm run docker:down && npm run docker:dev && sleep 5 && npm run db:push'
    };

    // Adicionar scripts que não existem
    Object.assign(packageJson.scripts, newScripts);

    // Corrigir scripts do Drizzle para usar dotenv
    packageJson.scripts['db:generate'] = 'dotenv -e .env.local -- drizzle-kit generate';
    packageJson.scripts['db:migrate'] = 'dotenv -e .env.local -- drizzle-kit migrate';
    packageJson.scripts['db:push'] = 'dotenv -e .env.local -- drizzle-kit push';
    packageJson.scripts['db:studio'] = 'dotenv -e .env.local -- drizzle-kit studio';

    if (writeFile('package.json', JSON.stringify(packageJson, null, 4))) {
        logSuccess('Scripts adicionados ao package.json');
        return true;
    }
    
    return false;
}

// Setup principal
async function main() {
    log('\n🚀 SETUP AUTOMÁTICO - IA AGENT', 'bright');
    log(`📍 Sistema detectado: ${detectOS()}`, 'cyan');
    log(`📁 Diretório do projeto: ${projectRoot}`, 'cyan');

    // Verificações básicas
    logStep(1, 'Verificando pré-requisitos');
    
    if (!checkNodeVersion()) {
        process.exit(1);
    }
    
    if (!checkNpm()) {
        process.exit(1);
    }

    // Instalar dependências
    logStep(2, 'Instalando dependências');
    if (!runCommand('npm install', 'Instalação de dependências')) {
        logError('Falha ao instalar dependências');
        process.exit(1);
    }

    // Criar arquivos de configuração
    logStep(3, 'Criando arquivos de configuração');
    
    createEnvFile();
    createEnvExample();
    createDockerCompose();
    createDbInitScript();
    addPackageScripts();

    // Setup do Docker (opcional)
    logStep(4, 'Setup do Docker (opcional)');
    
    const os = detectOS();
    let dockerCommand = '';
    
    if (os === 'windows') {
        dockerCommand = 'docker --version';
    } else {
        dockerCommand = 'docker --version';
    }
    
    try {
        execSync(dockerCommand, { stdio: 'pipe' });
        logSuccess('Docker detectado');
        logInfo('Para usar banco local: npm run docker:dev');
    } catch (error) {
        logWarning('Docker não detectado');
        logInfo('Use Neon (recomendado) ou instale Docker');
    }

    // Setup do banco
    logStep(5, 'Setup do banco de dados');
    
    logInfo('Opções de banco de dados:');
    log('1. Neon (recomendado) - https://console.neon.tech', 'cyan');
    log('2. Docker local - npm run docker:dev', 'cyan');
    log('3. PostgreSQL local', 'cyan');
    
    log('\n📋 PRÓXIMOS PASSOS:', 'bright');
    log('1. Configure suas credenciais no .env.local', 'yellow');
    log('2. Escolha e configure seu banco de dados', 'yellow');
    log('3. Execute: npm run db:push', 'yellow');
    log('4. Execute: node create-default-user.mjs', 'yellow');
    log('5. Execute: npm run dev', 'yellow');
    
    log('\n🎉 SETUP CONCLUÍDO!', 'green');
    log('A documentação completa está em README.md', 'blue');
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
    logError(`Erro não tratado: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(`Promise rejeitada: ${reason}`);
    process.exit(1);
});

// Executar setup
main().catch(error => {
    logError(`Erro no setup: ${error.message}`);
    process.exit(1);
});
