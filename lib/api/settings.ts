// lib/api/settings.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // ← УБИРАЕМ /api ОТСЮДА

export interface SettingsData {
  theme: 'light' | 'dark' | 'auto' | 'brown';
  brightness: number;
  fontSize: number;
  showAnimations: boolean;
}

export interface SettingsResponse {
  theme: SettingsData['theme'];
  brightness: number;
  fontSize: number;
  showAnimations: boolean;
  updatedAt: string;
}

export interface SyncResponse {
  merged: SettingsResponse;
  conflicts?: string[];
}

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('samodelkin_auth_token') || 
           localStorage.getItem('auth_token') || 
           localStorage.getItem('token');
  }
  return null;
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // ВАЖНО: добавляем /api прямо здесь!
  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка запроса');
  }

  return response.json();
};

export const settingsApi = {
  // Получить настройки
  getSettings: async (): Promise<SettingsResponse> => {
    const result = await fetchWithAuth('/settings'); // ← запрос на /api/settings
    return result.data;
  },

  // Сохранить настройки
  saveSettings: async (data: Partial<SettingsData>): Promise<SettingsResponse> => {
    const result = await fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  // Синхронизировать настройки
  syncSettings: async (clientSettings: SettingsData): Promise<SyncResponse> => {
    const result = await fetchWithAuth('/settings/sync', {
      method: 'POST',
      body: JSON.stringify(clientSettings),
    });
    return result.data;
  },

  // Сбросить настройки
  resetSettings: async (): Promise<SettingsResponse> => {
    const result = await fetchWithAuth('/settings/reset', {
      method: 'POST',
    });
    return result.data;
  },
};
