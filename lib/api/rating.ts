// lib/api/rating.ts
import { fetchWithAuth } from './client';

// Типы для действий с рейтингом
export type RatingSection = 
  | 'projects' 
  | 'masters' 
  | 'help' 
  | 'library' 
  | 'general';

export type RatingAction = 
  | 'create'           // Создание контента
  | 'like_given'       // Поставить лайк
  | 'like_received'    // Получить лайк
  | 'comment'          // Оставить комментарий
  | 'daily_login'      // Ежедневный вход
  | 'registration';    // Регистрация

// Интерфейс для параметров начисления баллов
export interface AwardPointsParams {
  action: RatingAction;
  section?: RatingSection;  // Опционально, для точного поиска формулы
  targetId?: string;        // ID созданного объекта (проекта, комментария и т.д.)
}

// Интерфейс для результата начисления
export interface AwardPointsResult {
  awarded: boolean;
  ratingChange: number;
  activityChange: number;
  message: string;
}

// Интерфейс для рейтинга пользователя (из API)
export interface UserRating {
  userId: string;
  totalRating: number;
  totalActivity: number;
  ratingLevel: string;
  activityLevel: string;
  ratingIcon: string;
  lastDailyLogin?: string;
  stats: {
    projectsCreated: number;
    mastersAdsCreated: number;
    helpRequestsCreated: number;
    libraryPostsCreated: number;
    likesGiven: number;
    likesReceived: number;
    commentsMade: number;
  };
}

// Интерфейс для записи в истории
export interface RatingAdjustment {
  id: string;
  userId: string;
  reason: string;
  ratingChange: number;
  activityChange: number;
  adminId?: string;
  adminNote?: string;
  timestamp: string;
}

// Интерфейс для уровней рейтинга
export interface RatingLevels {
  userLevels: Array<{
    min: number;
    max: number;
    name: string;
    icon: string;
  }>;
  activityLevels: Array<{
    min: number;
    max: number;
    name: string;
  }>;
  formulas: Array<{
    section: string;
    action: string;
    ratingPoints: number;
    activityPoints: number;
    description: string;
  }>;
}

/**
 * API для работы с рейтинговой системой
 * 
 * @example
 * // Начислить баллы за создание проекта
 * await ratingApi.awardPoints({ 
 *   action: 'create', 
 *   section: 'projects',
 *   targetId: 'project_123' 
 * });
 * 
 * @example
 * // Получить свой рейтинг
 * const myRating = await ratingApi.getMyRating();
 */
export const ratingApi = {
  /**
   * Начислить баллы пользователю за действие
   * Эту функцию будут вызывать все будущие разделы сайта
   */
  async awardPoints(params: AwardPointsParams): Promise<AwardPointsResult> {
    try {
      const response = await fetchWithAuth<{ data: AwardPointsResult }>('/api/rating/award', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка начисления баллов:', error);
      throw error;
    }
  },

  /**
   * Получить рейтинг текущего пользователя
   */
  async getMyRating(): Promise<UserRating> {
    try {
      const response = await fetchWithAuth<{ data: UserRating }>('/api/rating/my-rating');
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения рейтинга:', error);
      throw error;
    }
  },

  /**
   * Получить рейтинг пользователя по ID
   */
  async getUserRating(userId: string): Promise<UserRating> {
    try {
      const response = await fetchWithAuth<{ data: UserRating }>(`/api/rating/users/${userId}/rating`);
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения рейтинга пользователя:', error);
      throw error;
    }
  },

  /**
   * Получить историю начислений текущего пользователя
   */
  async getMyRatingHistory(limit?: number): Promise<{ adjustments: RatingAdjustment[]; total: number }> {
    try {
      const query = limit ? `?limit=${limit}` : '';
      const response = await fetchWithAuth<{ data: { adjustments: RatingAdjustment[]; total: number } }>(
        `/api/rating/my-history${query}`
      );
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения истории:', error);
      throw error;
    }
  },

  /**
   * Получить историю начислений пользователя по ID (для админки)
   */
  async getUserRatingHistory(userId: string, limit?: number): Promise<{ adjustments: RatingAdjustment[]; total: number }> {
    try {
      const query = limit ? `?limit=${limit}` : '';
      const response = await fetchWithAuth<{ data: { adjustments: RatingAdjustment[]; total: number } }>(
        `/api/rating/adjustments?userId=${userId}${query}`
      );
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения истории пользователя:', error);
      throw error;
    }
  },

  /**
   * Получить топ пользователей по рейтингу
   */
  async getTopUsers(limit: number = 30): Promise<UserRating[]> {
    try {
      const response = await fetchWithAuth<{ data: { ratings: UserRating[] } }>(
        `/api/rating/all?sortBy=rating_desc&limit=${limit}`
      );
      return response.data.ratings;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения топа пользователей:', error);
      throw error;
    }
  },

  /**
   * Получить топ пользователей по активности
   */
  async getMostActiveUsers(limit: number = 30): Promise<UserRating[]> {
    try {
      const response = await fetchWithAuth<{ data: { ratings: UserRating[] } }>(
        `/api/rating/all?sortBy=activity_desc&limit=${limit}`
      );
      return response.data.ratings;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения активных пользователей:', error);
      throw error;
    }
  },

  /**
   * Получить уровни и формулы рейтинга
   */
  async getRatingLevels(): Promise<RatingLevels> {
    try {
      const response = await fetchWithAuth<{ data: RatingLevels }>('/api/rating/levels');
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения уровней:', error);
      throw error;
    }
  },

  /**
   * Получить распределение пользователей по уровням
   */
  async getRatingDistribution(): Promise<any> {
    try {
      const response = await fetchWithAuth<{ data: any }>('/api/rating/distribution');
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения распределения:', error);
      throw error;
    }
  },

  /**
   * Получить статистику рейтинга пользователя
   */
  async getUserRatingStats(userId: string): Promise<{
    rating: UserRating;
    recentAdjustments: RatingAdjustment[];
    adjustmentStats: {
      totalRatingChanges: number;
      totalActivityChanges: number;
      positiveAdjustments: number;
      negativeAdjustments: number;
    };
  }> {
    try {
      const response = await fetchWithAuth<{ data: any }>(`/api/rating/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка получения статистики:', error);
      throw error;
    }
  },

  /**
   * Проверить, доступен ли бонус за ежедневный вход
   */
  async checkDailyBonus(): Promise<{
    canGetBonus: boolean;
    lastLogin: string | null;
    alreadyReceived: boolean;
  }> {
    try {
      const response = await fetchWithAuth<{ data: any }>('/api/rating/check-daily-bonus');
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка проверки бонуса:', error);
      throw error;
    }
  },

  /**
   * Поиск пользователей по рейтингу (для админки)
   */
  async searchUsers(params: {
    minRating?: number;
    maxRating?: number;
    minActivity?: number;
    maxActivity?: number;
    search?: string;
  }): Promise<{
    users: UserRating[];
    total: number;
    averageRating: number;
    averageActivity: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params.maxRating) queryParams.append('maxRating', params.maxRating.toString());
      if (params.minActivity) queryParams.append('minActivity', params.minActivity.toString());
      if (params.maxActivity) queryParams.append('maxActivity', params.maxActivity.toString());
      if (params.search) queryParams.append('search', params.search);
      
      const response = await fetchWithAuth<{ data: any }>(
        `/api/rating/search?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('[RatingAPI] Ошибка поиска пользователей:', error);
      throw error;
    }
  }
};

// Экспортируем также типы для удобства
export type { AwardPointsParams as RatingAwardParams };