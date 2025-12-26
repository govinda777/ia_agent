# AI Agent

A platform for automating customer service on WhatsApp with configurable AI agents.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **AI Engine:** Vercel AI SDK Core + OpenAI
- **Database:** Neon (Serverless Postgres) + Drizzle ORM
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

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# OpenAI (Required)
OPENAI_API_KEY=sk-proj-...

# Google Calendar (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=

# Default User ID (Required - see "Database Setup" section)
DEFAULT_USER_ID=uuid-of-default-user

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```

> ⚠️ **IMPORTANT**: Never commit the `.env.local` file! It is already in the `.gitignore`.

### 4. Database Setup

#### 4.1. Create tables

```bash
npx dotenv -e .env.local -- npx drizzle-kit push
```

#### 4.2. Create default user

Access the [Neon Console](https://console.neon.tech) → SQL Editor and run:

```sql
INSERT INTO users (name, email, created_at, updated_at) 
VALUES ('Admin', 'admin@ia-agent.com', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
RETURNING id;
```

Copy the returned `id` and add it to `.env.local`:

```env
DEFAULT_USER_ID=<copied-id>
```

### 5. Run in development

```bash
npm run dev
```

Access [http://localhost:3000](http://localhost:3000)

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
