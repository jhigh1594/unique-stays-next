import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_candidate_stays_platform" ADD VALUE IF NOT EXISTS 'Direct';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // PostgreSQL doesn't support removing enum values — no-op down migration
}
