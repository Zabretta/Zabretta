"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authAPI } from '@/lib/api/auth';
import type { User as ApiUser } from '@/lib/api/auth';

interface User {
  id: string;
  login: string;
  email: string;
  role?: string;
}

interface RegisterData {
  login: string;
  email: string;
  password: string;
  agreement: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка сессии при загрузке - ТОЛЬКО ИЗ LOCALSTORAGE!
  useEffect(() => {
    console.log('🔍 useAuth: проверка сохраненной сессии');
    
    const token = localStorage.getItem('samodelkin_auth_token');
    const savedUser = localStorage.getItem('samodelkin_user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ useAuth: пользователь восстановлен из localStorage:', parsedUser.id, 'роль:', parsedUser.role);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ useAuth: ошибка загрузки пользователя:', error);
        localStorage.removeItem('samodelkin_auth_token');
        localStorage.removeItem('samodelkin_user');
      }
    } else {
      console.log('👤 useAuth: нет сохраненной сессии');
    }
    
    setIsLoading(false);
  }, []);

  const login = async (login: string, password: string): Promise<boolean> => {
    console.log('🔐 useAuth: вход пользователя', login);
    
    try {
      const response = await authAPI.login({ login, password });
      
      if (response.success && response.data) {
        const apiUser = response.data.user;
        const userData: User = {
          id: apiUser.id,
          login: apiUser.login,
          email: apiUser.email,
          role: apiUser.role
        };
        
        localStorage.setItem('samodelkin_auth_token', response.data.token);
        localStorage.setItem('samodelkin_user', JSON.stringify(userData));
        setUser(userData);
        setAuthModalOpen(false);
        
        console.log('✅ useAuth: успешный вход, роль:', apiUser.role);
        return true;
      } else {
        console.error('❌ useAuth: ошибка входа', response.error);
        alert(response.error || 'Ошибка входа');
        return false;
      }
    } catch (error) {
      console.error('❌ useAuth: ошибка сети', error);
      alert('Не удалось подключиться к серверу');
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    console.log('📝 useAuth: регистрация пользователя', data.login);
    
    try {
      const response = await authAPI.register(data);
      
      if (response.success && response.data) {
        const apiUser = response.data.user;
        const userData: User = {
          id: apiUser.id,
          login: apiUser.login,
          email: apiUser.email,
          role: apiUser.role
        };
        
        localStorage.setItem('samodelkin_auth_token', response.data.token);
        localStorage.setItem('samodelkin_user', JSON.stringify(userData));
        setUser(userData);
        setAuthModalOpen(false);
        
        console.log('✅ useAuth: успешная регистрация, роль:', apiUser.role);
        return true;
      } else {
        console.error('❌ useAuth: ошибка регистрации', response.error);
        alert(response.error || 'Ошибка регистрации');
        return false;
      }
    } catch (error) {
      console.error('❌ useAuth: ошибка сети', error);
      alert('Не удалось подключиться к серверу');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    console.log('🚪 useAuth: выход пользователя');
    
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('samodelkin_auth_token');
      localStorage.removeItem('samodelkin_user');
      setUser(null);
      setAuthModalOpen(false);
      alert('Вы успешно вышли из системы');
    }
  };

  const isAuthenticated = !!user;
  // ИСПРАВЛЕНО: сравниваем в нижнем регистре
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  console.log('🔄 useAuth: рендер, isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'роль:', user?.role);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      authModalOpen,
      setAuthModalOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}