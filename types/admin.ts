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

// ИЗМЕНЕНО: Полностью переработан интерфейс AdminStats для создания двух независимых систем
// Система 1: "Кулибиных на сайте" (онлайн пользователи)
// Система 2: "Кулибиных всего" (зарегистрированные пользователи)
export interface AdminStats {
  // Система 1: "Кулибиных на сайте"
  onlineShown: number;           // Показывается пользователям (реальные онлайн + фиктивные онлайн)
  onlineReal: number;            // Реальные пользователи онлайн (только для админа)
  onlineFake: number;            // Фиктивные пользователи онлайн (100-200, только для админа)
  isOnlineSimulationActive: boolean; // Включена ли имитация онлайн
  
  // Система 2: "Кулибиных всего"
  totalShown: number;            // Показывается пользователям (реальные зарегистрированные + фиктивные "всего")
  totalReal: number;             // Реальные зарегистрированные пользователи
  totalFake: number;             // Фиктивные пользователи "всего" (константа 207)
  isTotalSimulationActive: boolean; // Включена ли имитация "всего"
  
  // Статические данные (общие для обеих систем)
  projectsCreated: number;
  adviceGiven: number;
  lastUpdate: string;
}

// УДАЛЕНО: Свойство areFakeTotalsHidden - больше не нужно, заменено на isTotalSimulationActive

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
  adminId?: string;
  adminNote?: string;
}

// ========= НОВЫЙ ТИП ДЛЯ УВЕДОМЛЕНИЙ =========
export interface AdminNotification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  type?: 'system' | 'user' | 'warning' | 'success';
  link?: string;
}

// ========= ТИПЫ ДЛЯ СТРАНИЦЫ РЕЙТИНГОВ =========
export interface RatingLevel {
  min: number;
  max: number;
  name: string;
  icon: string;
}

export interface ActivityLevel {
  min: number;
  max: number;
  name: string;
}

export interface RatingFormula {
  section: string;
  action: string;
  ratingPoints: number;
  activityPoints: number;
  description: string;
}

export interface RatingLevelsData {
  userLevels: RatingLevel[];
  activityLevels: ActivityLevel[];
  formulas: RatingFormula[];
}

export interface UserRatingStats {
  projectsCreated: number;
  mastersAdsCreated: number;
  helpRequestsCreated: number;
  libraryPostsCreated: number;
  likesGiven: number;
  likesReceived: number;
  commentsMade: number;
}

export interface UserRating {
  userId: string;
  totalRating: number;
  totalActivity: number;
  ratingLevel: string;
  ratingIcon: string;
  activityLevel: string;
  stats: UserRatingStats;
  lastDailyLogin?: string;  // ← ДОБАВЛЕНО ПОЛЕ ДЛЯ ОТСЛЕЖИВАНИЯ ПОСЛЕДНЕГО ДЕЙЛИ ЛОГИНА
}

export interface RatingsDistribution {
  ratings: UserRating[];
  total: number;
  averageRating: number;
  averageActivity: number;
  distributionByLevel: Record<string, number>;
}

// ========= КОНСТАНТЫ ДЛЯ РЕЙТИНГОВОЙ СИСТЕМЫ =========
export const USER_LEVELS: RatingLevel[] = [
  { min: 0, max: 200, name: "Студент", icon: "★" },
  { min: 201, max: 500, name: "Инженер", icon: "★★" },
  { min: 501, max: 1000, name: "Инженер-конструктор", icon: "★★★" },
  { min: 1001, max: 2000, name: "Профессор Сомоделкин", icon: "★★★★" },
  { min: 2001, max: Infinity, name: "Эксперт сообщества", icon: "★★★★★" }
];

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { min: 0, max: 100, name: "Новичок" },
  { min: 101, max: 300, name: "Активный" },
  { min: 301, max: 600, name: "Очень активный" },
  { min: 601, max: 1000, name: "Лидер активности" },
  { min: 1001, max: Infinity, name: "Легенда сообщества" }
];

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

// ========= МОКАП ДАННЫЕ ДЛЯ РАЗРАБОТКИ =========
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

export const mockAdminNotifications: AdminNotification[] = [
  { id: 1, text: 'Новый пользователь "ivanov" зарегистрировался', time: '5 мин назад', read: false, type: 'user', link: '/admin/users/user_15' },
  { id: 2, text: 'Статистика сайта успешно обновлена', time: '10 мин назад', read: true, type: 'system' },
  { id: 3, text: 'Пользователь "petrov" попросил проверку проекта', time: '15 мин назад', read: false, type: 'warning', link: '/admin/projects/45' },
  { id: 4, text: 'Завершено резервное копирование базы данных', time: '1 час назад', read: true, type: 'success' },
  { id: 5, text: 'Получено новое сообщение в обратную связь', time: '2 часа назад', read: false, type: 'user' },
  { id: 6, text: 'Обновлены правила сообщества', time: '5 часов назад', read: true, type: 'system' },
  { id: 7, text: 'Критическое обновление безопасности требуется', time: '1 день назад', read: false, type: 'warning' },
];