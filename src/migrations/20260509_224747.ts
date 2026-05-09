import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "stays_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_url" varchar
  );
  
  ALTER TABLE "stays" ADD COLUMN "editor_note" varchar;
  ALTER TABLE "stays" ADD COLUMN "best_for" varchar;
  ALTER TABLE "stays" ADD COLUMN "best_season" varchar;
  ALTER TABLE "stays" ADD COLUMN "vibe" varchar;
  ALTER TABLE "stays_gallery_images" ADD CONSTRAINT "stays_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stays_gallery_images" ADD CONSTRAINT "stays_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "stays_gallery_images_order_idx" ON "stays_gallery_images" USING btree ("_order");
  CREATE INDEX "stays_gallery_images_parent_id_idx" ON "stays_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "stays_gallery_images_image_idx" ON "stays_gallery_images" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "stays_gallery_images" CASCADE;
  ALTER TABLE "stays" DROP COLUMN "editor_note";
  ALTER TABLE "stays" DROP COLUMN "best_for";
  ALTER TABLE "stays" DROP COLUMN "best_season";
  ALTER TABLE "stays" DROP COLUMN "vibe";`)
}
