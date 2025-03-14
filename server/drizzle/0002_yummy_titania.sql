CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cart_id" varchar(50) NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar(50) NOT NULL,
	"cart_total" numeric(10, 2) NOT NULL,
	"net_amount" numeric,
	"net_payable_amount" numeric(10, 2)
);
--> statement-breakpoint
ALTER TABLE "invoice_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invoice_items" CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" RENAME COLUMN "invoice_id" TO "id";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "hsn_code" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_mode" varchar;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "adjustment_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "cgst" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "sgst" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "igst" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_id_idx" ON "carts" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "order_no_idx" ON "invoices" USING btree ("order_no");--> statement-breakpoint
CREATE INDEX "cat_no_index" ON "items" USING btree ("cat_no");