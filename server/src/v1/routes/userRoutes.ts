import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, items, invoices } from '../../db/schema';

const router = Router();
const pool = new Pool({ connectionString: `${process.env.DATABASE_URL}`, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 70000,  max: 3 });
const db = drizzle(pool);

// Error handler for database queries
const handleQueryError = (err: any, res: Response) => {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'An error occurred while executing the query.' });
};

// GET: Fetch user information by ID from users table
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
        // Convert userId to number
        const userIdNum = Number(userId);
        
        // Get user information from users table only
        const userInfo = await db.select().from(users).where(eq(users.id, userIdNum)).limit(1);
        
        if (userInfo.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        
        // Return user data (excluding password hash for security)
        const userData = {
            id: userInfo[0].id,
            shop_name: userInfo[0].shop_name,
            email: userInfo[0].email,
            created_at: userInfo[0].created_at
        };
        
        res.status(200).json(userData);
    } catch (error) {
        handleQueryError(error, res);
    }
});

// POST : Check whether user exists for login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        // Check if the user exists
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (user.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Directly compare password (not secure, but matching your current implementation)
        if (password !== user[0].password_hash) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // If authentication is successful
        res.status(200).json({ message: 'Login successful', user: user[0] });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
        return 
    }
});


// GET: Fetch all items of a user
router.get('/:userId/items', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const userItems = await db.select().from(items).where(eq(items.user_id, Number(userId)));
        res.status(200).json(userItems);
    } catch (error) {
        handleQueryError(error, res);
    }
});

// GET: Fetch all invoices of a user
router.get('/:userId/invoices', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const userInvoices = await db.select().from(invoices).where(eq(invoices.user_id, Number(userId)));
        res.status(200).json(userInvoices);
    } catch (error) {
        handleQueryError(error, res);
    }
});


export default router;