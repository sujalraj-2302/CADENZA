import axios from 'axios';

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${apiHost}:5000/api`,
  withCredentials: true, // send/receive the httpOnly auth cookie
});

export default api;
