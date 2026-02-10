// api/mocks-notifications.ts
// ==================== МОДУЛЬ МОКОВ ДЛЯ УВЕДОМЛЕНИЙ ====================

import { APIResponse } from './types';
import { AdminNotification } from '../types/admin';

// Имитация хранения уведомлений в "базе данных" (localStorage)
const NOTIFICATIONS_STORAGE_KEY = 'admin_notifications_mock';

// Функция для получения уведомлений из хранилища
const getStoredNotifications = (): AdminNotification[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Ошибка при чтении уведомлений из localStorage:', error);
  }
  
  // Если ничего нет в хранилище, возвращаем начальные данные
  const initialNotifications: AdminNotification[] = [
    { id: 1, text: 'Новый пользователь "ivanov" зарегистрировался', time: '5 мин назад', read: false, type: 'user', link: '/admin/users/user_15' },
    { id: 2, text: 'Статистика сайта успешно обновлена', time: '10 мин назад', read: true, type: 'system' },
    { id: 3, text: 'Пользователь "petrov" попросил проверку проекта', time: '15 мин назад', read: false, type: 'warning', link: '/admin/projects/45' },
    { id: 4, text: 'Завершено резервное копирование базы данных', time: '1 час назад', read: true, type: 'success' },
    { id: 5, text: 'Получено новое сообщение в обратную связь', time: '2 часа назад', read: false, type: 'user' },
    { id: 6, text: 'Обновлены правила сообщества', time: '5 часов назад', read: true, type: 'system' },
    { id: 7, text: 'Критическое обновление безопасности требуется', time: '1 день назад', read: false, type: 'warning' },
  ];
  
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialNotifications));
  return initialNotifications;
};

// Функция для сохранения уведомлений в хранилище
const saveNotifications = (notifications: AdminNotification[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Ошибка при сохранении уведомлений в localStorage:', error);
  }
};

// API для работы с уведомлениями
export const notificationsAPI = {
  // Получить все уведомления
  getNotifications: async (): Promise<APIResponse<AdminNotification[]>> => {
    console.log('[API MOCKS] Запрос уведомлений...');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200)); // Имитация задержки сети
    
    try {
      const notifications = getStoredNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      
      const mockResponse: APIResponse<AdminNotification[]> = {
        success: true,
        data: notifications,
        timestamp: new Date().toISOString()
      };
      
      console.log(`[API MOCKS] Уведомления загружены: ${notifications.length} шт. (${unreadCount} непрочитанных)`);
      return mockResponse;
      
    } catch (error) {
      console.error('[API MOCKS] Ошибка загрузки уведомлений:', error);
      
      const mockResponse: APIResponse<AdminNotification[]> = {
        success: false,
        error: 'Ошибка загрузки уведомлений',
        timestamp: new Date().toISOString()
      };
      
      return mockResponse;
    }
  },
  
  // Пометить уведомление как прочитанное
  markAsRead: async (id: number): Promise<APIResponse<{ updated: boolean }>> => {
    console.log(`[API MOCKS] Пометить уведомление #${id} как прочитанное...`);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    try {
      const notifications = getStoredNotifications();
      const notificationIndex = notifications.findIndex(n => n.id === id);
      
      if (notificationIndex === -1) {
        const mockResponse: APIResponse<{ updated: boolean }> = {
          success: false,
          error: `Уведомление с ID ${id} не найдено`,
          timestamp: new Date().toISOString()
        };
        return mockResponse;
      }
      
      notifications[notificationIndex].read = true;
      saveNotifications(notifications);
      
      const mockResponse: APIResponse<{ updated: boolean }> = {
        success: true,
        data: { updated: true },
        timestamp: new Date().toISOString()
      };
      
      console.log(`[API MOCKS] Уведомление #${id} помечено как прочитанное`);
      return mockResponse;
      
    } catch (error) {
      console.error('[API MOCKS] Ошибка обновления уведомления:', error);
      
      const mockResponse: APIResponse<{ updated: boolean }> = {
        success: false,
        error: 'Ошибка обновления уведомления',
        timestamp: new Date().toISOString()
      };
      
      return mockResponse;
    }
  },
  
  // Пометить все уведомления как прочитанные
  markAllAsRead: async (): Promise<APIResponse<{ updatedCount: number }>> => {
    console.log('[API MOCKS] Пометить все уведомления как прочитанные...');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
    
    try {
      const notifications = getStoredNotifications();
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        const mockResponse: APIResponse<{ updatedCount: number }> = {
          success: true,
          data: { updatedCount: 0 },
          timestamp: new Date().toISOString()
        };
        return mockResponse;
      }
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      saveNotifications(updatedNotifications);
      
      const mockResponse: APIResponse<{ updatedCount: number }> = {
        success: true,
        data: { updatedCount: unreadNotifications.length },
        timestamp: new Date().toISOString()
      };
      
      console.log(`[API MOCKS] Все уведомления помечены как прочитанные (${unreadNotifications.length} шт.)`);
      return mockResponse;
      
    } catch (error) {
      console.error('[API MOCKS] Ошибка обновления всех уведомлений:', error);
      
      const mockResponse: APIResponse<{ updatedCount: number }> = {
        success: false,
        error: 'Ошибка обновления уведомлений',
        timestamp: new Date().toISOString()
      };
      
      return mockResponse;
    }
  },
  
  // Создать новое уведомление (для тестирования)
  createNotification: async (text: string, type: AdminNotification['type'] = 'system'): Promise<APIResponse<AdminNotification>> => {
    console.log('[API MOCKS] Создание нового уведомления...');
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 200));
    
    try {
      const notifications = getStoredNotifications();
      const maxId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) : 0;
      const newId = maxId + 1;
      
      const newNotification: AdminNotification = {
        id: newId,
        text,
        time: 'Только что',
        read: false,
        type
      };
      
      const updatedNotifications = [newNotification, ...notifications];
      saveNotifications(updatedNotifications);
      
      const mockResponse: APIResponse<AdminNotification> = {
        success: true,
        data: newNotification,
        timestamp: new Date().toISOString()
      };
      
      console.log(`[API MOCKS] Создано новое уведомление #${newId}: ${text}`);
      return mockResponse;
      
    } catch (error) {
      console.error('[API MOCKS] Ошибка создания уведомления:', error);
      
      const mockResponse: APIResponse<AdminNotification> = {
        success: false,
        error: 'Ошибка создания уведомления',
        timestamp: new Date().toISOString()
      };
      
      return mockResponse;
    }
  }
};
