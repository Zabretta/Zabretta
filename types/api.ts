// types/api.ts
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
}

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
}

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