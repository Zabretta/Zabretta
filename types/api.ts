// api/types.ts
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  role?: 'user' | 'moderator' | 'admin';
}

// НОВЫЕ ТИПЫ ДЛЯ МОДЕРАЦИИ
export type ModerationFlag = "BAD_WORDS" | "SPAM_LINKS" | "ALL_CAPS" | "REPETITIVE_CHARS";
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

// ОБНОВЛЕННЫЙ MarketItem
export interface MarketItem {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  location: string;
  author: string;
  contact: string;
  createdAt: string;
  images: string[];
  // НОВЫЕ ПОЛЯ ДЛЯ МОДЕРАЦИИ (опционально для обратной совместимости)
  moderationStatus?: ModerationStatus;
  moderationFlags?: ModerationFlag[];
  moderatedAt?: string;
  moderatedBy?: string;
  moderatorNote?: string;
}

// НОВЫЙ ТИП для создания объявления с полями модерации
export interface CreateMarketItemDTO {
  title: string;
  description: string;
  price: number | "free";
  location: string;
  type: "sell" | "buy" | "free" | "exchange" | "auction";
  author: string;
  category?: string | null;
  imageUrl?: string;
  negotiable?: boolean;
  duration?: "2weeks" | "1month" | "2months";
  // НОВЫЕ ПОЛЯ ДЛЯ МОДЕРАЦИИ
  moderationStatus: ModerationStatus;
  moderationFlags: ModerationFlag[];
}

// НОВЫЙ ТИП для ответа при создании объявления
export interface CreateMarketItemResponse {
  id: string;
  title: string;
  description: string;
  price: number | "free";
  location: string;
  type: string;
  author: string;
  category?: string | null;
  imageUrl?: string;
  negotiable?: boolean;
  expirationDate?: string;
  duration?: string;
  createdAt: string;
  // НОВЫЕ ПОЛЯ ДЛЯ МОДЕРАЦИИ
  moderationStatus: ModerationStatus;
  moderationFlags: ModerationFlag[];
}

// НОВЫЙ ТИП для фильтрации объявлений в админке (понадобится позже)
export interface ModerationQueueItem {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  createdAt: string;
  moderationFlags: ModerationFlag[];
  price: number | "free";
  location: string;
  type: string;
}

// Остальные типы остаются без изменений
export interface Project {
  id: number;
  title: string;
  description: string;
  author: User;
  likes: number;
  comments: number;
  views: number;
  tags: string[];
  createdAt: string;
  images: string[];
}

export interface CommunityStats {
  online: number;
  projectsCreated: number;
  adviceGiven: number;
  newUsersToday: number;
  activeProjects: number;
}

export interface RatingRecord {
  id: string;
  userId: string;
  type: 'project' | 'master' | 'help' | 'library' | 'daily' | 'registration';
  section: 'projects' | 'masters' | 'help' | 'library' | 'general';
  action: 'create' | 'like_given' | 'like_received' | 'comment' | 'daily_login';
  points: number;
  ratingPoints: number;
  activityPoints: number;
  timestamp: Date;
  targetId?: string;
}

export interface UserRating {
  userId: string;
  totalRating: number;
  totalActivity: number;
  ratingLevel: string;
  activityLevel: string;
  ratingIcon: string;
  lastDailyLogin?: Date;
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