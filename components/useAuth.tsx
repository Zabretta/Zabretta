"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { mockAPI } from '../api/mocks';

interface User {
  id: string;
  login: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
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

  useEffect(() => {
    console.log('🔍 useAuth: проверка сохраненной сессии');
    
    const token = localStorage.getItem('samodelkin_auth_token');
    const userData = localStorage.getItem('samodelkin_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ useAuth: пользователь восстановлен:', parsedUser.id);
        setUser(parsedUser);
        
        // Добавляем пользователя в онлайн-сессии
        mockAPI.sessions.addUserSession(parsedUser.id);
      } catch (error) {
        console.error('❌ useAuth: ошибка загрузки данных пользователя:', error);
        
        localStorage.removeItem('samodelkin_auth_token');
        localStorage.removeItem('samodelkin_user');
        setUser(null);
      }
    } else {
      console.log('👤 useAuth: нет сохраненной сессии');
    }
  }, []);

  const login = (token: string, userData: User) => {
    console.log('🔐 useAuth: вход пользователя', userData.id, userData.login);
    
    localStorage.setItem('samodelkin_auth_token', token);
    localStorage.setItem('samodelkin_user', JSON.stringify(userData));
    setUser(userData);
    setAuthModalOpen(false);
    
    // Добавляем в активные сессии
    mockAPI.sessions.addUserSession(userData.id);
    
    console.log('✅ useAuth: пользователь установлен в контекст и добавлен в сессии');
  };

  const logout = () => {
    console.log('🚪 useAuth: выход пользователя');
    
    // Удаляем из активных сессий перед выходом
    if (user) {
      mockAPI.sessions.removeUserSession(user.id);
    }
    
    localStorage.removeItem('samodelkin_auth_token');
    localStorage.removeItem('samodelkin_user');
    setUser(null);
    alert('Вы успешно вышли из системы');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  console.log('🔄 useAuth: рендер, isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      login,
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