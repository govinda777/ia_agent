# AI Agent

A platform for automating customer service on WhatsApp with configurable AI agents.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **AI Engine:** Vercel AI SDK Core + OpenAI
- **Database:** PostgreSQL + Drizzle ORM
- **Local Development:** Docker + PostgreSQL
- **Deployment:** Vercel
- **UI Library:** Shadcn UI
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React

## 📁 Project Structure

```
/src
├── /app                    # Next.js App Router
│   ├── /dashboard          # Protected dashboard
│   └── /api                # API Routes
├── /components
│   ├── /ui                 # Shadcn primitives
│   ├── /layout             # Sidebar, Header
│   └── /features           # Feature-specific components
├── /lib
│   ├── /ai                 # Vercel AI SDK config
│   ├── /agents             # Agent orchestration
│   ├── /actions            # Server Actions
│   ├── /integrations       # External API integrations
│   └── /utils              # Utility functions
├── /db
│   └── /schema.ts          # Database schema
├── /stores
│   └── *.ts                # Zustand stores
├── /types
│   └── index.ts            # Global TypeScript types
└── /config
    └── constants.ts        # Application constants
```

## 🚀 Setup Automatizado (Recomendado)

### Setup completo com um comando:

```bash
npm run setup:local
```

Este script automatizado:
- ✅ Verifica pré-requisitos (Node.js, npm)
- ✅ Instala dependências automaticamente
- ✅ Cria arquivos de configuração (.env.local, .env.example)
- ✅ Configura Docker para banco local (opcional)
- ✅ Adiciona scripts úteis ao package.json
- ✅ Funciona em Windows, macOS e Linux

### Comandos disponíveis após setup:

```bash
# Iniciar banco local com Docker
npm run docker:dev

# Parar containers Docker
npm run docker:down

# Ver logs do Docker
npm run docker:logs

# Reset completo do banco
npm run db:reset
```

---

## 🛠️ Local Setup

### 1. Clone repository

```bash
git clone git@github.com:drtrafego/ia_agent.git
cd ia_agent
```

### 2. Install dependencies

```bash
npm install
```

> **Note**: This project uses Husky for git hooks. If you encounter `husky: command not found` errors during installation, see the [Husky Setup](#husky-setup) section below.

---

## 🚀 Como Subir a Aplicação

### Setup Rápido (Banco Local)

```bash
# 1. Clonar e instalar
git clone git@github.com:drtrafego/ia_agent.git
cd ia_agent
npm install

# 2. Configurar ambiente
cp .env.example .env.local
# Edite .env.local com sua OPENAI_API_KEY

# 3. Setup do banco local
npm run setup:db

# 4. Criar tabelas
npm run db:push

# 5. Criar usuário padrão
node create-default-user.mjs

# 6. Iniciar aplicação
npm run dev
```

Acesse: http://localhost:3000

---

### Setup Manual Detalhado

#### 1. Instalar Dependências
```bash
npm install
```

#### 2. Configurar Variáveis de Ambiente
Crie `.env.local`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ia_agent_dev
OPENAI_API_KEY=sk-proj-sua-chave-aqui
DEFAULT_USER_ID=
NEXTAUTH_URL=http://localhost:3000
```

#### 3. Configurar Banco de Dados Local

**Opção A: Docker (Recomendado)**
```bash
# Iniciar PostgreSQL + Redis
npm run docker:dev

# Verificar se está rodando
npm run docker:logs
```

**Opção B: PostgreSQL Nativo**
```bash
# Instalar PostgreSQL se não tiver
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Criar banco
createdb ia_agent_dev

# Usar URL: postgresql://postgres:senha@localhost:5432/ia_agent_dev
```

#### 4. Criar Tabelas
```bash
npm run db:push
```

#### 5. Criar Usuário Padrão
```bash
node create-default-user.mjs
# Copie o ID retornado para .env.local
```

#### 6. Iniciar Aplicação
```bash
npm run dev
```

---

## 🛠️ Comandos Úteis

### Banco de Dados Local
```bash
npm run setup:db      # Setup automático do banco
npm run docker:dev    # Iniciar PostgreSQL + Redis
npm run docker:down   # Parar containers
npm run docker:logs   # Ver logs
npm run db:push       # Criar tabelas
npm run db:studio     # Interface visual
npm run db:reset      # Reset completo
```

### Desenvolvimento
```bash
npm run dev           # Servidor desenvolvimento
npm run build         # Build produção
npm run start         # Servidor produção
npm run lint          # Verificar código
```

---

## 🌐 Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "your message"
git push origin main
```

### 2. Connect to Vercel

1. Go to: https://vercel.com/new
2. Select the `ia_agent` repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave blank)
   - **Build Command**: `next build`

### 3. Add Environment Variables

In **Environment Variables**, add:

| Name | Value | Where to get |
|------|-------|------------|
| `DATABASE_URL` | `postgresql://...` | [Neon Console](https://console.neon.tech) |
| `OPENAI_API_KEY` | `sk-proj-...` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `DEFAULT_USER_ID` | `uuid-...` | Run the SQL above in Neon |
| `GOOGLE_CLIENT_ID` | *(optional)* | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | *(optional)* | Google Cloud Console |

### 4. Deploy

Click **Deploy** and wait for the build to complete.

### 5. Create Tables in Database (First time)

After the first deploy, run locally:

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
```

Or run the SQL manually in the Neon Console.

## 📊 Database

### Table Structure

#### `agents`
Configuration of AI agents
- `id`, `name`, `description`, `system_prompt`
- `model_config` (JSON: model, temperature, etc.)
- `user_id` (linked to the creator user)

#### `threads`
Chat conversations/sessions
- `id`, `agent_id`, `user_id`
- `created_at`, `updated_at`

#### `messages`
Conversation messages
- `id`, `thread_id`, `role` (user/assistant)
- `content`, `created_at`

#### `users`
System users
- `id`, `name`, `email`

### Manage Database

```bash
# View data (visual interface)
npm run db:studio

# Generate new migrations
npm run db:generate

# Apply migrations
npm run db:push
```

## 🔧 Available Scripts

| Script | Description |
|--------|-----------|
| `npm run dev` | Development (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Apply migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (GUI) |

## 🐕 Husky Setup

This project uses Husky for git hooks to ensure code quality. If you encounter `husky: command not found` errors during `npm install`, follow these steps:

### Prerequisites
- Node.js >= 16.17.0
- Git initialized repository

### Installation Steps

```bash
# 1. Install Husky and lint-staged (if not already installed)
npm install --save-dev husky@^8.0.3 lint-staged

# 2. Initialize Husky
npx husky install

# 3. Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# 4. Make the hook executable (Linux/Mac/WSL)
chmod +x .husky/pre-commit

# 5. Test the setup
npm run prepare
```

### Windows Environment Setup

For Windows users, the pre-commit hook needs special configuration:

```bash
# 1. After npx husky install, create the pre-commit file manually
echo "#!/usr/bin/env sh" > .husky/pre-commit
echo ". \"$(dirname \"$0\")/_/husky.sh\"" >> .husky/pre-commit
echo "" >> .husky/pre-commit
echo "npx lint-staged" >> .husky/pre-commit

# 2. Set executable permissions using Git
git update-index --chmod=+x .husky/pre-commit

# 3. Add and commit the hook
git add .husky/pre-commit
git commit -m "Configure Husky pre-commit hook" --no-verify
```

### Verification
After setup, verify:
- `.husky/pre-commit` file exists with `npx lint-staged` content
- `npm install` runs without errors
- Git commits automatically run linting

### Troubleshooting Husky

**Error**: `husky: command not found`
- **Cause**: Husky not installed or incompatible Node.js version
- **Solution**: Install compatible version: `npm install --save-dev husky@^8.0.3`

**Error**: `husky - install command is DEPRECATED`
- **Cause**: Using Husky v9+ with old syntax
- **Solution**: Use `npx husky init` for v9+ or downgrade to v8.0.3

**Error**: `cannot spawn .husky/pre-commit: No such file or directory`
- **Cause**: Hook file not executable or incorrect permissions
- **Solution**: Run `git update-index --chmod=+x .husky/pre-commit`

**Error**: Permission denied on `.husky/pre-commit`
- **Cause**: Hook file not executable
- **Solution**: Run `chmod +x .husky/pre-commit` (Linux/Mac) or `git update-index --chmod=+x .husky/pre-commit` (Windows)

**Error**: Pre-commit hook not working on Windows
- **Cause**: WSL-specific logic or incorrect shebang
- **Solution**: Use the simplified hook configuration shown in Windows Environment Setup

## 🐛 Troubleshooting

### Error: `relation "agents" does not exist`
**Cause**: Tables were not created in the database.
**Solution**: Run `npx drizzle-kit push` (see "Database Setup" section)

### Error: `user_id violates not-null constraint`
**Cause**: `DEFAULT_USER_ID` variable is not configured.
**Solution**: Create a default user in the database and add the ID to `.env.local` / Vercel

### Error: `DATABASE_URL is not defined`
**Cause**: `.env.local` file does not exist or is misconfigured.
**Solution**: Create the file with the necessary variables (see "Local Setup" section)

### Push to GitHub blocked (GH013)
**Cause**: GitHub detected secrets (credentials) in the code.
**Solution**:
- Never commit `.env.local` or files with real credentials
- Use `.env.example` with placeholders only
- Make sure `.gitignore` includes `.env.local`

## 🔐 Security

- ✅ All credentials in environment variables
- ✅ `.env.local` in `.gitignore`
- ✅ Never commit secrets in the code
- ✅ Use `.env.example` with example values only

## 📝 License

Proprietary - Traffic Couple © 2024-2025
