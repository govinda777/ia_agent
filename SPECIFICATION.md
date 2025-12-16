# PRODUCT SPECIFICATION: NEXUS AGENT (ZAIA REPLICA)

## 1. VISÃO GERAL
Plataforma SaaS para construção de "Agentes de IA Baseados em Estágios".
Referência Visual e Funcional: Plataforma "Zaia".
Objetivo: Permitir que usuários configurem fluxos de conversa complexos (Coleta de dados -> Diagnóstico -> Agendamento) sem código.

## 2. ARQUITETURA TÉCNICA
- **Frontend:** Next.js 15 (App Router), Shadcn UI, Tailwind CSS 4, Lucide React.
- **Backend:** Next.js Server Actions.
- **AI/LLM:** Vercel AI SDK Core (`generateText` + `tool-calling`).
- **Database:** Neon (Postgres) + Drizzle ORM.
- **Validation:** Zod + React Hook Form.

## 3. DESIGN SYSTEM & UI (REF: PRINTS ZAIA)
- **Tema:** Light Mode Clean (Slate/Zinc). Nada de "Dark Mode Hacker".
- **Estrutura de Tela (Dashboard do Agente):**
  - **Coluna 1 (Sidebar):** Menu Icons (Estágios, Cérebro, Visual, Integrações).
  - **Coluna 2 (Main Canvas):**
    - Lista de Estágios (Cards empilhados verticalmente).
    - Ao clicar num estágio, abre-se o formulário de edição (ex: Inputs de Configuração).
  - **Coluna 3 (Inspector/Preview):**
    - Topo: Chat funcional.
    - Base/Aba: "Inspecionar" (Mostra JSON de variáveis: `data.nome`, `current_stage`).

## 4. MODELAGEM DE DADOS (CRÍTICO)

### Tabela: `agents`
- `workflow_config` (JSONB): Armazena a árvore de decisão.
  - Estrutura obrigatória do JSON de Estágio:
    ```json
    {
      "id": "uuid",
      "type": "schedule_google",
      "name": "Agendar Reunião",
      "conditions": "Se o usuário aceitar o horário",
      "config": {
        "calendar_id": "email@example.com",
        "duration_minutes": 30,
        "search_window_days": 5,
        "allow_overlap": false,
        "prompt_adjustment": "Priorize manhã"
      }
    }
    ```

### Tabela: `sessions`
- `variables` (JSONB): Armazena o estado da conversa.
  - Ex: `{"data.nome": "Thiago", "data.email": "thiago@zara.app"}`.
- `current_stage_id`: ID do estágio onde o usuário está preso.

## 5. REGRAS DE NEGÓCIO (REF: TRANSCRIÇÕES)

### A. Integração Google Calendar (Granularidade)
O sistema NÃO deve apenas "conectar". Deve permitir configurar no UI:
1.  **Duração:** Select (15m, 30m, 1h).
2.  **Janela de Busca:** Input (ex: "Próximos 5 dias").
3.  **Prompt de Ajuste:** Textarea (ex: "Mostre apenas horários da tarde").
4.  **Ação:** Switch entre "Listar Horários Livres" (FreeBusy) e "Criar Evento" (Insert).

### B. Lógica de "Gatilho de Estágio"
- O Agente só avança de estágio se as `required_variables` daquele estágio estiverem preenchidas na sessão.
- Se faltar variável (ex: email), o Agente deve perguntar ativamente antes de chamar a tool.

### C. Painel de Debug "Inspecionar"
- Deve replicar a funcionalidade da Zaia de mostrar:
  - "Variáveis preenchidas anteriormente"
  - "Estágio selecionado"
  - "Retorno do Cérebro"

---

## 6. STATUS DA IMPLEMENTAÇÃO ATUAL

### ✅ JÁ IMPLEMENTADO

| Componente | Arquivo | Status |
|------------|---------|--------|
| Schema Drizzle | `src/db/schema.ts` | ✅ Completo com `workflow_config`, `sessions`, `StageConfig` |
| State Machine | `src/lib/engine/state-machine.ts` | ✅ Lógica de transição e validação |
| Variable Extractor | `src/lib/engine/variable-extractor.ts` | ✅ LLM + fallback regex |
| Layout 3 Colunas | `src/app/dashboard/agents/[agentId]/builder/page.tsx` | ✅ Funcionando |
| Stage List | `src/components/agent-builder/StageList.tsx` | ✅ Cards empilhados |
| Stage Config | `src/components/agent-builder/StageConfigPanel.tsx` | ✅ Com config Calendar |
| Chat Preview | `src/components/agent-builder/ChatPreview.tsx` | ✅ Simulação |
| Variable Inspector | `src/components/agent-builder/VariableInspector.tsx` | ✅ Debug JSON |
| **OAuth2 Google** | `src/app/api/auth/google/` | ✅ Flow completo |
| **FreeBusy API** | `src/app/api/calendar/slots/` | ✅ Listar horários |
| **Create Event** | `src/app/api/calendar/book/` | ✅ Agendar reunião |
| **Tools Integradas** | `src/lib/ai/tools.ts` | ✅ list_calendar_slots + schedule_meeting |
| **Página Integrações** | `src/app/dashboard/integrations/` | ✅ Com botão conectar |
| **Takeover** | `src/app/actions/takeover.ts` | ✅ Assumir/devolver conversa |
| **Takeover Control** | `src/components/takeover/TakeoverControl.tsx` | ✅ Botão + badge |
| **Horário Funcionamento** | `src/components/agent-builder/WorkingHoursEditor.tsx` | ✅ Dias/horários |
| **Personalidade** | `src/components/agent-builder/PersonalityEditor.tsx` | ✅ Tom, emojis, idioma |
| **Agent Actions** | `src/app/actions/agent.ts` | ✅ Persistência workflow/config |

### 🔲 PENDENTE

| Componente | Prioridade |
|------------|------------|
| Knowledge Base (RAG) | Alta |
| Conectar LLM real ao preview | Média |
| Google Sheets integração | Média |
| Drag & Drop para estágios | Baixa |

---

## 7. ARQUIVOS PRINCIPAIS

```
src/
├── app/
│   ├── dashboard/
│   │   └── agents/
│   │       └── [agentId]/
│   │           └── builder/
│   │               └── page.tsx          # Layout 3 colunas
├── components/
│   └── agent-builder/
│       ├── StageList.tsx                 # Lista de estágios
│       ├── StageConfigPanel.tsx          # Configuração
│       ├── ChatPreview.tsx               # Chat de teste
│       └── VariableInspector.tsx         # Debug
├── db/
│   └── schema.ts                         # Schema Drizzle completo
└── lib/
    └── engine/
        ├── state-machine.ts              # Orquestração
        └── variable-extractor.ts         # Extração LLM
```

---

## 8. COMO TESTAR

1. `npm run dev`
2. Acesse: `http://localhost:3000/dashboard/agents/1/builder`
3. Clique em um estágio → Configure → Teste no chat
