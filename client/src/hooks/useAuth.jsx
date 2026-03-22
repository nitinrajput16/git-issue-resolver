import { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) return null;
      try {
        const res = await axios.get(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.user;
      } catch (err) {
        console.error('Auth check failed:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        });
        localStorage.removeItem('auth_token');
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Clear cache when auth token changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        queryClient.clear();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    queryClient.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user: data ?? null, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
