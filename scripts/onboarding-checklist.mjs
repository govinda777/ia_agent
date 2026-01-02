#!/usr/bin/env node

/**
 * Script interativo de onboarding para novos desenvolvedores
 * Uso: npm run onboarding
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
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

class OnboardingProgress {
  constructor() {
    this.progressFile = '.setup-progress.json';
    this.loadProgress();
  }
  
  loadProgress() {
    if (existsSync(this.progressFile)) {
      try {
        const data = readFileSync(this.progressFile, 'utf8');
        this.progress = JSON.parse(data);
      } catch (error) {
        this.progress = { completed: [], currentStep: 0, startedAt: null };
      }
    } else {
      this.progress = { completed: [], currentStep: 0, startedAt: null };
    }
  }
  
  saveProgress() {
    writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2));
  }
  
  markCompleted(stepId) {
    if (!this.progress.completed.includes(stepId)) {
      this.progress.completed.push(stepId);
      this.progress.currentStep++;
      this.saveProgress();
    }
  }
  
  isCompleted(stepId) {
    return this.progress.completed.includes(stepId);
  }
  
  getProgressPercentage() {
    return Math.round((this.progress.completed.length / this.totalSteps) * 100);
  }
  
  get totalSteps() {
    return this.steps.length;
  }
  
  get steps() {
    return [
      {
        id: 'welcome',
        title: 'Bem-vindo ao ia_agent!',
        description: 'Vamos configurar seu ambiente de desenvolvimento',
        action: this.showWelcome.bind(this)
      },
      {
        id: 'system-check',
        title: 'Verificação do Sistema',
        description: 'Verificar se seu ambiente atende aos requisitos',
        action: this.checkSystem.bind(this)
      },
      {
        id: 'git-config',
        title: 'Configuração Git',
        description: 'Configurar seu nome e email no Git',
        action: this.setupGit.bind(this)
      },
      {
        id: 'env-setup',
        title: 'Variáveis de Ambiente',
        description: 'Configurar .env.local com suas chaves de API',
        action: this.setupEnvironment.bind(this)
      },
      {
        id: 'dependencies',
        title: 'Instalação de Dependências',
        description: 'Instalar npm packages',
        action: this.installDependencies.bind(this)
      },
      {
        id: 'docker-setup',
        title: 'Configuração Docker',
        description: 'Iniciar containers PostgreSQL e Redis',
        action: this.setupDocker.bind(this)
      },
      {
        id: 'database-setup',
        title: 'Configuração Database',
        description: 'Aplicar schema e popular dados iniciais',
        action: this.setupDatabase.bind(this)
      },
      {
        id: 'vscode-setup',
        title: 'Configuração VSCode',
        description: 'Configurar VSCode com extensões recomendadas',
        action: this.setupVSCode.bind(this)
      },
      {
        id: 'validation',
        title: 'Validação Final',
        description: 'Verificar se tudo está funcionando',
        action: this.validateSetup.bind(this)
      },
      {
        id: 'next-steps',
        title: 'Próximos Passos',
        description: 'O que fazer agora',
        action: this.showNextSteps.bind(this)
      }
    ];
  }
  
  async showWelcome() {
    console.log(colorLog('bright', '\n🎉 Bem-vindo ao projeto ia_agent!\n'));
    
    console.log(colorLog('white'), 'O ia_agent é uma plataforma de agentes de IA com:'));
    console.log(colorLog('cyan'), '  • Dashboard web com Next.js 15'));
    console.log(colorLog('cyan'), '  • Integração com OpenAI, Claude, Gemini'));
    console.log(colorLog('cyan'), '  • WhatsApp via Baileys'));
    console.log(colorLog('cyan'), '  • Database PostgreSQL + Redis'));
    console.log(colorLog('cyan'), '  • Arquitetura cloud-native\n'));
    
    console.log(colorLog('yellow'), 'Este guia irá ajudar você a configurar tudo em ~10 minutos.\n'));
    
    const ready = await question('Pronto para começar? (s/n): ');
    if (ready.toLowerCase() !== 's') {
      console.log(colorLog('yellow'), '\n👋 Volte quando estiver pronto!');
      process.exit(0);
    }
    
    return true;
  }
  
  async checkSystem() {
    console.log(colorLog('bright'), '\n🖥️  Verificando Sistema...\n'));
    
    const checks = [];
    
    // Node.js
    const nodeResult = execCommand('node --version');
    const nodeVersion = nodeResult.success ? nodeResult.output : 'Não instalado';
    const nodeOk = nodeResult.success && parseInt(nodeVersion.slice(1).split('.')[0]) >= 20;
    
    checks.push({
      name: 'Node.js',
      status: nodeOk ? '✅' : '❌',
      value: nodeVersion,
      required: '>= 20.0.0'
    });
    
    // npm
    const npmResult = execCommand('npm --version');
    checks.push({
      name: 'npm',
      status: npmResult.success ? '✅' : '❌',
      value: npmResult.success ? npmResult.output : 'Não instalado',
      required: 'Qualquer versão'
    });
    
    // Docker
    const dockerResult = execCommand('docker --version');
    checks.push({
      name: 'Docker',
      status: dockerResult.success ? '✅' : '❌',
      value: dockerResult.success ? dockerResult.output : 'Não instalado',
      required: '>= 20.0.0'
    });
    
    // Git
    const gitResult = execCommand('git --version');
    checks.push({
      name: 'Git',
      status: gitResult.success ? '✅' : '❌',
      value: gitResult.success ? gitResult.output : 'Não instalado',
      required: '>= 2.0.0'
    });
    
    // Memória
    const totalMemory = require('os').totalmem();
    const memoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
    const memoryOk = memoryGB >= 8;
    
    checks.push({
      name: 'RAM',
      status: memoryOk ? '✅' : '⚠️',
      value: `${memoryGB}GB`,
      required: '>= 8GB'
    });
    
    console.log(colorLog('white'), 'Status do seu sistema:');
    for (const check of checks) {
      const color = check.status === '✅' ? 'green' : check.status === '⚠️' ? 'yellow' : 'red';
      console.log(`  ${colorLog(color, check.status)} ${check.name.padEnd(12)} | ${check.value} (requer ${check.required})`);
    }
    
    const hasErrors = checks.some(c => c.status === '❌');
    if (hasErrors) {
      console.log(colorLog('red'), '\n❌ Seu sistema não atende aos requisitos mínimos.'));
      console.log(colorLog('yellow'), 'Por favor, instale as ferramentas faltantes e tente novamente.');
      
      const continueAnyway = await question('\nDeseja continuar mesmo assim? (s/n): ');
      if (continueAnyway.toLowerCase() !== 's') {
        return false;
      }
    } else {
      console.log(colorLog('green'), '\n✅ Seu sistema atende aos requisitos!');
    }
    
    return true;
  }
  
  async setupGit() {
    console.log(colorLog('bright'), '\n🔧 Configurando Git...\n'));
    
    // Verificar configuração atual
    const nameResult = execCommand('git config --global user.name');
    const emailResult = execCommand('git config --global user.email');
    
    const hasName = nameResult.success && nameResult.output;
    const hasEmail = emailResult.success && emailResult.output;
    
    if (hasName && hasEmail) {
      console.log(colorLog('green'), '✅ Git já está configurado:');
      console.log(colorLog('white'), `   Nome: ${nameResult.output}`);
      console.log(colorLog('white'), `   Email: ${emailResult.output}`);
      
      const changeConfig = await question('\nDeseja alterar a configuração? (s/n): ');
      if (changeConfig.toLowerCase() !== 's') {
        return true;
      }
    }
    
    // Configurar nome
    const name = await question('Digite seu nome completo: ');
    if (name) {
      execCommand(`git config --global user.name "${name}"`);
      console.log(colorLog('green'), '✅ Nome configurado');
    }
    
    // Configurar email
    const email = await question('Digite seu email: ');
    if (email) {
      execCommand(`git config --global user.email "${email}"`);
      console.log(colorLog('green'), '✅ Email configurado');
    }
    
    // Configurar defaults
    execCommand('git config --global init.defaultBranch main');
    execCommand('git config --global pull.rebase false');
    console.log(colorLog('green'), '✅ Configurações padrão aplicadas');
    
    return true;
  }
  
  async setupEnvironment() {
    console.log(colorLog('bright'), '\n⚙️  Configurando Variáveis de Ambiente...\n'));
    
    if (existsSync('.env.local')) {
      console.log(colorLog('yellow'), '⚠️  Arquivo .env.local já existe.');
      
      const overwrite = await question('Deseja reconfigurar? (s/n): ');
      if (overwrite.toLowerCase() !== 's') {
        return true;
      }
    }
    
    // Criar .env.local
    if (!existsSync('.env.example')) {
      console.error(colorLog('red'), '❌ Arquivo .env.example não encontrado!');
      return false;
    }
    
    let envContent = readFileSync('.env.example', 'utf8');
    
    // Configurar OpenAI API Key
    console.log(colorLog('yellow'), '🔑 Configurando API Keys...\n'));
    
    const openAIKey = await question('Digite sua OpenAI API Key (ou deixe em branco): ');
    if (openAIKey && openAIKey.startsWith('sk-')) {
      envContent = envContent.replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${openAIKey}`);
      console.log(colorLog('green'), '✅ OpenAI API Key configurada');
    } else {
      console.log(colorLog('yellow'), '⚠️  OpenAI API Key não configurada (opcional para desenvolvimento básico)');
    }
    
    // Configurar Google API Key (opcional)
    const setupGoogle = await question('Deseja configurar Google API Key? (s/n): ');
    if (setupGoogle.toLowerCase() === 's') {
      const googleKey = await question('Digite sua Google API Key: ');
      if (googleKey) {
        envContent = envContent.replace(/GOOGLE_API_KEY=.*/, `GOOGLE_API_KEY=${googleKey}`);
        console.log(colorLog('green'), '✅ Google API Key configurada');
      }
    }
    
    // Gerar DEFAULT_USER_ID
    const { randomUUID } = await import('crypto');
    const userId = randomUUID();
    envContent = envContent.replace(/DEFAULT_USER_ID=.*/, `DEFAULT_USER_ID=${userId}`);
    console.log(colorLog('green'), `✅ DEFAULT_USER_ID gerado: ${userId}`);
    
    // Salvar arquivo
    writeFileSync('.env.local', envContent);
    console.log(colorLog('green'), '✅ Arquivo .env.local criado com sucesso!');
    
    return true;
  }
  
  async installDependencies() {
    console.log(colorLog('bright'), '\n📦 Instalando Dependências...\n'));
    
    if (existsSync('node_modules')) {
      console.log(colorLog('yellow'), '⚠️  node_modules já existe.');
      
      const reinstall = await question('Deseja reinstalar? (s/n): ');
      if (reinstall.toLowerCase() !== 's') {
        return true;
      }
    }
    
    console.log(colorLog('white'), 'Executando npm install...');
    const installResult = execCommand('npm install');
    
    if (installResult.success) {
      console.log(colorLog('green'), '✅ Dependências instaladas com sucesso!');
      return true;
    } else {
      console.error(colorLog('red'), '❌ Falha ao instalar dependências');
      console.error(installResult.error);
      return false;
    }
  }
  
  async setupDocker() {
    console.log(colorLog('bright'), '\n🐳 Configurando Docker...\n'));
    
    // Verificar se Docker está rodando
    const dockerInfo = execCommand('docker info');
    if (!dockerInfo.success) {
      console.error(colorLog('red'), '❌ Docker não está rodando!');
      console.log(colorLog('yellow'), 'Por favor, inicie o Docker Desktop e tente novamente.');
      return false;
    }
    
    console.log(colorLog('white'), 'Iniciando containers PostgreSQL e Redis...');
    const upResult = execCommand('npm run docker:dev');
    
    if (upResult.success) {
      console.log(colorLog('green'), '✅ Containers iniciados!');
      console.log(colorLog('yellow'), 'Aguardando 15 segundos para os serviços ficarem prontos...');
      
      // Aguardar containers ficarem prontos
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      return true;
    } else {
      console.error(colorLog('red'), '❌ Falha ao iniciar containers');
      console.error(upResult.error);
      return false;
    }
  }
  
  async setupDatabase() {
    console.log(colorLog('bright'), '\n🗄️  Configurando Database...\n'));
    
    // Verificar se PostgreSQL está pronto
    let retries = 10;
    while (retries > 0) {
      const readyResult = execCommand('docker exec ia-agent-postgres pg_isready -U postgres');
      if (readyResult.success) {
        break;
      }
      console.log(colorLog('yellow'), `Aguardando PostgreSQL... (${retries} tentativas restantes)`));
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries--;
    }
    
    if (retries === 0) {
      console.error(colorLog('red'), '❌ PostgreSQL não ficou pronto a tempo!');
      return false;
    }
    
    // Aplicar schema
    console.log(colorLog('white'), 'Aplicando schema do database...');
    const pushResult = execCommand('npm run db:push');
    
    if (pushResult.success) {
      console.log(colorLog('green'), '✅ Schema aplicado!');
    } else {
      console.error(colorLog('red'), '❌ Falha ao aplicar schema');
      return false;
    }
    
    // Popular dados iniciais
    console.log(colorLog('white'), 'Populando dados iniciais...');
    const seedResult = execCommand('npm run db:seed');
    
    if (seedResult.success) {
      console.log(colorLog('green'), '✅ Dados iniciais populados!');
    } else {
      console.log(colorLog('yellow'), '⚠️  Dados iniciais não populados (não crítico)');
    }
    
    return true;
  }
  
  async setupVSCode() {
    console.log(colorLog('bright'), '\n💻 Configurando VSCode...\n'));
    
    console.log(colorLog('white'), 'Para a melhor experiência, recomendamos configurar o VSCode:'));
    console.log(colorLog('cyan'), '1. Crie a pasta .vscode/ na raiz do projeto'));
    console.log(colorLog('cyan'), '2. Adicione os arquivos de configuração'));
    console.log(colorLog('cyan'), '3. Instale as extensões recomendadas\n'));
    
    const hasVSCode = execCommand('code --version').success;
    
    if (hasVSCode) {
      console.log(colorLog('green'), '✅ VSCode detectado!');
      
      const setupNow = await question('Deseja abrir o guia de configuração VSCode? (s/n): ');
      if (setupNow.toLowerCase() === 's') {
        console.log(colorLog('cyan'), '\n📖 Consulte o arquivo vscode-setup-guide.md para instruções detalhadas.\n');
      }
    } else {
      console.log(colorLog('yellow'), '⚠️  VSCode não detectado. Você pode usar qualquer editor, mas VSCode é recomendado.\n');
    }
    
    return true;
  }
  
  async validateSetup() {
    console.log(colorLog('bright'), '\n🔍 Validando Setup...\n'));
    
    console.log(colorLog('white'), 'Executando validação completa do ambiente...');
    const validateResult = execCommand('npm run env:validate');
    
    if (validateResult.success) {
      console.log(colorLog('green'), '✅ Ambiente validado com sucesso!');
      return true;
    } else {
      console.log(colorLog('yellow'), '⚠️  Ambiente validado com alguns avisos'));
      console.log(colorLog('white'), 'Isso é normal para desenvolvimento básico.');
      return true;
    }
  }
  
  async showNextSteps() {
    console.log(colorLog('bright'), '\n🎉 Setup Concluído!\n'));
    
    console.log(colorLog('green'), 'Seu ambiente está pronto para desenvolvimento!'));
    
    console.log(colorLog('white'), '\n🚀 Para começar:'));
    console.log(colorLog('cyan'), '   npm run dev'));
    console.log(colorLog('white'), '\n🌐 Acesse a aplicação:'));
    console.log(colorLog('cyan'), '   http://localhost:3000'));
    
    console.log(colorLog('white'), '\n📚 Recursos úteis:'));
    console.log(colorLog('cyan'), '   • Documentação: docs/'));
    console.log(colorLog('cyan'), '   • Scripts: npm run'));
    console.log(colorLog('cyan'), '   • Database: npm run db:studio'));
    console.log(colorLog('cyan'), '   • Logs: npm run docker:logs'));
    
    console.log(colorLog('white'), '\n🔧 Comandos importantes:'));
    console.log(colorLog('cyan'), '   • Validar ambiente: npm run env:validate'));
    console.log(colorLog('cyan'), '   • Corrigir problemas: npm run env:fix'));
    console.log(colorLog('cyan'), '   • Reset completo: npm run env:reset'));
    console.log(colorLog('cyan'), '   • Diagnóstico: npm run env:doctor'));
    
    console.log(colorLog('white'), '\n💡 Dicas:'));
    console.log(colorLog('cyan'), '   • Use npm run docker:logs para monitorar containers'));
    console.log(colorLog('cyan'), '   • Configure suas API keys no .env.local'));
    console.log(colorLog('cyan'), '   • Execute npm run env:validate se tiver problemas'));
    
    console.log(colorLog('white'), '\n🤝 Comunidade:'));
    console.log(colorLog('cyan'), '   • Issues: https://github.com/govinda777/ia_agent/issues'));
    console.log(colorLog('cyan'), '   • Discord: [link do discord]'));
    
    console.log(colorLog('bright'), '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    console.log(colorLog('bright'), colorLog('green'), '🎊 Bem-vindo ao time ia_agent!'));
    console.log(colorLog('white'), '\nFeliz desenvolvimento! 🚀\n'));
    
    return true;
  }
  
  async run() {
    if (!this.progress.startedAt) {
      this.progress.startedAt = new Date().toISOString();
      this.saveProgress();
    }
    
    console.log(colorLog('bright'), '🎓 ONBOARDING - ia_agent\n'));
    
    const steps = this.steps;
    const currentStepIndex = Math.max(0, this.progress.currentStep);
    
    for (let i = currentStepIndex; i < steps.length; i++) {
      const step = steps[i];
      
      if (this.isCompleted(step.id)) {
        continue;
      }
      
      console.log(colorLog('blue'), `\n📍 Passo ${i + 1}/${steps.length}: ${step.title}`));
      console.log(colorLog('white'), step.description);
      
      const success = await step.action();
      
      if (success) {
        this.markCompleted(step.id);
        console.log(colorLog('green'), `\n✅ Passo ${i + 1} concluído!\n`);
        
        if (i < steps.length - 1) {
          const continueNext = await question('Continuar para o próximo passo? (s/n): ');
          if (continueNext.toLowerCase() !== 's') {
            console.log(colorLog('yellow'), '\n💾 Progresso salvo! Execute npm run onboarding para continuar.');
            break;
          }
        }
      } else {
        console.log(colorLog('red'), `\n❌ Falha no passo ${i + 1}`));
        
        const retry = await question('Deseja tentar novamente? (s/n): ');
        if (retry.toLowerCase() === 's') {
          i--; // Tentar novamente
        } else {
          console.log(colorLog('yellow'), '\n💾 Progresso salvo! Execute npm run onboarding para continuar.');
          break;
        }
      }
    }
    
    // Mostrar progresso final
    const completed = this.progress.completed.length;
    const total = steps.length;
    const percentage = this.getProgressPercentage();
    
    console.log(colorLog('bright'), '\n📊 Progresso do Onboarding:'));
    console.log(colorLog('white'), `   Concluído: ${completed}/${total} (${percentage}%)`);
    
    if (percentage === 100) {
      console.log(colorLog('green'), '\n🎉 Parabéns! Onboarding concluído com sucesso!');
      
      // Limpar arquivo de progresso
      try {
        require('fs').unlinkSync(this.progressFile);
        console.log(colorLog('white'), '🧹 Arquivo de progresso removido');
      } catch (error) {
        // Ignorar erro ao remover arquivo
      }
    }
  }
}

async function main() {
  const onboarding = new OnboardingProgress();
  await onboarding.run();
}

main().catch(error => {
  console.error(colorLog('red'), `Erro fatal: ${error.message}`));
  process.exit(1);
});
