# Contribuindo para o ia_agent

Bem-vindo! Este guia irá ajudar você a contribuir para o projeto ia_agent.

## 🚀 Setup Rápido

### Pré-requisitos
- Node.js 20+
- Docker Desktop
- 8GB RAM
- Git configurado

### Setup Automatizado (5 minutos)
```bash
# 1. Clone o repositório
git clone https://github.com/govinda777/ia_agent.git
cd ia_agent

# 2. Execute o onboarding interativo
npm run onboarding

# 3. Comece a desenvolver
npm run dev
```

### Setup Manual
Se preferir configurar manualmente:
```bash
# 1. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves de API

# 2. Instale dependências
npm install

# 3. Inicie containers Docker
npm run docker:dev

# 4. Configure o database
npm run db:push
npm run db:seed

# 5. Inicie o desenvolvimento
npm run dev
```

## 📋 Validação do Ambiente

Antes de começar a desenvolver, sempre valide seu ambiente:
```bash
npm run env:validate
```

Se encontrar problemas, tente corrigir automaticamente:
```bash
npm run env:fix
```

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Iniciar Next.js
npm run build            # Build para produção
npm run start             # Iniciar produção
npm run lint              # Verificar código
npm run test              # Rodar testes
```

### Database
```bash
npm run db:push          # Aplicar schema
npm run db:studio        # Interface gráfica
npm run db:stats         # Estatísticas detalhadas
npm run db:seed          # Popular dados iniciais
```

### Docker
```bash
npm run docker:dev       # Iniciar containers
npm run docker:down      # Parar containers
npm run docker:logs      # Ver logs
npm run docker:health    # Status dos serviços
```

### Ambiente
```bash
npm run env:validate     # Validar ambiente
npm run env:doctor       # Diagnóstico completo
npm run env:fix          # Corrigir problemas
npm run env:reset        # Reset completo
```

## 🌟 Fluxo de Trabalho

### 1. Crie uma Branch
```bash
git checkout -b feature/sua-feature
```

### 2. Desenvolva
- Faça suas alterações
- Teste localmente
- Valide o ambiente

### 3. Valide Antes de Commitar
```bash
npm run lint
npm run test
npm run build
npm run env:validate
```

### 4. Commit e Push
```bash
git add .
git commit -m "feat: add sua feature"
git push origin feature/sua-feature
```

### 5. Pull Request
- Crie uma PR descrevendo suas mudanças
- Aguarde review
- Faça as correções solicitadas

## 📁 Estrutura do Projeto

```
ia_agent/
├── src/                    # Código fonte
│   ├── app/               # App Router (Next.js 15)
│   ├── components/        # Componentes React
│   ├── db/               # Database schema e seeds
│   ├── lib/              # Utilitários
│   └── server/           # Código server-side
├── scripts/              # Scripts de automação
├── docs/                 # Documentação
├── .github/              # Workflows e templates
├── docker-compose.dev.yml # Configuração Docker local
└── package.json          # Dependências e scripts
```

## 🏗️ Arquitetura

### Tecnologias
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL 15, Drizzle ORM
- **Cache**: Redis 7
- **IA**: OpenAI, Anthropic Claude, Google Gemini
- **WhatsApp**: Baileys (WhatsApp Web)
- **Infra**: Docker, Vercel, Railway

### Design Patterns
- **Repository Pattern**: Para acesso a dados
- **Service Layer**: Para lógica de negócio
- **Event-Driven**: Para comunicação assíncrona
- **Microservices**: WhatsApp como serviço separado

## 🔧 Configuração de Desenvolvimento

### VSCode
Recomendamos usar VSCode com as extensões:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Docker
- Prisma

Use o guia `vscode-setup-guide.md` para configurar.

### Environment Variables
Essenciais para desenvolvimento:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ia_agent_dev
OPENAI_API_KEY=sk-sua-chave
DEFAULT_USER_ID=uuid-gerado
NEXTAUTH_URL=http://localhost:3000
```

### Database
O projeto usa PostgreSQL com Docker. Schema é gerenciado pelo Drizzle ORM.

## 🧪 Testes

### Tipos de Testes
- **Unit**: Testes de unidade com Vitest
- **Integration**: Testes de integração com database
- **E2E**: Testes end-to-end com Playwright

### Rodando Testes
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Com coverage
```

### Escrevendo Testes
- Testes unitários devem ser rápidos e isolados
- Testes de integração devem usar database de teste
- Testes E2E devem simular fluxos reais

## 📝 Código Style

### Regras
- Use TypeScript para todo código novo
- Siga as regras do ESLint
- Formate com Prettier
- Use nomes descritivos
- Comente código complexo

### Convenções
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case para arquivos, PascalCase para componentes

### Exemplos
```typescript
// Componente
export const UserProfile: React.FC<Props> = ({ user }) => {
  return <div>{user.name}</div>;
};

// Service
export class WhatsAppService {
  async sendMessage(to: string, message: string) {
    // Implementation
  }
}

// Constant
export const API_ENDPOINTS = {
  USERS: '/api/users',
  AGENTS: '/api/agents',
} as const;
```

## 🤖 Trabalhando com IA

### OpenAI Integration
```typescript
import { openai } from '@/lib/ai/openai';

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### Novos Providers
Para adicionar um novo provider de IA:
1. Crie arquivo em `src/lib/ai/`
2. Implemente interface padrão
3. Adicione ao registry
4. Adicione testes

## 📱 WhatsApp Integration

### Baileys Service
O WhatsApp usa Baileys em um serviço separado:
```bash
npm run whatsapp:dev      # Serviço local
npm run whatsapp:deploy   # Deploy produção
```

### Testando WhatsApp
Use números de teste do WhatsApp Business API.

## 🚀 Deploy

### Preview Deploy
```bash
git push origin feature/sua-feature
# Automatic preview deploy via Vercel
```

### Production Deploy
```bash
git push origin main
# Automatic production deploy via Vercel
```

### Environment Variables de Produção
Configure no Vercel:
- `DATABASE_URL` (Neon)
- `OPENAI_API_KEY`
- `NEXTAUTH_URL`
- Outras variáveis necessárias

## 🔍 Debugging

### Logs
```bash
npm run docker:logs      # Logs dos containers
npm run logs:tail        # Logs Vercel
```

### Database Debug
```bash
npm run db:studio        # Interface gráfica
npm run db:stats         # Estatísticas
```

### Performance
```bash
npm run perf:analyze     # Análise de bundle
npm run perf:lighthouse  # Lighthouse audit
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Porta em uso
```bash
npm run env:fix          # Corrigir automaticamente
# Ou manualmente
lsof -ti:3000 | xargs kill -9
```

#### Docker não inicia
```bash
# Verificar se Docker Desktop está rodando
docker info

# Reiniciar containers
npm run docker:down
npm run docker:dev
```

#### Database não conecta
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
npm run docker:logs | grep postgres

# Reset database
npm run db:reset
```

#### Environment variables
```bash
# Validar configuração
npm run env:validate

# Verificar arquivo
cat .env.local

# Reconfigurar
npm run env:setup
```

### Getting Help
1. **Diagnóstico**: `npm run env:doctor`
2. **Documentação**: Verifique `docs/`
3. **Issues**: Abra issue no GitHub
4. **Discord**: Comunidade no Discord

## 📋 Checklist de Contribuição

### Antes de Abrir PR
- [ ] Código segue style guide
- [ ] Testes passando
- [ ] Build funcionando
- [ ] Ambiente validado
- [ ] Documentação atualizada
- [ ] Commits semânticos

### Para Features
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Documentação da API
- [ ] Exemplos de uso

### Para Bugs
- [ ] Teste reproduzindo bug
- [ ] Teste verificando fix
- [ ] Atualização de changelog

## 🏆 Reconhecimento

Contribuidores são reconhecidos em:
- `README.md` - Contributors section
- Release notes
- Discord - Canal #contributors
- Annual recognition

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

## 🤝 Perguntas?

- **GitHub Issues**: Para bugs e features
- **Discord**: Para dúvidas e discussões
- **Email**: team@ia-agent.com

---

**Obrigado por contribuir! 🎉**
