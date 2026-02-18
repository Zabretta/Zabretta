// lib/api/rules.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Rule {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
}

export interface RulesData {
  rules: Rule[];
  accepted: boolean;
  acceptedDate?: string;
}

export interface AcceptanceResponse {
  accepted: boolean;
}

export interface AcceptRulesResponse {
  acceptedDate: string;
}

export interface ResetAcceptanceResponse {
  success: boolean;
}

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('samodelkin_auth_token') || 
                  localStorage.getItem('auth_token') || 
                  localStorage.getItem('token');
    
    console.log('[rulesApi] Токен получен:', token ? '✅ есть' : '❌ нет');
    return token;
  }
  return null;
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('[rulesApi] Нет токена авторизации!');
    throw new Error('Требуется авторизация');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  console.log(`[rulesApi] Запрос: ${API_BASE}/api${endpoint}`, { method: options.method || 'GET', hasToken: !!token });

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  console.log(`[rulesApi] Ответ: ${response.status}`, response.statusText);

  if (response.status === 401) {
    console.error('[rulesApi] Ошибка 401: Неверный токен');
    throw new Error('Неверный токен');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    throw new Error(error.error || 'Ошибка запроса');
  }

  const result = await response.json();
  return result.data;
};

const fetchPublic = async (endpoint: string) => {
  console.log(`[rulesApi] Публичный запрос: ${API_BASE}/api${endpoint}`);
  
  const response = await fetch(`${API_BASE}/api${endpoint}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    throw new Error(error.error || 'Ошибка запроса');
  }

  const result = await response.json();
  return result.data;
};

export const rulesApi = {
  /**
   * Получить все правила (публичный маршрут - НЕ ТРЕБУЕТ ТОКЕНА)
   */
  getRules: async (): Promise<Rule[]> => {
    return fetchPublic('/rules');
  },

  /**
   * Проверить, принял ли пользователь правила (ТРЕБУЕТ ТОКЕН)
   */
  checkAcceptance: async (): Promise<AcceptanceResponse> => {
    return fetchWithAuth('/rules/acceptance');
  },

  /**
   * Принять правила (ТРЕБУЕТ ТОКЕН)
   */
  acceptRules: async (): Promise<AcceptRulesResponse> => {
    return fetchWithAuth('/rules/accept', {
      method: 'POST'
    });
  },

  /**
   * Сбросить принятие правил (для тестирования) (ТРЕБУЕТ ТОКЕН)
   */
  resetAcceptance: async (): Promise<ResetAcceptanceResponse> => {
    return fetchWithAuth('/rules/reset', {
      method: 'POST'
    });
  },

  /**
   * Получить правила вместе со статусом принятия (ТРЕБУЕТ ТОКЕН)
   */
  getRulesWithAcceptance: async (): Promise<RulesData> => {
    return fetchWithAuth('/rules/with-acceptance');
  }
};