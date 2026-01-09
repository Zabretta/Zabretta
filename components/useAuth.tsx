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
    // Проверяем сохранённую сессию при загрузке
    const token = localStorage.getItem('samodelkin_auth_token');
    const userData = localStorage.getItem('samodelkin_user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        logout();
      }
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('samodelkin_auth_token', token);
    localStorage.setItem('samodelkin_user', JSON.stringify(userData));
    setUser(userData);
    setAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('samodelkin_auth_token');
    localStorage.removeItem('samodelkin_user');
    setUser(null);
    alert('Вы успешно вышли из системы');
  };

  const isAuthenticated = !!user;

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
