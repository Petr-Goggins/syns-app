import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const searchProducts = async (query: string) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/products/search`, {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('Product search error:', error);
    throw error;
  }
};
