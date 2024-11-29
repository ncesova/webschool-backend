CREATE SCHEMA "drizzle";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
	"id" serial NOT NULL,
	"hash" text,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classrooms_table" (
	"id" integer,
	"admins_id" text,
	"students_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles_table" (
	"id" integer,
	"name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_table" (
	"id" serial NOT NULL,
	"username" text,
	"password" text,
	"role_id" integer,
	"name" text,
	"surname" text,
	"classroom_id" integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "__drizzle_migrations_pkey" ON "drizzle"."__drizzle_migrations" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_table_pkey" ON "users_table" USING btree ("id");