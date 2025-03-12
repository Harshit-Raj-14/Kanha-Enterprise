import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

dotenv.config({ path: '.env' });

const PORT = process.env.PORT || 5050;

// Middleware
const app = express();
app.use(express.json());

const allowedOrigins = ['http://localhost:3000'];
const options: cors.CorsOptions = {
  origin: allowedOrigins
};
app.use(cors(options));

// Use Morgan for logging HTTP requests
app.use(morgan('dev'));

// API version 1
import v1UserRouter from './v1/routes/userRoutes';
app.use("/api/v1/users", v1UserRouter);

import v1ItemRouter from './v1/routes/itemRoutes';
app.use("/api/v1/items", v1ItemRouter);

import v1InvoiceRouter from './v1/routes/invoiceRoutes';
app.use("/api/v1/invoices", v1InvoiceRouter);

app.listen(PORT, () => {
  console.log(`Sher listening on port ${PORT}`);
});
