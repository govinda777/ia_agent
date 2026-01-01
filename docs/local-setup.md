# Setup do Ambiente Local - ia_agent

Guia completo para configurar o ambiente de desenvolvimento do projeto ia_agent.

## 📋 Pré-requisitos

### Sistema Operacional
- **Windows 10/11** (com WSL2 recomendado)
- **macOS 10.15+** (Catalina ou superior)
- **Ubuntu 20.04+** ou distribuição Linux equivalente

### Hardware Mínimo
- **RAM**: 8GB (16GB recomendado)
- **Disco**: 10GB livres (SSD recomendado)
- **CPU**: 2+ cores
- **Internet**: Conexão estável

### Software Obrigatório

#### Node.js
```bash
# Instalar via nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Ou baixar direto de https://nodejs.org
```

#### Docker Desktop
- **Windows**: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- **macOS**: [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

#### Git
```bash
# Windows: Baixar de https://git-scm.com
# macOS: brew install git
# Ubuntu: sudo apt-get install git
```

#### VSCode (Opcional mas recomendado)
- Download: [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Extensões necessárias serão configuradas automaticamente

---

## 🚀 Setup Rápido (5 minutos)

### 1. Clonar o Repositório
```bash
git clone https://github.com/govinda777/ia_agent.git
cd ia_agent
```

### 2. Setup Automatizado
```bash
npm run env:setup
```

O script interativo irá:
- ✅ Detectar o que já está configurado
- ✅ Perguntar o que precisa ser feito
- ✅ Configurar tudo automaticamente
- ✅ Validar o ambiente ao final

### 3. Iniciar Desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🔧 Setup Manual (Detalhado)

### Passo 1: Variáveis de Ambiente

#### Criar .env.local
```bash
cp .env.example .env.local
```

#### Configurar variáveis obrigatórias
```bash
# Edite o arquivo .env.local
nano .env.local  # ou use seu editor preferido
```

**Variáveis obrigatórias:**
```env
# Database (já configurado para Docker local)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ia_agent_dev

# OpenAI API Key (necessária para IA)
OPENAI_API_KEY=sk-sua-chave-aqui

# ID do usuário padrão (já vem com UUID)
DEFAULT_USER_ID=uuid-gerado-automaticamente

# URL do NextAuth
NEXTAUTH_URL=http://localhost:3000
```

**Variáveis opcionais:**
```env
# Google APIs (para Calendar/Sheets)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REFRESH_TOKEN=seu-refresh-token

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-sua-chave

# Google AI (Gemini)
GOOGLE_API_KEY=sua-chave-google
```

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Iniciar Infraestrutura Docker
```bash
npm run docker:dev
```

Isso irá iniciar:
- PostgreSQL 15 na porta 5432
- Redis 7 na porta 6379

### Passo 4: Configurar Database
```bash
npm run db:push
```

Isso irá criar todas as tabelas necessárias.

### Passo 5: Popular Dados Iniciais
```bash
npm run setup:db
```

Isso irá criar:
- Usuário padrão
- Agente de exemplo
- Dados de teste

### Passo 6: Iniciar Aplicação
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 🛠️ Scripts Disponíveis

### Validação e Diagnóstico
```bash
npm run env:validate          # Validar ambiente completo
npm run env:validate:fix       # Validar e tentar corrigir
npm run env:doctor            # Diagnóstico detalhado
npm run env:info              # Informações do ambiente
```

### Setup e Correção
```bash
npm run env:setup             # Setup interativo completo
npm run env:fix               # Corrigir problemas automáticos
npm run env:clean              # Limpar tudo
npm run env:reset              # Reset para estado inicial
```

### Docker e Database
```bash
npm run docker:dev            # Iniciar containers
npm run docker:down           # Parar containers
npm run docker:logs           # Ver logs
npm run docker:health         # Status dos serviços
npm run docker:clean          # Limpar volumes
npm run docker:db:shell       # Acesso PostgreSQL
npm run docker:redis:cli      # Acesso Redis CLI
```

### Database
```bash
npm run db:push              # Aplicar schema
npm run db:studio            # Interface gráfica
npm run db:reset              # Reset completo
npm run db:stats             # Estatísticas detalhadas
```

### Desenvolvimento
```bash
npm run dev                  # Iniciar Next.js
npm run build                # Build para produção
npm run start                 # Iniciar produção
npm run lint                  # Verificar código
npm run test                  # Rodar testes
```

### WhatsApp Service (quando implementado)
```bash
npm run whatsapp:dev          # Rodar serviço local
npm run whatsapp:deploy       # Deploy produção
npm run whatsapp:logs         # Logs produção
```

---

## 📊 Verificação de Saúde

### Validação Completa
```bash
npm run env:validate
```

**Output esperado:**
```
🔍 Validando Ambiente de Desenvolvimento...

✅ Sistema Operacional
   ✓ Linux (Ubuntu 22.04)
   ✓ Arquitetura: x64
   ✓ RAM: 16GB disponível
   ✓ Disco: 45GB livre

✅ Ferramentas
   ✓ Node.js v20.11.0
   ✓ npm v10.2.4
   ✓ Docker v25.0.0
   ✓ Docker Compose v2.24.0

✅ Configuração
   ✓ .env.local existe
   ✓ Variáveis configuradas

✅ Docker
   ✓ Daemon rodando
   ✓ Permissões OK

✅ Database
   ✓ PostgreSQL rodando
   ✓ Schema aplicado

✅ Redis
   ✓ Redis rodando
   ✓ Conectividade OK

✅ Build e Lint
   ✓ TypeScript compilado
   ✓ ESLint sem erros

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ AMBIENTE ESTÁ PERFEITO!

Você já pode começar a desenvolver:
$ npm run dev
```

---

## 🔧 Troubleshooting

### Problema: Porta 3000 em uso
**Erro:** `Error: listen EADDRINUSE :::3000`

**Soluções:**
```bash
# Opção 1: Matar processo
npm run env:fix

# Opção 2: Manual
lsof -ti:3000 | xargs kill -9

# Opção 3: Mudar porta
PORT=3001 npm run dev
```

### Problema: Docker não inicia
**Erro:** `Cannot connect to the Docker daemon`

**Soluções:**
```bash
# Windows/Mac
# 1. Verifique se Docker Desktop está rodando
# 2. Reinicie Docker Desktop
# 3. Verifique permissões

# Linux
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

### Problema: PostgreSQL não conecta
**Erro:** `connection refused` ou `timeout`

**Soluções:**
```bash
# Verificar se container está rodando
docker ps | grep postgres

# Verificar logs
npm run docker:logs

# Reiniciar containers
npm run docker:down
npm run docker:dev

# Verificar se porta está livre
netstat -tuln | grep 5432
```

### Problema: node_modules corrompido
**Erro:** `MODULE_NOT_FOUND` ou erros estranhos

**Soluções:**
```bash
# Limpar e reinstalar
npm run env:clean
npm install

# Ou manualmente
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problema: Permissões no Windows
**Erro**: `Permission denied` ou `EPERM`

**Soluções:**
```bash
# Executar como Administrador
# Ou usar WSL2
wsl --install

# Ou configurar permissões
# 1. Abrir PowerShell como Administrador
# 2. Executar: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Variáveis de ambiente não funcionam
**Erro**: `DATABASE_URL is not defined`

**Soluções:**
```bash
# Verificar se arquivo existe
ls -la .env.local

# Verificar conteúdo
cat .env.local

# Verificar se está no .gitignore
cat .gitignore | grep .env.local

# Recriar arquivo
cp .env.example .env.local
# Edite novamente
```

### Problema: Build falha
**Erro**: Erros de TypeScript ou ESLint

**Soluções:**
```bash
# Verificar TypeScript
npx tsc --noEmit

# Verificar ESLint
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Se persistir, limpar cache
rm -rf .next
npm run build
```

---

## 📱 VSCode Configuration

### Extensões Recomendadas
As extensões serão sugeridas automaticamente ao abrir o projeto, mas instale manualmente se necessário:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-vscode.vscode-typescript-next
```

### Configurações Automáticas
O projeto inclui configurações VSCode em `.vscode/`:
- Formatação automática ao salvar
- Integração com ESLint
- Configurações do TypeScript
- Debug configuration

---

## 🔄 Fluxo de Trabalho Recomendado

### Diário
```bash
# 1. Validar ambiente (se houver problemas)
npm run env:validate

# 2. Iniciar infraestrutura
npm run docker:dev

# 3. Iniciar desenvolvimento
npm run dev

# 4. Em outro terminal, monitorar logs
npm run docker:logs
```

### Semanal
```bash
# Limpar caches e otimizar
npm run env:clean
npm install
npm run docker:dev
```

### Ao atualizar repositório
```bash
git pull main
npm install  # Atualizar dependências
npm run env:validate  # Verificar se tudo OK
```

---

## 📚 Recursos Adicionais

### Documentação
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Docker Docs](https://docs.docker.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Comunidade
- [Discord do Projeto](https://discord.gg/ia-agent)
- [GitHub Discussions](https://github.com/govinda777/ia_agent/discussions)
- [Issues e Bugs](https://github.com/govinda777/ia_agent/issues)

### Tutoriais em Vídeo
- [Setup Windows](https://youtu.be/link-windows)
- [Setup macOS](https://youtu.be/link-macos)
- [Setup Linux](https://youtu.be/link-linux)

---

## ❓ Perguntas Frequentes

### Q: Preciso de uma API key real da OpenAI?
**A:** Para desenvolvimento básico não, mas para testar funcionalidades de IA sim. Você pode obter uma em [platform.openai.com](https://platform.openai.com/).

### Q: Posso usar outro database além do PostgreSQL?
**A:** O projeto está otimizado para PostgreSQL. Mudar requer modificações significativas no ORM e configurações.

### Q: Por que Docker é obrigatório?
**A:** Docker garante ambiente consistente entre diferentes máquinas. É possível rodar sem Docker, mas requer setup manual do PostgreSQL e Redis.

### Q: Quanta RAM o projeto consome?
**A:** Em desenvolvimento:
- Next.js: ~200-500MB
- PostgreSQL: ~100-200MB
- Redis: ~50-100MB
- Total: ~500MB-1GB mínimo recomendado

### Q: Posso desenvolver sem o WhatsApp?
**A:** Sim! O WhatsApp é um módulo opcional. Você pode desenvolver o dashboard, agentes, e outras funcionalidades sem ele.

### Q: Como faço backup dos meus dados?
**A:** Os dados estão nos volumes Docker. Para backup:
```bash
# Backup PostgreSQL
docker exec ia-agent-postgres pg_dump -U postgres ia_agent_dev > backup.sql

# Backup Redis
docker exec ia-agent-redis redis-cli BGSAVE
docker cp ia-agent-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## 🆘 Suporte

Se você encountering problemas após seguir este guia:

1. **Execute o diagnóstico completo:**
   ```bash
   npm run env:doctor
   ```

2. **Tente a correção automática:**
   ```bash
   npm run env:fix
   ```

3. **Limpe e resete se necessário:**
   ```bash
   npm run env:reset
   ```

4. **Abra uma issue no GitHub:**
   - Descreva seu SO e versão
   - Inclua o output de `npm run env:doctor`
   - Descreva o passo a passo do problema

5. **Contate a equipe:**
   - Discord: [link do discord]
   - Email: support@ia-agent.com

---

## ✅ Checklist Final

Antes de começar a desenvolver, certifique-se de:

- [ ] Node.js 20+ instalado
- [ ] Docker Desktop rodando
- [ ] Repositório clonado
- [ ] .env.local configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Containers Docker rodando (`npm run docker:dev`)
- [ ] Schema aplicado (`npm run db:push`)
- [ ] Dados iniciais populados (`npm run setup:db`)
- [ ] Aplicação iniciando (`npm run dev`)
- [ ] Acessando http://localhost:3000
- [ ] Validação passando (`npm run env:validate`)

Se todos os itens estão marcados, seu ambiente está pronto! 🚀
