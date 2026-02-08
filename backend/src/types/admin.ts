// backend/src/types/admin.ts
import { UserRole, TargetType } from '@prisma/client';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  login: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    login: string;
    email: string;
    name?: string;
    role: UserRole;
  };
}

export interface RatingAdjustmentRequest {
  userId: string;
  ratingChange: number;
  activityChange: number;
  reason: string;
  adminNote?: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  rating?: number;
  activityPoints?: number;
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

export interface BulkUpdateUsersRequest {
  userIds: string[];
  updates: UserUpdateRequest;
}

export interface ResetPasswordRequest {
  userId: string;
  sendEmail?: boolean;
  generateTemporaryPassword?: boolean;
}

export interface AdminQueryParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}
