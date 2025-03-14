import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { pgTable, serial, varchar, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

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
    cat_no: integer('cat_no').unique().notNull(),
    product_name: varchar('product_name', { length: 255 }).notNull(),
    lot_no: integer('lot_no'),
    quantity: integer('quantity').notNull(),
    w_rate: decimal('w_rate', { precision: 10, scale: 2 }),
    selling_price: decimal('selling_price', { precision: 10, scale: 2 }),
    mrp: decimal('mrp', { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Invoices Table
export const invoices = pgTable('invoices', {
    invoice_id: varchar('invoice_id', { length: 50 }).primaryKey(),
    user_id: integer('user_id').notNull().references(() => users.id),
    party_name: varchar('party_name', { length: 255 }).notNull(),
    order_no: integer('order_no').unique().notNull(),
    address: varchar('address', { length: 500 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }),
    gstin: varchar('gstin', { length: 15 }),
    road_permit: varchar('road_permit'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Invoice Items Table
export const invoiceItems = pgTable('invoice_items', {
    id: serial('id').primaryKey(),
    invoice_id: varchar('invoice_id', { length: 50 }).notNull().references(() => invoices.invoice_id),
    item_id: integer('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});

// Stock Movements Table
export const stockMovements = pgTable('stock_movements', {
    id: serial('id').primaryKey(),
    item_id: integer('item_id').notNull().references(() => items.id),
    type: varchar('type', { length: 20 }).notNull(), // 'in', 'out', 'return'
    quantity: integer('quantity').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Type Definitions
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type Item = InferSelectModel<typeof items>;
export type InsertItem = InferInsertModel<typeof items>;

export type Invoice = InferSelectModel<typeof invoices>;
export type InsertInvoice = InferInsertModel<typeof invoices>;

export type InvoiceItem = InferSelectModel<typeof invoiceItems>;
export type InsertInvoiceItem = InferInsertModel<typeof invoiceItems>;

export type StockMovement = InferSelectModel<typeof stockMovements>;
export type InsertStockMovement = InferInsertModel<typeof stockMovements>;
