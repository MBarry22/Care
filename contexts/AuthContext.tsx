import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { authService, AuthUser } from '@/services/authService';
import { useStore } from '@/store/useStore';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentUser } = useStore();

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      const hasToken = await authService.getStoredToken();
      
      if (storedUser && hasToken) {
        setUser(storedUser);
        const storeUser = authService.convertToStoreUser(storedUser);
        setCurrentUser(storeUser);
      }
    } catch (error) {
      console.error('Auth state check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
      const storeUser = authService.convertToStoreUser(response.user);
      setCurrentUser(storeUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
      const storeUser = authService.convertToStoreUser(response.user);
      setCurrentUser(storeUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setCurrentUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        const storeUser = authService.convertToStoreUser(storedUser);
        setCurrentUser(storeUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
