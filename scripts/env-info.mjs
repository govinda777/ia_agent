#!/usr/bin/env node

/**
 * Script para exibir informações detalhadas do ambiente
 * Uso: npm run env:info
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getSystemInfo() {
  const info = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    nodePath: process.execPath,
    npmVersion: null,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpus: require('os').cpus(),
    totalMemory: require('os').totalmem(),
    freeMemory: require('os').freemem(),
    homeDir: homedir()
  };
  
  // Obter versão do npm
  const npmResult = execCommand('npm --version');
  if (npmResult.success) {
    info.npmVersion = npmResult.output;
  }
  
  // Informações específicas do SO
  if (process.platform === 'linux') {
    const osRelease = execCommand('cat /etc/os-release | grep PRETTY_NAME');
    if (osRelease.success) {
      info.osName = osRelease.output.split('=')[1].replace(/"/g, '');
    }
    
    const memInfo = execCommand('free -h | grep Mem');
    if (memInfo.success) {
      info.systemMemory = memInfo.output;
    }
    
    const diskInfo = execCommand('df -h . | tail -1');
    if (diskInfo.success) {
      info.diskSpace = diskInfo.output;
    }
  } else if (process.platform === 'darwin') {
    const macVersion = execCommand('sw_vers -productVersion');
    if (macVersion.success) {
      info.osName = `macOS ${macVersion.output}`;
    }
  } else if (process.platform === 'win32') {
    const winVersion = execCommand('ver');
    if (winVersion.success) {
      info.osName = `Windows ${winVersion.output}`;
    }
  }
  
  return info;
}

function getProjectInfo() {
  const info = {
    name: null,
    version: null,
    description: null,
    dependencies: 0,
    devDependencies: 0,
    scripts: 0,
    lastModified: null
  };
  
  if (existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      info.name = packageJson.name;
      info.version = packageJson.version;
      info.description = packageJson.description;
      info.dependencies = Object.keys(packageJson.dependencies || {}).length;
      info.devDependencies = Object.keys(packageJson.devDependencies || {}).length;
      info.scripts = Object.keys(packageJson.scripts || {}).length;
    } catch (error) {
      console.error('Erro ao ler package.json:', error.message);
    }
  }
  
  if (existsSync('package.json')) {
    const stats = require('fs').statSync('package.json');
    info.lastModified = stats.mtime;
  }
  
  return info;
}

function getGitInfo() {
  const info = {
    branch: null,
    commit: null,
    status: null,
    remote: null,
    ahead: 0,
    behind: 0
  };
  
  // Verificar se estamos em um repositório git
  const gitDir = execCommand('git rev-parse --git-dir');
  if (!gitDir.success) {
    info.status = 'Not a git repository';
    return info;
  }
  
  // Branch atual
  const branchResult = execCommand('git rev-parse --abbrev-ref HEAD');
  if (branchResult.success) {
    info.branch = branchResult.output;
  }
  
  // Último commit
  const commitResult = execCommand('git rev-parse --short HEAD');
  if (commitResult.success) {
    info.commit = commitResult.output;
  }
  
  // Status
  const statusResult = execCommand('git status --porcelain');
  if (statusResult.success) {
    const lines = statusResult.output.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      info.status = 'Clean';
    } else {
      info.status = `Modified (${lines.length} files)`;
    }
  }
  
  // Remote
  const remoteResult = execCommand('git remote get-url origin');
  if (remoteResult.success) {
    info.remote = remoteResult.output;
  }
  
  // Ahead/Behind
  const aheadBehindResult = execCommand('git rev-list --count --left-right @{upstream}...HEAD 2>/dev/null || echo "0 0"');
  if (aheadBehindResult.success) {
    const [behind, ahead] = aheadBehindResult.output.split(' ');
    info.ahead = parseInt(ahead) || 0;
    info.behind = parseInt(behind) || 0;
  }
  
  return info;
}

function getDockerInfo() {
  const info = {
    version: null,
    daemonRunning: false,
    containers: {
      total: 0,
      running: 0,
      stopped: 0
    },
    images: 0,
    volumes: 0,
    networks: 0,
    projectContainers: []
  };
  
  // Versão do Docker
  const versionResult = execCommand('docker --version');
  if (versionResult.success) {
    info.version = versionResult.output;
  }
  
  // Verificar se daemon está rodando
  const infoResult = execCommand('docker info');
  if (infoResult.success) {
    info.daemonRunning = true;
    
    // Contar containers
    const psResult = execCommand('docker ps -a --format "{{.Names}}\\t{{.Status}}"');
    if (psResult.success) {
      const lines = psResult.output.split('\n').filter(line => line.trim());
      info.containers.total = lines.length;
      
      for (const line of lines) {
        if (line.includes('Up')) {
          info.containers.running++;
        } else {
          info.containers.stopped++;
        }
        
        // Verificar containers do projeto
        if (line.includes('ia-agent-')) {
          const [name, status] = line.split('\t');
          info.projectContainers.push({ name, status: status.includes('Up') ? 'running' : 'stopped' });
        }
      }
    }
    
    // Contar imagens
    const imagesResult = execCommand('docker images --format "{{.Repository}}"');
    if (imagesResult.success) {
      info.images = imagesResult.output.split('\n').filter(line => line.trim()).length;
    }
    
    // Contar volumes
    const volumesResult = execCommand('docker volume ls');
    if (volumesResult.success) {
      info.volumes = volumesResult.output.split('\n').filter(line => line.trim()).length - 1; // -1 para header
    }
    
    // Contar networks
    const networksResult = execCommand('docker network ls');
    if (networksResult.success) {
      info.networks = networksResult.output.split('\n').filter(line => line.trim()).length - 1; // -1 para header
    }
  }
  
  return info;
}

function getServiceInfo() {
  const info = {
    postgresql: {
      container: false,
      port: 5432,
      status: 'unknown'
    },
    redis: {
      container: false,
      port: 6379,
      status: 'unknown'
    },
    nextjs: {
      port: 3000,
      status: 'unknown'
    }
  };
  
  // Verificar containers PostgreSQL e Redis
  if (info.docker.daemonRunning) {
    const psResult = execCommand('docker ps --format "{{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
    if (psResult.success) {
      const lines = psResult.output.split('\n');
      
      for (const line of lines) {
        if (line.includes('ia-agent-postgres')) {
          info.postgresql.container = true;
          info.postgresql.status = line.includes('Up') ? 'running' : 'stopped';
        } else if (line.includes('ia-agent-redis')) {
          info.redis.container = true;
          info.redis.status = line.includes('Up') ? 'running' : 'stopped';
        }
      }
    }
  }
  
  // Verificar portas
  const ports = [3000, 5432, 6379];
  for (const port of ports) {
    try {
      const result = execCommand(`netstat -tuln | grep :${port} || lsof -ti:${port} || echo "free"`);
      const isUsed = !result.output.includes('free') && result.output !== '';
      
      if (port === 3000) {
        info.nextjs.status = isUsed ? 'in-use' : 'free';
      } else if (port === 5432) {
        info.postgresql.port = isUsed ? 'in-use' : 'free';
      } else if (port === 6379) {
        info.redis.port = isUsed ? 'in-use' : 'free';
      }
    } catch (error) {
      // Ignorar erros na verificação de portas
    }
  }
  
  return info;
}

function getEnvironmentInfo() {
  const info = {
    hasEnvFile: false,
    envFileSize: 0,
    variables: [],
    configuredVars: 0,
    missingVars: [],
    placeholderVars: []
  };
  
  if (existsSync('.env.local')) {
    info.hasEnvFile = true;
    
    try {
      const envContent = readFileSync('.env.local', 'utf8');
      info.envFileSize = envContent.length;
      
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          
          const variable = {
            key: key.trim(),
            hasValue: value.length > 0,
            isPlaceholder: value.includes('sk-proj-') || value.includes('uuid-of-') || value.includes('your-'),
            length: value.length
          };
          
          info.variables.push(variable);
          
          if (variable.hasValue && !variable.isPlaceholder) {
            info.configuredVars++;
          } else if (variable.isPlaceholder) {
            info.placeholderVars.push(variable.key);
          }
        }
      }
      
      // Verificar variáveis obrigatórias
      const required = ['DATABASE_URL', 'OPENAI_API_KEY', 'DEFAULT_USER_ID', 'NEXTAUTH_URL'];
      info.missingVars = required.filter(req => 
        !info.variables.find(v => v.key === req && v.hasValue && !v.isPlaceholder)
      );
      
    } catch (error) {
      console.error('Erro ao ler .env.local:', error.message);
    }
  }
  
  return info;
}

function printInfo() {
  console.log(colorLog('bright', '📋 INFORMAÇÕES DETALHADAS DO AMBIENTE\n'));
  
  // Sistema
  const sysInfo = getSystemInfo();
  console.log(colorLog('cyan', '🖥️  SISTEMA OPERACIONAL'));
  console.log(colorLog('white', `   SO: ${sysInfo.osName || sysInfo.platform} (${sysInfo.arch})`));
  console.log(colorLog('white', `   Node.js: ${sysInfo.nodeVersion}`));
  console.log(colorLog('white', `   npm: ${sysInfo.npmVersion || 'Não instalado'}`));
  console.log(colorLog('white', `   Path: ${sysInfo.nodePath}`));
  console.log(colorLog('white', `   Home: ${sysInfo.homeDir}`));
  console.log(colorLog('white', `   CPUs: ${sysInfo.cpus.length} cores`));
  console.log(colorLog('white', `   RAM Total: ${formatBytes(sysInfo.totalMemory)}`));
  console.log(colorLog('white', `   RAM Livre: ${formatBytes(sysInfo.freeMemory)}`));
  console.log(colorLog('white', `   RAM Usada: ${formatBytes(sysInfo.totalMemory - sysInfo.freeMemory)} (${Math.round((sysInfo.totalMemory - sysInfo.freeMemory) / sysInfo.totalMemory * 100)}%)`));
  if (sysInfo.systemMemory) {
    console.log(colorLog('white', `   Memória Sistema: ${sysInfo.systemMemory}`));
  }
  if (sysInfo.diskSpace) {
    console.log(colorLog('white', `   Espaço Disco: ${sysInfo.diskSpace}`));
  }
  console.log('');
  
  // Projeto
  const projInfo = getProjectInfo();
  console.log(colorLog('cyan', '📁 INFORMAÇÕES DO PROJETO'));
  console.log(colorLog('white', `   Nome: ${projInfo.name || 'Desconhecido'}`));
  console.log(colorLog('white', `   Versão: ${projInfo.version || 'N/A'}`));
  console.log(colorLog('white', `   Descrição: ${projInfo.description || 'N/A'}`));
  console.log(colorLog('white', `   Dependências: ${projInfo.dependencies}`));
  console.log(colorLog('white', `   Dev Dependencies: ${projInfo.devDependencies}`));
  console.log(colorLog('white', `   Scripts: ${projInfo.scripts}`));
  if (projInfo.lastModified) {
    console.log(colorLog('white', `   Modificado: ${projInfo.lastModified.toLocaleString()}`));
  }
  console.log('');
  
  // Git
  const gitInfo = getGitInfo();
  console.log(colorLog('cyan', '🔗 INFORMAÇÕES GIT'));
  console.log(colorLog('white', `   Repositório: ${gitInfo.status}`));
  if (gitInfo.branch) {
    console.log(colorLog('white', `   Branch: ${gitInfo.branch}`));
    console.log(colorLog('white', `   Commit: ${gitInfo.commit}`));
    console.log(colorLog('white', `   Status: ${gitInfo.status}`));
    if (gitInfo.remote) {
      console.log(colorLog('white', `   Remote: ${gitInfo.remote}`));
    }
    if (gitInfo.ahead > 0 || gitInfo.behind > 0) {
      console.log(colorLog('white', `   Divergência: +${gitInfo.ahead}/-${gitInfo.behind}`));
    }
  }
  console.log('');
  
  // Docker
  const dockerInfo = getDockerInfo();
  console.log(colorLog('cyan', '🐳 INFORMAÇÕES DOCKER'));
  console.log(colorLog('white', `   Versão: ${dockerInfo.version || 'Não instalado'}`));
  console.log(colorLog('white', `   Daemon: ${dockerInfo.daemonRunning ? '✅ Rodando' : '❌ Parado'}`));
  console.log(colorLog('white', `   Containers: ${dockerInfo.containers.total} total (${dockerInfo.containers.running} rodando, ${dockerInfo.containers.stopped} parados)`));
  console.log(colorLog('white', `   Imagens: ${dockerInfo.images}`));
  console.log(colorLog('white', `   Volumes: ${dockerInfo.volumes}`));
  console.log(colorLog('white', `   Networks: ${dockerInfo.networks}`));
  
  if (dockerInfo.projectContainers.length > 0) {
    console.log(colorLog('white', '   Containers do Projeto:'));
    for (const container of dockerInfo.projectContainers) {
      const icon = container.status === 'running' ? '✅' : '❌';
      console.log(colorLog('white', `      ${icon} ${container.name} (${container.status})`));
    }
  }
  console.log('');
  
  // Serviços
  const serviceInfo = getServiceInfo();
  console.log(colorLog('cyan', '🚀 STATUS DOS SERVIÇOS'));
  console.log(colorLog('white', `   Next.js (3000): ${serviceInfo.nextjs.status}`));
  console.log(colorLog('white', `   PostgreSQL (5432): ${serviceInfo.postgresql.container ? `Container ${serviceInfo.postgresql.status}` : serviceInfo.postgresql.port}`));
  console.log(colorLog('white', `   Redis (6379): ${serviceInfo.redis.container ? `Container ${serviceInfo.redis.status}` : serviceInfo.redis.port}`));
  console.log('');
  
  // Ambiente
  const envInfo = getEnvironmentInfo();
  console.log(colorLog('cyan', '⚙️  VARIÁVEIS DE AMBIENTE'));
  console.log(colorLog('white', `   .env.local: ${envInfo.hasEnvFile ? '✅ Existe' : '❌ Não existe'}`));
  if (envInfo.hasEnvFile) {
    console.log(colorLog('white', `   Tamanho: ${formatBytes(envInfo.envFileSize)}`));
    console.log(colorLog('white'), `   Variáveis: ${envInfo.variables.length} total`);
    console.log(colorLog('white'), `   Configuradas: ${envInfo.configuredVars}`);
    
    if (envInfo.placeholderVars.length > 0) {
      console.log(colorLog('yellow'), `   Placeholders: ${envInfo.placeholderVars.join(', ')}`);
    }
    
    if (envInfo.missingVars.length > 0) {
      console.log(colorLog('red'), `   Faltando: ${envInfo.missingVars.join(', ')}`);
    }
    
    // Mostrar algumas variáveis (sem valores sensíveis)
    console.log(colorLog('white'), '   Variáveis configuradas:');
    for (const variable of envInfo.variables.slice(0, 5)) {
      const status = variable.hasValue && !variable.isPlaceholder ? '✅' : '❌';
      console.log(colorLog('white'), `      ${status} ${variable.key}`);
    }
  }
  console.log('');
  
  // Resumo
  console.log(colorLog('bright', '📊 RESUMO'));
  const healthScore = calculateHealthScore(sysInfo, dockerInfo, serviceInfo, envInfo);
  console.log(colorLog('white'), `   Score Saúde: ${healthScore}/100`);
  
  const grade = healthScore >= 90 ? 'A' : healthScore >= 80 ? 'B' : healthScore >= 70 ? 'C' : healthScore >= 60 ? 'D' : 'F';
  const gradeColor = healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red';
  console.log(colorLog(gradeColor), `   Grau: ${grade}`);
  
  console.log(colorLog('bright'), '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(colorLog('cyan'), 'Comandos úteis:');
  console.log(colorLog('white'), '- Validar ambiente: npm run env:validate');
  console.log(colorLog('white'), '- Diagnóstico completo: npm run env:doctor');
  console.log(colorLog('white'), '- Corrigir problemas: npm run env:fix');
  console.log(colorLog('white'), '- Setup completo: npm run env:setup');
}

function calculateHealthScore(system, docker, services, environment) {
  let score = 0;
  
  // Sistema (30 pontos)
  if (system.nodeVersion && parseInt(system.nodeVersion.slice(1)) >= 20) score += 10;
  if (system.npmVersion) score += 10;
  if (system.totalMemory - system.freeMemory < system.totalMemory * 0.8) score += 10; // Não usar mais de 80% RAM
  
  // Docker (30 pontos)
  if (docker.daemonRunning) score += 10;
  if (docker.containers.running > 0) score += 10;
  if (docker.projectContainers.length >= 2) score += 10; // PostgreSQL + Redis
  
  // Serviços (25 pontos)
  if (services.postgresql.container === true || services.postgresql.port === 'in-use') score += 10;
  if (services.redis.container === true || services.redis.port === 'in-use') score += 10;
  if (services.nextjs.status === 'free') score += 5;
  
  // Ambiente (15 pontos)
  if (environment.hasEnvFile) score += 5;
  if (environment.configuredVars >= 3) score += 5;
  if (environment.missingVars.length === 0) score += 5;
  
  return Math.min(score, 100);
}

async function main() {
  try {
    printInfo();
  } catch (error) {
    console.error(colorLog('red'), `Erro fatal: ${error.message}`);
    process.exit(1);
  }
}

main();
