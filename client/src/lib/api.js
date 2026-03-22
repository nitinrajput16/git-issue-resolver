import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: false, // no longer needed
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  console.log('API request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenLength: token?.length
  });
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Clear React Query cache to trigger re-auth check
      // Note: This requires access to queryClient, which isn't available here
      // The auth hook handles this via the useQuery staleTime/cacheTime
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;