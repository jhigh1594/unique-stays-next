import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_candidate_stays_platform" AS ENUM('Airbnb', 'VRBO', 'Wander');
  CREATE TYPE "public"."enum_candidate_stays_region" AS ENUM('West', 'Southwest', 'South', 'Midwest', 'Northeast', 'Southeast');
  CREATE TYPE "public"."enum_candidate_stays_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TABLE "candidate_stays_scraped_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amenity" varchar NOT NULL
  );
  
  CREATE TABLE "candidate_stays" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_url" varchar NOT NULL,
  	"platform" "enum_candidate_stays_platform" NOT NULL,
  	"title" varchar NOT NULL,
  	"location" varchar,
  	"state" varchar,
  	"region" "enum_candidate_stays_region",
  	"price" numeric,
  	"rating" numeric,
  	"review_count" numeric,
  	"image_url" varchar,
  	"scraped_description" varchar,
  	"novelty_score" numeric,
  	"novelty_reason" varchar,
  	"status" "enum_candidate_stays_status" DEFAULT 'pending' NOT NULL,
  	"discovered_at" timestamp(3) with time zone,
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "candidate_stays_id" integer;
  ALTER TABLE "candidate_stays_scraped_amenities" ADD CONSTRAINT "candidate_stays_scraped_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidate_stays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "candidate_stays_scraped_amenities_order_idx" ON "candidate_stays_scraped_amenities" USING btree ("_order");
  CREATE INDEX "candidate_stays_scraped_amenities_parent_id_idx" ON "candidate_stays_scraped_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "candidate_stays_source_url_idx" ON "candidate_stays" USING btree ("source_url");
  CREATE INDEX "candidate_stays_updated_at_idx" ON "candidate_stays" USING btree ("updated_at");
  CREATE INDEX "candidate_stays_created_at_idx" ON "candidate_stays" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidate_stays_fk" FOREIGN KEY ("candidate_stays_id") REFERENCES "public"."candidate_stays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_candidate_stays_id_idx" ON "payload_locked_documents_rels" USING btree ("candidate_stays_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "candidate_stays_scraped_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "candidate_stays" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "candidate_stays_scraped_amenities" CASCADE;
  DROP TABLE "candidate_stays" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_candidate_stays_fk";
  
  DROP INDEX "payload_locked_documents_rels_candidate_stays_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "candidate_stays_id";
  DROP TYPE "public"."enum_candidate_stays_platform";
  DROP TYPE "public"."enum_candidate_stays_region";
  DROP TYPE "public"."enum_candidate_stays_status";`)
}
