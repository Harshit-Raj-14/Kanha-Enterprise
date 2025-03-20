import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';
import { and, eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, items, invoices, carts, cartItems } from '../../db/schema';

const router = Router();
const pool = new Pool({ connectionString: `${process.env.DATABASE_URL}`, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);

// Error handler for database queries
const handleQueryError = (err: any, res: Response) => {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'An error occurred while executing the query.' });
};

// Get next available invoice number
router.get('/next-invoice-number', async (req: Request, res: Response) => {
    try {
        // Get the latest invoice from the database
        const latestInvoices = await db.select({ invoice_no: invoices.invoice_no })
            .from(invoices)
            .orderBy(desc(invoices.invoice_no))
            .limit(1);

        let nextInvoiceNumber = 'MPK/25-26/00001';
        
        if (latestInvoices.length > 0) {
            // Extract the numeric part and increment
            const lastInvoice = latestInvoices[0].invoice_no;
            const numericPart = parseInt(lastInvoice.replace(/\D/g, ''), 10) + 1;
            nextInvoiceNumber = `MPK/25-26/${numericPart.toString().padStart(5, '0')}`;
        }
        
        res.json({ invoice_no: nextInvoiceNumber });
    } catch (err) {
        handleQueryError(err, res);
    }
});

// Get item by cat_no
router.get('/items/cat-no/:catNo', async (req: Request, res: Response) => {
    try {
        const { catNo } = req.params;
        
        const itemResult = await db.select()
            .from(items)
            .where(eq(items.cat_no, catNo));
        
        if (!itemResult.length) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }
        
        res.json(itemResult[0]);
    } catch (err) {
        handleQueryError(err, res);
    }
});

// Create a new invoice with cart
router.post('/', async (req: Request, res: Response) => {
    try {
        const { invoice, cart } = req.body;
        
        // Start a transaction
        await pool.query('BEGIN');
        
        // Insert invoice with required fields and conditionally spread optional fields
        const invoiceResult = await db.insert(invoices)
            .values({
                invoice_no: invoice.invoice_no,
                user_id: invoice.user_id,
                party_name: invoice.party_name,
                // Optional fields added using spread operator with conditional checks
                ...(invoice.order_no !== undefined && invoice.order_no !== null && invoice.order_no !== '' && { order_no: invoice.order_no }),
                ...(invoice.doctor_name !== undefined && invoice.doctor_name !== null && invoice.doctor_name !== '' && { doctor_name: invoice.doctor_name }),
                ...(invoice.patient_name !== undefined && invoice.patient_name !== null && invoice.patient_name !== '' && { patient_name: invoice.patient_name }),
                ...(invoice.address !== undefined && invoice.address !== null && invoice.address !== '' && { address: invoice.address }),
                ...(invoice.city !== undefined && invoice.city !== null && invoice.city !== '' && { city: invoice.city }),
                ...(invoice.state !== undefined && invoice.state !== null && invoice.state !== '' && { state: invoice.state }),
                ...(invoice.pincode !== undefined && invoice.pincode !== null && invoice.pincode !== '' && { pincode: invoice.pincode }),
                ...(invoice.mobile_no !== undefined && invoice.mobile_no !== null && { mobile_no: invoice.mobile_no }),
                ...(invoice.gstin !== undefined && invoice.gstin !== null && invoice.gstin !== '' && { gstin: invoice.gstin }),
                ...(invoice.road_permit !== undefined && invoice.road_permit !== null && invoice.road_permit !== '' && { road_permit: invoice.road_permit }),
                ...(invoice.payment_mode !== undefined && invoice.payment_mode !== null && invoice.payment_mode !== '' && { payment_mode: invoice.payment_mode }),
                ...(invoice.adjustment_percent !== undefined && invoice.adjustment_percent !== null && { adjustment_percent: invoice.adjustment_percent }),
                ...(invoice.cgst !== undefined && invoice.cgst !== null && { cgst: invoice.cgst }),
                ...(invoice.sgst !== undefined && invoice.sgst !== null && { sgst: invoice.sgst }),
                ...(invoice.igst !== undefined && invoice.igst !== null && { igst: invoice.igst }),
            })
            .returning({ id: invoices.id });
        
        const invoiceId = invoiceResult[0].id;
        
        // Insert cart with spread for optional fields
        const cartResult = await db.insert(carts)
            .values({
                invoice_id: invoiceId,
                cart_total: cart.cart_total,
                net_amount: cart.net_amount,
                ...(cart.net_payable_amount !== undefined && cart.net_payable_amount !== null && { net_payable_amount: cart.net_payable_amount }),
            })
            .returning({ id: carts.id });
        
        const cartId = cartResult[0].id;
        
        // Insert cart items
        for (const item of cart.items) {
            await db.insert(cartItems)
                .values({
                    cart_id: cartId,
                    item_id: item.item_id,
                    selected_quantity: item.selected_quantity,
                    selling_price: item.selling_price,
                    total: item.total,
                    ...(item.hsn_code !== undefined && item.hsn_code !== null && item.hsn_code !== '' && { hsn_code: item.hsn_code }),
                    ...(item.addon_percent !== undefined && item.addon_percent !== null && { addon_percent: item.addon_percent }),
                });
            
            // Get current item quantity
            const itemResult = await db.select({ quantity: items.quantity })
                .from(items)
                .where(eq(items.id, item.item_id));
                
            if (itemResult.length > 0) {
                const currentQuantity = Number(itemResult[0].quantity);
                const newQuantity = Math.max(0, currentQuantity - item.selected_quantity);
                
                // Update item inventory (reduce quantity)
                await db.update(items)
                    .set({
                        quantity: newQuantity
                    })
                    .where(eq(items.id, item.item_id));
            }
        }
        
        // Commit transaction
        await pool.query('COMMIT');
        
        res.status(201).json({ 
            message: 'Invoice created successfully', 
            invoice_id: invoiceId,
            cart_id: cartId
        });
    } catch (err) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        handleQueryError(err, res);
    }
});

// Get invoice by ID (including all related data)
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Get invoice details
        const invoiceResult = await db.select()
            .from(invoices)
            .where(eq(invoices.id, parseInt(id, 10)));
        
        if (!invoiceResult.length) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        
        const invoice = invoiceResult[0];
        
        // Get cart details
        const cartResult = await db.select()
            .from(carts)
            .where(eq(carts.invoice_id, invoice.id));
        
        if (!cartResult.length) {
            res.status(404).json({ message: 'Cart not found for this invoice' });
            return;
        }
        
        const cart = cartResult[0];
        
        // Get cart items
        const cartItemsResult = await db.select({
                id: cartItems.id,
                cart_id: cartItems.cart_id,
                item_id: cartItems.item_id,
                hsn_code: cartItems.hsn_code,
                addon_percent: cartItems.addon_percent,
                selected_quantity: cartItems.selected_quantity,
                selling_price: cartItems.selling_price,
                total: cartItems.total,
                // Join with items table to get product details
                product_name: items.product_name,
                lot_no: items.lot_no,
                cat_no: items.cat_no,
                mrp: items.mrp
            })
            .from(cartItems)
            .leftJoin(items, eq(cartItems.item_id, items.id))
            .where(eq(cartItems.cart_id, cart.id));
        
        // Combine all data
        const completeInvoice = {
            invoice,
            cart: {
                ...cart,
                items: cartItemsResult
            }
        };
        
        res.json(completeInvoice);
    } catch (err) {
        handleQueryError(err, res);
    }
});

// Get user invoices
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        const userInvoices = await db.select({
                id: invoices.id,
                invoice_no: invoices.invoice_no,
                party_name: invoices.party_name,
                created_at: invoices.created_at,
                payment_mode: invoices.payment_mode,
                net_payable: carts.net_payable_amount
            })
            .from(invoices)
            .leftJoin(carts, eq(invoices.id, carts.invoice_id))
            .where(eq(invoices.user_id, parseInt(userId, 10)))
            .orderBy(desc(invoices.created_at));
        
        res.json(userInvoices);
    } catch (err) {
        handleQueryError(err, res);
    }
});

export default router;