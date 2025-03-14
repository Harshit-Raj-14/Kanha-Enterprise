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
  user_id: number;
  cat_no: number;
  product_name: string;
  lot_no?: number | null;
  quantity: number;
  w_rate?: number | null;
  selling_price?: number | null;
  mrp: number;
}

// Define types for error responses
interface ApiError {
  message: string;
  status: number;
  data?: any;
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
      data: error.response.data
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response received from server. Please check your connection',
      status: 0
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0
    };
  }
};

// API functions
export const itemsApi = {
  // Add a new stock item
  addStockItem: async (itemData: StockItem) => {
    try {
      // Validate numeric fields before sending to API
      if (isNaN(itemData.cat_no)) {
        throw new Error('Catalog number must be a valid number');
      }
      
      if (isNaN(itemData.quantity) || itemData.quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      if (isNaN(itemData.mrp) || itemData.mrp <= 0) {
        throw new Error('MRP must be a positive number');
      }
      
      if (itemData.w_rate !== null && (isNaN(Number(itemData.w_rate)) || Number(itemData.w_rate) < 0)) {
        throw new Error('Wholesale rate must be a valid number');
      }
      
      if (itemData.selling_price !== null && (isNaN(Number(itemData.selling_price)) || Number(itemData.selling_price) < 0)) {
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
      
      // Otherwise, format and throw the API error
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
  }
};

export default api;