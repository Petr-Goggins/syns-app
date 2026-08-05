import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('sb-auth-token');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    } catch {
      // token not JSON-prefixed, ignore
    }
  }
  return config;
});
