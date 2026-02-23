// lib/api/market.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ItemType = 'sell' | 'buy' | 'free' | 'exchange' | 'auction';
export type DurationType = '2weeks' | '1month' | '2months';
export type ItemCategory = 
  | 'tools' | 'materials' | 'furniture' | 'electronics' | 'cooking'
  | 'auto' | 'sport' | 'robot' | 'handmade' | 'stolar' | 'hammer' | 'other';

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number | 'free';
  priceValue?: number;
  location: string;
  author: string;
  authorId?: string;
  rating: number;
  type: ItemType;
  imageUrl?: string;
  negotiable: boolean;
  expirationDate?: string;
  duration?: DurationType;
  createdAt?: string;
  updatedAt?: string;
  views: number;
  contacts: number;
  category?: ItemCategory;
}

export interface CreateItemData {
  title: string;
  description: string;
  price: number | 'free';
  location: string;
  type: ItemType;
  author: string;
  category?: ItemCategory;
  imageUrl?: string;
  negotiable?: boolean;
  duration: DurationType;
}

export interface ContactAuthorData {
  itemId: string;
  message: string;
  contactMethod: string;
}

export interface MarketFilters {
  type?: ItemType;
  category?: ItemCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ===== ТИПЫ ДЛЯ СООБЩЕНИЙ =====
export interface MarketMessage {
  id: string;
  parentId?: string | null;
  itemId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  read: boolean;
  contactMethod: string;
  createdAt: string;
  updatedAt: string;
  fromUser?: {
    id: string;
    login: string;
    name: string | null;
    avatar: string | null;
    phone?: string | null;        // Добавлено для контактов
    email?: string | null;        // Добавлено для контактов
    showPhone?: boolean;           // Добавлено для приватности
    showEmail?: boolean;           // Добавлено для приватности
  };
  toUser?: {
    id: string;
    login: string;
    name: string | null;
    avatar: string | null;
    phone?: string | null;        // Добавлено для контактов
    email?: string | null;        // Добавлено для контактов
    showPhone?: boolean;           // Добавлено для приватности
    showEmail?: boolean;           // Добавлено для приватности
  };
  item?: {
    id: string;
    title: string;
    price: string | number;
    imageUrl: string | null;
  };
}

export interface MessageThread {
  thread: MarketMessage[];
  otherUser: {
    id: string;
    login: string;
    name: string | null;
    avatar: string | null;
    phone: string | null;
    email: string | null;
    showPhone: boolean;            // Добавлено обязательно
    showEmail: boolean;            // Добавлено обязательно
  };
  item: {
    id: string;
    title: string;
    price: string | number;
    imageUrl: string | null;
  };
}

export interface SendReplyData {
  message: string;
}

export interface UnreadCountResponse {
  count: number;
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

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    throw new Error(error.error || 'Ошибка запроса');
  }

  const result = await response.json();
  return result.data;
};

export const marketApi = {
  /**
   * Загрузить объявления с фильтрацией
   */
  loadItems: async (filters?: MarketFilters): Promise<MarketItem[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const query = queryParams.toString();
    const endpoint = `/market/items${query ? `?${query}` : ''}`;
    
    return fetchWithAuth(endpoint);
  },

  /**
   * Создать новое объявление
   */
  createItem: async (data: CreateItemData): Promise<MarketItem> => {
    return fetchWithAuth('/market/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Связаться с автором объявления
   */
  contactAuthor: async (data: ContactAuthorData): Promise<{ success: boolean }> => {
    return fetchWithAuth('/market/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Получить объявление по ID
   */
  getItemById: async (id: string): Promise<MarketItem> => {
    return fetchWithAuth(`/market/items/${id}`);
  },

  /**
   * Удалить объявление (только для автора)
   */
  deleteItem: async (id: string): Promise<{ success: boolean }> => {
    return fetchWithAuth(`/market/items/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Обновить объявление (только для автора)
   */
  updateItem: async (id: string, data: Partial<CreateItemData>): Promise<MarketItem> => {
    return fetchWithAuth(`/market/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Получить категории
   */
  getCategories: async (): Promise<{ id: string; name: string; label: string; icon?: string }[]> => {
    return fetchWithAuth('/market/categories');
  },

  // ===== МЕТОДЫ ДЛЯ СООБЩЕНИЙ =====

  /**
   * Получить все сообщения текущего пользователя
   * GET /api/market/messages
   */
  getMessages: async (): Promise<MarketMessage[]> => {
    return fetchWithAuth('/market/messages');
  },

  /**
   * Получить переписку по сообщению
   * GET /api/market/messages/:id/thread
   */
  getMessageThread: async (messageId: string): Promise<MessageThread> => {
    try {
      const response = await fetchWithAuth(`/market/messages/${messageId}/thread`);
      
      // Проверяем структуру ответа и добавляем поля showPhone/showEmail если их нет
      if (response && response.otherUser) {
        return {
          ...response,
          otherUser: {
            id: response.otherUser.id || '',
            login: response.otherUser.login || 'Пользователь',
            name: response.otherUser.name || null,
            avatar: response.otherUser.avatar || null,
            phone: response.otherUser.phone || null,
            email: response.otherUser.email || null,
            // Гарантируем наличие полей приватности с значениями по умолчанию false
            showPhone: response.otherUser.showPhone === true ? true : false,
            showEmail: response.otherUser.showEmail === true ? true : false,
          },
          thread: response.thread || [],
          item: response.item || {
            id: '',
            title: 'Объявление',
            price: '',
            imageUrl: null
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Ошибка в getMessageThread:', error);
      throw error;
    }
  },

  /**
   * Отправить ответ на сообщение
   * POST /api/market/messages/:id/reply
   */
  sendReply: async (messageId: string, data: SendReplyData): Promise<MarketMessage> => {
    return fetchWithAuth(`/market/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Отметить сообщение как прочитанное
   * PUT /api/market/messages/:id/read
   */
  markAsRead: async (messageId: string): Promise<MarketMessage> => {
    return fetchWithAuth(`/market/messages/${messageId}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Получить количество непрочитанных сообщений
   * GET /api/market/messages/unread/count
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return fetchWithAuth('/market/messages/unread/count');
  },
};