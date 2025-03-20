// app/services/items-api.ts
import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define types for the item data
interface StockItem {
  id?: string;
  user_id: number;
  cat_no: string;  // Changed to string only
  product_name: string;
  lot_no?: string | null;  // Changed to string only
  hsn_no?: string | null;  // Added new field
  quantity: number;
  w_rate?: number | null;
  selling_price?: number | null;
  mrp: number;
  created_at?: string;
}

// Define types for error responses
interface ApiError {
  message: string;
  status: number;
  data?: any;
  originalError?: any;
}

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

// Helper to format error responses
const formatError = (error: any): ApiError => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      message: error.response.data?.error || 'An error occurred while processing your request',
      status: error.response.status,
      data: error.response.data,
      originalError: error
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response received from server. Please check your connection',
      status: 0,
      originalError: error
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      originalError: error
    };
  }
};

// API functions
export const itemsApi = {
  // Add a new stock item
  addStockItem: async (itemData: StockItem) => {
    try {
      // Validate required string fields
      if (!itemData.cat_no || itemData.cat_no.trim() === '') {
        throw new Error('Catalog number is required');
      }
      
      if (!itemData.product_name || itemData.product_name.trim() === '') {
        throw new Error('Product name is required');
      }
      
      // Validate numeric fields
      if (isNaN(Number(itemData.quantity)) || Number(itemData.quantity) <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      if (isNaN(Number(itemData.mrp)) || Number(itemData.mrp) <= 0) {
        throw new Error('MRP must be a positive number');
      }
      
      if (itemData.w_rate !== null && itemData.w_rate !== undefined && 
          (isNaN(Number(itemData.w_rate)) || Number(itemData.w_rate) < 0)) {
        throw new Error('Wholesale rate must be a valid number');
      }
      
      if (itemData.selling_price !== null && itemData.selling_price !== undefined && 
          (isNaN(Number(itemData.selling_price)) || Number(itemData.selling_price) < 0)) {
        throw new Error('Selling price must be a valid number');
      }
      
      const response = await api.post('/items', itemData);
      return response.data;
    } catch (error: any) {
      console.error('Error adding stock item:', error);
      
      // If it's an error we threw for validation, preserve the message
      if (error.message && !error.response) {
        throw {
          response: {
            data: { error: error.message },
            status: 400
          }
        };
      }
      
      // Otherwise, throw the original error to preserve all details
      throw error;
    }
  },
  
  // Get all items for a user
  getUserItems: async (userId: number) => {
    try {
      if (isNaN(userId) || userId <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const response = await api.get(`/items/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user items:', error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  },

  // Update an existing item
  updateItem: async (itemId: string, itemData: Partial<StockItem>) => {
    try {
      // Validate required fields if provided
      if (itemData.cat_no !== undefined && itemData.cat_no.trim() === '') {
        throw new Error('Catalog number cannot be empty');
      }
      
      if (itemData.product_name !== undefined && itemData.product_name.trim() === '') {
        throw new Error('Product name cannot be empty');
      }
      
      if (itemData.quantity !== undefined && (isNaN(Number(itemData.quantity)) || Number(itemData.quantity) <= 0)) {
        throw new Error('Quantity must be a positive number');
      }
      
      if (itemData.mrp !== undefined && (isNaN(Number(itemData.mrp)) || Number(itemData.mrp) <= 0)) {
        throw new Error('MRP must be a positive number');
      }
      
      // Validate optional fields
      if (itemData.w_rate !== undefined && itemData.w_rate !== null && 
          (isNaN(Number(itemData.w_rate)) || Number(itemData.w_rate) < 0)) {
        throw new Error('Wholesale rate must be a valid number');
      }
      
      if (itemData.selling_price !== undefined && itemData.selling_price !== null && 
          (isNaN(Number(itemData.selling_price)) || Number(itemData.selling_price) < 0)) {
        throw new Error('Selling price must be a valid number');
      }
      
      // No need to validate lot_no and hsn_no as they are strings
      
      console.log(`Updating item ${itemId} with data:`, itemData);
      const response = await api.put(`/items/${itemId}`, itemData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating item:', error);
      
      // If the error has a response from the server
      if (error.response && error.response.data) {
        console.log('Server error response:', error.response.data);
        
        // Check for specific catalog number error
        if (error.response.data.error && 
            (error.response.data.error.includes('catalog number') || 
             error.response.data.error.includes('cat_no'))) {
          
          // Enhance the error with a more specific message
          error.response.data.error = 'A product with this catalog number already exists.';
        }
      }
      
      // If it's an error we threw for validation, preserve the message
      if (error.message && !error.response) {
        throw {
          response: {
            data: { error: error.message },
            status: 400
          }
        };
      }
      
      // Throw the error with all its properties
      throw error;
    }
  },
  
  // Delete an item
  deleteItem: async (itemId: string) => {
    try {
      console.log(`Deleting item with ID: ${itemId}`);
      const response = await api.delete(`/items/${itemId}`);
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      
      // Log more details for debugging
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      const formattedError = formatError(error);
      throw formattedError;
    }
  },

  // Search for items
  searchItems: async (userId: number, searchType: 'cat_no' | 'product_name', searchTerm: string) => {
    try {
      if (isNaN(userId) || userId <= 0) {
        throw new Error('Invalid user ID');
      }
      
      if (!searchTerm.trim()) {
        throw new Error('Search term cannot be empty');
      }
      
      console.log(`Searching for items with userId=${userId}, searchType=${searchType}, searchTerm=${searchTerm}`);
      
      const response = await api.get('/items/search', {
        params: {
          userId,
          searchType,
          searchTerm
        }
      });
      
      console.log('Search response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error searching items:', error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  },
  
  // Get a specific item by ID
  getItemById: async (itemId: string) => {
    try {
      const response = await api.get(`/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item with ID ${itemId}:`, error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  }
};

export default api;