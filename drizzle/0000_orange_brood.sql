CREATE TYPE "public"."credential_types" AS ENUM('EMAIL_SMTP', 'EMAIL_IMAP', 'OAUTH2', 'API_KEY', 'DATABASE', 'WEBHOOK', 'AI_API', 'GOOGLE', 'AWS', 'AZURE', 'SLACK', 'DISCORD', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PAUSED', 'CANCELLED', 'WAITING');--> statement-breakpoint
CREATE TYPE "public"."node_types" AS ENUM('INITIAL', 'WEBHOOK', 'MANUAL', 'SCHEDULE', 'HTTP', 'DATABASE', 'EMAIL', 'AI', 'GOOGLESHEET', 'CODE', 'CONDITION', 'FILTER', 'SLACK', 'DISCORD');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "build_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text,
	"name" text NOT NULL,
	"types" "node_types" NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position" jsonb DEFAULT '{"x":0,"y":0}'::jsonb NOT NULL,
	"workflow_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "credential_types" NOT NULL,
	"user_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_execution_id" text NOT NULL,
	"node_execution_id" text,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"source_node_id" text NOT NULL,
	"target_node_id" text NOT NULL,
	"from_output" text,
	"to_input" text,
	"type" text DEFAULT 'buttonedge',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_execution_id" text NOT NULL,
	"node_id" text NOT NULL,
	"status" "execution_status" DEFAULT 'PENDING' NOT NULL,
	"input_data" jsonb DEFAULT '{}'::jsonb,
	"output_data" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"retry_attempt" integer DEFAULT 0,
	"execution_time" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"status" "execution_status" DEFAULT 'PENDING' NOT NULL,
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"mode" text DEFAULT 'test',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_nodes" ADD CONSTRAINT "build_nodes_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_workflow_execution_id_workflow_executions_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_node_execution_id_node_executions_id_fk" FOREIGN KEY ("node_execution_id") REFERENCES "public"."node_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_connections" ADD CONSTRAINT "node_connections_source_node_id_build_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."build_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_connections" ADD CONSTRAINT "node_connections_target_node_id_build_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."build_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_executions" ADD CONSTRAINT "node_executions_workflow_execution_id_workflow_executions_id_fk" FOREIGN KEY ("workflow_execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_executions" ADD CONSTRAINT "node_executions_node_id_build_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."build_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credentials_user_name_idx" ON "credentials" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "node_connections_unique_idx" ON "node_connections" USING btree ("source_node_id","target_node_id","to_input","from_output");