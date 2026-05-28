import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stays" ADD COLUMN IF NOT EXISTS "city" varchar;
   ALTER TABLE "stays" ADD COLUMN IF NOT EXISTS "state_code" varchar;
   ALTER TABLE "stays" ADD COLUMN IF NOT EXISTS "coordinates" jsonb;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stays" DROP COLUMN IF EXISTS "city";
   ALTER TABLE "stays" DROP COLUMN IF EXISTS "state_code";
   ALTER TABLE "stays" DROP COLUMN IF EXISTS "coordinates";
  `)
}
