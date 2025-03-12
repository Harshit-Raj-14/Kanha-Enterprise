// app/services/api.ts
import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth related API calls
export const authService = {
  // Login user
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/users/login', { email, password });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data.message || 'Authentication failed');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Error during authentication. Please try again.');
      }
    }
  },
};

export default api;