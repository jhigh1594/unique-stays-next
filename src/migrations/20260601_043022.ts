import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_score_reports_platform" AS ENUM('airbnb', 'vrbo', 'wander');
  CREATE TYPE "public"."enum_host_leads_source" AS ENUM('free', 'paid');
  CREATE TABLE "score_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"url_hash" varchar NOT NULL,
  	"listing_url" varchar NOT NULL,
  	"platform" "enum_score_reports_platform" NOT NULL,
  	"overall_score" numeric NOT NULL,
  	"dimensions" jsonb NOT NULL,
  	"listing_data" jsonb,
  	"paid" boolean DEFAULT false,
  	"session_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "host_leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"listing_url" varchar NOT NULL,
  	"score_id" numeric,
  	"source" "enum_host_leads_source" DEFAULT 'free' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "stays" ADD COLUMN "bathrooms" numeric NOT NULL DEFAULT 1;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "score_reports_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "host_leads_id" integer;
  CREATE UNIQUE INDEX "score_reports_url_hash_idx" ON "score_reports" USING btree ("url_hash");
  CREATE INDEX "score_reports_updated_at_idx" ON "score_reports" USING btree ("updated_at");
  CREATE INDEX "score_reports_created_at_idx" ON "score_reports" USING btree ("created_at");
  CREATE INDEX "host_leads_updated_at_idx" ON "host_leads" USING btree ("updated_at");
  CREATE INDEX "host_leads_created_at_idx" ON "host_leads" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_score_reports_fk" FOREIGN KEY ("score_reports_id") REFERENCES "public"."score_reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_host_leads_fk" FOREIGN KEY ("host_leads_id") REFERENCES "public"."host_leads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_score_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("score_reports_id");
  CREATE INDEX "payload_locked_documents_rels_host_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("host_leads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "score_reports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "host_leads" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "score_reports" CASCADE;
  DROP TABLE "host_leads" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_score_reports_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_host_leads_fk";
  
  DROP INDEX "payload_locked_documents_rels_score_reports_id_idx";
  DROP INDEX "payload_locked_documents_rels_host_leads_id_idx";
  ALTER TABLE "stays" DROP COLUMN "bathrooms";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "score_reports_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "host_leads_id";
  DROP TYPE "public"."enum_score_reports_platform";
  DROP TYPE "public"."enum_host_leads_source";`)
}
