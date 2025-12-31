CREATE TYPE "public"."action_type" AS ENUM('google_calendar_list', 'google_calendar_create', 'google_sheets_append', 'transfer_human', 'send_whatsapp_template', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('google', 'meta', 'whatsapp', 'openai');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."stage_type" AS ENUM('identify', 'diagnosis', 'schedule', 'handoff', 'custom');--> statement-breakpoint
CREATE TYPE "public"."thread_status" AS ENUM('active', 'pending', 'qualified', 'booked', 'archived');--> statement-breakpoint
CREATE TYPE "public"."tool_call_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"type" "action_type" NOT NULL,
	"config" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "stage_type" DEFAULT 'custom' NOT NULL,
	"order" integer NOT NULL,
	"entry_condition" text,
	"instructions" text NOT NULL,
	"required_variables" jsonb DEFAULT '[]'::jsonb,
	"next_stage_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"model_config" jsonb DEFAULT '{"model":"gpt-4o","provider":"openai","temperature":0.7,"maxTokens":1024}'::jsonb NOT NULL,
	"enabled_tools" jsonb DEFAULT '[]'::jsonb,
	"company_profile" text,
	"workflow_config" jsonb DEFAULT '[]'::jsonb,
	"display_name" varchar(100),
	"personality" text,
	"tone" varchar(50) DEFAULT 'friendly',
	"use_emojis" boolean DEFAULT true,
	"language" varchar(10) DEFAULT 'pt-BR',
	"avatar_url" text,
	"widget_config" jsonb DEFAULT '{"primaryColor":"#6366f1","position":"right","welcomeMessage":"Olá! Como posso ajudar?"}'::jsonb,
	"working_hours" jsonb DEFAULT '{"enabled":false,"timezone":"America/Sao_Paulo","days":[1,2,3,4,5],"start":"09:00","end":"18:00","outsideMessage":"Estamos fora do horário de atendimento. Retornaremos em breve!"}'::jsonb,
	"google_integration_id" uuid,
	"use_main_google_integration" boolean DEFAULT true,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"credentials" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"content_type" varchar(20) DEFAULT 'text' NOT NULL,
	"topic" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_from_webhook" boolean DEFAULT false NOT NULL,
	"was_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"current_stage_id" varchar(100),
	"previous_stage_id" varchar(100),
	"variables" jsonb DEFAULT '{}'::jsonb,
	"stage_history" jsonb DEFAULT '[]'::jsonb,
	"last_tool_called" varchar(100),
	"last_tool_result" jsonb,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_id" uuid,
	"external_id" varchar(50) NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "thread_status" DEFAULT 'active' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"is_human_takeover" boolean DEFAULT false NOT NULL,
	"takeover_at" timestamp,
	"takeover_by" uuid,
	"takeover_reason" varchar(255),
	"first_interaction_at" timestamp DEFAULT now() NOT NULL,
	"last_interaction_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"tool_name" varchar(100) NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"status" "tool_call_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"execution_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_stage_id_agent_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."agent_stages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_stages" ADD CONSTRAINT "agent_stages_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_google_integration_id_integrations_id_fk" FOREIGN KEY ("google_integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_takeover_by_users_id_fk" FOREIGN KEY ("takeover_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_stage_id_idx" ON "agent_actions" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "actions_type_idx" ON "agent_actions" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stages_agent_id_idx" ON "agent_stages" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stages_order_idx" ON "agent_stages" USING btree ("agent_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_user_id_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_active_idx" ON "agents" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_user_provider_idx" ON "integrations" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_agent_id_idx" ON "knowledge_base" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_agent_topic_idx" ON "knowledge_base" USING btree ("agent_id","topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_content_type_idx" ON "knowledge_base" USING btree ("agent_id","content_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_thread_id_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_thread_time_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_thread_id_idx" ON "sessions" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "threads_external_id_idx" ON "threads" USING btree ("user_id","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "threads_user_id_idx" ON "threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "threads_status_idx" ON "threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "threads_last_interaction_idx" ON "threads" USING btree ("last_interaction_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "threads_takeover_idx" ON "threads" USING btree ("is_human_takeover");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_calls_message_id_idx" ON "tool_calls" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_calls_tool_name_idx" ON "tool_calls" USING btree ("tool_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");