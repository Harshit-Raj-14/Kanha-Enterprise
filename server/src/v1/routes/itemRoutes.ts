import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, items, invoices, invoiceItems, stockMovements } from '../db/schema';

const router = Router();
const pool = new Pool({ connectionString: `${process.env.DATABASE_URL}`, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 70000,  max: 3 });
const db = drizzle(pool);

// Error handler for database queries
const handleQueryError = (err: any, res: Response) => {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'An error occurred while executing the query.' });
};

// POST - Add new stock item
router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { 
            user_id, 
            cat_no, 
            product_name, 
            lot_no, 
            quantity, 
            w_rate, 
            selling_price, 
            mrp 
        } = req.body;

        // Validate required fields
        if (!user_id || !cat_no || !product_name || !quantity || !mrp) {
            res.status(400).json({ 
                error: 'Missing required fields. Please provide user_id, cat_no, product_name, quantity, and mrp.' 
            });
            return;
        }

        // Insert the new item
        const newItem = await db.insert(items).values({
            user_id,
            cat_no,
            product_name,
            quantity,
            mrp,
            // For optional fields, only include them if they have values
            ...(lot_no !== undefined && { lot_no }),
            ...(w_rate !== undefined && { w_rate }),
            ...(selling_price !== undefined && { selling_price }),
        }).returning();
        
        res.status(201).json(newItem[0]);
    } catch (err) {
        // Check for duplicate key violation
        if (err instanceof Error && err.message.includes('duplicate key')) {
            return res.status(409).json({ error: 'A product with this catalog number already exists.' });
        }
        handleQueryError(err, res);
    }
});

// GET - Fetch all items for a user
router.get('/items/user/:userId', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            res.status(400).json({ error: 'Invalid user ID format.' });
            return;
        }

        const userItems = await db.select().from(items).where(eq(items.user_id, userId));
        res.status(200).json(userItems);
    } catch (err) {
        handleQueryError(err, res);
    }
});

export default router;