// api/mocks-auth.ts
// ==================== СИСТЕМА АВТОРИЗАЦИИ API ====================

import { APIResponse } from './types';
import { statsAPI } from './mocks-stats';

// === ТИПЫ АВТОРИЗАЦИИ ===

export interface User {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  role?: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegistrationData {
  login: string;
  email: string;
  password: string;
  agreement: boolean;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
}

// === УТИЛИТЫ ===

const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

// === ФУНКЦИИ АВТОРИЗАЦИИ ===

// Регистрация пользователя
export const registerUser = async (userData: RegistrationData): Promise<APIResponse<User>> => {
  console.log('[API MOCKS] Регистрация пользователя:', userData);
  await simulateNetworkDelay();
  
  // Валидация логина
  if (userData.login.length < 3 || userData.login.length > 20) {
    return {
      success: false,
      error: 'Логин должен содержать от 3 до 20 символов',
      timestamp: new Date().toISOString()
    };
  }
  
  // Валидация пароля
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(userData.password)) {
    return {
      success: false,
      error: 'Пароль: минимум 8 символов, цифра + буква',
      timestamp: new Date().toISOString()
    };
  }
  
  // Проверка согласия с правилами
  if (!userData.agreement) {
    return {
      success: false,
      error: 'Необходимо принять правила сайта',
      timestamp: new Date().toISOString()
    };
  }
  
  // Определяем роль: если логин admin - даем роль админа
  const isAdmin = userData.login.toLowerCase() === 'admin';
  const isModerator = userData.login.toLowerCase() === 'moderator';
  
  // Увеличиваем счетчик реальных пользователей
  await statsAPI.incrementOnRegistration();
  
  // Создаем пользователя
  const newUser: User = {
    id: 'user_' + Date.now(),
    login: userData.login,
    email: userData.email,
    name: userData.login,
    avatar: `https://i.pravatar.cc/150?u=${userData.email}`,
    role: isAdmin ? 'admin' : (isModerator ? 'moderator' : 'user'),
    createdAt: new Date().toISOString()
  };
  
  // Сохраняем в localStorage для демонстрации
  const users = JSON.parse(localStorage.getItem('samodelkin_users') || '[]');
  users.push(newUser);
  localStorage.setItem('samodelkin_users', JSON.stringify(users));
  
  console.log('[API MOCKS] Пользователь создан:', newUser);
  
  return {
    success: true,
    data: newUser,
    timestamp: new Date().toISOString()
  };
};

// Вход пользователя
export const loginUser = async (credentials: LoginCredentials): Promise<APIResponse<{ user: User; token: string }>> => {
  console.log('[API MOCKS] Вход пользователя:', credentials.login);
  await simulateNetworkDelay();
  
  // Определяем роль: если логин admin - даем роль админа
  const isAdmin = credentials.login.toLowerCase() === 'admin';
  const isModerator = credentials.login.toLowerCase() === 'moderator';
  
  // Создаем пользователя для демонстрации
  const user: User = {
    id: isAdmin ? 'admin1' : (isModerator ? 'mod1' : 'user_' + Date.now()),
    login: credentials.login,
    email: `${credentials.login}@example.com`,
    name: credentials.login,
    avatar: `https://i.pravatar.cc/150?u=${credentials.login}`,
    role: isAdmin ? 'admin' : (isModerator ? 'moderator' : 'user'),
    createdAt: new Date().toISOString()
  };
  
  // Создаем токен
  const token = 'jwt_token_demo_' + Date.now();
  
  // Сохраняем сессию
  const session = {
    user,
    token,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem('samodelkin_session', JSON.stringify(session));
  
  console.log('[API MOCKS] Пользователь вошел:', user);
  
  return {
    success: true,
    data: { user, token },
    timestamp: new Date().toISOString()
  };
};

// Восстановление пароля
export const forgotPassword = async (email: string): Promise<APIResponse<{ emailSent: boolean }>> => {
  console.log('[API MOCKS] Запрос восстановления пароля для:', email);
  await simulateNetworkDelay();
  
  // В реальном приложении здесь была бы отправка email
  console.log('[API MOCKS] Email для восстановления отправлен на:', email);
  
  return {
    success: true,
    data: { emailSent: true },
    timestamp: new Date().toISOString()
  };
};

// Выход пользователя
export const logoutUser = async (): Promise<APIResponse<{ loggedOut: boolean }>> => {
  console.log('[API MOCKS] Выход пользователя');
  await simulateNetworkDelay();
  
  // Удаляем сессию
  localStorage.removeItem('samodelkin_session');
  
  return {
    success: true,
    data: { loggedOut: true },
    timestamp: new Date().toISOString()
  };
};

// Проверка токена
export const verifyToken = async (token: string): Promise<APIResponse<{ valid: boolean; user?: User }>> => {
  console.log('[API MOCKS] Проверка токена');
  await simulateNetworkDelay();
  
  // В демо-режиме всегда возвращаем true
  const session = localStorage.getItem('samodelkin_session');
  
  if (session) {
    const sessionData = JSON.parse(session);
    
    return {
      success: true,
      data: {
        valid: true,
        user: sessionData.user
      },
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    success: true,
    data: { valid: false },
    timestamp: new Date().toISOString()
  };
};

// Получение текущего пользователя
export const getCurrentUser = async (): Promise<APIResponse<User>> => {
  console.log('[API MOCKS] Получение текущего пользователя');
  await simulateNetworkDelay();
  
  const session = localStorage.getItem('samodelkin_session');
  
  if (session) {
    const sessionData = JSON.parse(session);
    
    return {
      success: true,
      data: sessionData.user,
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    success: false,
    error: 'Пользователь не авторизован',
    timestamp: new Date().toISOString()
  };
};

// Обновление профиля пользователя
export const updateUserProfile = async (updates: Partial<User>): Promise<APIResponse<User>> => {
  console.log('[API MOCKS] Обновление профиля:', updates);
  await simulateNetworkDelay();
  
  const session = localStorage.getItem('samodelkin_session');
  
  if (!session) {
    return {
      success: false,
      error: 'Пользователь не авторизован',
      timestamp: new Date().toISOString()
    };
  }
  
  const sessionData = JSON.parse(session);
  const updatedUser = { ...sessionData.user, ...updates };
  
  // Обновляем сессию
  sessionData.user = updatedUser;
  localStorage.setItem('samodelkin_session', JSON.stringify(sessionData));
  
  return {
    success: true,
    data: updatedUser,
    timestamp: new Date().toISOString()
  };
};

// === ЭКСПОРТ АВТОРИЗАЦИИ API ===

export const authAPI = {
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  forgotPassword,
  verifyToken,
  getCurrentUser,
  updateUserProfile
};