import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Intercepteur : ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('assembly_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur : gestion centralisée des erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expiré ou invalide
      localStorage.removeItem('assembly_token');
      localStorage.removeItem('assembly_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message
      || error.response?.data?.error
      || (error.response
        ? 'Une erreur est survenue lors de la requête.'
        : error.code === 'ECONNABORTED'
          ? 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants.'
          : 'Impossible de joindre le serveur. Vérifiez que l’API est démarrée et que NEXT_PUBLIC_API_URL est correctement configurée.');
    return Promise.reject({
      status: error.response?.status,
      message: Array.isArray(message) ? message.join(', ') : message,
      data: error.response?.data,
    });
  },
);

export default api;
