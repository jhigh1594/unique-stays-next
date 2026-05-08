import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_index" varchar;

    ALTER TABLE "stays" DROP CONSTRAINT IF EXISTS "stays_category_id_categories_id_fk";
    ALTER TABLE "stays" ADD CONSTRAINT "stays_category_id_categories_id_fk"
      FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "stays" DROP CONSTRAINT IF EXISTS "stays_category_id_categories_id_fk";
    ALTER TABLE "stays" ADD CONSTRAINT "stays_category_id_categories_id_fk"
      FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "users" DROP COLUMN IF EXISTS "enable_a_p_i_key";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "api_key";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "api_key_index";
  `)
}
