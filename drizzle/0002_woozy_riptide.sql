CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(50) NOT NULL,
	"customer_id" integer NOT NULL,
	"items" jsonb NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
