// lib/api/praise.ts
import { fetchWithAuth } from './client';

export interface CreatePraiseRequest {
  toUserId: string;
  contentId?: string;
  praiseType: 'GREAT' | 'EXCELLENT' | 'MASTER' | 'INSPIRING' | 'CREATIVE' | 'DETAILED' | 'HELPFUL' | 'THANKS';
  message?: string;
}

export interface PraiseData {
  id: string;
  fromUserId: string;
  toUserId: string;
  contentId?: string | null;
  praiseType: string;
  message?: string | null;
  createdAt: string;
  fromUser?: {
    id: string;
    login: string;
    name?: string | null;
    avatar?: string | null;
  };
  toUser?: {
    id: string;
    login: string;
    name?: string | null;
    avatar?: string | null;
  };
  content?: {
    id: string;
    title: string;
    type: string;
  } | null;
}

export interface PraisesResponse {
  praises: PraiseData[];
  total: number;
  page: number;
  limit: number;
}

export interface UserPraisesStats {
  given: number;
  received: number;
  receivedByType: Record<string, number>;
}

export const praiseApi = {
  /**
   * Создать новую похвалу
   * POST /api/praise
   */
  async createPraise(data: CreatePraiseRequest): Promise<{ praise: PraiseData }> {
    try {
      const response = await fetchWithAuth<{ praise: PraiseData }>('/api/praise', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при создании похвалы:', error);
      throw error;
    }
  },

  /**
   * Получить список похвал с фильтрацией
   * GET /api/praise
   */
  async getPraises(params?: {
    userId?: string;
    contentId?: string;
    page?: number;
    limit?: number;
  }): Promise<PraisesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.contentId) queryParams.append('contentId', params.contentId);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString();
      const endpoint = `/api/praise${query ? `?${query}` : ''}`;
      
      const response = await fetchWithAuth<PraisesResponse>(endpoint);
      return response;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при получении похвал:', error);
      throw error;
    }
  },

  /**
   * Получить похвалы текущего пользователя
   * GET /api/praise/me
   */
  async getMyPraises(params?: {
    page?: number;
    limit?: number;
  }): Promise<PraisesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString();
      const endpoint = `/api/praise/me${query ? `?${query}` : ''}`;
      
      const response = await fetchWithAuth<PraisesResponse>(endpoint);
      return response;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при получении своих похвал:', error);
      throw error;
    }
  },

  /**
   * Получить статистику похвал пользователя
   * GET /api/praise/stats/:userId
   */
  async getUserStats(userId: string): Promise<UserPraisesStats> {
    try {
      const response = await fetchWithAuth<UserPraisesStats>(`/api/praise/stats/${userId}`);
      return response;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при получении статистики:', error);
      throw error;
    }
  },

  /**
   * Проверить, хвалил ли текущий пользователь контент
   * GET /api/praise/check/:contentId
   */
  async hasUserPraised(contentId: string): Promise<{ hasPraised: boolean }> {
    try {
      const response = await fetchWithAuth<{ hasPraised: boolean }>(`/api/praise/check/${contentId}`);
      return response;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при проверке похвалы:', error);
      throw error;
    }
  },

  /**
   * Удалить похвалу (только для админов)
   * DELETE /api/praise/:praiseId
   */
  async deletePraise(praiseId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetchWithAuth<{ success: boolean }>(`/api/praise/${praiseId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при удалении похвалы:', error);
      throw error;
    }
  },

  /**
   * Получить общее количество похвал для контента
   * Утилитарный метод
   */
  async getContentPraiseCount(contentId: string): Promise<number> {
    try {
      const response = await this.getPraises({ contentId, limit: 1 });
      return response.total;
    } catch (error) {
      console.error('[PraiseAPI] Ошибка при получении количества похвал:', error);
      return 0;
    }
  }
};