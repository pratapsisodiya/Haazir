CREATE TYPE "public"."conversation_mode" AS ENUM('bot', 'human', 'closed');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('queued', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."opt_in_status" AS ENUM('opted_in', 'opted_out', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."sent_by" AS ENUM('bot', 'user', 'campaign', 'reminder', 'system');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_account_status" AS ENUM('connected', 'error', 'disconnected');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"wa_id" text NOT NULL,
	"bsuid" text,
	"name" text,
	"profile_name" text,
	"language" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"opt_in_status" "opt_in_status" DEFAULT 'unknown' NOT NULL,
	"opt_in_source" text,
	"opt_in_at" timestamp with time zone,
	"opted_out_at" timestamp with time zone,
	"last_inbound_at" timestamp with time zone,
	"notes" text,
	"custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"whatsapp_account_id" uuid NOT NULL,
	"mode" "conversation_mode" DEFAULT 'bot' NOT NULL,
	"assigned_user_id" uuid,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_message_preview" text,
	"service_window_expires_at" timestamp with time zone,
	"human_until" timestamp with time zone,
	"flow_state" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" "message_direction" NOT NULL,
	"wa_message_id" text,
	"type" text NOT NULL,
	"body" text,
	"interactive" jsonb,
	"media_id" text,
	"media_key" text,
	"media_mime" text,
	"transcript" text,
	"status" "message_status",
	"error_code" text,
	"error_title" text,
	"pricing_category" text,
	"cost_paise_estimate" integer,
	"sent_by" "sent_by",
	"sent_by_user_id" uuid,
	"ai_trace_id" uuid,
	"reply_to_wa_message_id" text,
	"wa_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_waMessageId_unique" UNIQUE("wa_message_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"waba_id" text NOT NULL,
	"phone_number_id" text NOT NULL,
	"display_phone" text,
	"verified_name" text,
	"access_token_enc" text NOT NULL,
	"token_expires_at" timestamp with time zone,
	"quality_rating" text,
	"messaging_limit_tier" text,
	"status" "whatsapp_account_status" DEFAULT 'connected' NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_accounts_phoneNumberId_unique" UNIQUE("phone_number_id")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_whatsapp_account_id_whatsapp_accounts_id_fk" FOREIGN KEY ("whatsapp_account_id") REFERENCES "public"."whatsapp_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_org_wa_id_unique" ON "contacts" USING btree ("org_id","wa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_org_bsuid_unique" ON "contacts" USING btree ("org_id","bsuid") WHERE "contacts"."bsuid" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_org_contact_unique" ON "conversations" USING btree ("org_id","contact_id");--> statement-breakpoint
CREATE INDEX "conversations_org_last_message_idx" ON "conversations" USING btree ("org_id","last_message_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_org_id_idx" ON "messages" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "whatsapp_accounts_org_id_idx" ON "whatsapp_accounts" USING btree ("org_id");