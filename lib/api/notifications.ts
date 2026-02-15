// app/lib/notifications.ts
// API-клиент для работы с уведомлениями

import { AdminNotification } from '@/types/admin';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Функция для получения токена
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('samodelkin_auth_token') || 
           localStorage.getItem('auth_token') || 
           localStorage.getItem('token');
  }
  return null;
};

// Общая функция для запросов с авторизацией
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Ошибка ${response.status}`);
  }

  return response.json();
};

export const notificationsApi = {
  // Получить все уведомления
  getNotifications: async (): Promise<AdminNotification[]> => {
    try {
      const result = await fetchWithAuth('/api/admin/notifications');
      return result.data || [];
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      throw error;
    }
  },

  // Пометить уведомление как прочитанное
  markAsRead: async (id: number): Promise<void> => {
    try {
      await fetchWithAuth(`/api/admin/notifications/${id}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error(`Ошибка при отметке уведомления ${id}:`, error);
      throw error;
    }
  },

  // Пометить все уведомления как прочитанные
  markAllAsRead: async (): Promise<void> => {
    try {
      await fetchWithAuth('/api/admin/notifications/read-all', {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
      throw error;
    }
  },

  // Создать новое уведомление (для тестирования)
  createNotification: async (text: string, type: AdminNotification['type'] = 'system'): Promise<AdminNotification> => {
    try {
      const result = await fetchWithAuth('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ text, type: type.toUpperCase() }),
      });
      return result.data;
    } catch (error) {
      console.error('Ошибка при создании уведомления:', error);
      throw error;
    }
  },

  // Получить количество непрочитанных уведомлений
  getUnreadCount: async (): Promise<number> => {
    try {
      const result = await fetchWithAuth('/api/admin/notifications/unread/count');
      return result.data?.count || 0;
    } catch (error) {
      console.error('Ошибка при получении количества уведомлений:', error);
      throw error;
    }
  },
};
