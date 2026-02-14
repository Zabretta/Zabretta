// lib/api/auth.ts
import { apiClient } from './client';

export interface User {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterData {
  login: string;
  email: string;
  password: string;
  agreement: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

class AuthAPI {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      
      if (response.success && response.data?.token) {
        apiClient.setToken(response.data.token);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Ошибка входа'
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
      
      if (response.success && response.data?.token) {
        apiClient.setToken(response.data.token);
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Ошибка регистрации'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.setToken(null);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: User }>('/api/auth/me');
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }
    
    return null;
  }
}

export const authAPI = new AuthAPI();