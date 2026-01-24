// Типы для админ-панели
export interface AdminUser {
  id: string;
  login: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  registrationDate: string;
  lastLogin?: string;
  rating: number;
  activity: number;
  status: 'active' | 'blocked' | 'inactive';
}

export interface AdminStats {
  shownOnline: number;
  realOnline: number;
  fakeOnline: number;
  shownTotal: number;
  realTotal: number;
  fakeTotal: number;
  projectsCreated: number;
  adviceGiven: number;
  isSimulationActive: boolean;
  lastUpdate: string;
}

export interface AdminStatsHistory {
  timestamp: string;
  action: string;
  changes: Record<string, any>;
  admin: string;
}

export interface RatingAdjustment {
  userId: string;
  reason: string;
  ratingChange: number;
  activityChange: number;
  timestamp: string;
}

// Мокап данные для разработки
export const mockAdminUsers: AdminUser[] = Array.from({ length: 50 }, (_, i) => ({
  id: `user_${i + 1}`,
  login: `user${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i < 5 ? 'moderator' : 'user',
  registrationDate: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  lastLogin: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  rating: Math.floor(Math.random() * 1000),
  activity: Math.floor(Math.random() * 500),
  status: Math.random() > 0.1 ? 'active' : 'blocked'
}));
