// api/mocks.ts

// === БАЗОВЫЕ ТИПЫ (ВЫНЕСТИ В НАЧАЛО) ===

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto' | 'brown';
  brightness: number;
  fontSize: number;
  showAnimations: boolean;
}

export type ItemType = "sell" | "buy" | "free" | "exchange" | "auction";

export interface MarketItem {
  id: number;
  title: string;
  description: string;
  price: number | "free";
  location: string;
  author: string;
  rating: number;
  type: ItemType;
  imageUrl?: string;
  negotiable?: boolean;
}

export interface User {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  role?: string; // ДОБАВЛЕНО: поле для роли
}

export interface RulesData {
  rules: string[];
  accepted: boolean;
  acceptedDate?: string;
}

export interface AcceptRulesResponse {
  accepted: boolean;
  acceptedDate: string;
}

export interface ResetAcceptanceResponse {
  reset: boolean;
}

// === СИСТЕМА СТАТИСТИКИ ===
export interface StatsData {
  online: number;           // Кулибиных онлайн (реальные + имитация)
  total: number;           // Кулибиных всего (фиктивные + реальные)
  projectsCreated: number; // Самоделок создано (статичное)
  adviceGiven: number;     // Ценных советов (статичное)
  lastUpdate: string;      // Время последнего обновления
  realOnline: number;      // Реальные пользователи онлайн
  simulationOnline: number; // Имитированные пользователи
  isSimulationActive: boolean; // Активна ли имитация
  _realTotal?: number;     // Внутреннее: реальные пользователи всего
  _fakeTotal?: number;     // Внутреннее: фиктивные пользователи всего
}

// === ТИПЫ ДЛЯ АДМИН-ПАНЕЛИ ===

export interface AdminUser extends User {
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
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

// === СИСТЕМА РЕЙТИНГА - НОВЫЕ ИНТЕРФЕЙСЫ ===

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

// === ФУНКЦИИ АДМИН-ПАНЕЛИ ===

// Получение статистики для админ-панели
export const getAdminStats = async (): Promise<APIResponse<AdminStats>> => {
  await simulateNetworkDelay();
  
  const stats = loadStatsFromStorage();
  
  const adminStats: AdminStats = {
    users: {
      total: 1542,
      active: 1234,
      newToday: 12,
      online: stats.online,
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
        { id: 'user5', name: 'Профессор', rating: 1950, activity: 890 }
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
        case 'rating_desc': return b.rating! - a.rating!;
        case 'rating_asc': return a.rating! - b.rating!;
        case 'activity_desc': return b.activityPoints! - a.activityPoints!;
        case 'activity_asc': return a.activityPoints! - b.activityPoints!;
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

// Обновление пользователя
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
  
  // Обновляем пользователя
  mockAdminUsers[userIndex] = { ...mockAdminUsers[userIndex], ...updates };
  
  // Логируем действие
  mockAuditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin1', // Текущий админ
    userName: 'Главный Админ',
    action: 'USER_UPDATED',
    targetType: 'user',
    targetId: userId,
    details: updates,
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
  
  // Обновляем настройки
  Object.assign(mockSystemSettings, settings);
  
  // Логируем действие
  mockAuditLogs.unshift({
    id: `log_${Date.now()}`,
    userId: 'admin1',
    userName: 'Главный Админ',
    action: 'SYSTEM_SETTINGS_UPDATED',
    targetType: 'system',
    details: settings,
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
      { id: 'user1', name: 'Иван Кулибин', rating: 2450, level: 'Эксперт сообщества' },
      { id: 'user2', name: 'Мастер Самоделкин', rating: 2180, level: 'Профессор Сомоделкин' },
      { id: 'user5', name: 'Профессор', rating: 1950, level: 'Профессор Сомоделкин' },
      { id: 'user7', name: 'Инженер', rating: 1750, level: 'Инженер-конструктор' },
      { id: 'user10', name: 'Студент', rating: 1450, level: 'Инженер-конструктор' }
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

// === НОВЫЕ ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ РЕЙТИНГОМ В АДМИНКЕ ===

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
}>> => {
  await simulateNetworkDelay();
  
  // Формулы начисления (можно брать из useRatingSystem)
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
      formulas
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
        projectsCreated: Math.floor(Math.random() * 20),
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

// Ручная корректировка рейтинга пользователя
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

  // Обновляем рейтинг пользователя
  const currentRating = mockAdminUsers[userIndex].rating || 0;
  const currentActivity = mockAdminUsers[userIndex].activityPoints || 0;
  
  mockAdminUsers[userIndex].rating = currentRating + adjustment.ratingChange;
  mockAdminUsers[userIndex].activityPoints = currentActivity + adjustment.activityChange;

  // Создаем запись в истории корректировок
  const adjustmentRecord: RatingAdjustment = {
    userId,
    reason: adjustment.reason,
    ratingChange: adjustment.ratingChange,
    activityChange: adjustment.activityChange,
    timestamp: new Date().toISOString()
  };

  // В реальной системе здесь была бы запись в БД
  console.log('[ADMIN] Корректировка рейтинга:', adjustmentRecord);

  // Логируем действие в аудит-логи
  mockAuditLogs.unshift({
    id: `rating_adj_${Date.now()}`,
    userId: 'admin1', // Текущий админ
    userName: 'Главный Админ',
    action: 'RATING_ADJUSTED',
    targetType: 'rating',
    targetId: userId,
    details: adjustment,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    data: {
      success: true,
      newRating: mockAdminUsers[userIndex].rating!,
      newActivity: mockAdminUsers[userIndex].activityPoints!,
      adjustmentId: `adj_${Date.now()}`
    },
    timestamp: new Date().toISOString()
  };
};

// Получение истории корректировок рейтинга
export const getRatingAdjustments = async (params?: {
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<APIResponse<{
  adjustments: RatingAdjustment[];
  total: number;
}>> => {
  await simulateNetworkDelay();

  // В реальной системе здесь был бы запрос к БД
  // Создаем моковые данные для демонстрации
  const mockAdjustments: RatingAdjustment[] = [
    {
      userId: 'user1',
      reason: 'Награда за активность в сообществе',
      ratingChange: 50,
      activityChange: 0,
      timestamp: '2024-03-10T14:30:00Z'
    },
    {
      userId: 'user2',
      reason: 'Корректировка после ошибки системы',
      ratingChange: -20,
      activityChange: 10,
      timestamp: '2024-03-09T11:15:00Z'
    },
    {
      userId: 'user3',
      reason: 'Поощрение за помощь новичкам',
      ratingChange: 30,
      activityChange: 20,
      timestamp: '2024-03-08T16:45:00Z'
    }
  ];

  // Фильтрация по пользователю
  let filtered = [...mockAdjustments];
  if (params?.userId) {
    filtered = filtered.filter(adj => adj.userId === params.userId);
  }

  // Пагинация
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    success: true,
    data: {
      adjustments: paginated,
      total: filtered.length
    },
    timestamp: new Date().toISOString()
  };
};

// === СУЩЕСТВУЮЩИЕ ФУНКЦИИ ===

// Имитация задержки сети
const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

// Функции для работы со статистикой
const STATS_STORAGE_KEY = 'samodelkin_stats';

// НАСТРОЙКИ ФИКТИВНЫХ ЗНАЧЕНИЙ
const FAKE_TOTAL = 307; // Фиктивное значение "Кулибиных всего" (можно уменьшать постепенно)
const FAKE_SIMULATION_START = 245; // Стартовое значение имитации онлайн

// БАЗОВЫЕ ЗНАЧЕНИЯ (без фиктивных добавок)
const BASE_STATS: Omit<StatsData, 'total' | '_realTotal' | '_fakeTotal'> = {
  realOnline: 0,           // Реальные пользователи онлайн (начинаем с 0)
  simulationOnline: FAKE_SIMULATION_START, // Имитация онлайн
  online: FAKE_SIMULATION_START, // Общее онлайн = realOnline + simulationOnline
  projectsCreated: 7543,
  adviceGiven: 15287,
  lastUpdate: new Date().toISOString(),
  isSimulationActive: true  // Имитация активна по умолчанию
};

// Загружает статистику из localStorage или возвращает значения по умолчанию
const loadStatsFromStorage = (): StatsData => {
  try {
    const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      
      // Миграция: если нет новых полей, добавляем их
      if (parsed.realOnline === undefined) {
        parsed.realOnline = 0;
        parsed.simulationOnline = parsed.online || FAKE_SIMULATION_START;
        parsed.online = parsed.realOnline + parsed.simulationOnline;
      }
      
      // РАСЧЁТ ОБЩЕГО КОЛИЧЕСТВА:
      // Фиктивная часть постепенно уменьшается по мере роста реальных пользователей
      const realTotalFromStorage = parsed.total || 0; // Реальные из localStorage
      
      // Вычисляем, сколько фиктивных показывать
      // Формула: фиктивных = MAX(0, FAKE_TOTAL - реальные/2)
      // Это значит: каждые 2 реальных пользователя уменьшают фиктивных на 1
      const fakeTotalToShow = Math.max(0, FAKE_TOTAL - Math.floor(realTotalFromStorage / 2));
      
      // Общее количество для показа = фиктивные + реальные
      const totalToShow = fakeTotalToShow + realTotalFromStorage;
      
      return {
        ...parsed,
        total: totalToShow, // Показываем сумму фиктивных и реальных
        _realTotal: realTotalFromStorage, // Сохраняем реальное для внутреннего использования
        _fakeTotal: fakeTotalToShow, // Сохраняем фиктивное для отладки
        lastUpdate: parsed.lastUpdate || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('[STATS] Ошибка загрузки статистики из localStorage:', error);
  }
  
  // Первый запуск: создаем начальную статистику
  const initialStats: StatsData = {
    ...BASE_STATS,
    total: FAKE_TOTAL + 0, // Начальное значение = фиктивные + 0 реальных
    _realTotal: 0,
    _fakeTotal: FAKE_TOTAL
  };
  
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
    ...BASE_STATS,
    total: 0, // В localStorage храним только реальных
    lastUpdate: new Date().toISOString()
  }));
  
  return initialStats;
};

// Сохраняет статистику в localStorage (только реальные данные)
const saveStatsToStorage = (stats: StatsData): void => {
  try {
    // Извлекаем реальное количество из объекта
    const realTotal = stats._realTotal || 0;
    
    // Сохраняем только реальные данные, без фиктивной части
    const statsToSave = {
      realOnline: stats.realOnline,
      simulationOnline: stats.simulationOnline,
      online: stats.online,
      total: realTotal, // Сохраняем только реальных
      projectsCreated: stats.projectsCreated,
      adviceGiven: stats.adviceGiven,
      isSimulationActive: stats.isSimulationActive,
      lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(statsToSave));
    
    console.log('[STATS] Сохранено в localStorage. Реальных всего:', realTotal);
  } catch (error) {
    console.error('[STATS] Ошибка сохранения статистики в localStorage:', error);
  }
};

// Генерирует случайное число в диапазоне min-max
const getRandomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// === НОВЫЕ ФУНКЦИИ: РАЗДЕЛЕНИЕ ДАННЫХ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ И АДМИНА ===

// Получить реальные данные (только для внутреннего использования)
const getRealStats = (): StatsData => {
  const stats = loadStatsFromStorage();
  
  // Возвращаем только реальные данные
  return {
    ...stats,
    total: stats._realTotal || 0, // Только реальные пользователи
    online: stats.realOnline, // Только реальные онлайн
    _realTotal: stats._realTotal || 0,
    _fakeTotal: 0 // Фиктивные не показываем
  };
};

// ==================== ИЗМЕНЕНИЕ 1: getStatsForUsers() ====================
// Получить статистику для обычных пользователей (с фиктивными)
const getStatsForUsers = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Загрузка статистики для пользователей...');
  await simulateNetworkDelay();
  
  const stats = loadStatsFromStorage();
  
  // +++ НАЧАЛО ИЗМЕНЕНИЯ +++
  // ЕСЛИ имитация ВЫКЛЮЧЕНА - показываем только реальные данные
  if (!stats.isSimulationActive) {
    console.log('[STATS] Пользователям показываем только реальных пользователей');
    const filteredStats = {
      ...stats,
      online: stats.realOnline,           // Показываем только реальных онлайн
      total: stats._realTotal || 0,       // Показываем только реальных всего
      simulationOnline: 0,                 // Фиктивные скрыты (0 для отладки)
    };
    
    const mockResponse: APIResponse<StatsData> = {
      success: true,
      data: filteredStats,
      timestamp: new Date().toISOString()
    };
    
    console.log('[API MOCKS] Статистика для пользователей (имитация ВЫКЛЮЧЕНА):', mockResponse);
    return mockResponse;
  }
  // +++ КОНЕЦ ИЗМЕНЕНИЯ +++
  
  // Если имитация ВКЛЮЧЕНА - оставляем старую логику
  console.log('[STATS] Пользователям показано всего:', stats.total, 
              '(фиктивных:', stats._fakeTotal || 0, 
              ', реальных:', stats._realTotal || 0, ')');
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статистика для пользователей загружена:', mockResponse);
  return mockResponse;
};

// === ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ АДМИНА ===
const getStatsForAdmin = async (): Promise<APIResponse<StatsData & {
  realTotal: number;    // Явно добавляем поле
  fakeTotal: number;    // Явно добавляем поле
}>> => {
  console.log('[API MOCKS] Загрузка статистики ДЛЯ АДМИНА...');
  await simulateNetworkDelay();
  
  const stats = loadStatsFromStorage();
  
  // +++ ШАГ 2: ГАРАНТИРУЕМ, что админ всегда видит полные данные +++
  const adminStats = {
    ...stats,
    // ГАРАНТИРУЕМ, что админ всегда видит полные данные, даже если имитация выключена
    realTotal: stats._realTotal || 0,
    fakeTotal: stats._fakeTotal || 0, // Всегда показываем реальное значение фиктивных
    // Пересчитываем online для админа, чтобы он видел реальную картину
    online: stats.online, // Оставляем как есть, так как в stats.online уже учтена логика видимости
  };
  
  // Логируем детали для отладки
  console.log('[STATS] Админу показано всего:', adminStats.total, 
              '(фиктивных:', adminStats.fakeTotal, 
              ', реальных:', adminStats.realTotal, ')');
  
  const mockResponse: APIResponse<typeof adminStats> = {
    success: true,
    data: adminStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статистика для админа загружена:', mockResponse);
  return mockResponse;
};

// Получить детальную информацию (обновленная версия)
const getDetailedStats = async (): Promise<APIResponse<{
  shownTotal: number;
  realTotal: number;
  fakeTotal: number;
  formula: string;
  fakeTotalConstant: number;
  canEditFakeTotal: boolean;
  shownOnline: number;
  realOnline: number;
  fakeOnline: number;
}>> => {
  console.log('[API MOCKS] Загрузка детальной статистики...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  
  const detailedInfo = {
    shownTotal: currentStats.total,
    realTotal: currentStats._realTotal || 0,
    fakeTotal: currentStats._fakeTotal || FAKE_TOTAL,
    shownOnline: currentStats.online,
    realOnline: currentStats.realOnline,
    fakeOnline: currentStats.simulationOnline,
    formula: `Показано = фиктивных(${FAKE_TOTAL} - реальные/2) + реальные`,
    fakeTotalConstant: FAKE_TOTAL,
    canEditFakeTotal: false // В будущем можно сделать редактируемым
  };
  
  const mockResponse: APIResponse<typeof detailedInfo> = {
    success: true,
    data: detailedInfo,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Детальная статистика:', mockResponse);
  return mockResponse;
};

// === mockAPI ОБЪЕКТ ===

// Централизованные функции-заглушки
export const mockAPI = {
  // Настройки
  settings: {
    loadSettings: async (): Promise<APIResponse<AppSettings>> => {
      console.log('[API MOCKS] Загрузка настроек с сервера...');
      await simulateNetworkDelay();
      
      const savedSettings = localStorage.getItem('server_settings');
      const defaultSettings: AppSettings = { 
        theme: 'auto', 
        brightness: 100, 
        fontSize: 100,
        showAnimations: true
      };
      
      const mockResponse: APIResponse<AppSettings> = {
        success: true,
        data: savedSettings ? JSON.parse(savedSettings) : defaultSettings,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Настройки загружены:', mockResponse);
      return mockResponse;
    },
    
    saveSettings: async (settings: AppSettings): Promise<APIResponse<{ synced: boolean }>> => {
      console.log('[API MOCKS] Сохранение настроек на сервер...', settings);
      await simulateNetworkDelay();
      
      localStorage.setItem('server_settings', JSON.stringify(settings));
      
      const mockResponse: APIResponse<{ synced: boolean }> = {
        success: Math.random() > 0.1,
        data: { synced: true },
        error: Math.random() > 0.9 ? 'Ошибка синхронизации' : undefined,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Настройки сохранены:', mockResponse);
      return mockResponse;
    },
    
    syncSettings: async (): Promise<APIResponse<{ 
      merged: AppSettings; 
      conflicts?: string[] 
    }>> => {
      console.log('[API MOCKS] Синхронизация настроек...');
      await simulateNetworkDelay();
      
      const serverSettings = localStorage.getItem('server_settings');
      const defaultSettings: AppSettings = { 
        theme: 'auto', 
        brightness: 100, 
        fontSize: 100,
        showAnimations: true
      };
      
      const mockResponse: APIResponse<{
        merged: AppSettings;
        conflicts?: string[];
      }> = {
        success: true,
        data: {
          merged: serverSettings ? JSON.parse(serverSettings) : defaultSettings,
          conflicts: Math.random() > 0.7 ? ['theme', 'brightness'] : undefined
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Синхронизация завершена:', mockResponse);
      return mockResponse;
    }
  },

  // Барахолка
  marketplace: {
    loadItems: async (filterType: string = "all"): Promise<APIResponse<MarketItem[]>> => {
      console.log(`[API MOCKS] Загрузка объявлений с фильтром: ${filterType}`);
      await simulateNetworkDelay();
      
      const staticItems: MarketItem[] = [
        {
          id: 1,
          title: "Набор инструментов для начинающего мастера",
          description: "Полный набор инструментов: молоток, отвертки, пассатижи, уровень. Отличное состояние.",
          price: 2500,
          location: "Москва",
          author: "Иван Кулибин",
          rating: 4.8,
          type: "sell"
        },
      ];
      
      let filteredItems = staticItems;
      if (filterType !== "all") {
        filteredItems = filteredItems.filter(item => item.type === filterType);
      }
      
      const mockResponse: APIResponse<MarketItem[]> = {
        success: true,
        data: filteredItems,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Объявления загружены:', mockResponse);
      return mockResponse;
    },

    createItem: async (itemData: Omit<MarketItem, "id" | "rating">): Promise<APIResponse<MarketItem>> => {
      console.log('[API MOCKS] Создание объявления:', itemData);
      await simulateNetworkDelay();
      
      const newItem: MarketItem = {
        ...itemData,
        id: Date.now(),
        rating: 4.5,
      };
      
      const savedItems = localStorage.getItem("marketplace_items");
      const items = savedItems ? JSON.parse(savedItems) : [];
      items.push(newItem);
      localStorage.setItem("marketplace_items", JSON.stringify(items));
      
      const mockResponse: APIResponse<MarketItem> = {
        success: true,
        data: newItem,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Объявление создано:', mockResponse);
      return mockResponse;
    },

    contactAuthor: async (itemId: number, message?: string): Promise<APIResponse<{ sent: boolean }>> => {
      console.log(`[API MOCKS] Связь с автором #${itemId}`, message ? `Сообщение: ${message}` : '');
      await simulateNetworkDelay();
      
      const contactLog = {
        itemId,
        message: message || "Хочу связаться по поводу вашего объявления",
        timestamp: new Date().toISOString(),
      };
      
      const savedContacts = localStorage.getItem("marketplace_contacts");
      const contacts = savedContacts ? JSON.parse(savedContacts) : [];
      contacts.push(contactLog);
      localStorage.setItem("marketplace_contacts", JSON.stringify(contacts));
      
      const mockResponse: APIResponse<{ sent: boolean }> = {
        success: true,
        data: { sent: true },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Сообщение отправлено:', mockResponse);
      return mockResponse;
    }
  },

  // Аутентификация
  auth: {
    register: async (userData: { login: string; email: string; password: string; agreement: boolean }): Promise<APIResponse<User>> => {
      console.log('[API MOCKS] Регистрация пользователя:', userData);
      await simulateNetworkDelay();
      
      if (userData.login.length < 3 || userData.login.length > 20) {
        return {
          success: false,
          error: 'Логин должен содержать от 3 до 20 символов',
          timestamp: new Date().toISOString()
        };
      }
      
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(userData.password)) {
        return {
          success: false,
          error: 'Пароль: минимум 8 символов, цифра + буква',
          timestamp: new Date().toISOString()
        };
      }
      
      if (!userData.agreement) {
        return {
          success: false,
          error: 'Необходимо принять правила сайта',
          timestamp: new Date().toISOString()
        };
      }
      
      // Определяем роль: если логин admin - даем роль админа
      const isAdmin = userData.login.toLowerCase() === 'admin';
      
      const mockResponse: APIResponse<User> = {
        success: true,
        data: {
          id: 'user_' + Date.now(),
          login: userData.login,
          email: userData.email,
          name: userData.login,
          avatar: `https://i.pravatar.cc/150?u=${userData.email}`,
          role: isAdmin ? 'admin' : 'user', // ← ДОБАВЛЕНО
          createdAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Регистрация завершена:', mockResponse);
      return mockResponse;
    },

    login: async (credentials: { login: string; password: string }): Promise<APIResponse<{ user: User; token: string }>> => {
      console.log('[API MOCKS] Вход пользователя:', credentials.login);
      await simulateNetworkDelay();
      
      // Определяем роль: если логин admin - даем роль админа
      const isAdmin = credentials.login.toLowerCase() === 'admin';
      const isModerator = credentials.login.toLowerCase() === 'moderator';
      
      const mockResponse: APIResponse<{ user: User; token: string }> = {
        success: true,
        data: {
          user: {
            id: isAdmin ? 'admin1' : (isModerator ? 'mod1' : 'user_' + Date.now()),
            login: credentials.login,
            email: `${credentials.login}@example.com`,
            name: credentials.login,
            avatar: `https://i.pravatar.cc/150?u=${credentials.login}`,
            role: isAdmin ? 'admin' : (isModerator ? 'moderator' : 'user'), // ← ДОБАВЛЕНО
            createdAt: new Date().toISOString()
          },
          token: 'jwt_token_demo_' + Date.now()
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Вход завершен:', mockResponse);
      return mockResponse;
    },

    forgotPassword: async (email: string): Promise<APIResponse<{ emailSent: boolean }>> => {
      console.log('[API MOCKS] Запрос восстановления пароля для:', email);
      await simulateNetworkDelay();
      
      const mockResponse: APIResponse<{ emailSent: boolean }> = {
        success: true,
        data: { emailSent: true },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Запрос восстановления завершен:', mockResponse);
      return mockResponse;
    }
  },

  // Правила сообщества
  rules: {
    loadRules: async (): Promise<APIResponse<RulesData>> => {
      console.log('[API MOCKS] Загрузка правил сообщества');
      await simulateNetworkDelay();
      
      const rules = [
        "Уважаемые пользователи, приветствуем вас на нашем сайте САМОДЕЛКИН...",
        "На нашей площадке после регистрации вы получаете возможность...",
        "На сайте для каждого пользователя создана рейтинговая система...",
        "На сайте есть возможность разместить обьявление о продаже...",
        "На сайте запрещено распостранять стороннюю рекламу и спам...",
        "Уважаемые пользователи, просьба относиться друг к другу с уважением...",
      ];
      
      const accepted = localStorage.getItem('samodelkin_rules_accepted') === 'true';
      const acceptedDate = localStorage.getItem('samodelkin_rules_accepted_date') || undefined;
      
      const mockResponse: APIResponse<RulesData> = {
        success: true,
        data: { 
          rules, 
          accepted,
          acceptedDate
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Правила загружены:', mockResponse);
      return mockResponse;
    },

    acceptRules: async (): Promise<APIResponse<AcceptRulesResponse>> => {
      console.log('[API MOCKS] Принятие правил сообщества');
      await simulateNetworkDelay();
      
      const acceptedDate = new Date().toISOString();
      localStorage.setItem('samodelkin_rules_accepted', 'true');
      localStorage.setItem('samodelkin_rules_accepted_date', acceptedDate);
      
      const mockResponse: APIResponse<AcceptRulesResponse> = {
        success: true,
        data: { 
          accepted: true, 
          acceptedDate 
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Правила приняты:', mockResponse);
      return mockResponse;
    },

    resetAcceptance: async (): Promise<APIResponse<ResetAcceptanceResponse>> => {
      console.log('[API MOCKS] Сброс принятия правил (для разработки)');
      await simulateNetworkDelay();
      
      localStorage.removeItem('samodelkin_rules_accepted');
      localStorage.removeItem('samodelkin_rules_accepted_date');
      
      const mockResponse: APIResponse<ResetAcceptanceResponse> = {
        success: true,
        data: { reset: true },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Согласие сброшено:', mockResponse);
      return mockResponse;
    },

    checkAcceptance: async (): Promise<APIResponse<{ accepted: boolean; acceptedDate?: string }>> => {
      console.log('[API MOCKS] Проверка статуса принятия правил');
      await simulateNetworkDelay();
      
      const accepted = localStorage.getItem('samodelkin_rules_accepted') === 'true';
      const acceptedDate = localStorage.getItem('samodelkin_rules_accepted_date') || undefined;
      
      const mockResponse: APIResponse<{ accepted: boolean; acceptedDate?: string }> = {
        success: true,
        data: { accepted, acceptedDate },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Статус проверен:', mockResponse);
      return mockResponse;
    }
  },

  // === СИСТЕМА СТАТИСТИКИ ===
  stats: {
    // Старая функция (оставлена для совместимости)
    getStats: getStatsForUsers,
    
    // Новая функция: для обычных пользователей (с фиктивными данными)
    getStatsForUsers,
    
    // Новая функция: для админа (с разделением фиктивных/реальных)
    getStatsForAdmin,
    
    // Новая функция: для получения реальных данных (внутренняя)
    getRealStats: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Загрузка реальной статистики...');
      await simulateNetworkDelay();
      
      const realStats = getRealStats();
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: realStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Реальная статистика:', mockResponse);
      return mockResponse;
    },

    // Увеличить счетчики при регистрации
    incrementOnRegistration: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Увеличение счетчиков при регистрации...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      // Определяем, нужно ли отключать имитацию
      // Если реальных пользователей (total) стало больше 300, отключаем имитацию
      const realTotal = currentStats._realTotal || 0;
      const shouldDisableSimulation = realTotal + 1 > 300;
      
      // Увеличиваем реальных пользователей онлайн
      const newRealOnline = currentStats.realOnline + 1;
      
      // Увеличиваем РЕАЛЬНЫХ всего
      const newRealTotal = realTotal + 1;
      
      // Пересчитываем общее онлайн
      const totalOnline = newRealOnline + currentStats.simulationOnline;
      
      // Пересчитываем фиктивную часть (уменьшаем по мере роста реальных)
      const fakeTotalToShow = Math.max(0, FAKE_TOTAL - Math.floor(newRealTotal / 2));
      
      // Общее количество для показа
      const totalToShow = fakeTotalToShow + newRealTotal;
      
      const updatedStats: StatsData = {
        ...currentStats,
        realOnline: newRealOnline,
        online: totalOnline,
        total: totalToShow,
        _realTotal: newRealTotal,
        _fakeTotal: fakeTotalToShow,
        isSimulationActive: shouldDisableSimulation ? false : currentStats.isSimulationActive,
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Счетчики увеличены. Показано:', totalToShow, 
                  '(фиктивных:', fakeTotalToShow, ', реальных:', newRealTotal, ')');
      return mockResponse;
    },

    // ==================== ИЗМЕНЕНИЕ 2: simulateOnlineChange() ====================
    // Имитация изменения онлайн-пользователей
    simulateOnlineChange: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Имитация изменения онлайн пользователей...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      // --- УДАЛЕН БЛОК ПРОВЕРКИ isSimulationActive ---
      // Теперь генерация работает всегда, независимо от статуса имитации
      
      // ГЕНЕРАЦИЯ СЛУЧАЙНЫХ ИЗМЕНЕНИЙ ИМИТАЦИИ
      let newSimulationOnline = currentStats.simulationOnline;
      
      // 70% шанс изменения, 30% шанс оставить как есть
      if (Math.random() > 0.3) {
        // Генерируем случайное изменение от 1 до 3
        const changeAmount = getRandomInRange(1, 3);
        
        // Определяем направление: 50% шанс увеличения, 50% уменьшения
        const isIncrease = Math.random() > 0.5;
        
        if (isIncrease) {
          newSimulationOnline += changeAmount;
        } else {
          newSimulationOnline -= changeAmount;
        }
        
        // Гарантируем, что имитация в пределах 100-300
        newSimulationOnline = Math.max(100, Math.min(300, newSimulationOnline));
        
        console.log(`[STATS] Имитация онлайн: ${isIncrease ? '+' : '-'}${changeAmount} = ${newSimulationOnline}`);
      }
      
      // Пересчитываем общее онлайн
      const totalOnline = currentStats.realOnline + newSimulationOnline;
      
      const updatedStats: StatsData = {
        ...currentStats,
        simulationOnline: newSimulationOnline,
        online: totalOnline,
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Имитация завершена:', mockResponse);
      return mockResponse;
    },

    // Сбросить статистику (для разработки)
    resetStats: async (): Promise<APIResponse<{ reset: boolean }>> => {
      console.log('[API MOCKS] Сброс статистики...');
      await simulateNetworkDelay();
      
      localStorage.removeItem(STATS_STORAGE_KEY);
      
      const mockResponse: APIResponse<{ reset: boolean }> = {
        success: true,
        data: { reset: true },
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Статистика сброшена:', mockResponse);
      return mockResponse;
    },

    // Сбросить только "Кулибиных всего" до 0 (для админки)
    resetTotalToZero: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Сброс "Кулибиных всего" до 0...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      const updatedStats: StatsData = {
        ...currentStats,
        total: currentStats._realTotal || 0, // Показываем только реальных
        _fakeTotal: 0, // Убираем все фиктивные
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] "Кулибиных всего" сброшено до реальных:', mockResponse);
      return mockResponse;
    },

    // Ручное восстановление фиктивных пользователей (для админки)
    restoreFakeTotal: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Восстановление фиктивных пользователей...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      const realTotal = currentStats._realTotal || 0;
      
      // Восстанавливаем фиктивных по формуле
      const fakeTotalToShow = Math.max(0, FAKE_TOTAL - Math.floor(realTotal / 2));
      
      const updatedStats: StatsData = {
        ...currentStats,
        total: fakeTotalToShow + realTotal, // Показываем фиктивных + реальных
        _fakeTotal: fakeTotalToShow, // Восстанавливаем фиктивных
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Фиктивные пользователи восстановлены:', mockResponse);
      return mockResponse;
    },

    // Ручное отключение имитации (для админки)
    disableSimulation: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Ручное отключение имитации...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      // При отключении имитации, онлайн становится равным реальным пользователям
      const updatedStats: StatsData = {
        ...currentStats,
        isSimulationActive: false,
        simulationOnline: 0,
        online: currentStats.realOnline,
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Имитация отключена:', mockResponse);
      return mockResponse;
    },

    // +++ ШАГ 1: Добавление метода включения имитации +++
    // Ручное ВКЛЮЧЕНИЕ имитации (для админки)
    enableSimulation: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Ручное включение имитации...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      // При включении имитации, возвращаем значения фиктивных пользователей
      const updatedStats: StatsData = {
        ...currentStats,
        isSimulationActive: true,
        simulationOnline: FAKE_SIMULATION_START, // Возвращаем стартовое значение
        online: currentStats.realOnline + FAKE_SIMULATION_START,
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Имитация включена:', mockResponse);
      return mockResponse;
    },
    
    // Добавить реального пользователя онлайн (при входе)
    addRealOnline: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Добавление реального пользователя онлайн...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      const newRealOnline = currentStats.realOnline + 1;
      const totalOnline = newRealOnline + currentStats.simulationOnline;
      
      const updatedStats: StatsData = {
        ...currentStats,
        realOnline: newRealOnline,
        online: totalOnline,
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Реальный пользователь добавлен:', mockResponse);
      return mockResponse;
    },
    
    // Убрать реального пользователя онлайн (при выходе)
    removeRealOnline: async (): Promise<APIResponse<StatsData>> => {
      console.log('[API MOCKS] Удаление реального пользователя онлайн...');
      await simulateNetworkDelay();
      
      const currentStats = loadStatsFromStorage();
      
      const newRealOnline = Math.max(0, currentStats.realOnline - 1);
      const totalOnline = newRealOnline + currentStats.simulationOnline;
      
      const updatedStats: StatsData = {
        ...currentStats,
        realOnline: newRealOnline,
        online: totalOnline,
        lastUpdate: new Date().toISOString()
      };
      
      saveStatsToStorage(updatedStats);
      
      const mockResponse: APIResponse<StatsData> = {
        success: true,
        data: updatedStats,
        timestamp: new Date().toISOString()
      };
      
      console.log('[API MOCKS] Реальный пользователь удален:', mockResponse);
      return mockResponse;
    },
    
    // Получить детальную информацию (обновленная версия)
    getDetailedStats
  },

  // === АДМИН-ПАНЕЛЬ API ===
  admin: {
    getAdminStats,
    getAdminUsers,
    updateAdminUser,
    getAdminAuditLogs,
    getAdminViolations,
    updateAdminViolation,
    getAdminSystemSettings,
    updateAdminSystemSettings,
    getAdminRatingStats,
    
    // НОВЫЕ ФУНКЦИИ ДЛЯ РЕЙТИНГА:
    getRatingLevels: getAdminRatingLevels,
    getAllUserRatings,
    adjustUserRating,
    getRatingAdjustments
  }
};

// Экспорт админ API
export const adminAPI = {
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  getAdminAuditLogs,
  getAdminViolations,
  updateAdminViolation,
  getAdminSystemSettings,
  updateAdminSystemSettings,
  getAdminRatingStats,
  
  // НОВЫЕ ФУНКЦИИ ДЛЯ РЕЙТИНГА:
  getRatingLevels: getAdminRatingLevels,
  getAllUserRatings,
  adjustUserRating,
  getRatingAdjustments
};