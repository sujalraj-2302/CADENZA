import axios from 'axios';

const defaultApiUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true,
});

export default api;
