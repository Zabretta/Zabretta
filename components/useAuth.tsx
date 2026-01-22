// components/useAuth.tsx
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  login: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
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
      } catch (error) {
        console.error('❌ useAuth: ошибка загрузки данных пользователя:', error);
        logout();
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
    
    console.log('✅ useAuth: пользователь установлен в контекст');
  };

  const logout = () => {
    console.log('🚪 useAuth: выход пользователя');
    
    localStorage.removeItem('samodelkin_auth_token');
    localStorage.removeItem('samodelkin_user');
    setUser(null);
    alert('Вы успешно вышли из системы');
  };

  const isAuthenticated = !!user;

  console.log('🔄 useAuth: рендер, isAuthenticated:', isAuthenticated);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
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
