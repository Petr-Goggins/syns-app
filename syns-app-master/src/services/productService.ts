import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Валидация URL при инициализации
if (!BACKEND_URL || typeof BACKEND_URL !== 'string') {
  console.warn('VITE_BACKEND_URL is not configured, using default');
}

const getBackendUrl = (): string => {
  return BACKEND_URL || 'http://localhost:8000';
};

export const searchProducts = async (query: string) => {
  // Валидация входных данных
  if (!query || typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 100) {
    throw new Error('Invalid query: must be between 2 and 100 characters');
  }

  try {
    const sanitizedQuery = query.trim().slice(0, 100);
    const response = await axios.get(`${getBackendUrl()}/api/products/search`, {
      params: { query: sanitizedQuery },
      headers: {
        'User-Agent': 'Sync-App/1.0',
      },
      timeout: 15000, // Уменьшенный таймаут
    });
    
    // Валидация ответа
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid product search response format');
      return [];
    }
    
    // Санитайзинг результатов
    return response.data.map((p: any) => ({
      ...p,
      name: typeof p.name === 'string' ? p.name.slice(0, 200) : '',
      brand: typeof p.brand === 'string' ? p.brand.slice(0, 100) : '',
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Product search error:', error.message);
    } else {
      console.error('Product search error:', error);
    }
    throw error;
  }
};
