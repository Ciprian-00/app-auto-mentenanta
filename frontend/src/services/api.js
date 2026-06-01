import axios from 'axios';

// URL-ul backend-ului: în producție vine din REACT_APP_API_URL,
// iar local cade pe localhost.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const method = error?.config?.method?.toUpperCase();
    const url = error?.config?.url;
    // url e relativ la baseURL, dar suficient ca să identifici endpoint-ul
    // (backend logs rămân sursa adevărului, dar asta ne dă rapid context în browser console)
    console.error('[API ERROR]', { status, method, url, data: error?.response?.data });
    return Promise.reject(error);
  }
);

export default api;
