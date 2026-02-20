// lib/api/notifications.ts
// API-клиент для работы с уведомлениями (пользовательские + админские)

// Типы для пользовательских уведомлений
export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'MESSAGE' | 'SYSTEM' | 'ACHIEVEMENT';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Типы для уведомлений в админке
export interface AdminNotification {
  id: number;
  userId: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
  user?: {
    login: string;
    name?: string;
  };
}

// Типы для настроек уведомлений
export interface NotificationSettings {
  emailEnabled: boolean;
  emailLikes: boolean;
  emailComments: boolean;
  emailMessages: boolean;
  pushEnabled: boolean;
  pushLikes: boolean;
  pushComments: boolean;
  pushMessages: boolean;
  siteLikes: boolean;
  siteComments: boolean;
  siteMessages: boolean;
}

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
    const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    throw new Error(error.error || `Ошибка ${response.status}`);
  }

  const result = await response.json();
  return result.data;
};

// ========== ОБЩИЙ API ДЛЯ УВЕДОМЛЕНИЙ ==========
export const notificationsApi = {
  // ===== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (User) =====
  
  /**
   * Получить уведомления текущего пользователя
   */
  async getMyNotifications(params?: {
    type?: string;
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.read !== undefined) queryParams.append('read', String(params.read));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const endpoint = `/api/notifications${query ? `?${query}` : ''}`;
    
    return fetchWithAuth(endpoint);
  },

  /**
   * Получить количество непрочитанных уведомлений для текущего пользователя
   */
  async getMyUnreadCount(): Promise<number> {
    try {
      const result = await fetchWithAuth('/api/notifications/unread-count');
      return result.count || 0;
    } catch (error) {
      console.error('Ошибка при получении количества уведомлений:', error);
      return 0;
    }
  },

  /**
   * Отметить своё уведомление как прочитанное
   */
  async markMyAsRead(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/notifications/${id}/read`, {
      method: 'POST'
    });
  },

  /**
   * Отметить все свои уведомления как прочитанные
   */
  async markMyAllAsRead(): Promise<{ success: boolean }> {
    return fetchWithAuth('/api/notifications/read-all', {
      method: 'POST'
    });
  },

  /**
   * Удалить своё уведомление
   */
  async deleteMyNotification(id: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Получить настройки уведомлений текущего пользователя
   */
  async getMySettings(): Promise<NotificationSettings> {
    return fetchWithAuth('/api/notifications/settings');
  },

  /**
   * Обновить настройки уведомлений текущего пользователя
   */
  async updateMySettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return fetchWithAuth('/api/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // ===== МЕТОДЫ ДЛЯ АДМИНИСТРАТОРОВ (Admin) =====

  /**
   * Получить все уведомления (для админки)
   */
  async getAllNotifications(): Promise<AdminNotification[]> {
    try {
      const result = await fetchWithAuth('/api/admin/notifications');
      return result || [];
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      throw error;
    }
  },

  /**
   * Пометить уведомление как прочитанное (для админки)
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await fetchWithAuth(`/api/admin/notifications/${id}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error(`Ошибка при отметке уведомления ${id}:`, error);
      throw error;
    }
  },

  /**
   * Пометить все уведомления как прочитанные (для админки)
   */
  async markAllAsRead(): Promise<void> {
    try {
      await fetchWithAuth('/api/admin/notifications/read-all', {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
      throw error;
    }
  },

  /**
   * Создать новое уведомление (для тестирования или рассылки)
   */
  async createNotification(text: string, type: AdminNotification['type'] = 'system'): Promise<AdminNotification> {
    try {
      const result = await fetchWithAuth('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ text, type: type.toUpperCase() }),
      });
      return result;
    } catch (error) {
      console.error('Ошибка при создании уведомления:', error);
      throw error;
    }
  },

  /**
   * Получить количество непрочитанных уведомлений для админки
   */
  async getAdminUnreadCount(): Promise<number> {
    try {
      const result = await fetchWithAuth('/api/admin/notifications/unread/count');
      return result?.count || 0;
    } catch (error) {
      console.error('Ошибка при получении количества уведомлений:', error);
      return 0;
    }
  },

  /**
   * Отправить массовую рассылку уведомлений (для админки)
   */
  async sendBulkNotification(data: {
    userIds?: string[];
    all?: boolean;
    type: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<{ success: boolean; count: number }> {
    return fetchWithAuth('/api/admin/notifications/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Получить статистику по уведомлениям (для админки)
   */
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    return fetchWithAuth('/api/admin/notifications/stats');
  }
};
