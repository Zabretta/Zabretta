"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authAPI } from '@/lib/api/auth';
import type { User as ApiUser } from '@/lib/api/auth';
import io, { Socket } from 'socket.io-client';

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
  isModerator: boolean; // 👈 ДОБАВЛЕНО
  isLoading: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  refreshUser: () => Promise<void>;
  onlineCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  // 👇 Инициализация WebSocket при авторизации (ИСПРАВЛЕНО)
  useEffect(() => {
    if (user && !socket) {
      const token = localStorage.getItem('samodelkin_auth_token');
      
      if (!token) {
        console.log('⚠️ Нет токена для WebSocket подключения');
        return;
      }
      
      console.log('🔌 Подключение к WebSocket с токеном');
      
      // Подключаемся к WebSocket с токеном в auth
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token // ✅ Передаем токен при подключении!
        },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('🔌 WebSocket подключен, socket id:', newSocket.id);
        
        // Отправляем информацию о пользователе (для получения login)
        // Сервер уже знает userId из токена, но не знает login
        newSocket.emit('user-online', {
          userId: user.id,
          login: user.login
        });
      });

      newSocket.on('online-count', (count: number) => {
        console.log('👥 Онлайн пользователей:', count);
        setOnlineCount(count);
      });

      newSocket.on('force-disconnect', (message: string) => {
        console.log('⚠️ Принудительное отключение:', message);
        alert(message);
        logout();
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket отключен, причина:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Ошибка подключения WebSocket:', error.message);
        
        // Если ошибка аутентификации - пробуем обновить токен
        if (error.message.includes('Authentication error')) {
          console.log('⚠️ Ошибка аутентификации WebSocket, пробуем обновить токен');
          refreshUser(); // Обновляем данные пользователя и токен
        }
      });

      newSocket.on('error', (error: Error) => {
        console.error('❌ WebSocket ошибка:', error);
      });

      setSocket(newSocket);
    }

    // Очистка при размонтировании
    return () => {
      if (socket) {
        console.log('🧹 Отключаем WebSocket при размонтировании');
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [user]); // Зависимость от user - переподключаемся при смене пользователя

  // Функция для загрузки полных данных пользователя
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data || result;
        
        if (userData) {
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
    
    // Отправляем событие о выходе на сервер
    if (socket) {
      socket.emit('user-logout');
      socket.disconnect();
      setSocket(null);
    }
    
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      localStorage.removeItem('samodelkin_auth_token');
      localStorage.removeItem('samodelkin_user');
      setUser(null);
      setAuthModalOpen(false);
      setOnlineCount(0);
      alert('Вы успешно вышли из системы');
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isModerator = user?.role?.toUpperCase() === 'MODERATOR'; // 👈 ДОБАВЛЕНО

  console.log('🔄 useAuth: рендер, isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'isModerator:', isModerator, 'роль:', user?.role);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      isModerator, // 👈 ДОБАВЛЕНО В VALUE
      isLoading,
      login,
      register,
      logout,
      authModalOpen,
      setAuthModalOpen,
      refreshUser,
      onlineCount
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