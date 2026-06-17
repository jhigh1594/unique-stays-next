import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_snow_webhook_logs_status" AS ENUM('received', 'processed', 'failed');
  CREATE TABLE "snow_webhook_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event" varchar NOT NULL,
  	"slug" varchar,
  	"idempotency_key" varchar,
  	"status" "enum_snow_webhook_logs_status" DEFAULT 'received' NOT NULL,
  	"message" varchar,
  	"raw_body" varchar NOT NULL,
  	"payload" jsonb,
  	"headers" jsonb,
  	"received_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "blog_posts" ADD COLUMN "snowseo_article_id" varchar;
  ALTER TABLE "blog_posts" ADD COLUMN "archived_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "snow_webhook_logs_id" integer;
  CREATE UNIQUE INDEX "snow_webhook_logs_idempotency_key_idx" ON "snow_webhook_logs" USING btree ("idempotency_key");
  CREATE INDEX "snow_webhook_logs_updated_at_idx" ON "snow_webhook_logs" USING btree ("updated_at");
  CREATE INDEX "snow_webhook_logs_created_at_idx" ON "snow_webhook_logs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_snow_webhook_logs_fk" FOREIGN KEY ("snow_webhook_logs_id") REFERENCES "public"."snow_webhook_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_snow_webhook_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("snow_webhook_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "snow_webhook_logs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "snow_webhook_logs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_snow_webhook_logs_fk";
  
  DROP INDEX "payload_locked_documents_rels_snow_webhook_logs_id_idx";
  ALTER TABLE "blog_posts" DROP COLUMN "snowseo_article_id";
  ALTER TABLE "blog_posts" DROP COLUMN "archived_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "snow_webhook_logs_id";
  DROP TYPE "public"."enum_snow_webhook_logs_status";`)
}
