import axios from 'axios';

// SECURITY FIX: Validate backend URL - must use HTTPS in production
const getBackendUrl = (): string => {
  const url = import.meta.env.VITE_BACKEND_URL;
  
  if (!url || typeof url !== 'string') {
    console.warn('VITE_BACKEND_URL is not configured, using default');
    return 'http://localhost:8000';
  }
  
  // In production, enforce HTTPS
  if (import.meta.env.PROD && !url.startsWith('https://')) {
    console.error('SECURITY WARNING: VITE_BACKEND_URL must use HTTPS in production');
  }
  
  return url;
};

export const searchProducts = async (query: string) => {
  // Input validation with sanitization
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
      timeout: 15000, // Reduced timeout
    });
    
    // Response validation
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid product search response format');
      return [];
    }
    
    // Sanitize results with proper typing
    return response.data
      .filter((p: unknown): p is { name?: unknown; brand?: unknown } => p !== null && typeof p === 'object')
      .map((p) => ({
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
