import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quiz_leads_occasion" AS ENUM('romantic', 'solo', 'friends', 'family');
  CREATE TYPE "public"."enum_quiz_leads_vibe" AS ENUM('woods', 'waterfront', 'desert', 'mountains', 'offgrid');
  CREATE TYPE "public"."enum_quiz_leads_distance" AS ENUM('nearby', 'halfday', 'anywhere');
  CREATE TYPE "public"."enum_quiz_leads_budget" AS ENUM('under150', '150to300', '300to500', '500plus');
  CREATE TYPE "public"."enum_quiz_leads_must_have" AS ENUM('views', 'privacy', 'hottub', 'hiking', 'pets', 'offgrid-wifi-free');
  CREATE TABLE "quiz_leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"zip_code" varchar NOT NULL,
  	"occasion" "enum_quiz_leads_occasion",
  	"vibe" "enum_quiz_leads_vibe",
  	"distance" "enum_quiz_leads_distance",
  	"budget" "enum_quiz_leads_budget",
  	"must_have" "enum_quiz_leads_must_have",
  	"result_slug" varchar,
  	"match_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quiz_leads_id" integer;
  CREATE INDEX "quiz_leads_updated_at_idx" ON "quiz_leads" USING btree ("updated_at");
  CREATE INDEX "quiz_leads_created_at_idx" ON "quiz_leads" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quiz_leads_fk" FOREIGN KEY ("quiz_leads_id") REFERENCES "public"."quiz_leads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_quiz_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("quiz_leads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quiz_leads" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "quiz_leads" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quiz_leads_fk";
  DROP INDEX "payload_locked_documents_rels_quiz_leads_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quiz_leads_id";
  DROP TYPE "public"."enum_quiz_leads_occasion";
  DROP TYPE "public"."enum_quiz_leads_vibe";
  DROP TYPE "public"."enum_quiz_leads_distance";
  DROP TYPE "public"."enum_quiz_leads_budget";
  DROP TYPE "public"."enum_quiz_leads_must_have";`)
}
