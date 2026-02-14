// lib/api/admin.ts
// API-клиент для всех запросов админки к бэкенду

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Типы для параметров (объявляем здесь, чтобы не зависеть от внешних файлов)
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
}

// Получение JWT токена из localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('samodelkin_auth_token') || 
           localStorage.getItem('auth_token') || 
           localStorage.getItem('token');
  }
  return null;
};

// Общая функция для HTTP-запросов с обработкой ошибок
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Обработка ошибок аутентификации - БЕЗ РЕДИРЕКТА
    if (response.status === 401) {
      throw new Error('Требуется авторизация');
    }

    // Обработка ошибок доступа
    if (response.status === 403) {
      throw new Error('Доступ запрещен. Требуются права администратора');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API ошибка ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Функции для публичных эндпоинтов (без авторизации)
const fetchPublic = async (endpoint: string) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `API ошибка ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Public API Error (${endpoint}):`, error);
    throw error;
  }
};

// ==================== ОСНОВНОЙ API ОБЪЕКТ ====================

export const adminApi = {
  // === СТАТИСТИКА ===
  getStats: async () => {
    const response = await fetchWithAuth('/admin/stats');
    return response.data;
  },

  // ИСПРАВЛЕНО: изменен путь с /admin/logs на /admin/audit-logs (как в бэкенде)
  getAuditLogs: async (params?: { limit?: number; page?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchWithAuth(`/admin/audit-logs${query}`);
    return response.data;
  },

  // === ПОЛЬЗОВАТЕЛИ ===
  getUsers: async (params?: GetUsersParams) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchWithAuth(`/admin/users${query}`);
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await fetchWithAuth(`/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, updates: any) => {
    const response = await fetchWithAuth(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data;
  },

  toggleUserBlock: async (userId: string, reason?: string) => {
    const response = await fetchWithAuth(`/admin/users/${userId}/toggle-block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data;
  },

  resetPassword: async (userId: string) => {
    const response = await fetchWithAuth('/admin/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return response.data;
  },

  // === РЕЙТИНГ (админские эндпоинты) ===
  adjustRating: async (data: {
    userId: string;
    ratingChange: number;
    activityChange: number;
    reason: string;
    adminNote?: string;
  }) => {
    const response = await fetchWithAuth('/admin/rating/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // === РЕЙТИНГ (публичные эндпоинты) ===
  getRatingLevels: async () => {
    const response = await fetchPublic('/rating/levels');
    return response.data;
  },

  getRatingDistribution: async () => {
    const response = await fetchPublic('/rating/distribution');
    return response.data;
  },

  getUserRating: async (userId: string) => {
    const response = await fetchPublic(`/rating/users/${userId}/rating`);
    return response.data;
  },

  getUserRatingStats: async (userId: string) => {
    const response = await fetchPublic(`/rating/users/${userId}/stats`);
    return response.data;
  },

  getRatingAdjustments: async (params?: { userId?: string; limit?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const response = await fetchPublic(`/rating/adjustments${query}`);
    return response.data;
  },

  // === СИСТЕМНАЯ СТАТИСТИКА ===
  getSystemStats: async () => {
    const response = await fetchPublic('/stats/system');
    return response.data;
  },

  getDailyStats: async (days: number = 7) => {
    const response = await fetchPublic(`/stats/daily?days=${days}`);
    return response.data;
  },

  getContentStats: async () => {
    const response = await fetchPublic('/stats/content');
    return response.data;
  },

  getUserActivityStats: async (userId: string) => {
    const response = await fetchPublic(`/stats/users/${userId}`);
    return response.data;
  },
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

export const apiUtils = {
  checkBackendHealth: async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  getBackendInfo: async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return await response.json();
    } catch {
      return null;
    }
  },
};
