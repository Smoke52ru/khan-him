import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_requests_source" AS ENUM('list', 'quick', 'price');
  CREATE TABLE "requests_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"name" varchar NOT NULL,
  	"sku" varchar,
  	"quantity" varchar
  );
  
  CREATE TABLE "requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"message" varchar,
  	"source" "enum_requests_source" NOT NULL,
  	"consent_at" timestamp(3) with time zone,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "requests_id" integer;
  ALTER TABLE "requests_items" ADD CONSTRAINT "requests_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "requests_items" ADD CONSTRAINT "requests_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "requests_items_order_idx" ON "requests_items" USING btree ("_order");
  CREATE INDEX "requests_items_parent_id_idx" ON "requests_items" USING btree ("_parent_id");
  CREATE INDEX "requests_items_product_idx" ON "requests_items" USING btree ("product_id");
  CREATE INDEX "requests_updated_at_idx" ON "requests" USING btree ("updated_at");
  CREATE INDEX "requests_created_at_idx" ON "requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_requests_fk" FOREIGN KEY ("requests_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "requests_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "requests_items" CASCADE;
  DROP TABLE "requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "requests_id";
  DROP TYPE "public"."enum_requests_source";`)
}
