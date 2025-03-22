// app/services/invoices-api.ts
import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface InvoiceFormData {
  invoice_no: string;
  party_name: string;
  order_no?: string;
  doctor_name?: string;
  patient_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mobile_no?: number;
  gstin?: string;
  road_permit?: string;
  payment_mode?: string;
  adjustment_percent?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  user_shop_name?: string; // Added for PrintInvoice component
  user_id?: number; // Added for invoice submission
}

export interface CartItemData {
  item_id: number;
  cat_no: string;
  product_name: string;
  lot_no?: string;
  hsn_code?: string;
  expiry?: string;
  mrp: number;
  selling_price: number;
  selected_quantity: number;
  addon_percent?: number;
  total: number;
}

export interface CartData {
  cart_total: number;
  net_amount: number;
  net_payable_amount: number;
  items: CartItemData[];
}

export interface InvoiceSubmitData {
  invoice: InvoiceFormData;
  cart: CartData;
}


// Invoice related API calls

export const invoicesApi = {
  // Get item details by cat_no
  getItemByCatNo: async (catNo: string) => {
    try {
      const response = await api.get(`/invoices/items/cat-no/${catNo}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch item');
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error('Error fetching item. Please try again.');
      }
    }
  },

  // Generate invoice number (usually server-side, but can be mocked here for now)
  getNextInvoiceNumber: async () => {
    try {
        const response = await api.get('/invoices/next-invoice-number');

        // Store the latest invoice in localStorage for fallback use
        localStorage.setItem('lastInvoiceNumber', response.data.invoice_no);

        return response.data.invoice_no;
    } catch (error) {
        console.error("Server unavailable, generating fallback invoice number");

        // Get last stored invoice from localStorage
        let lastInvoice = localStorage.getItem('lastInvoiceNumber');

        if (lastInvoice) {
            // Extract numeric part correctly using regex
            const match = lastInvoice.match(/(\d+)$/);
            
            if (match) {
                const numericPart = parseInt(match[1], 10) + 1;
                const parts = lastInvoice.split('/');
                const nextInvoice = `MPK/${parts[1]}/${String(numericPart).padStart(5, '0')}`;

                // Update localStorage with the new fallback invoice
                localStorage.setItem('lastInvoiceNumber', nextInvoice);
                
                return nextInvoice;
            }
        }

        // If no last invoice is found, start from the default value
        const defaultInvoice = `MPK/25-26/00001`;
        localStorage.setItem('lastInvoiceNumber', defaultInvoice);
        return defaultInvoice;
    }
  },


  // Create a new invoice with cart
  createInvoice: async (invoiceData: InvoiceSubmitData) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create invoice');
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error('Error creating invoice. Please try again.');
      }
    }
  },

  // Get invoice by ID (for printing or viewing)
  getInvoiceById: async (invoiceId: number) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch invoice');
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error('Error fetching invoice. Please try again.');
      }
    }
  },

  deleteInvoice: async (invoiceId: number) => {
    try {
      const response = await api.delete(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete invoice');
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error('Error deleting invoice. Please try again.');
      }
    }
  },

  // Get all invoices for a user
  getUserInvoices: async (userId: number) => {
    try {
      const response = await api.get(`/invoices/user/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch invoices');
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error('Error fetching invoices. Please try again.');
      }
    }
  }
};

export default invoicesApi;