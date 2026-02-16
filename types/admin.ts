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