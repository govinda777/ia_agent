#!/usr/bin/env node

/**
 * Script completo de validação do ambiente de desenvolvimento
 * Uso: npm run env:validate [--verbose] [--fix]
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { homedir } from 'os';
import { join } from 'path';

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

// Resultados dos checks
const results = {
  system: { status: 'pending', checks: [] },
  tools: { status: 'pending', checks: [] },
  ports: { status: 'pending', checks: [] },
  config: { status: 'pending', checks: [] },
  docker: { status: 'pending', checks: [] },
  dependencies: { status: 'pending', checks: [] },
  database: { status: 'pending', checks: [] },
  redis: { status: 'pending', checks: [] },
  build: { status: 'pending', checks: [] },
  external: { status: 'pending', checks: [] }
};

const verbose = process.argv.includes('--verbose');
const autoFix = process.argv.includes('--fix');

// Helper functions
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: verbose ? 'inherit' : 'pipe',
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
    return true; // Assume free if command fails
  }
}

function getRequiredEnvVars() {
  const envExample = readFileSync('.env.example', 'utf8');
  const lines = envExample.split('\n');
  const required = [];
  
  for (const line of lines) {
    if (line.includes('=') && !line.startsWith('#')) {
      const key = line.split('=')[0];
      if (key && !key.includes('_OPTIONAL')) {
        required.push(key);
      }
    }
  }
  
  return required;
}

async function checkSystem() {
  console.log(colorLog('cyan', '🖥️  Sistema Operacional'));
  
  try {
    // Detectar SO
    const platform = process.platform;
    const arch = process.arch;
    const nodeVersion = process.version;
    
    results.system.checks.push({
      name: 'Sistema Operacional',
      status: 'success',
      value: `${platform} (${arch})`,
      details: `Node.js ${nodeVersion}`
    });
    
    // Verificar Node.js version
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (nodeMajor >= 20) {
      results.system.checks.push({
        name: 'Node.js Version',
        status: 'success',
        value: nodeVersion,
        details: 'Versão >= 20.0.0 ✅'
      });
    } else {
      results.system.checks.push({
        name: 'Node.js Version',
        status: 'error',
        value: nodeVersion,
        details: 'Requer Node.js >= 20.0.0'
      });
    }
    
    // Verificar npm
    const npmResult = execCommand('npm --version');
    if (npmResult.success) {
      results.system.checks.push({
        name: 'npm Version',
        status: 'success',
        value: `v${npmResult.output}`,
        details: 'npm funcionando'
      });
    } else {
      results.system.checks.push({
        name: 'npm Version',
        status: 'error',
        value: 'Não encontrado',
        details: 'npm não está instalado'
      });
    }
    
    // Verificar RAM (simplificado)
    if (platform === 'linux') {
      const memResult = execCommand('free -h | grep Mem | awk \'{print $2}\'');
      if (memResult.success) {
        results.system.checks.push({
          name: 'RAM Disponível',
          status: 'success',
          value: memResult.output,
          details: 'Memória OK'
        });
      }
    }
    
  } catch (error) {
    results.system.checks.push({
      name: 'Sistema',
      status: 'error',
      value: 'Erro ao detectar',
      details: error.message
    });
  }
}

async function checkTools() {
  console.log(colorLog('cyan', '🛠️  Ferramentas'));
  
  const tools = [
    { name: 'Docker', command: 'docker --version', minVersion: '20.0' },
    { name: 'Docker Compose', command: 'docker-compose --version || docker compose version', minVersion: '2.0' },
    { name: 'Git', command: 'git --version', minVersion: '2.0' }
  ];
  
  for (const tool of tools) {
    const result = execCommand(tool.command);
    if (result.success) {
      results.tools.checks.push({
        name: tool.name,
        status: 'success',
        value: result.output,
        details: `${tool.name} funcionando`
      });
    } else {
      results.tools.checks.push({
        name: tool.name,
        status: 'error',
        value: 'Não encontrado',
        details: `${tool.name} não está instalado`
      });
    }
  }
  
  // Verificar configuração do Git
  const gitConfig = execCommand('git config --list');
  if (gitConfig.success && gitConfig.output.includes('user.name') && gitConfig.output.includes('user.email')) {
    results.tools.checks.push({
      name: 'Git Config',
      status: 'success',
      value: 'Configurado',
      details: 'user.name e user.email OK'
    });
  } else {
    results.tools.checks.push({
      name: 'Git Config',
      status: 'warning',
      value: 'Não configurado',
      details: 'Execute: git config --global user.name "Seu Nome" && git config --global user.email "seu@email.com"'
    });
  }
}

async function checkPorts() {
  console.log(colorLog('cyan', '🔌 Portas Disponíveis'));
  
  const ports = [
    { name: 'Next.js', port: 3000 },
    { name: 'PostgreSQL', port: 5432 },
    { name: 'Redis', port: 6379 },
    { name: 'Drizzle Studio', port: 5555 }
  ];
  
  for (const portInfo of ports) {
    const isFree = checkPort(portInfo.port);
    results.ports.checks.push({
      name: `Porta ${portInfo.port} (${portInfo.name})`,
      status: isFree ? 'success' : 'error',
      value: isFree ? 'Disponível' : 'Em uso',
      details: isFree ? `${portInfo.name} pode usar` : `Outro processo usando porta ${portInfo.port}`
    });
  }
}

async function checkConfig() {
  console.log(colorLog('cyan', '⚙️  Configuração'));
  
  // Verificar .env.local
  if (existsSync('.env.local')) {
    results.config.checks.push({
      name: '.env.local',
      status: 'success',
      value: 'Existe',
      details: 'Arquivo de ambiente encontrado'
    });
    
    // Verificar variáveis obrigatórias
    const envContent = readFileSync('.env.local', 'utf8');
    const requiredVars = getRequiredEnvVars();
    const missingVars = [];
    const placeholderVars = [];
    
    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      } else {
        const value = envContent.split(`${varName}=`)[1]?.split('\n')[0];
        if (value.includes('sk-proj-') || value.includes('uuid-of-') || value.includes('your-')) {
          placeholderVars.push(varName);
        }
      }
    }
    
    if (missingVars.length === 0 && placeholderVars.length === 0) {
      results.config.checks.push({
        name: 'Variáveis de Ambiente',
        status: 'success',
        value: 'Completas',
        details: 'Todas as variáveis obrigatórias configuradas'
      });
    } else {
      const issues = [];
      if (missingVars.length > 0) issues.push(`Faltando: ${missingVars.join(', ')}`);
      if (placeholderVars.length > 0) issues.push(`Placeholders: ${placeholderVars.join(', ')}`);
      
      results.config.checks.push({
        name: 'Variáveis de Ambiente',
        status: 'error',
        value: 'Incompletas',
        details: issues.join('; ')
      });
    }
  } else {
    results.config.checks.push({
      name: '.env.local',
      status: 'error',
      value: 'Não encontrado',
      details: 'Execute: cp .env.example .env.local'
    });
  }
  
  // Verificar .gitignore
  if (existsSync('.gitignore')) {
    const gitignore = readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('.env.local')) {
      results.config.checks.push({
        name: '.gitignore',
        status: 'success',
        value: 'Configurado',
        details: '.env.local está no .gitignore'
      });
    } else {
      results.config.checks.push({
        name: '.gitignore',
        status: 'warning',
        value: 'Incompleto',
        details: 'Adicione .env.local ao .gitignore'
      });
    }
  }
}

async function checkDocker() {
  console.log(colorLog('cyan', '🐳 Docker'));
  
  // Verificar se Docker daemon está rodando
  const dockerInfo = execCommand('docker info');
  if (dockerInfo.success) {
    results.docker.checks.push({
      name: 'Docker Daemon',
      status: 'success',
      value: 'Rodando',
      details: 'Docker está funcionando'
    });
    
    // Verificar permissões
    const dockerPs = execCommand('docker ps');
    if (dockerPs.success) {
      results.docker.checks.push({
        name: 'Permissões Docker',
        status: 'success',
        value: 'OK',
        details: 'Usuário pode executar comandos Docker'
      });
    } else {
      results.docker.checks.push({
        name: 'Permissões Docker',
        status: 'error',
        value: 'Sem permissão',
        details: 'Adicione seu usuário ao grupo docker'
      });
    }
    
    // Verificar se pode baixar imagens
    const pullResult = execCommand('docker pull hello-world --quiet');
    if (pullResult.success) {
      results.docker.checks.push({
        name: 'Download de Imagens',
        status: 'success',
        value: 'Funcionando',
        details: 'Consegue baixar imagens do Docker Hub'
      });
    } else {
      results.docker.checks.push({
        name: 'Download de Imagens',
        status: 'warning',
        value: 'Falhou',
        details: 'Problema de conectividade ou permissão'
      });
    }
  } else {
    results.docker.checks.push({
      name: 'Docker Daemon',
      status: 'error',
      value: 'Parado',
      details: 'Inicie o Docker Desktop'
    });
  }
}

async function checkDependencies() {
  console.log(colorLog('cyan', '📦 Dependências Node'));
  
  // Verificar node_modules
  if (existsSync('node_modules')) {
    results.dependencies.checks.push({
      name: 'node_modules',
      status: 'success',
      value: 'Existe',
      details: 'Dependências instaladas'
    });
    
    // Verificar package-lock.json
    if (existsSync('package-lock.json')) {
      results.dependencies.checks.push({
        name: 'package-lock.json',
        status: 'success',
        value: 'Sincronizado',
        details: 'Lock file presente'
      });
    } else {
      results.dependencies.checks.push({
        name: 'package-lock.json',
        status: 'warning',
        value: 'Ausente',
        details: 'Execute: npm install'
      });
    }
    
    // Verificar vulnerabilidades
    const auditResult = execCommand('npm audit --json');
    if (auditResult.success) {
      try {
        const audit = JSON.parse(auditResult.output);
        const criticalVulns = audit.vulnerabilities ? Object.values(audit.vulnerabilities).filter(v => v.severity === 'critical').length : 0;
        
        if (criticalVulns === 0) {
          results.dependencies.checks.push({
            name: 'Segurança',
            status: 'success',
            value: 'OK',
            details: 'Sem vulnerabilidades críticas'
          });
        } else {
          results.dependencies.checks.push({
            name: 'Segurança',
            status: 'warning',
            value: `${criticalVulns} críticas`,
            details: 'Execute: npm audit fix'
          });
        }
      } catch {
        results.dependencies.checks.push({
          name: 'Segurança',
          status: 'warning',
          value: 'Não verificado',
          details: 'Não foi possível analisar vulnerabilities'
        });
      }
    }
  } else {
    results.dependencies.checks.push({
      name: 'node_modules',
      status: 'error',
      value: 'Não existe',
      details: 'Execute: npm install'
    });
  }
}

async function checkDatabase() {
  console.log(colorLog('cyan', '🗄️  Database'));
  
  // Verificar se container PostgreSQL está rodando
  const psResult = execCommand('docker ps --filter "name=ia-agent-postgres" --format "table {{.Names}}\\t{{.Status}}"');
  if (psResult.success && psResult.output.includes('ia-agent-postgres')) {
    results.database.checks.push({
      name: 'PostgreSQL Container',
      status: 'success',
      value: 'Rodando',
      details: 'Container PostgreSQL ativo'
    });
    
    // Tentar conectar
    const connectResult = execCommand('docker exec ia-agent-postgres pg_isready -U postgres');
    if (connectResult.success) {
      results.database.checks.push({
        name: 'Conexão PostgreSQL',
        status: 'success',
        value: 'OK',
        details: 'Consegue conectar no database'
      });
      
      // Verificar se schema está aplicado
      const schemaResult = execCommand('docker exec ia-agent-postgres psql -U postgres -d ia_agent_dev -c "\\dt"');
      if (schemaResult.success && schemaResult.output.includes('users')) {
        results.database.checks.push({
          name: 'Database Schema',
          status: 'success',
          value: 'Aplicado',
          details: 'Tabelas existem no database'
        });
      } else {
        results.database.checks.push({
          name: 'Database Schema',
          status: 'error',
          value: 'Não aplicado',
          details: 'Execute: npm run db:push'
        });
      }
    } else {
      results.database.checks.push({
        name: 'Conexão PostgreSQL',
        status: 'error',
        value: 'Falhou',
        details: 'Database não está pronto'
      });
    }
  } else {
    results.database.checks.push({
      name: 'PostgreSQL Container',
      status: 'error',
      value: 'Parado',
      details: 'Execute: npm run docker:dev'
    });
  }
}

async function checkRedis() {
  console.log(colorLog('cyan', '🔴 Redis'));
  
  // Verificar se container Redis está rodando
  const psResult = execCommand('docker ps --filter "name=ia-agent-redis" --format "table {{.Names}}\\t{{.Status}}"');
  if (psResult.success && psResult.output.includes('ia-agent-redis')) {
    results.redis.checks.push({
      name: 'Redis Container',
      status: 'success',
      value: 'Rodando',
      details: 'Container Redis ativo'
    });
    
    // Tentar conectar
    const connectResult = execCommand('docker exec ia-agent-redis redis-cli ping');
    if (connectResult.success && connectResult.output.includes('PONG')) {
      results.redis.checks.push({
        name: 'Conexão Redis',
        status: 'success',
        value: 'OK',
        details: 'Redis respondendo'
      });
      
      // Testar SET/GET
      const testResult = execCommand('docker exec ia-agent-redis redis-cli set test-key "test-value" && docker exec ia-agent-redis redis-cli get test-key && docker exec ia-agent-redis redis-cli del test-key');
      if (testResult.success && testResult.output.includes('test-value')) {
        results.redis.checks.push({
          name: 'Redis Funcionalidade',
          status: 'success',
          value: 'OK',
          details: 'SET/GET funcionando'
        });
      } else {
        results.redis.checks.push({
          name: 'Redis Funcionalidade',
          status: 'error',
          value: 'Falhou',
          details: 'Redis não está operacional'
        });
      }
    } else {
      results.redis.checks.push({
        name: 'Conexão Redis',
        status: 'error',
        value: 'Falhou',
        details: 'Redis não está respondendo'
      });
    }
  } else {
    results.redis.checks.push({
      name: 'Redis Container',
      status: 'error',
      value: 'Parado',
      details: 'Execute: npm run docker:dev'
    });
  }
}

async function checkBuild() {
  console.log(colorLog('cyan', '🔨 Build e Lint'));
  
  // TypeScript compilation
  const tscResult = execCommand('npx tsc --noEmit');
  if (tscResult.success) {
    results.build.checks.push({
      name: 'TypeScript',
      status: 'success',
      value: 'OK',
      details: 'Compilação sem erros'
    });
  } else {
    results.build.checks.push({
      name: 'TypeScript',
      status: 'error',
      value: 'Erros',
      details: 'Erros de TypeScript encontrados'
    });
  }
  
  // ESLint
  const lintResult = execCommand('npm run lint -- --format=json');
  if (lintResult.success) {
    results.build.checks.push({
      name: 'ESLint',
      status: 'success',
      value: 'OK',
      details: 'Sem erros críticos'
    });
  } else {
    results.build.checks.push({
      name: 'ESLint',
      status: 'warning',
      value: 'Warnings',
      details: 'Existem warnings de linting'
    });
  }
  
  // Next.js build
  const buildResult = execCommand('npm run build');
  if (buildResult.success) {
    results.build.checks.push({
      name: 'Next.js Build',
      status: 'success',
      value: 'OK',
      details: 'Build concluído com sucesso'
    });
  } else {
    results.build.checks.push({
      name: 'Next.js Build',
      status: 'error',
      value: 'Falhou',
      details: 'Build não concluído'
    });
  }
}

async function checkExternal() {
  console.log(colorLog('cyan', '🌐 Serviços Externos'));
  
  if (existsSync('.env.local')) {
    const envContent = readFileSync('.env.local', 'utf8');
    
    // Verificar OpenAI API key
    if (envContent.includes('OPENAI_API_KEY=')) {
      const apiKey = envContent.split('OPENAI_API_KEY=')[1]?.split('\n')[0];
      if (apiKey && !apiKey.includes('sk-proj-') && !apiKey.includes('your-')) {
        // Testar API key (simplificado)
        results.external.checks.push({
          name: 'OpenAI API Key',
          status: 'success',
          value: 'Configurada',
          details: 'API key presente (não testada)'
        });
      } else {
        results.external.checks.push({
          name: 'OpenAI API Key',
          status: 'warning',
          value: 'Placeholder',
          details: 'Configure uma API key real'
        });
      }
    }
    
    // Verificar DEFAULT_USER_ID
    if (envContent.includes('DEFAULT_USER_ID=')) {
      const userId = envContent.split('DEFAULT_USER_ID=')[1]?.split('\n')[0];
      if (userId && !userId.includes('uuid-of-') && userId.length > 10) {
        results.external.checks.push({
          name: 'DEFAULT_USER_ID',
          status: 'success',
          value: 'Configurado',
          details: 'UUID válido presente'
        });
      } else {
        results.external.checks.push({
          name: 'DEFAULT_USER_ID',
          status: 'warning',
          value: 'Placeholder',
          details: 'Configure um UUID real'
        });
      }
    }
  }
}

function calculateStatus() {
  for (const [category, data] of Object.entries(results)) {
    const errorCount = data.checks.filter(c => c.status === 'error').length;
    const warningCount = data.checks.filter(c => c.status === 'warning').length;
    
    if (errorCount > 0) {
      data.status = 'error';
    } else if (warningCount > 0) {
      data.status = 'warning';
    } else {
      data.status = 'success';
    }
  }
}

function printReport() {
  console.log('\n' + colorLog('bright', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const [category, data] of Object.entries(results)) {
    const errorCount = data.checks.filter(c => c.status === 'error').length;
    const warningCount = data.checks.filter(c => c.status === 'warning').length;
    
    totalErrors += errorCount;
    totalWarnings += warningCount;
    
    let statusIcon = '✅';
    let statusColor = 'green';
    
    if (data.status === 'error') {
      statusIcon = '❌';
      statusColor = 'red';
    } else if (data.status === 'warning') {
      statusIcon = '⚠️';
      statusColor = 'yellow';
    }
    
    console.log(colorLog(statusColor, `${statusIcon} ${category.toUpperCase()}`));
    
    for (const check of data.checks) {
      let icon = '✓';
      let color = 'green';
      
      if (check.status === 'error') {
        icon = '✗';
        color = 'red';
      } else if (check.status === 'warning') {
        icon = '⚠';
        color = 'yellow';
      }
      
      console.log(`   ${colorLog(color, icon)} ${check.name.padEnd(25)} | ${colorLog(color, check.value.padStart(12))}`);
      if (verbose || check.status !== 'success') {
        console.log(`      ${colorLog('white', check.details)}`);
      }
    }
    console.log('');
  }
  
  // Resumo final
  console.log(colorLog('bright', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(colorLog('green', '✅ AMBIENTE ESTÁ PERFEITO!'));
    console.log(colorLog('white', '\nVocê já pode começar a desenvolver:'));
    console.log(colorLog('cyan', '$ npm run dev'));
    console.log(colorLog('white', '\nURLs úteis:'));
    console.log(colorLog('cyan', '- App: http://localhost:3000'));
    console.log(colorLog('cyan', '- Drizzle Studio: npm run db:studio'));
    console.log(colorLog('cyan', '- Logs Docker: npm run docker:logs'));
  } else {
    if (totalErrors > 0) {
      console.log(colorLog('red', `❌ AMBIENTE TEM PROBLEMAS (${totalErrors} erros)`));
    } else {
      console.log(colorLog('yellow', `⚠️  AMBIENTE TEM AVISOS (${totalWarnings} warnings)`));
    }
    
    console.log(colorLog('white', '\nProblemas encontrados:'));
    
    const problems = [];
    for (const [category, data] of Object.entries(results)) {
      for (const check of data.checks) {
        if (check.status === 'error') {
          problems.push(`1. ${check.name}: ${check.details}`);
        }
      }
    }
    
    problems.slice(0, 10).forEach(problem => {
      console.log(colorLog('red', problem));
    });
    
    console.log(colorLog('white', '\nSugestões de correção:'));
    
    const suggestions = [];
    for (const [category, data] of Object.entries(results)) {
      for (const check of data.checks) {
        if (check.status === 'error') {
          if (check.name.includes('.env.local')) {
            suggestions.push('1. Execute: npm run env:setup');
          } else if (check.name.includes('Container')) {
            suggestions.push('2. Execute: npm run docker:dev');
          } else if (check.name.includes('node_modules')) {
            suggestions.push('3. Execute: npm install');
          } else if (check.name.includes('Schema')) {
            suggestions.push('4. Execute: npm run db:push');
          } else if (check.name.includes('Porta')) {
            suggestions.push('5. Verifique processos nas portas conflitantes');
          }
        }
      }
    }
    
    // Remover duplicados
    const uniqueSuggestions = [...new Set(suggestions)];
    uniqueSuggestions.slice(0, 5).forEach(suggestion => {
      console.log(colorLog('cyan', suggestion));
    });
    
    if (autoFix) {
      console.log(colorLog('yellow', '\n🔧 Tentando corrigir automaticamente...'));
      console.log(colorLog('cyan', 'Execute: npm run env:fix'));
    } else {
      console.log(colorLog('yellow', '\n🔧 Para tentar corrigir automaticamente:'));
      console.log(colorLog('cyan', 'Execute: npm run env:validate --fix'));
    }
  }
  
  console.log('');
}

// Main execution
async function main() {
  console.log(colorLog('bright', '🔍 Validando Ambiente de Desenvolvimento...\n'));
  
  try {
    await checkSystem();
    await checkTools();
    await checkPorts();
    await checkConfig();
    await checkDocker();
    await checkDependencies();
    await checkDatabase();
    await checkRedis();
    await checkBuild();
    await checkExternal();
    
    calculateStatus();
    printReport();
    
    // Exit code baseado no resultado
    const totalErrors = Object.values(results).reduce((sum, data) => 
      sum + data.checks.filter(c => c.status === 'error').length, 0
    );
    
    process.exit(totalErrors > 0 ? 1 : 0);
    
  } catch (error) {
    console.error(colorLog('red', `Erro fatal: ${error.message}`));
    process.exit(1);
  }
}

main();
