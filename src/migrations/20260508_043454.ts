import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_stays_region" AS ENUM('West', 'Southwest', 'South', 'Midwest', 'Northeast', 'Southeast');
  CREATE TYPE "public"."enum_stays_platform" AS ENUM('Airbnb', 'VRBO', 'Wander', 'Direct');
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"emoji" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "spokes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"tagline" varchar,
  	"description" varchar,
  	"icon" varchar,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stays_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );
  
  CREATE TABLE "stays" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"location" varchar NOT NULL,
  	"state" varchar NOT NULL,
  	"region" "enum_stays_region" NOT NULL,
  	"category_id" integer NOT NULL,
  	"platform" "enum_stays_platform" NOT NULL,
  	"affiliate_url" varchar NOT NULL,
  	"image_id" integer,
  	"image_url" varchar,
  	"price" numeric NOT NULL,
  	"rating" numeric,
  	"review_count" numeric,
  	"sleeps" numeric NOT NULL,
  	"bedrooms" numeric NOT NULL,
  	"description" varchar NOT NULL,
  	"featured" boolean DEFAULT false,
  	"editors_pick" boolean DEFAULT false,
  	"is_new" boolean DEFAULT false,
  	"work_friendly_wifi_speed" varchar,
  	"work_friendly_has_desk" boolean DEFAULT false,
  	"pet_details_pet_friendly" boolean DEFAULT false,
  	"pet_details_pet_policy" varchar,
  	"rv_details_rv_hookup" boolean DEFAULT false,
  	"rv_details_rv_info" varchar,
  	"ev_details_ev_charger" boolean DEFAULT false,
  	"ev_details_ev_info" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stays_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"spokes_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "spokes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stays_id" integer;
  ALTER TABLE "spokes" ADD CONSTRAINT "spokes_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays_tags" ADD CONSTRAINT "stays_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays" ADD CONSTRAINT "stays_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays" ADD CONSTRAINT "stays_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stays_rels" ADD CONSTRAINT "stays_rels_spokes_fk" FOREIGN KEY ("spokes_id") REFERENCES "public"."spokes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "spokes_slug_idx" ON "spokes" USING btree ("slug");
  CREATE INDEX "spokes_hero_image_idx" ON "spokes" USING btree ("hero_image_id");
  CREATE INDEX "spokes_updated_at_idx" ON "spokes" USING btree ("updated_at");
  CREATE INDEX "spokes_created_at_idx" ON "spokes" USING btree ("created_at");
  CREATE INDEX "stays_tags_order_idx" ON "stays_tags" USING btree ("_order");
  CREATE INDEX "stays_tags_parent_id_idx" ON "stays_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "stays_slug_idx" ON "stays" USING btree ("slug");
  CREATE INDEX "stays_category_idx" ON "stays" USING btree ("category_id");
  CREATE INDEX "stays_image_idx" ON "stays" USING btree ("image_id");
  CREATE INDEX "stays_updated_at_idx" ON "stays" USING btree ("updated_at");
  CREATE INDEX "stays_created_at_idx" ON "stays" USING btree ("created_at");
  CREATE INDEX "stays_rels_order_idx" ON "stays_rels" USING btree ("order");
  CREATE INDEX "stays_rels_parent_idx" ON "stays_rels" USING btree ("parent_id");
  CREATE INDEX "stays_rels_path_idx" ON "stays_rels" USING btree ("path");
  CREATE INDEX "stays_rels_spokes_id_idx" ON "stays_rels" USING btree ("spokes_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spokes_fk" FOREIGN KEY ("spokes_id") REFERENCES "public"."spokes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stays_fk" FOREIGN KEY ("stays_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_spokes_id_idx" ON "payload_locked_documents_rels" USING btree ("spokes_id");
  CREATE INDEX "payload_locked_documents_rels_stays_id_idx" ON "payload_locked_documents_rels" USING btree ("stays_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "spokes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stays_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stays" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stays_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "spokes" CASCADE;
  DROP TABLE "stays_tags" CASCADE;
  DROP TABLE "stays" CASCADE;
  DROP TABLE "stays_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_spokes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stays_fk";
  
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_spokes_id_idx";
  DROP INDEX "payload_locked_documents_rels_stays_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "spokes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stays_id";
  DROP TYPE "public"."enum_stays_region";
  DROP TYPE "public"."enum_stays_platform";`)
}
