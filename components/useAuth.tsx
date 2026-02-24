"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authAPI } from '@/lib/api/auth';
import type { User as ApiUser } from '@/lib/api/auth';

// Расширяем тип User, добавляя поля для профиля
interface ExtendedUser extends ApiUser {
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  lastLogin?: string | null;
}

interface RegisterData {
  login: string;
  email: string;
  password: string;
  agreement: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔧 ИСПРАВЛЕНО: используем переменную окружения для API
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Функция для загрузки полных данных пользователя
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      if (!token) return;

      // 🔧 ИСПРАВЛЕНО: добавляем полный URL бэкенда
      const response = await fetch(`${API_BASE}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Извлекаем данные (могут быть в result.data или в самом result)
        const userData = result.data || result;
        
        if (userData) {
          // Объединяем с существующим пользователем
          setUser(prev => prev ? { ...prev, ...userData } : userData);
          localStorage.setItem('samodelkin_user', JSON.stringify(userData));
          console.log('✅ useAuth: пользователь обновлен', userData);
        }
      } else {
        console.warn(`⚠️ useAuth: ошибка загрузки ${response.status}`);
      }
    } catch (error) {
      console.error('❌ useAuth: ошибка обновления пользователя:', error);
    }
  };

  // Проверка сессии при загрузке
  useEffect(() => {
    console.log('🔍 useAuth: проверка сохраненной сессии');
    
    const token = localStorage.getItem('samodelkin_auth_token');
    const savedUser = localStorage.getItem('samodelkin_user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ useAuth: пользователь восстановлен из localStorage:', parsedUser.id);
        setUser(parsedUser);
        
        // В фоне загружаем актуальные данные
        refreshUser();
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
        const userData = response.data.user;
        
        localStorage.setItem('samodelkin_auth_token', response.data.token);
        localStorage.setItem('samodelkin_user', JSON.stringify(userData));
        setUser(userData);
        setAuthModalOpen(false);
        
        console.log('✅ useAuth: успешный вход, роль:', userData.role);
        
        // После входа загружаем полные данные
        refreshUser();
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
        const userData = response.data.user;
        
        localStorage.setItem('samodelkin_auth_token', response.data.token);
        localStorage.setItem('samodelkin_user', JSON.stringify(userData));
        setUser(userData);
        setAuthModalOpen(false);
        
        console.log('✅ useAuth: успешная регистрация, роль:', userData.role);
        
        // После регистрации загружаем полные данные
        refreshUser();
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
      setAuthModalOpen,
      refreshUser
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