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
