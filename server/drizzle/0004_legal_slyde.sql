ALTER TABLE "carts" ALTER COLUMN "invoice_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "selected_quantity" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN "quantity";