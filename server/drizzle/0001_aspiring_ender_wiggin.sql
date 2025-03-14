ALTER TABLE "items" ALTER COLUMN "w_rate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "selling_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "road_permit" varchar;