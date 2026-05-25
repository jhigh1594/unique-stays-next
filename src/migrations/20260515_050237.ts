import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "candidate_stays" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "candidate_stays" ADD CONSTRAINT "candidate_stays_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "candidate_stays_hero_image_idx" ON "candidate_stays" USING btree ("hero_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "candidate_stays" DROP CONSTRAINT "candidate_stays_hero_image_id_media_id_fk";
  
  DROP INDEX "candidate_stays_hero_image_idx";
  ALTER TABLE "candidate_stays" DROP COLUMN "hero_image_id";`)
}
