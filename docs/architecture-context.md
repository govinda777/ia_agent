# C4 Context Diagram - ia_agent

```mermaid
graph TB
    subgraph "External Systems"
        WA[WhatsApp Network]
        USER[End Users]
        ADMIN[Administrators]
        AI_PROVIDERS[AI Providers]
        GOOGLE[Google Services]
    end

    subgraph "ia_agent System"
        NEXTJS[Next.js Application]
        BAILEYS[Baileys WhatsApp Service]
        NEON[Neon PostgreSQL]
        REDIS[Upstash Redis]
    end

    subgraph "Infrastructure"
        VERCEL[Vercel Platform]
        RAILWAY[Railway Platform]
    end

    USER -->|WhatsApp Messages| WA
    WA -->|Webhooks| BAILEYS
    BAILEYS -->|API Calls| NEXTJS
    NEXTJS -->|AI Requests| AI_PROVIDERS
    NEXTJS -->|Calendar/Sheets| GOOGLE
    ADMIN -->|Dashboard| NEXTJS
    
    NEXTJS -.->|Hosted on| VERCEL
    BAILEYS -.->|Hosted on| RAILWAY
    NEXTJS -->|Queries| NEON
    NEXTJS -->|Cache| REDIS
    BAILEYS -->|Cache| REDIS
```

## System Interactions

### Primary Flow
1. **User sends WhatsApp message** → WhatsApp Network
2. **WhatsApp webhook** → Baileys Service (Railway)
3. **Baileys processes** → HTTP API to Next.js (Vercel)
4. **Next.js processes** → AI Provider + Database + Redis
5. **Response flows back** through same path

### Admin Flow
1. **Admin accesses dashboard** → Next.js (Vercel)
2. **Configuration changes** → Neon Database
3. **Real-time updates** → WebSocket/Redis

## Key Design Decisions

- **Stateless Frontend**: Next.js on Vercel (serverless)
- **Stateful WhatsApp Service**: Baileys on Railway (persistent container)
- **Serverless Database**: Neon (branching, scaling)
- **Serverless Cache**: Upstash Redis (edge, pay-per-use)
