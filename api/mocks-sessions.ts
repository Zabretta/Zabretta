// api/mocks-sessions.ts
import { StatsData } from './mocks-stats';

const SESSIONS_STORAGE_KEY = 'samodelkin_active_sessions';
const STATS_STORAGE_KEY = 'samodelkin_stats';

// Хранилище активных сессий { userId: timestamp }
type ActiveSessions = Record<string, string>;

const getActiveSessions = (): ActiveSessions => {
  const sessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return sessions ? JSON.parse(sessions) : {};
};

const saveActiveSessions = (sessions: ActiveSessions): void => {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
};

// Добавить сессию пользователя
export const addUserSession = (userId: string): void => {
  const sessions = getActiveSessions();
  
  // Если пользователь уже онлайн - не добавляем
  if (sessions[userId]) {
    console.log(`[SESSIONS] Пользователь ${userId} уже онлайн`);
    return;
  }
  
  sessions[userId] = new Date().toISOString();
  saveActiveSessions(sessions);
  updateOnlineStats();
  console.log(`[SESSIONS] Пользователь ${userId} теперь онлайн`);
};

// Удалить сессию пользователя
export const removeUserSession = (userId: string): void => {
  const sessions = getActiveSessions();
  
  if (!sessions[userId]) {
    console.log(`[SESSIONS] Пользователь ${userId} уже офлайн`);
    return;
  }
  
  delete sessions[userId];
  saveActiveSessions(sessions);
  updateOnlineStats();
  console.log(`[SESSIONS] Пользователь ${userId} теперь офлайн`);
};

// Получить количество активных пользователей
export const getOnlineUsersCount = (): number => {
  const sessions = getActiveSessions();
  return Object.keys(sessions).length;
};

// Обновить статистику на основе активных сессий
const updateOnlineStats = (): void => {
  const activeCount = getOnlineUsersCount();
  const stats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || '{}');
  
  const updatedStats: StatsData = {
    ...stats,
    realOnline: activeCount,
    onlineShown: activeCount + (stats.onlineFake || 0),
    lastUpdate: new Date().toISOString()
  };
  
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updatedStats));
  console.log(`[SESSIONS] Обновлена статистика: ${activeCount} реальных онлайн`);
};

// Очистить старые сессии (например, старше 30 минут)
export const cleanupOldSessions = (maxAgeMinutes = 30): void => {
  const sessions = getActiveSessions();
  const now = new Date();
  let cleaned = 0;
  
  Object.keys(sessions).forEach(userId => {
    const sessionTime = new Date(sessions[userId]);
    const minutesDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60);
    
    if (minutesDiff > maxAgeMinutes) {
      delete sessions[userId];
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    saveActiveSessions(sessions);
    updateOnlineStats();
    console.log(`[SESSIONS] Очищено ${cleaned} старых сессий`);
  }
};

// Экспорт API сессий
export const sessionsAPI = {
  addUserSession,
  removeUserSession,
  getOnlineUsersCount,
  cleanupOldSessions,
  updateOnlineStats
};