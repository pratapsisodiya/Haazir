CREATE TYPE "public"."course_mode" AS ENUM('offline', 'online', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."bot_tone" AS ENUM('warm', 'formal');--> statement-breakpoint
CREATE TYPE "public"."knowledge_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."knowledge_type" AS ENUM('faq', 'text', 'pdf', 'url');--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"days" text[] DEFAULT '{}'::text[] NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"start_date" date NOT NULL,
	"seats_total" integer NOT NULL,
	"seats_filled" integer DEFAULT 0 NOT NULL,
	"demo_allowed" boolean DEFAULT true NOT NULL,
	"branch_label" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"description" text,
	"duration_text" text,
	"mode" "course_mode" DEFAULT 'offline' NOT NULL,
	"fee_total_paise" integer NOT NULL,
	"installment_plan" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brochure_key" text,
	"certificate_text" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"intent" text,
	"language" text,
	"confidence" real,
	"retrieved_chunk_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"tool_calls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" text,
	"prompt_version" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"latency_ms" integer,
	"handed_off" boolean DEFAULT false NOT NULL,
	"handoff_reason" text,
	"guardrail_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cost_usd_micros" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"persona_name" text DEFAULT 'Haazir Sahayak' NOT NULL,
	"tone" "bot_tone" DEFAULT 'warm' NOT NULL,
	"languages" text[] DEFAULT '{hi,en,hinglish}'::text[] NOT NULL,
	"greeting" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"main_menu" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fallback_message" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"handoff_keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"optout_keywords" text[] DEFAULT '{}'::text[] NOT NULL,
	"after_hours_message" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"competitor_names" text[] DEFAULT '{}'::text[] NOT NULL,
	"max_ai_replies_per_contact_hour" integer DEFAULT 20 NOT NULL,
	"privacy_notice_url" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_configs_orgId_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "knowledge_type" NOT NULL,
	"title" text NOT NULL,
	"file_key" text,
	"url" text,
	"text_content" text,
	"status" "knowledge_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unanswered_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"question" text NOT NULL,
	"normalized" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "handoff_reason" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "handoff_summary" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "handoff_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_traces" ADD CONSTRAINT "ai_traces_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_traces" ADD CONSTRAINT "ai_traces_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_traces" ADD CONSTRAINT "ai_traces_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_configs" ADD CONSTRAINT "bot_configs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_faqs" ADD CONSTRAINT "knowledge_faqs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_faqs" ADD CONSTRAINT "knowledge_faqs_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unanswered_questions" ADD CONSTRAINT "unanswered_questions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batches_org_id_idx" ON "batches" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "batches_course_id_idx" ON "batches" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "courses_org_id_idx" ON "courses" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "ai_traces_org_created_idx" ON "ai_traces" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_org_id_idx" ON "knowledge_chunks" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_embedding_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "knowledge_chunks_tsv_idx" ON "knowledge_chunks" USING gin ("tsv");--> statement-breakpoint
CREATE INDEX "knowledge_faqs_org_id_idx" ON "knowledge_faqs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "knowledge_sources_org_id_idx" ON "knowledge_sources" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unanswered_org_normalized_unique" ON "unanswered_questions" USING btree ("org_id","normalized");