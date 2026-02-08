// backend/src/types/api.ts
import { UserRole, TargetType, ContentType, ContentStatus } from '@prisma/client';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
}

export interface GetAdminAuditLogsParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
}

export interface AdminUser {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  rating?: number;
  activityPoints?: number;
  totalPosts?: number;
  violations?: number;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    online: number;
    byRole: Record<UserRole, number>;
  };
  content: {
    totalPosts: number;
    newToday: number;
    projects: number;
    marketItems: number;
    helpRequests: number;
    libraryPosts: number;
  };
  ratings: {
    totalGiven: number;
    todayGiven: number;
    averageRating: number;
    topUsers: Array<{
      id: string;
      name: string;
      rating: number;
      activity: number;
    }>;
  };
  system: {
    uptime: string;
    memoryUsage: number;
    responseTime: number;
    errors: number;
  };
  timeline: Array<{
    date: string;
    users: number;
    posts: number;
    ratings: number;
  }>;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: TargetType;
  targetId?: string;
  details?: Record<string, any>;
  ip?: string;
  timestamp: string;
}

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

export interface AdminViolationReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'USER' | 'POST' | 'COMMENT';
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface AdminSystemSettings {
  siteMaintenance: boolean;
  registrationEnabled: boolean;
  postingEnabled: boolean;
  ratingEnabled: boolean;
  maxFileSize: number;
  maxPostsPerDay: number;
  defaultTheme: 'LIGHT' | 'DARK' | 'AUTO';
  emailNotifications: boolean;
  security: {
    requireEmailVerification: boolean;
    enable2FA: boolean;
    sessionTimeout: number;
  };
}

export interface RatingRecord {
  id: string;
  userId: string;
  type: 'PROJECT' | 'MASTER' | 'HELP' | 'LIBRARY' | 'DAILY' | 'REGISTRATION';
  section: 'PROJECTS' | 'MASTERS' | 'HELP' | 'LIBRARY' | 'GENERAL';
  action: 'CREATE' | 'LIKE_GIVEN' | 'LIKE_RECEIVED' | 'COMMENT' | 'DAILY_LOGIN';
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

export const USER_LEVELS = [
  { min: 0, max: 200, name: "Студент", icon: "★" },
  { min: 201, max: 500, name: "Инженер", icon: "★★" },
  { min: 501, max: 1000, name: "Инженер-конструктор", icon: "★★★" },
  { min: 1001, max: 2000, name: "Профессор Сомоделкин", icon: "★★★★" },
  { min: 2001, max: Infinity, name: "Эксперт сообщества", icon: "★★★★★" }
];

export const ACTIVITY_LEVELS = [
  { min: 0, max: 100, name: "Новичок" },
  { min: 101, max: 300, name: "Активный" },
  { min: 301, max: 600, name: "Очень активный" },
  { min: 601, max: 1000, name: "Лидер активности" },
  { min: 1001, max: Infinity, name: "Легенда сообщества" }
];
