// api/mocks-admin.ts
// ==================== АДМИН-ПАНЕЛЬ API ====================

import { APIResponse } from './types';

// === ТИПЫ ДЛЯ АДМИН-ПАНЕЛИ ===

export interface AdminUser {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
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
    byRole: {
      admin: number;
      moderator: number;
      user: number;
    };
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
  targetType: 'user' | 'post' | 'rating' | 'system' | 'content';
  targetId?: string;
  details?: Record<string, any>;
  ip?: string;
  timestamp: string;
}

export interface AdminViolationReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'user' | 'post' | 'comment';
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
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
  defaultTheme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  security: {
    requireEmailVerification: boolean;
    enable2FA: boolean;
    sessionTimeout: number;
  };
}

// === ТИПЫ ДЛЯ РЕЙТИНГА ===

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

export interface RatingAdjustment {
  userId: string;
  reason: string;
  ratingChange: number;
  activityChange: number;
  timestamp: string;
  adminId?: string;
  adminNote?: string;
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

export const mockRatingRecords: RatingRecord[] = [];
export const mockRatings: UserRating[] = [];

// === МОКИ ДЛЯ АДМИН-ПАНЕЛИ ===

const mockAdminUsers: AdminUser[] = [
  {
    id: 'admin1',
    login: 'admin',
    email: 'admin@samodelkin.ru',
    name: 'Главный Админ',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-03-15T14:30:00Z',
    rating: 2450,
    activityPoints: 1200,
    totalPosts: 45,
    violations: 0
  },
  {
    id: 'mod1',
    login: 'moderator',
    email: 'mod@samodelkin.ru',
    name: 'Модератор Иван',
    role: 'moderator',
    isActive: true,
    createdAt: '2024-02-01T11:00:00Z',
    lastLogin: '2024-03-15T13:45:00Z',
    rating: 1800,
    activityPoints: 950,
    totalPosts: 32,
    violations: 2
  },
  {
    id: 'user1',
    login: 'kulibin',
    email: 'user1@example.com',
    name: 'Иван Кулибин',
    role: 'user',
    isActive: true,
    createdAt: '2024-02-10T09:00:00Z',
    lastLogin: '2024-03-15T12:15:00Z',
    rating: 1250,
    activityPoints: 620,
    totalPosts: 18,
    violations: 0
  },
  {
    id: 'user2',
    login: 'master',
    email: 'user2@example.com',
    name: 'Мастер Самоделкин',
    role: 'user',
    isActive: true,
    createdAt: '2024-02-12T14:00:00Z',
    lastLogin: '2024-03-14T16:45:00Z',
    rating: 950,
    activityPoints: 480,
    totalPosts: 12,
    violations: 1
  },
  {
    id: 'user3',
    login: 'novice',
    email: 'user3@example.com',
    name: 'Новичок Петров',
    role: 'user',
    isActive: false,
    createdAt: '2024-03-01T10:00:00Z',
    lastLogin: '2024-03-10T11:30:00Z',
    rating: 150,
    activityPoints: 80,
    totalPosts: 3,
    violations: 0
  }
];

const mockAuditLogs: AdminAuditLog[] = [
  {
    id: 'log1',
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'USER_ROLE_CHANGED',
    targetType: 'user',
    targetId: 'user2',
    details: { from: 'user', to: 'moderator' },
    timestamp: '2024-03-15T10:30:00Z'
  },
  {
    id: 'log2',
    userId: 'mod1',
    userName: 'Модератор Иван',
    action: 'POST_DELETED',
    targetType: 'post',
    targetId: 'post123',
    details: { reason: 'Нарушение правил' },
    timestamp: '2024-03-15T09:15:00Z'
  },
  {
    id: 'log3',
    userId: 'user1',
    userName: 'Иван Кулибин',
    action: 'POST_CREATED',
    targetType: 'post',
    targetId: 'post124',
    details: { type: 'project', title: 'Новый проект' },
    timestamp: '2024-03-14T16:45:00Z'
  },
  {
    id: 'log4',
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'SYSTEM_SETTINGS_UPDATED',
    targetType: 'system',
    details: { setting: 'siteMaintenance', value: false },
    timestamp: '2024-03-14T14:20:00Z'
  },
  {
    id: 'log5',
    userId: 'user2',
    userName: 'Мастер Самоделкин',
    action: 'VIOLATION_REPORTED',
    targetType: 'user',
    targetId: 'user3',
    details: { reason: 'Спам' },
    timestamp: '2024-03-14T11:10:00Z'
  }
];

const mockViolationReports: AdminViolationReport[] = [
  {
    id: 'viol1',
    reporterId: 'user1',
    reporterName: 'Иван Кулибин',
    targetId: 'user3',
    targetType: 'user',
    reason: 'Оскорбительные комментарии',
    status: 'resolved',
    createdAt: '2024-03-14T10:00:00Z',
    resolvedAt: '2024-03-14T12:00:00Z',
    resolvedBy: 'mod1',
    notes: 'Пользователь предупрежден'
  },
  {
    id: 'viol2',
    reporterId: 'user2',
    reporterName: 'Мастер Самоделкин',
    targetId: 'post123',
    targetType: 'post',
    reason: 'Некорректная категория',
    status: 'pending',
    createdAt: '2024-03-15T09:30:00Z'
  },
  {
    id: 'viol3',
    reporterId: 'mod1',
    reporterName: 'Модератор Иван',
    targetId: 'user4',
    targetType: 'user',
    reason: 'Множественный спам',
    status: 'reviewed',
    createdAt: '2024-03-13T15:45:00Z',
    resolvedBy: 'admin1',
    notes: 'Требуется проверка админа'
  }
];

const mockSystemSettings: AdminSystemSettings = {
  siteMaintenance: false,
  registrationEnabled: true,
  postingEnabled: true,
  ratingEnabled: true,
  maxFileSize: 10, // MB
  maxPostsPerDay: 20,
  defaultTheme: 'auto',
  emailNotifications: true,
  security: {
    requireEmailVerification: false,
    enable2FA: false,
    sessionTimeout: 24 // hours
  }
};

// История корректировок рейтинга
const mockRatingAdjustments: RatingAdjustment[] = [
  {
    userId: 'user1',
    reason: 'Награда за активность в сообществе',
    ratingChange: 50,
    activityChange: 0,
    timestamp: '2024-03-10T14:30:00Z',
    adminId: 'admin1',
    adminNote: 'За помощь новичкам в чате'
  },
  {
    userId: 'user2',
    reason: 'Корректировка после ошибки системы',
    ratingChange: -20,
    activityChange: 10,
    timestamp: '2024-03-09T11:15:00Z',
    adminId: 'mod1',
    adminNote: 'Исправлен баг с начислением очков'
  },
  {
    userId: 'user3',
    reason: 'Поощрение за помощь новичкам',
    ratingChange: 30,
    activityChange: 20,
    timestamp: '2024-03-08T16:45:00Z',
    adminId: 'admin1',
    adminNote: 'Подробный ответ на вопрос в разделе помощи'
  }
];

// === ОБЩИЕ УТИЛИТЫ ===

const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

// === ФУНКЦИИ АДМИН-ПАНЕЛИ ===

// Получение статистики для админ-панели
export const getAdminStats = async (): Promise<APIResponse<AdminStats>> => {
  await simulateNetworkDelay();
  
  const adminStats: AdminStats = {
    users: {
      total: 1542,
      active: 1234,
      newToday: 12,
      online: 156,
      byRole: {
        admin: 3,
        moderator: 8,
        user: 1531
      }
    },
    content: {
      totalPosts: 8921,
      newToday: 47,
      projects: 4521,
      marketItems: 2876,
      helpRequests: 1234,
      libraryPosts: 290
    },
    ratings: {
      totalGiven: 45789,
      todayGiven: 134,
      averageRating: 4.2,
      topUsers: [
        { id: 'user1', name: 'Иван Кулибин', rating: 2450, activity: 1200 },
        { id: 'user2', name: 'Мастер Самоделкин', rating: 2180, activity: 1050 },
        { id: 'admin1', name: 'Главный Админ', rating: 2450, activity: 1200 }
      ]
    },
    system: {
      uptime: '99.8%',
      memoryUsage: 65,
      responseTime: 120,
      errors: 3
    },
    timeline: [
      { date: '2024-03-10', users: 1500, posts: 210, ratings: 890 },
      { date: '2024-03-11', users: 1510, posts: 198, ratings: 920 },
      { date: '2024-03-12', users: 1518, posts: 234, ratings: 1010 },
      { date: '2024-03-13', users: 1525, posts: 189, ratings: 870 },
      { date: '2024-03-14', users: 1532, posts: 256, ratings: 1120 },
      { date: '2024-03-15', users: 1542, posts: 247, ratings: 1340 }
    ]
  };
  
  return {
    success: true,
    data: adminStats,
    timestamp: new Date().toISOString()
  };
};

// Получение списка пользователей
export const getAdminUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
}): Promise<APIResponse<{ users: AdminUser[]; total: number; page: number }>> => {
  await simulateNetworkDelay();
  
  let filteredUsers = [...mockAdminUsers];
  
  // Фильтрация по роли
  if (params?.role && params.role !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === params.role);
  }
  
  // Поиск
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.name?.toLowerCase().includes(searchLower) ||
      user.login.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Сортировка
  if (params?.sortBy) {
    filteredUsers.sort((a, b) => {
      switch (params.sortBy) {
        case 'rating_desc': return (b.rating || 0) - (a.rating || 0);
        case 'rating_asc': return (a.rating || 0) - (b.rating || 0);
        case 'activity_desc': return (b.activityPoints || 0) - (a.activityPoints || 0);
        case 'activity_asc': return (a.activityPoints || 0) - (b.activityPoints || 0);
        case 'date_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default: return 0;
      }
    });
  }
  
  // Пагинация
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const startIndex = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);
  
  return {
    success: true,
    data: {
      users: paginatedUsers,
      total: filteredUsers.length,
      page
    },
    timestamp: new Date().toISOString()
  };
};

// Обновление пользователя (для UserEditModal)
export const updateAdminUser = async (
  userId: string, 
  updates: Partial<AdminUser>
): Promise<APIResponse<AdminUser>> => {
  await simulateNetworkDelay();
  
  const userIndex = mockAdminUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Пользователь не найден',
      timestamp: new Date().toISOString()
    };
  }
  
  // Сохраняем старые значения для аудита
  const oldUser = { ...mockAdminUsers[userIndex] };
  
  // Обновляем пользователя
  mockAdminUsers[userIndex] = { ...mockAdminUsers[userIndex], ...updates };
  
  // Логируем действие
  const changes: Record<string, any> = {};
  
  if (updates.name !== undefined && updates.name !== oldUser.name) {
    changes.name = { from: oldUser.name, to: updates.name };
  }
  if (updates.email !== undefined && updates.email !== oldUser.email) {
    changes.email = { from: oldUser.email, to: updates.email };
  }
  if (updates.role !== undefined && updates.role !== oldUser.role) {
    changes.role = { from: oldUser.role, to: updates.role };
  }
  if (updates.isActive !== undefined && updates.isActive !== oldUser.isActive) {
    changes.status = { from: oldUser.isActive ? 'active' : 'blocked', to: updates.isActive ? 'active' : 'blocked' };
  }
  
  mockAuditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin1', // Текущий админ
    userName: 'Главный Админ',
    action: 'USER_UPDATED',
    targetType: 'user',
    targetId: userId,
    details: { changes, ...updates },
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    data: mockAdminUsers[userIndex],
    timestamp: new Date().toISOString()
  };
};

// Получение аудит-логов
export const getAdminAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
}): Promise<APIResponse<{ logs: AdminAuditLog[]; total: number }>> => {
  await simulateNetworkDelay();
  
  let filteredLogs = [...mockAuditLogs];
  
  // Фильтрация по пользователю
  if (params?.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === params.userId);
  }
  
  // Фильтрация по действию
  if (params?.action) {
    filteredLogs = filteredLogs.filter(log => log.action === params.action);
  }
  
  // Пагинация
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);
  
  return {
    success: true,
    data: {
      logs: paginatedLogs,
      total: filteredLogs.length
    },
    timestamp: new Date().toISOString()
  };
};

// Получение репортов о нарушениях
export const getAdminViolations = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<APIResponse<{ reports: AdminViolationReport[]; total: number }>> => {
  await simulateNetworkDelay();
  
  let filteredReports = [...mockViolationReports];
  
  // Фильтрация по статусу
  if (params?.status && params.status !== 'all') {
    filteredReports = filteredReports.filter(report => report.status === params.status);
  }
  
  // Пагинация
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const startIndex = (page - 1) * limit;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + limit);
  
  return {
    success: true,
    data: {
      reports: paginatedReports,
      total: filteredReports.length
    },
    timestamp: new Date().toISOString()
  };
};

// Обновление репорта о нарушении
export const updateAdminViolation = async (
  reportId: string, 
  updates: Partial<AdminViolationReport>
): Promise<APIResponse<AdminViolationReport>> => {
  await simulateNetworkDelay();
  
  const reportIndex = mockViolationReports.findIndex(r => r.id === reportId);
  if (reportIndex === -1) {
    return {
      success: false,
      error: 'Репорт не найден',
      timestamp: new Date().toISOString()
    };
  }
  
  // Обновляем репорт
  mockViolationReports[reportIndex] = { 
    ...mockViolationReports[reportIndex], 
    ...updates 
  };
  
  // Логируем действие
  mockAuditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'VIOLATION_UPDATED',
    targetType: 'content',
    targetId: reportId,
    details: updates,
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    data: mockViolationReports[reportIndex],
    timestamp: new Date().toISOString()
  };
};

// Получение настроек системы
export const getAdminSystemSettings = async (): Promise<APIResponse<AdminSystemSettings>> => {
  await simulateNetworkDelay();
  
  return {
    success: true,
    data: mockSystemSettings,
    timestamp: new Date().toISOString()
  };
};

// Обновление настроек системы
export const updateAdminSystemSettings = async (
  settings: Partial<AdminSystemSettings>
): Promise<APIResponse<AdminSystemSettings>> => {
  await simulateNetworkDelay();
  
  // Сохраняем старые значения для аудита
  const oldSettings = { ...mockSystemSettings };
  
  // Обновляем настройки
  Object.assign(mockSystemSettings, settings);
  
  // Определяем изменения
  const changes: Record<string, any> = {};
  Object.keys(settings).forEach(key => {
    const typedKey = key as keyof AdminSystemSettings;
    if (JSON.stringify(oldSettings[typedKey]) !== JSON.stringify(settings[typedKey])) {
      changes[key] = { from: oldSettings[typedKey], to: settings[typedKey] };
    }
  });
  
  // Логируем действие
  mockAuditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'SYSTEM_SETTINGS_UPDATED',
    targetType: 'system',
    details: { changes, ...settings },
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    data: mockSystemSettings,
    timestamp: new Date().toISOString()
  };
};

// Получение детальной статистики рейтинга
export const getAdminRatingStats = async (): Promise<APIResponse<{
  totalRatingPoints: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  topRatedUsers: Array<{
    id: string;
    name: string;
    rating: number;
    level: string;
  }>;
  dailyRatingActivity: Array<{
    date: string;
    points: number;
    actions: number;
  }>;
}>> => {
  await simulateNetworkDelay();
  
  const stats = {
    totalRatingPoints: 457890,
    averageRating: 4.2,
    ratingDistribution: {
      '★': 420,
      '★★': 680,
      '★★★': 320,
      '★★★★': 95,
      '★★★★★': 27
    },
    topRatedUsers: [
      { id: 'admin1', name: 'Главный Админ', rating: 2450, level: 'Эксперт сообщества' },
      { id: 'user1', name: 'Иван Кулибин', rating: 2450, level: 'Эксперт сообщества' },
      { id: 'user2', name: 'Мастер Самоделкин', rating: 2180, level: 'Профессор Сомоделкин' },
      { id: 'mod1', name: 'Модератор Иван', rating: 1800, level: 'Профессор Сомоделкин' },
      { id: 'user3', name: 'Новичок Петров', rating: 150, level: 'Студент' }
    ],
    dailyRatingActivity: [
      { date: '2024-03-10', points: 2450, actions: 120 },
      { date: '2024-03-11', points: 2180, actions: 105 },
      { date: '2024-03-12', points: 3120, actions: 156 },
      { date: '2024-03-13', points: 1950, actions: 98 },
      { date: '2024-03-14', points: 2780, actions: 139 },
      { date: '2024-03-15', points: 3250, actions: 162 }
    ]
  };
  
  return {
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  };
};

// === ФУНКЦИИ ДЛЯ РАБОТЫ С МОДАЛЬНЫМИ ОКНАМИ ===

// Корректировка рейтинга пользователя (для RatingAdjustmentModal)
export const adjustUserRating = async (
  userId: string,
  adjustment: {
    ratingChange: number;
    activityChange: number;
    reason: string;
    adminNote?: string;
  }
): Promise<APIResponse<{
  success: boolean;
  newRating: number;
  newActivity: number;
  adjustmentId: string;
  user: AdminUser;
}>> => {
  await simulateNetworkDelay();

  // Ищем пользователя
  const userIndex = mockAdminUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Пользователь не найден',
      timestamp: new Date().toISOString()
    };
  }

  // Сохраняем старые значения
  const oldRating = mockAdminUsers[userIndex].rating || 0;
  const oldActivity = mockAdminUsers[userIndex].activityPoints || 0;
  
  // Обновляем рейтинг пользователя
  mockAdminUsers[userIndex].rating = oldRating + adjustment.ratingChange;
  mockAdminUsers[userIndex].activityPoints = oldActivity + adjustment.activityChange;

  // Создаем запись в истории корректировок
  const adjustmentRecord: RatingAdjustment = {
    userId,
    reason: adjustment.reason,
    ratingChange: adjustment.ratingChange,
    activityChange: adjustment.activityChange,
    timestamp: new Date().toISOString(),
    adminId: 'admin1',
    adminNote: adjustment.adminNote || `Ручная корректировка: ${adjustment.reason}`
  };
  
  mockRatingAdjustments.unshift(adjustmentRecord);

  // Логируем действие в аудит-логи
  mockAuditLogs.unshift({
    id: `rating_adj_${Date.now()}`,
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'RATING_ADJUSTED',
    targetType: 'rating',
    targetId: userId,
    details: {
      ...adjustment,
      oldRating,
      oldActivity,
      newRating: mockAdminUsers[userIndex].rating!,
      newActivity: mockAdminUsers[userIndex].activityPoints!
    },
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    data: {
      success: true,
      newRating: mockAdminUsers[userIndex].rating!,
      newActivity: mockAdminUsers[userIndex].activityPoints!,
      adjustmentId: `adj_${Date.now()}`,
      user: mockAdminUsers[userIndex]
    },
    timestamp: new Date().toISOString()
  };
};

// Получение истории корректировок рейтинга
export const getRatingAdjustments = async (params?: {
  userId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<APIResponse<{
  adjustments: RatingAdjustment[];
  total: number;
  summary: {
    totalRatingChanges: number;
    totalActivityChanges: number;
    positiveAdjustments: number;
    negativeAdjustments: number;
  };
}>> => {
  await simulateNetworkDelay();

  // Фильтрация по пользователю
  let filtered = [...mockRatingAdjustments];
  if (params?.userId) {
    filtered = filtered.filter(adj => adj.userId === params.userId);
  }

  // Фильтрация по дате
  if (params?.startDate) {
    const startDate = new Date(params.startDate);
    filtered = filtered.filter(adj => new Date(adj.timestamp) >= startDate);
  }
  if (params?.endDate) {
    const endDate = new Date(params.endDate);
    filtered = filtered.filter(adj => new Date(adj.timestamp) <= endDate);
  }

  // Сортировка по дате (новые сначала)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Пагинация
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  // Статистика
  const summary = {
    totalRatingChanges: filtered.reduce((sum, adj) => sum + adj.ratingChange, 0),
    totalActivityChanges: filtered.reduce((sum, adj) => sum + adj.activityChange, 0),
    positiveAdjustments: filtered.filter(adj => adj.ratingChange > 0).length,
    negativeAdjustments: filtered.filter(adj => adj.ratingChange < 0).length
  };

  return {
    success: true,
    data: {
      adjustments: paginated,
      total: filtered.length,
      summary
    },
    timestamp: new Date().toISOString()
  };
};

// Сброс пароля пользователя (для UserProfileModal)
export const resetUserPassword = async (
  userId: string,
  options?: {
    sendEmail?: boolean;
    generateTemporaryPassword?: boolean;
  }
): Promise<APIResponse<{ 
  success: boolean; 
  emailSent: boolean;
  temporaryPassword?: string;
  resetLink?: string;
}>> => {
  await simulateNetworkDelay();
  
  const user = mockAdminUsers.find(u => u.id === userId);
  if (!user) {
    return {
      success: false,
      error: 'Пользователь не найден',
      timestamp: new Date().toISOString()
    };
  }
  
  // Генерируем временный пароль (для демонстрации)
  const temporaryPassword = options?.generateTemporaryPassword 
    ? `temp_${Math.random().toString(36).slice(2, 10)}`
    : undefined;
  
  const emailSent = options?.sendEmail !== false;
  
  // В реальной системе здесь была бы отправка email
  console.log(`[ADMIN] Сброс пароля для ${user.email}`, {
    temporaryPassword,
    emailSent,
    resetLink: emailSent ? `/auth/reset-password?token=demo_token_${Date.now()}` : undefined
  });
  
  // Логируем действие
  mockAuditLogs.unshift({
    id: `pwd_reset_${Date.now()}`,
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'PASSWORD_RESET',
    targetType: 'user',
    targetId: userId,
    details: { 
      email: user.email, 
      method: 'admin_request',
      sendEmail: emailSent,
      hasTemporaryPassword: !!temporaryPassword
    },
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    data: { 
      success: true, 
      emailSent,
      temporaryPassword,
      resetLink: emailSent ? `/auth/reset-password?token=demo_token_${Date.now()}` : undefined
    },
    timestamp: new Date().toISOString()
  };
};

// Переключение статуса блокировки пользователя
export const toggleUserBlock = async (
  userId: string,
  reason?: string
): Promise<APIResponse<{ 
  success: boolean; 
  newStatus: boolean;
  user: AdminUser;
}>> => {
  await simulateNetworkDelay();
  
  const userIndex = mockAdminUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Пользователь не найден',
      timestamp: new Date().toISOString()
    };
  }
  
  // Сохраняем старое состояние
  const oldStatus = mockAdminUsers[userIndex].isActive;
  
  // Меняем статус
  mockAdminUsers[userIndex].isActive = !oldStatus;
  
  // Логируем действие
  mockAuditLogs.unshift({
    id: `block_toggle_${Date.now()}`,
    userId: 'admin1',
    userName: 'Главный Админ',
    action: oldStatus ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
    targetType: 'user',
    targetId: userId,
    details: { 
      oldStatus: oldStatus ? 'active' : 'blocked',
      newStatus: mockAdminUsers[userIndex].isActive ? 'active' : 'blocked',
      reason: reason || (oldStatus ? 'Блокировка администратором' : 'Разблокировка администратором')
    },
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    data: { 
      success: true, 
      newStatus: mockAdminUsers[userIndex].isActive,
      user: mockAdminUsers[userIndex]
    },
    timestamp: new Date().toISOString()
  };
};

// Получение данных одного пользователя по ID
export const getAdminUserById = async (
  userId: string
): Promise<APIResponse<AdminUser>> => {
  await simulateNetworkDelay();
  
  const user = mockAdminUsers.find(u => u.id === userId);
  if (!user) {
    return {
      success: false,
      error: 'Пользователь не найден',
      timestamp: new Date().toISOString()
    };
  }
  
  // Получаем историю корректировок для этого пользователя
  const userAdjustments = mockRatingAdjustments.filter(adj => adj.userId === userId);
  
  // Добавляем дополнительную статистику (в реальной системе было бы в отдельном запросе)
  const userWithStats = {
    ...user,
    _stats: {
      totalRatingAdjustments: userAdjustments.reduce((sum, adj) => sum + adj.ratingChange, 0),
      totalActivityAdjustments: userAdjustments.reduce((sum, adj) => sum + adj.activityChange, 0),
      adjustmentCount: userAdjustments.length,
      lastAdjustment: userAdjustments[0] || null
    }
  };
  
  return {
    success: true,
    data: userWithStats,
    timestamp: new Date().toISOString()
  };
};

// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АДМИНКИ ===

// Получение всех данных об уровнях рейтинга
export const getAdminRatingLevels = async (): Promise<APIResponse<{
  userLevels: typeof USER_LEVELS;
  activityLevels: typeof ACTIVITY_LEVELS;
  formulas: Array<{
    section: string;
    action: string;
    ratingPoints: number;
    activityPoints: number;
    description: string;
  }>;
  currentAdjustments: typeof mockRatingAdjustments;
}>> => {
  await simulateNetworkDelay();
  
  // Формулы начисления
  const formulas = [
    { section: 'projects', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание проекта' },
    { section: 'projects', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Лайк проекту' },
    { section: 'projects', action: 'like_received', ratingPoints: 1, activityPoints: 0, description: 'Получение лайка' },
    { section: 'projects', action: 'comment', ratingPoints: 0, activityPoints: 3, description: 'Комментарий к проекту' },
    { section: 'masters', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание объявления мастера' },
    { section: 'masters', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Лайк мастеру' },
    { section: 'help', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание запроса о помощи' },
    { section: 'help', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Полезный ответ' },
    { section: 'library', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание публикации' },
    { section: 'library', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Лайк публикации' },
    { section: 'general', action: 'registration', ratingPoints: 15, activityPoints: 0, description: 'Регистрация на сайте' },
    { section: 'general', action: 'daily_login', ratingPoints: 0, activityPoints: 2, description: 'Ежедневный вход' },
  ];

  return {
    success: true,
    data: {
      userLevels: USER_LEVELS,
      activityLevels: ACTIVITY_LEVELS,
      formulas,
      currentAdjustments: mockRatingAdjustments.slice(0, 10) // Последние 10 корректировок
    },
    timestamp: new Date().toISOString()
  };
};

// Получение рейтингов всех пользователей
export const getAllUserRatings = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: 'rating_desc' | 'rating_asc' | 'activity_desc' | 'activity_asc';
}): Promise<APIResponse<{
  ratings: UserRating[];
  total: number;
  averageRating: number;
  averageActivity: number;
  distributionByLevel: Record<string, number>;
}>> => {
  await simulateNetworkDelay();
  
  // Создаем моковые рейтинги на основе моковых пользователей
  const allRatings: UserRating[] = mockAdminUsers.map(user => {
    const rating = user.rating || 0;
    const activity = user.activityPoints || 0;
    
    // Определяем уровень по рейтингу
    const userLevel = USER_LEVELS.find(level => rating >= level.min && rating <= level.max) || USER_LEVELS[0];
    const activityLevel = ACTIVITY_LEVELS.find(level => activity >= level.min && activity <= level.max) || ACTIVITY_LEVELS[0];
    
    return {
      userId: user.id,
      totalRating: rating,
      totalActivity: activity,
      ratingLevel: userLevel.name,
      activityLevel: activityLevel.name,
      ratingIcon: userLevel.icon,
      lastDailyLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      stats: {
        projectsCreated: user.totalPosts || 0,
        mastersAdsCreated: Math.floor(Math.random() * 10),
        helpRequestsCreated: Math.floor(Math.random() * 15),
        libraryPostsCreated: Math.floor(Math.random() * 8),
        likesGiven: Math.floor(Math.random() * 50),
        likesReceived: Math.floor(Math.random() * 30),
        commentsMade: Math.floor(Math.random() * 40)
      }
    };
  });

  // Сортировка
  let sortedRatings = [...allRatings];
  if (params?.sortBy) {
    sortedRatings.sort((a, b) => {
      switch (params.sortBy) {
        case 'rating_desc': return b.totalRating - a.totalRating;
        case 'rating_asc': return a.totalRating - b.totalRating;
        case 'activity_desc': return b.totalActivity - a.totalActivity;
        case 'activity_asc': return a.totalActivity - b.totalActivity;
        default: return 0;
      }
    });
  }

  // Пагинация
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const startIndex = (page - 1) * limit;
  const paginatedRatings = sortedRatings.slice(startIndex, startIndex + limit);

  // Распределение по уровням
  const distributionByLevel: Record<string, number> = {};
  USER_LEVELS.forEach(level => {
    distributionByLevel[level.name] = allRatings.filter(r => 
      r.totalRating >= level.min && r.totalRating <= level.max
    ).length;
  });

  // Средние значения
  const totalRating = allRatings.reduce((sum, r) => sum + r.totalRating, 0);
  const totalActivity = allRatings.reduce((sum, r) => sum + r.totalActivity, 0);

  return {
    success: true,
    data: {
      ratings: paginatedRatings,
      total: allRatings.length,
      averageRating: Math.round(totalRating / allRatings.length),
      averageActivity: Math.round(totalActivity / allRatings.length),
      distributionByLevel
    },
    timestamp: new Date().toISOString()
  };
};

// Массовое обновление пользователей
export const bulkUpdateUsers = async (
  userIds: string[],
  updates: Partial<AdminUser>
): Promise<APIResponse<{ updated: number; failed: number; users: AdminUser[] }>> => {
  await simulateNetworkDelay();
  
  let updated = 0;
  let failed = 0;
  const updatedUsers: AdminUser[] = [];
  
  userIds.forEach(userId => {
    const userIndex = mockAdminUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      mockAdminUsers[userIndex] = { ...mockAdminUsers[userIndex], ...updates };
      updatedUsers.push(mockAdminUsers[userIndex]);
      updated++;
    } else {
      failed++;
    }
  });
  
  // Логируем массовое действие
  if (updated > 0) {
    mockAuditLogs.unshift({
      id: `bulk_${Date.now()}`,
      userId: 'admin1',
      userName: 'Главный Админ',
      action: 'BULK_UPDATE',
      targetType: 'user',
      details: { 
        count: updated, 
        updates,
        userIds: userIds.slice(0, 5) // Логируем только первые 5 ID
      },
      timestamp: new Date().toISOString()
    });
  }
  
  return {
    success: true,
    data: { updated, failed, users: updatedUsers },
    timestamp: new Date().toISOString()
  };
};

// Поиск пользователей по различным критериям
export const searchAdminUsers = async (
  query: string,
  fields: Array<'login' | 'email' | 'name' | 'id'> = ['login', 'email', 'name']
): Promise<APIResponse<AdminUser[]>> => {
  await simulateNetworkDelay();
  
  const queryLower = query.toLowerCase();
  
  const results = mockAdminUsers.filter(user => {
    return fields.some(field => {
      const value = user[field];
      return value && typeof value === 'string' && value.toLowerCase().includes(queryLower);
    });
  });
  
  return {
    success: true,
    data: results,
    timestamp: new Date().toISOString()
  };
};

// === ЭКСПОРТ АДМИН API ===

export const adminAPI = {
  // Основные функции
  getAdminStats,
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  getAdminAuditLogs,
  getAdminViolations,
  updateAdminViolation,
  getAdminSystemSettings,
  updateAdminSystemSettings,
  getAdminRatingStats,
  
  // Функции для модальных окон
  adjustUserRating,
  getRatingAdjustments,
  resetUserPassword,
  toggleUserBlock,
  
  // Рейтинг
  getRatingLevels: getAdminRatingLevels,
  getAllUserRatings,
  
  // Дополнительные функции
  bulkUpdateUsers,
  searchAdminUsers
};