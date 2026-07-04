import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_stays_target_spoke" AS ENUM('unique', 'work-friendly', 'pet-friendly', 'rv-ready', 'ev-ready');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "candidate_stays"
      ADD COLUMN IF NOT EXISTS "target_spoke" "public"."enum_candidate_stays_target_spoke",
      ADD COLUMN IF NOT EXISTS "spoke_fields" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidate_stays"
      DROP COLUMN IF EXISTS "target_spoke",
      DROP COLUMN IF EXISTS "spoke_fields";

    DROP TYPE IF EXISTS "public"."enum_candidate_stays_target_spoke";
  `)
}
