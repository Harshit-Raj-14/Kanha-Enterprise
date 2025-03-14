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

// Add an interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
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

// API functions
export const itemsApi = {
  // Add a new stock item
  addStockItem: async (itemData: StockItem) => {
    try {
      const response = await api.post('/items', itemData);
      return response.data;
    } catch (error) {
      console.error('Error adding stock item:', error);
      throw error;
    }
  },
  
  // Get all items for a user
  getUserItems: async (userId: number) => {
    try {
      const response = await api.get(`/items/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user items:', error);
      throw error;
    }
  }
};

export default api;