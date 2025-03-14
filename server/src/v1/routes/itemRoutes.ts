import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, items, invoices, stockMovements } from '../db/schema';

const router = Router();

// Create a connection pool to the PostgreSQL database
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false }, 
  connectionTimeoutMillis: 70000,
  max: 3 
});

// Initialize drizzle ORM with the connection pool
const db = drizzle(pool);

// Error handler for database queries
const handleQueryError = (err: any, res: Response) => {
    console.error('Error executing query:', err);
    
    // Check for specific PostgreSQL error codes
    if (err.code === '23505') { // Unique violation
        if (err.constraint && err.constraint.includes('cat_no')) {
            return res.status(409).json({ 
                error: 'A product with this catalog number already exists.' 
            });
        }
        return res.status(409).json({ 
            error: 'A record with these details already exists.' 
        });
    }
    
    if (err.code === '23503') { // Foreign key violation
        return res.status(400).json({ 
            error: 'Referenced record does not exist.' 
        });
    }
    
    if (err.code === '22P02') { // Invalid text representation
        return res.status(400).json({ 
            error: 'Invalid data format. Please check numeric fields.' 
        });
    }
    
    res.status(500).json({ 
        error: 'An error occurred while executing the query.' 
    });
};

// Validate numeric fields
const validateNumeric = (value: any, fieldName: string, required: boolean = false): string | null => {
    // Check if required field is missing
    if (required && (value === undefined || value === null || value === '')) {
        return `${fieldName} is required.`;
    }
    
    // Skip validation if field is optional and empty
    if (!required && (value === undefined || value === null || value === '')) {
        return null;
    }
    
    // Convert to number and validate
    const num = Number(value);
    if (isNaN(num)) {
        return `${fieldName} must be a valid number.`;
    }
    
    return null;
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
        
        // Collect validation errors
        const validationErrors: string[] = [];
        
        // Validate required fields
        if (!user_id) {
            validationErrors.push('User ID is required.');
        } else if (isNaN(Number(user_id)) || Number(user_id) <= 0) {
            validationErrors.push('User ID must be a valid positive number.');
        }
        
        // Validate catalog number
        const catNoError = validateNumeric(cat_no, 'Catalog number', true);
        if (catNoError) validationErrors.push(catNoError);
        
        // Validate product name
        if (!product_name) {
            validationErrors.push('Product name is required.');
        } else if (typeof product_name !== 'string') {
            validationErrors.push('Product name must be text.');
        } else if (product_name.trim().length === 0) {
            validationErrors.push('Product name cannot be empty.');
        }
        
        // Validate quantity
        const quantityError = validateNumeric(quantity, 'Quantity', true);
        if (quantityError) {
            validationErrors.push(quantityError);
        } else if (Number(quantity) <= 0) {
            validationErrors.push('Quantity must be greater than zero.');
        }
        
        // Validate MRP
        const mrpError = validateNumeric(mrp, 'MRP', true);
        if (mrpError) {
            validationErrors.push(mrpError);
        } else if (Number(mrp) <= 0) {
            validationErrors.push('MRP must be greater than zero.');
        }
        
        // Validate optional fields
        if (lot_no !== undefined && lot_no !== null && lot_no !== '') {
            const lotNoError = validateNumeric(lot_no, 'Lot number');
            if (lotNoError) validationErrors.push(lotNoError);
        }
        
        if (w_rate !== undefined && w_rate !== null && w_rate !== '') {
            const wRateError = validateNumeric(w_rate, 'Wholesale rate');
            if (wRateError) validationErrors.push(wRateError);
        }
        
        if (selling_price !== undefined && selling_price !== null && selling_price !== '') {
            const sellingPriceError = validateNumeric(selling_price, 'Selling price');
            if (sellingPriceError) validationErrors.push(sellingPriceError);
        }
        
        // If validation errors exist, return them
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: validationErrors.join(' '),
                validationErrors
            });
        }
        
        // Check if catalog number already exists
        const existingItem = await db.select({ id: items.id })
            .from(items)
            .where(eq(items.cat_no, Number(cat_no)))
            .limit(1);
            
        if (existingItem.length > 0) {
            return res.status(409).json({ 
                error: 'A product with this catalog number already exists.' 
            });
        }

        // Insert the new item
        const newItem = await db.insert(items).values({
            user_id,
            cat_no,
            product_name,
            quantity,
            mrp,
            // For optional fields, only include them if they have values
            ...(lot_no !== undefined && lot_no !== null && lot_no !== '' && { lot_no: Number(lot_no) }),
            ...(w_rate !== undefined && w_rate !== null && w_rate !== '' && { w_rate: Number(w_rate) }),
            ...(selling_price !== undefined && selling_price !== null && selling_price !== '' && 
                { selling_price: Number(selling_price) }),
        }).returning();
       
        res.status(201).json({
            message: 'Stock item added successfully',
            item: newItem[0]
        });
    } catch (err) {
        handleQueryError(err, res);
    }
});

// GET - Fetch all items for a user
router.get('/user/:userId', async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = parseInt(req.params.userId);
       
        if (isNaN(userId) || userId <= 0) {
            res.status(400).json({ error: 'Invalid user ID format. User ID must be a positive number.' });
            return;
        }
        
        // Verify user exists before querying items
        const userExists = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
            
        if (userExists.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        const userItems = await db.select().from(items).where(eq(items.user_id, userId));
        
        res.status(200).json({
            count: userItems.length,
            items: userItems
        });
    } catch (err) {
        handleQueryError(err, res);
    }
});

export default router;