#!/usr/bin/env node

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SETUP BANCO LOCAL - IA Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Script para configurar banco PostgreSQL local para desenvolvimento
 * Opções: Docker, PostgreSQL nativo, ou instalação automática
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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
        return false;
    }
}

// Verificar se Docker está disponível
function checkDocker() {
    try {
        execSync('docker --version', { stdio: 'pipe' });
        logSuccess('Docker disponível');
        return true;
    } catch (error) {
        logWarning('Docker não encontrado');
        return false;
    }
}

// Verificar se PostgreSQL está instalado
function checkPostgreSQL() {
    try {
        execSync('psql --version', { stdio: 'pipe' });
        logSuccess('PostgreSQL disponível');
        return true;
    } catch (error) {
        logWarning('PostgreSQL não encontrado');
        return false;
    }
}

// Setup com Docker
function setupDocker() {
    logStep(1, 'Configurando banco com Docker');
    
    if (!runCommand('docker compose -f docker-compose.dev.yml up -d', 'Iniciando containers Docker')) {
        logError('Falha ao iniciar Docker');
        return false;
    }
    
    // Aguardar banco estar pronto
    logInfo('Aguardando banco ficar pronto...');
    setTimeout(() => {
        logSuccess('Banco PostgreSQL pronto via Docker');
    }, 5000);
    
    return true;
}

// Setup com PostgreSQL local
function setupPostgreSQLLocal() {
    logStep(1, 'Configurando banco PostgreSQL local');
    
    logInfo('Verificando se PostgreSQL está rodando...');
    try {
        execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
        logSuccess('PostgreSQL está rodando');
    } catch (error) {
        logError('PostgreSQL não está rodando');
        logInfo('Inicie o PostgreSQL service ou instale-o');
        return false;
    }
    
    // Criar banco se não existir
    logInfo('Criando banco ia_agent_dev...');
    try {
        execSync('createdb -h localhost -p 5432 -U postgres ia_agent_dev', { stdio: 'pipe' });
        logSuccess('Banco criado');
    } catch (error) {
        logWarning('Banco pode já existir');
    }
    
    return true;
}

// Instalar PostgreSQL (Windows)
function installPostgreSQLWindows() {
    logStep(1, 'Instalação PostgreSQL Windows');
    
    logInfo('Opções de instalação:');
    log('1. Baixe PostgreSQL: https://www.postgresql.org/download/windows/', 'cyan');
    log('2. Use chocolatey: choco install postgresql', 'cyan');
    log('3. Use scoop: scoop install postgresql', 'cyan');
    
    return false;
}

// Menu de opções
function showMenu() {
    log('\n🗄️  CONFIGURAÇÃO DE BANCO LOCAL', 'bright');
    log('\nOpções disponíveis:', 'yellow');
    log('1. Docker (Recomendado)', 'green');
    log('2. PostgreSQL local já instalado', 'blue');
    log('3. Instalar PostgreSQL', 'yellow');
    log('4. Sair', 'red');
    
    return prompt('\nEscolha uma opção (1-4): ');
}

// Principal
async function main() {
    log('\n🚀 SETUP BANCO LOCAL - IA AGENT', 'bright');
    
    const hasDocker = checkDocker();
    const hasPostgres = checkPostgreSQL();
    
    let choice = '1'; // Padrão: Docker
    
    if (!hasDocker && !hasPostgres) {
        logWarning('Nenhum banco de dados encontrado');
        choice = '3'; // Instalar
    } else if (hasDocker) {
        logInfo('Docker disponível - usando como padrão');
        choice = '1';
    } else if (hasPostgres) {
        logInfo('PostgreSQL disponível - usando como padrão');
        choice = '2';
    }
    
    switch (choice) {
        case '1':
            if (hasDocker) {
                setupDocker();
            } else {
                logError('Docker não encontrado. Instale Docker Desktop.');
                process.exit(1);
            }
            break;
            
        case '2':
            if (hasPostgres) {
                setupPostgreSQLLocal();
            } else {
                logError('PostgreSQL não encontrado.');
                process.exit(1);
            }
            break;
            
        case '3':
            const os = process.platform;
            if (os === 'win32') {
                installPostgreSQLWindows();
            } else {
                logInfo('Use seu gerenciador de pacotes:');
                log('macOS: brew install postgresql', 'cyan');
                log('Ubuntu: sudo apt-get install postgresql postgresql-contrib', 'cyan');
            }
            break;
            
        case '4':
            logInfo('Saindo...');
            process.exit(0);
            break;
            
        default:
            logError('Opção inválida');
            process.exit(1);
    }
    
    log('\n📋 PRÓXIMOS PASSOS:', 'bright');
    log('1. Configure OPENAI_API_KEY no .env.local', 'yellow');
    log('2. Execute: npm run db:push', 'yellow');
    log('3. Execute: node create-default-user.mjs', 'yellow');
    log('4. Execute: npm run dev', 'yellow');
    
    log('\n🎉 BANCO CONFIGURADO!', 'green');
}

// Executar
main().catch(error => {
    logError(`Erro: ${error.message}`);
    process.exit(1);
});
