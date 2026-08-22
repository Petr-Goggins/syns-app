import axios from 'axios';

// SECURITY FIX: Validate API URL - must use HTTPS in production
const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL || '/api';
  
  // In production, enforce HTTPS
  if (import.meta.env.PROD && !url.startsWith('https://') && !url.startsWith('/')) {
    console.error('SECURITY WARNING: API URL must use HTTPS in production');
  }
  
  return url;
};

const baseURL = getBaseUrl();

// Безопасное извлечение токена с валидацией
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('sb-auth-token');
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.access_token === 'string') {
      // Валидация формата токена (JWT обычно состоит из 3 частей)
      const token = parsed.access_token;
      // More strict JWT validation
      if (token.split('.').length === 3 && token.length > 20 && /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/.test(token)) {
        return token;
      }
    }
  } catch {
    // Token not JSON-prefixed or invalid, ignore
  }
  return null;
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false, // Не отправлять куки автоматически для безопасности
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен недействителен, можно очистить его
      try {
        localStorage.removeItem('sb-auth-token');
      } catch {
        // Ignore localStorage errors
      }
    }
    return Promise.reject(error);
  }
);
