# 📋 Documentação de Arquitetura - ia_agent

Bem-vindo à documentação completa de arquitetura do projeto **ia_agent**. Esta seção contém todos os documentos de planejamento, design e implementação da arquitetura cloud-native.

## 📚 Índice de Documentos

### 🏗️ Arquitetura Core
- **[Context Diagram](./architecture-context.md)** - Visão geral do sistema e integrações
- **[Container Diagram](./architecture-containers.md)** - Detalhamento dos containers e responsabilidades
- **[WhatsApp Service Architecture](./whatsapp-service-architecture.md)** - Design do microserviço WhatsApp

### 📊 Monitoramento & Observabilidade
- **[Monitoring & Observability Stack](./monitoring-observability.md)** - Stack completo de monitoramento
- **[CI/CD Pipeline](../.github/workflows/ci-improved.yml)** - Pipeline automatizado melhorado

### 🛣️ Implementação
- **[Implementation Roadmap](./implementation-roadmap.md)** - Roadmap completo com Sprints e deliverables

### 🛠️ Scripts & Automação
- **[Metrics Collection](../scripts/collect-metrics.js)** - Script para coletar métricas do sistema
- **[Database Stats](../scripts/db-stats.js)** - Estatísticas detalhadas do PostgreSQL
- **[Redis Stats](../scripts/redis-stats.js)** - Estatísticas detalhadas do Redis

---

## 🎯 Resumo Executivo

O **ia_agent** está evoluindo de uma arquitetura monolítica local para uma arquitetura cloud-native escalável:

### Arquitetura Atual
```
┌─────────────────────────────────────┐
│ Docker Compose (Local)              │
│ ├── Next.js + Baileys (monolito)   │
│ ├── PostgreSQL 15                   │
│ └── Redis 7                         │
└─────────────────────────────────────┘
```

### Arquitetura Futura
```
┌─────────────────┐    ┌──────────────────────┐
│ Vercel (Serverless) │  │ Railway (Persistent)  │
│   Next.js App      │  │   Baileys Service     │
└─────────┬───────────┘  └─────────┬────────────┘
          │                       │
          ▼                       ▼
┌─────────────────┐    ┌──────────────────────┐
│ Neon (PostgreSQL) │  │ Upstash (Redis)      │
└─────────────────┘    └──────────────────────┘
```

---

## 🚀 Stack Tecnológico

### Frontend & Backend
- **Next.js 15** - Framework full-stack com App Router
- **TypeScript** - Type safety e melhor DX
- **Tailwind CSS + Shadcn UI** - UI moderna e responsiva

### Database & Cache
- **Neon PostgreSQL** - Database serverless com branching
- **Upstash Redis** - Cache serverless edge-optimized
- **Drizzle ORM** - Type-safe SQL com excelente DX

### AI & WhatsApp
- **Vercel AI SDK** - Integração unificada com múltiplos providers
- **@whiskeysockets/baileys** - Conexão WhatsApp não-oficial
- **OpenAI + Anthropic + Google** - Múltiplos modelos de IA

### Infraestrutura
- **Vercel** - Hosting serverless para Next.js
- **Railway** - Container persistente para WhatsApp
- **GitHub Actions** - CI/CD automatizado

### Monitoramento
- **Sentry** - Error tracking e performance
- **Better Stack** - Uptime monitoring
- **Vercel Analytics** - Web vitals e analytics

---

## 📋 Scripts Disponíveis

### Docker & Infraestrutura Local
```bash
npm run docker:dev          # Iniciar containers
npm run docker:down         # Parar containers
npm run docker:health       # Status dos serviços
npm run docker:clean        # Limpar volumes
npm run docker:db:shell     # Acesso PostgreSQL
npm run docker:redis:cli    # Acesso Redis CLI
```

### Database
```bash
npm run db:push             # Aplicar schema
npm run db:studio           # Drizzle Studio
npm run db:reset            # Reset completo
npm run db:stats            # Estatísticas detalhadas
```

### Desenvolvimento
```bash
npm run dev:full            # Iniciar tudo (docker + next)
npm run health:check        # Verificar health
npm run metrics:collect     # Coletar métricas
```

### WhatsApp Service
```bash
npm run whatsapp:dev        # Rodar serviço local
npm run whatsapp:deploy     # Deploy Railway
npm run whatsapp:logs       # Logs em produção
```

### Infraestrutura como Código
```bash
npm run infra:init          # Setup inicial
npm run infra:plan          # Preview changes
npm run infra:apply:staging # Apply staging
npm run infra:apply:prod    # Apply produção
```

---

## 💰 Custos Estimados

### Desenvolvimento (Free Tier)
- **Vercel**: $0/mês
- **Neon**: $0/mês
- **Upstash**: $0/mês
- **Railway**: $0/mês
- **Total**: **$0/mês**

### Produção (Scale)
- **Vercel Pro**: $20/mês
- **Neon Scale**: $25/mês
- **Upstash Pro**: $5/mês
- **Railway Hobby**: $10/mês
- **Sentry Team**: $80/mês
- **Better Stack**: $12/mês
- **Total**: **$152/mês**

---

## 🎯 Próximos Passos

1. **Revisar Arquitetura**: Ler todos os documentos de design
2. **Aprovar Roadmap**: Validar timeline e budget
3. **Setup Contas**: Criar contas nos serviços cloud
4. **Iniciar Sprint 1**: Migrar infraestrutura core
5. **Monitorar Progresso**: Reuniões semanais de review

---

## 📞 Suporte

### Documentação Adicional
- [Next.js Docs](https://nextjs.org/docs)
- [Neon Docs](https://neon.tech/docs)
- [Upstash Docs](https://docs.upstash.com)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)

### Comunidade
- [Discord Vercel](https://vercel.com/discord)
- [Neon Community](https://neon.tech/community)
- [GitHub Discussions](https://github.com/govinda777/ia_agent/discussions)

---

## 🏆 Conclusão

Esta documentação fornece uma visão completa da arquitetura do ia_agent, desde o design inicial até a implementação production-ready. A abordagem cloud-native garante escalabilidade, performance e baixo custo operacional.

**O futuro do ia_agent é serverless, escalável e production-ready!** 🚀
