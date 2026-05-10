import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "stays_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  ALTER TABLE "stays" ADD COLUMN "body" varchar;
  ALTER TABLE "stays" ADD COLUMN "area_guide" varchar;
  ALTER TABLE "stays_faqs" ADD CONSTRAINT "stays_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "stays_faqs_order_idx" ON "stays_faqs" USING btree ("_order");
  CREATE INDEX "stays_faqs_parent_id_idx" ON "stays_faqs" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "stays_faqs" CASCADE;
  ALTER TABLE "stays" DROP COLUMN "body";
  ALTER TABLE "stays" DROP COLUMN "area_guide";`)
}
