# IA Agent

Plataforma de automação de atendimento via WhatsApp com agentes de IA configuráveis.

## 🚀 Stack Tecnológica

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript (Strict Mode)
- **AI Engine:** Vercel AI SDK Core
- **Database:** Neon (Serverless Postgres) + Drizzle ORM
- **UI Library:** Shadcn UI
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React

## 📁 Estrutura do Projeto

```
/src
├── /app                    # Next.js App Router
│   ├── /dashboard          # Painel protegido
│   └── /api                # API Routes (webhooks)
├── /components
│   ├── /ui                 # Shadcn primitives
│   ├── /layout             # Sidebar, Header
│   └── /features           # Componentes por funcionalidade
├── /lib
│   ├── /ai                 # Vercel AI SDK config
│   ├── /db                 # Drizzle Client
│   └── utils.ts            # Helpers
├── /server
│   ├── /actions            # Server Actions
│   ├── /services           # Integrações externas
│   └── /queries            # Database queries
├── /db
│   └── schema.ts           # Drizzle Schema
└── /docs
    ├── ARCHITECTURE.md     # Documentação de arquitetura
    └── ENV_TEMPLATE.md     # Template de variáveis
```

## 🛠️ Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o template de `src/docs/ENV_TEMPLATE.md` para `.env.local` e preencha os valores.

### 3. Configurar banco de dados

```bash
# Gerar migrações
npm run db:generate

# Aplicar migrações
npm run db:push

# Visualizar banco (opcional)
npm run db:studio
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📖 Documentação

- [Arquitetura do Sistema](/src/docs/ARCHITECTURE.md)
- [Template de Variáveis](/src/docs/ENV_TEMPLATE.md)

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Builda para produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Executa ESLint |
| `npm run db:generate` | Gera migrações do Drizzle |
| `npm run db:push` | Aplica migrações no banco |
| `npm run db:studio` | Abre Drizzle Studio |

## 📝 License

Proprietary - Casal do Tráfego © 2024
