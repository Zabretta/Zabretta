// lib/api/library.ts
import { fetchWithAuth } from './client';  // 👈 ИСПРАВЛЕННЫЙ ИМПОРТ

// ========== ТИПЫ ДАННЫХ ==========

export interface LibraryItem {
  id: string;
  title: string;
  content: string;
  type: "text" | "photo" | "drawing" | "video" | "other";
  author: string;
  authorLogin: string;
  userId: string;
  contentId: string;
  date: string;
  likes: number;
  userLiked?: boolean;
  thumbnail?: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  // Статистика похвал
  praises?: {
    total: number;
    distribution: Record<string, number>;
    topEmoji: string;
    topCount: number;
  };
}

export interface LibrarySubsection {
  id: string;
  title: string;
  items: LibraryItem[];
  createdBy?: string;
  createdAt?: string;
  itemCount?: number;
}

export interface LibrarySection {
  id: string;
  title: string;
  icon: string;
  words?: string[];
  subsections: LibrarySubsection[];
  allowedTypes: ("text" | "photo" | "drawing" | "video" | "other")[];
  fileExtensions?: string[];
  maxFileSize?: number;
  itemCount?: number;
  subsectionCount?: number;
}

export interface LibraryStats {
  totalItems: number;
  totalSections: number;
  totalSubsections: number;
  byType: Record<string, number>;
  recentItems: LibraryItem[];
}

export interface CreateSubsectionData {
  title: string;
  sectionId: string;
}

export interface CreateItemData {
  title: string;
  content: string;
  type: "text" | "photo" | "drawing" | "video" | "other";
  sectionId: string;
  subsectionId: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  thumbnail?: string;
}

export interface UpdateSubsectionData {
  title?: string;
}

export interface UpdateItemData {
  title?: string;
  content?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  thumbnail?: string;
}

export interface LibraryResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

// ========== API КЛИЕНТ ==========

export const libraryApi = {
  /**
   * Получить все разделы библиотеки (стеллажи)
   * GET /api/library/sections
   */
  async getAllSections(): Promise<LibrarySection[]> {
    return fetchWithAuth('/api/library/sections');
  },

  /**
   * Получить раздел по ID
   * GET /api/library/sections/:sectionId
   */
  async getSection(sectionId: string): Promise<LibrarySection> {
    return fetchWithAuth(`/api/library/sections/${sectionId}`);
  },

  /**
   * Получить подразделы раздела
   * GET /api/library/sections/:sectionId/subsections
   */
  async getSubsections(sectionId: string): Promise<LibrarySubsection[]> {
    return fetchWithAuth(`/api/library/sections/${sectionId}/subsections`);
  },

  /**
   * Получить подраздел по ID
   * GET /api/library/subsections/:subsectionId
   */
  async getSubsection(subsectionId: string): Promise<LibrarySubsection> {
    return fetchWithAuth(`/api/library/subsections/${subsectionId}`);
  },

  /**
   * Получить элементы подраздела
   * GET /api/library/subsections/:subsectionId/items?page=1&limit=20
   */
  async getItems(
    subsectionId: string, 
    params?: { page?: number; limit?: number }
  ): Promise<LibraryResponse<LibraryItem[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const endpoint = `/api/library/subsections/${subsectionId}/items${query ? `?${query}` : ''}`;
    
    return fetchWithAuth(endpoint);
  },

  /**
   * Получить элемент по ID
   * GET /api/library/items/:itemId
   */
  async getItem(itemId: string): Promise<LibraryItem> {
    return fetchWithAuth(`/api/library/items/${itemId}`);
  },

  /**
   * Создать новый подраздел
   * POST /api/library/subsections
   */
  async createSubsection(data: CreateSubsectionData): Promise<LibrarySubsection> {
    return fetchWithAuth('/api/library/subsections', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Создать новый документ
   * POST /api/library/items
   */
  async createItem(data: CreateItemData): Promise<LibraryItem> {
    return fetchWithAuth('/api/library/items', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Обновить подраздел
   * PUT /api/library/subsections/:subsectionId
   */
  async updateSubsection(
    subsectionId: string, 
    data: UpdateSubsectionData
  ): Promise<LibrarySubsection> {
    return fetchWithAuth(`/api/library/subsections/${subsectionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Обновить документ
   * PUT /api/library/items/:itemId
   */
  async updateItem(
    itemId: string, 
    data: UpdateItemData
  ): Promise<LibraryItem> {
    return fetchWithAuth(`/api/library/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Удалить подраздел
   * DELETE /api/library/subsections/:subsectionId
   */
  async deleteSubsection(subsectionId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/library/subsections/${subsectionId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Удалить документ
   * DELETE /api/library/items/:itemId
   */
  async deleteItem(itemId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/library/items/${itemId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Поставить лайк документу
   * POST /api/library/items/:itemId/like
   */
  async likeItem(itemId: string): Promise<{ likes: number; userLiked: boolean }> {
    return fetchWithAuth(`/api/library/items/${itemId}/like`, {
      method: 'POST'
    });
  },

  /**
   * Убрать лайк с документа
   * DELETE /api/library/items/:itemId/like
   */
  async unlikeItem(itemId: string): Promise<{ likes: number; userLiked: boolean }> {
    return fetchWithAuth(`/api/library/items/${itemId}/like`, {
      method: 'DELETE'
    });
  },

  /**
   * Получить статистику библиотеки
   * GET /api/library/stats
   */
  async getStats(): Promise<LibraryStats> {
    return fetchWithAuth('/api/library/stats');
  },

  /**
   * Поиск по библиотеке
   * GET /api/library/search?q=query&type=text&page=1
   */
  async search(params: {
    q: string;
    type?: string;
    sectionId?: string;
    page?: number;
    limit?: number;
  }): Promise<LibraryResponse<LibraryItem[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.type) queryParams.append('type', params.type);
    if (params.sectionId) queryParams.append('sectionId', params.sectionId);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    return fetchWithAuth(`/api/library/search?${queryParams.toString()}`);
  },

  /**
   * Проверить права на редактирование документа
   * GET /api/library/items/:itemId/can-edit
   */
  async canEditItem(itemId: string): Promise<{ canEdit: boolean }> {
    return fetchWithAuth(`/api/library/items/${itemId}/can-edit`);
  },

  /**
   * Проверить права на редактирование подраздела
   * GET /api/library/subsections/:subsectionId/can-edit
   */
  async canEditSubsection(subsectionId: string): Promise<{ canEdit: boolean }> {
    return fetchWithAuth(`/api/library/subsections/${subsectionId}/can-edit`);
  }
};
