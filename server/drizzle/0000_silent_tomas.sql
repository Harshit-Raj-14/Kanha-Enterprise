CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cart_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"hsn_code" varchar(20),
	"addon_percent" numeric(5, 2),
	"selected_quantity" integer NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"cart_total" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"net_payable_amount" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_no" varchar(10) NOT NULL,
	"user_id" integer NOT NULL,
	"party_name" varchar(100) NOT NULL,
	"order_no" varchar(20),
	"doctor_name" varchar(100),
	"patient_name" varchar(100),
	"address" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"pincode" varchar(10),
	"mobile_no" integer,
	"gstin" varchar(15),
	"road_permit" varchar(20),
	"payment_mode" varchar(20),
	"adjustment_percent" numeric(5, 2),
	"cgst" numeric(5, 2),
	"sgst" numeric(5, 2),
	"igst" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invoices_invoice_no_unique" UNIQUE("invoice_no"),
	CONSTRAINT "invoices_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cat_no" varchar(20) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"lot_no" varchar(20),
	"hsn_no" varchar(20),
	"quantity" integer NOT NULL,
	"w_rate" numeric(10, 2),
	"selling_price" numeric(10, 2),
	"mrp" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "items_cat_no_unique" UNIQUE("cat_no")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_id_idx" ON "carts" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_no_idx" ON "invoices" USING btree ("invoice_no");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cat_no_index" ON "items" USING btree ("cat_no");