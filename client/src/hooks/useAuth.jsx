import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || ''}/auth/me`, { withCredentials: true });
      return res.data.user;
    },
    retry: false,
  });

  const logout = async () => {
    await axios.post(`${import.meta.env.VITE_API_URL || ''}/auth/logout`, {}, { withCredentials: true });
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
