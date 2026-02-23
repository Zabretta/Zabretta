// lib/api/user.ts
import { fetchWithAuth } from './client';

export interface DashboardStats {
  user: {
    id: string;
    login: string;
    name: string | null;
    avatar: string | null;
    rating: number;
    activityPoints: number;
    registeredAt: string;
    lastLogin: string | null;
  };
  stats: {
    projectsCreated: number;
    mastersAdsCreated: number;
    helpRequestsCreated: number;
    libraryPostsCreated: number;
    likesGiven: number;
    likesReceived: number;
    commentsMade: number;
    commentsReceived: number;
    totalViews: number;
  };
  totalContent: number;
}

export interface UserProfile {
  id: string;
  login: string;
  name: string | null;
  avatar: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  rating: number;
  activityPoints: number;
  createdAt: string;
  lastLogin: string | null;
  content: Array<{
    id: string;
    type: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    createdAt: string;
  }>;
}

export interface UserStats {
  user: {
    id: string;
    login: string;
    name: string | null;
    rating: number;
    activityPoints: number;
    createdAt: string;
    lastLogin: string | null;
  };
  content: Record<string, number>;
  totalContent: number;
  recentRatingAdjustments: Array<{
    id: string;
    reason: string;
    ratingChange: number;
    activityChange: number;
    timestamp: string;
    adminName?: string;
  }>;
}

export interface UserActivity {
  period: string;
  activity: Array<{
    date: string;
    contentCreated: number;
    ratingChanges: number;
    totalActivity: number;
  }>;
  summary: {
    totalContent: number;
    totalRatingChanges: number;
    averageDailyActivity: number;
  };
}

export interface UserContent {
  content: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    views: number;
    likes: number;
    comments: number;
    rating: number;
    createdAt: string;
    updatedAt: string | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchUser {
  id: string;
  login: string;
  name: string | null;
  avatar: string | null;
  rating: number;
}

export interface CheckExistsResponse {
  emailExists: boolean;
  loginExists: boolean;
}

export interface PublicProfile {
  id: string;
  login: string;
  name: string | null;
  avatar: string | null;
  rating: number;
  activityPoints: number;
  createdAt: string;
  lastLogin: string | null;
  content: Array<{
    id: string;
    type: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    createdAt: string;
  }>;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
}

export const userApi = {
  /**
   * Получить данные текущего пользователя
   * GET /api/user/me
   */
  async getCurrentUser(): Promise<UserProfile> {
    return fetchWithAuth('/api/user/me');
  },

  /**
   * Обновить профиль пользователя
   * PUT /api/user/me
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    return fetchWithAuth('/api/user/me', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Изменить пароль
   * POST /api/user/change-password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: true; message: string }> {
    return fetchWithAuth('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  /**
   * Удалить аккаунт
   * POST /api/user/delete-account
   */
  async deleteAccount(confirmation: string): Promise<{ success: true; message: string }> {
    return fetchWithAuth('/api/user/delete-account', {
      method: 'POST',
      body: JSON.stringify({ confirmation })
    });
  },

  /**
   * Получить контент пользователя с фильтрацией
   * GET /api/user/content?type=PROJECT&status=ACTIVE&page=1&limit=10
   */
  async getUserContent(params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<UserContent> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    const endpoint = `/api/user/content${query ? `?${query}` : ''}`;
    
    return fetchWithAuth(endpoint);
  },

  /**
   * Получить активность пользователя за период
   * GET /api/user/activity?days=30
   */
  async getUserActivity(days: number = 30): Promise<UserActivity> {
    return fetchWithAuth(`/api/user/activity?days=${days}`);
  },

  /**
   * Получить статистику пользователя
   * GET /api/user/stats
   */
  async getUserStats(): Promise<UserStats> {
    return fetchWithAuth('/api/user/stats');
  },

  /**
   * Получить полную статистику для личного кабинета
   * GET /api/user/dashboard-stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchWithAuth('/api/user/dashboard-stats');
  },

  /**
   * Поиск пользователей
   * GET /api/user/search?q=query&limit=10
   */
  async searchUsers(query: string, limit: number = 10): Promise<SearchUser[]> {
    return fetchWithAuth(`/api/user/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  /**
   * Проверить существование пользователя (при регистрации)
   * POST /api/user/check-exists
   */
  async checkExists(data: { email?: string; login?: string }): Promise<CheckExistsResponse> {
    return fetchWithAuth('/api/user/check-exists', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Получить публичный профиль пользователя по ID
   * GET /api/user/:userId
   */
  async getUserProfile(userId: string): Promise<PublicProfile> {
    return fetchWithAuth(`/api/user/${userId}`);
  }
};