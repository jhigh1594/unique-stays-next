import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_reports_findings_severity" AS ENUM('info', 'warning', 'critical');
  CREATE TYPE "public"."enum_audit_reports_platform" AS ENUM('Airbnb', 'VRBO', 'Wander', 'Direct');
  CREATE TYPE "public"."enum_audit_reports_severity" AS ENUM('info', 'warning', 'critical');
  CREATE TYPE "public"."enum_audit_reports_status" AS ENUM('pending', 'reviewed', 'resolved');
  CREATE TABLE "audit_reports_findings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"expected" varchar,
  	"actual" varchar,
  	"severity" "enum_audit_reports_findings_severity" NOT NULL
  );
  
  CREATE TABLE "audit_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"run_id" varchar NOT NULL,
  	"stay_id" integer,
  	"stay_slug" varchar NOT NULL,
  	"stay_title" varchar NOT NULL,
  	"platform" "enum_audit_reports_platform" NOT NULL,
  	"affiliate_url" varchar,
  	"severity" "enum_audit_reports_severity" DEFAULT 'info' NOT NULL,
  	"status" "enum_audit_reports_status" DEFAULT 'pending' NOT NULL,
  	"checked_at" timestamp(3) with time zone NOT NULL,
  	"resolved_at" timestamp(3) with time zone,
  	"resolved_by" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_reports_id" integer;
  ALTER TABLE "audit_reports_findings" ADD CONSTRAINT "audit_reports_findings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audit_reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "audit_reports_findings_order_idx" ON "audit_reports_findings" USING btree ("_order");
  CREATE INDEX "audit_reports_findings_parent_id_idx" ON "audit_reports_findings" USING btree ("_parent_id");
  CREATE INDEX "audit_reports_stay_idx" ON "audit_reports" USING btree ("stay_id");
  CREATE INDEX "audit_reports_updated_at_idx" ON "audit_reports" USING btree ("updated_at");
  CREATE INDEX "audit_reports_created_at_idx" ON "audit_reports" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_reports_fk" FOREIGN KEY ("audit_reports_id") REFERENCES "public"."audit_reports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_audit_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_reports_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_reports_findings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_reports" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "audit_reports_findings" CASCADE;
  DROP TABLE "audit_reports" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_reports_fk";
  
  DROP INDEX "payload_locked_documents_rels_audit_reports_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_reports_id";
  DROP TYPE "public"."enum_audit_reports_findings_severity";
  DROP TYPE "public"."enum_audit_reports_platform";
  DROP TYPE "public"."enum_audit_reports_severity";
  DROP TYPE "public"."enum_audit_reports_status";`)
}
