import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, serial, varchar, integer, decimal, timestamp, index } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    shop_name: varchar('shop_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 150 }).unique().notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Items Table
export const items = pgTable('items', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').notNull().references(() => users.id),
    cat_no: varchar('cat_no', { length: 25 }).unique().notNull(),
    product_name: varchar('product_name', { length: 255 }).notNull(),
    lot_no: varchar('lot_no', { length: 25 }),
    hsn_no: varchar('hsn_no', { length: 25 }),
    quantity: integer('quantity').notNull(),
    w_rate: decimal('w_rate', { precision: 10, scale: 2 }),
    selling_price: decimal('selling_price', { precision: 10, scale: 2 }),
    mrp: decimal('mrp', { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    catNoIndex: index('cat_no_index').on(table.cat_no),
}));

// Invoices Table
export const invoices = pgTable('invoices', {
    id: serial('id').primaryKey(),
    invoice_no: varchar('invoice_no', { length: 25 }).unique().notNull(),
    user_id: integer('user_id').notNull().references(() => users.id),
    party_name: varchar('party_name', { length: 100 }).notNull(),
    order_no: varchar('order_no', { length: 25 }).unique(),
    doctor_name: varchar('doctor_name', { length: 100 }),
    patient_name: varchar('patient_name', { length: 100 }),
    address: varchar('address', { length: 255 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }),
    mobile_no: varchar('mobile_no', { length: 10 }),
    gstin: varchar('gstin', { length: 15 }),
    road_permit: varchar('road_permit', { length: 25 }),
    payment_mode: varchar('payment_mode', { length: 25 }),
    adjustment_percent: decimal('adjustment_percent', { precision: 5, scale: 2 }),
    cgst: decimal('cgst', { precision: 5, scale: 2 }),
    sgst: decimal('sgst', { precision: 5, scale: 2 }),
    igst: decimal('igst', { precision: 5, scale: 2 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    invoiceNoIndex: index('invoice_no_idx').on(table.invoice_no),
    userIdIndex: index('user_id_idx').on(table.user_id),
}));

// Carts Table
export const carts = pgTable('carts', {
    id: serial('id').primaryKey(),
    invoice_id: integer('invoice_id').notNull().references(() => invoices.id),
    cart_total: decimal('cart_total', { precision: 10, scale: 2 }).notNull(),
    net_amount: decimal('net_amount', { precision: 10, scale: 2 }).notNull(),
    net_payable_amount: decimal('net_payable_amount', { precision: 10, scale: 2 }),  //after round off
}, (table) => ({
    invoiceIdIndex: index('invoice_id_idx').on(table.invoice_id),
}));

// Cart Items Table
export const cartItems = pgTable('cart_items', {
    id: serial('id').primaryKey(),
    cart_id: integer('cart_id').notNull().references(() => carts.id),
    item_id: integer('item_id').notNull().references(() => items.id),
    hsn_code: varchar('hsn_code', { length: 20 }),
    addon_percent: decimal('addon_percent', { precision: 5, scale: 2 }),
    selected_quantity: integer('selected_quantity').notNull(),
    selling_price: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
});


// Type Definitions
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type Item = InferSelectModel<typeof items>;
export type InsertItem = InferInsertModel<typeof items>;

export type Invoice = InferSelectModel<typeof invoices>;
export type InsertInvoice = InferInsertModel<typeof invoices>;

export type Cart = InferSelectModel<typeof carts>;
export type InsertCart = InferInsertModel<typeof carts>;

export type CartItem = InferSelectModel<typeof cartItems>;
export type InsertCartItem = InferInsertModel<typeof cartItems>;

