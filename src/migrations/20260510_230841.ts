import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stays" ADD COLUMN "needs_review" boolean DEFAULT false;
  ALTER TABLE "stays" ADD COLUMN "review_reason" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stays" DROP COLUMN "needs_review";
  ALTER TABLE "stays" DROP COLUMN "review_reason";`)
}
