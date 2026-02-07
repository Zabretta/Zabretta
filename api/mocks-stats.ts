// api/mocks-stats.ts
// ==================== СИСТЕМА СТАТИСТИКИ API ====================

import { APIResponse } from './types';

// === ТИПЫ СТАТИСТИКИ ===

export interface StatsData {
  // Система 1: "Кулибиных на сайте" (совместимость со старым кодом)
  online: number;           // Кулибиных онлайн (реальные + фиктивные) - для обратной совместимости
  realOnline: number;       // Реальные пользователи онлайн
  simulationOnline: number; // Имитированные пользователи онлайн - для обратной совместимости
  
  // Система 2: "Кулибиных всего" (совместимость со старым кодом)
  total: number;           // Кулибиных всего (фиктивные + реальные) - для обратной совместимости
  
  // Новые поля для двух независимых систем
  onlineShown: number;           // Показывается пользователям (реальные онлайн + фиктивные онлайн)
  onlineFake: number;            // Фиктивные пользователи онлайн (100-200)
  isOnlineSimulationActive: boolean; // Включена ли имитация онлайн
  
  totalShown: number;            // Показывается пользователям (реальные зарегистрированные + 207)
  totalReal: number;             // Реальные зарегистрированные пользователи
  totalFake: number;             // Фиктивные пользователи "всего" (константа 207)
  isTotalSimulationActive: boolean; // Включена ли имитация "всего"
  
  // Статические данные (общие для обеих систем)
  projectsCreated: number; // Самоделок создано (статичное)
  adviceGiven: number;     // Ценных советов (статичное)
  lastUpdate: string;      // Время последнего обновления
}

// Тип для истории изменений
export interface AdminStatsHistory {
  timestamp: string;
  action: string;
  changes: Record<string, any>;
  admin: string;
}

// === КОНСТАНТЫ ===

const STATS_STORAGE_KEY = 'samodelkin_stats';
const HISTORY_STORAGE_KEY = 'samodelkin_stats_history';
const FAKE_ONLINE_MIN = 100;       // Минимальное значение фиктивных онлайн
const FAKE_ONLINE_MAX = 200;       // Максимальное значение фиктивных онлайн
const FAKE_ONLINE_START = 150;     // Стартовое значение в середине диапазона
const FAKE_TOTAL_CONSTANT = 207;   // Константа для фиктивных "всего" пользователей

// === БАЗОВАЯ СТАТИСТИКА ===

const BASE_STATS: StatsData = {
  // Система 1: "Кулибиных на сайте" (совместимость)
  online: FAKE_ONLINE_START,           // Для обратной совместимости
  realOnline: 0,                       // Реальные онлайн
  simulationOnline: FAKE_ONLINE_START, // Для обратной совместимости
  
  // Система 2: "Кулибиных всего" (совместимость)
  total: FAKE_TOTAL_CONSTANT,          // Для обратной совместимости
  
  // Новые поля для системы 1
  onlineShown: FAKE_ONLINE_START,      // Показывается пользователям
  onlineFake: FAKE_ONLINE_START,       // Фиктивные онлайн (100-200)
  isOnlineSimulationActive: true,      // Имитация онлайн активна по умолчанию
  
  // Новые поля для системы 2
  totalShown: FAKE_TOTAL_CONSTANT,     // Показывается пользователям
  totalReal: 0,                        // Реальные зарегистрированные
  totalFake: FAKE_TOTAL_CONSTANT,      // Фиктивные "всего" (константа)
  isTotalSimulationActive: true,       // Имитация "всего" активна по умолчанию
  
  // Статические данные
  projectsCreated: 7543,
  adviceGiven: 15287,
  lastUpdate: new Date().toISOString()
};

// === УТИЛИТЫ ===

const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

const getRandomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Генерирует случайное число в диапазоне 100-200
const generateFakeOnline = (currentFake: number): number => {
  // 70% шанс изменения, 30% шанс оставить как есть
  if (Math.random() > 0.3) {
    // Генерируем случайное изменение от 1 до 3
    const changeAmount = getRandomInRange(1, 3);
    
    // Определяем направление: 50% шанс увеличения, 50% уменьшения
    const isIncrease = Math.random() > 0.5;
    
    let newValue = isIncrease ? currentFake + changeAmount : currentFake - changeAmount;
    
    // Гарантируем диапазон 100-200 с коррекцией если вышли за пределы
    if (newValue < FAKE_ONLINE_MIN) {
      // Если ниже 100, добавляем немного
      newValue = FAKE_ONLINE_MIN + getRandomInRange(1, 5);
    } else if (newValue > FAKE_ONLINE_MAX) {
      // Если выше 200, убавляем немного
      newValue = FAKE_ONLINE_MAX - getRandomInRange(1, 5);
    }
    
    // Финальная проверка диапазона
    return Math.max(FAKE_ONLINE_MIN, Math.min(FAKE_ONLINE_MAX, newValue));
  }
  
  // Если не меняем, возвращаем текущее значение
  return currentFake;
};

// === ОСНОВНЫЕ ФУНКЦИИ ===

// Загружает статистику из localStorage или возвращает значения по умолчанию
const loadStatsFromStorage = (): StatsData => {
  try {
    const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      
      // Миграция: если это старая структура, преобразуем в новую
      if (parsed.realOnline === undefined) {
        console.log('[STATS] Миграция со старой структуры данных');
        return {
          ...BASE_STATS,
          realOnline: parsed.realOnline || 0,
          totalReal: parsed._realTotal || 0,
          totalShown: (parsed._realTotal || 0) + FAKE_TOTAL_CONSTANT,
        };
      }
      
      // Если это новая структура, возвращаем как есть
      return parsed;
    }
  } catch (error) {
    console.error('[STATS] Ошибка загрузки статистики из localStorage:', error);
  }
  
  // Первый запуск: возвращаем базовые значения
  console.log('[STATS] Создание начальной статистики');
  return BASE_STATS;
};

// Сохраняет статистику в localStorage
const saveStatsToStorage = (stats: StatsData): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    console.log('[STATS] Сохранено в localStorage. Онлайн:', stats.onlineShown, 'Всего:', stats.totalShown);
  } catch (error) {
    console.error('[STATS] Ошибка сохранения статистики в localStorage:', error);
  }
};

// Добавляет запись в историю изменений
const addHistoryRecord = (action: string, changes: Record<string, any>, admin: string = 'admin'): void => {
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    const history: AdminStatsHistory[] = savedHistory ? JSON.parse(savedHistory) : [];
    
    const newRecord: AdminStatsHistory = {
      timestamp: new Date().toISOString(),
      action,
      changes,
      admin
    };
    
    history.unshift(newRecord); // Добавляем в начало
    
    // Сохраняем только последние 50 записей
    const trimmedHistory = history.slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
    
    console.log(`[HISTORY] Добавлена запись: ${action}`, changes);
  } catch (error) {
    console.error('[HISTORY] Ошибка сохранения истории:', error);
  }
};

// Получить историю изменений для админки
export const getHistory = async (): Promise<APIResponse<AdminStatsHistory[]>> => {
  console.log('[API MOCKS] Загрузка истории изменений...');
  await simulateNetworkDelay();
  
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    
    const history: AdminStatsHistory[] = savedHistory 
      ? JSON.parse(savedHistory)
      : [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'Корректировка фиктивных "всего"',
            changes: { totalFake: '207 → 208' },
            admin: 'admin'
          },
          {
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: 'Включение имитации онлайн',
            changes: { onlineFake: '0 → 150' },
            admin: 'admin'
          },
          {
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            action: 'Регистрация нового пользователя',
            changes: { totalReal: '45 → 46' },
            admin: 'system'
          }
        ];
    
    console.log('[API MOCKS] История загружена:', history.length, 'записей');
    
    return {
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[API MOCKS] Ошибка загрузки истории:', error);
    
    return {
      success: false,
      error: 'Ошибка загрузки истории',
      timestamp: new Date().toISOString()
    };
  }
};

// Получить статистику для пользователей (с фиктивными данными)
export const getStatsForUsers = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Загрузка статистики для пользователей...');
  await simulateNetworkDelay();
  
  const stats = loadStatsFromStorage();
  
  // Для пользователей показываем только суммарные значения
  const userView: StatsData = {
    ...stats,
    // Для обратной совместимости
    online: stats.onlineShown,
    total: stats.totalShown,
    simulationOnline: stats.isOnlineSimulationActive ? stats.onlineFake : 0,
  };
  
  console.log('[STATS] Пользователям показано: онлайн=', userView.online, 'всего=', userView.total);
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: userView,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статистика для пользователей загружена:', mockResponse);
  return mockResponse;
};

// Получить статистику для админа (с разделением фиктивных/реальных)
export const getStatsForAdmin = async (): Promise<APIResponse<StatsData & {
  onlineReal: number;
  onlineFake: number;
  totalReal: number;
  totalFake: number;
}>> => {
  console.log('[API MOCKS] Загрузка статистики ДЛЯ АДМИНА...');
  await simulateNetworkDelay();
  
  const stats = loadStatsFromStorage();
  
  // Для админа показываем все данные
  const adminStats = {
    ...stats,
    // Для обратной совместимости
    online: stats.onlineShown,
    total: stats.totalShown,
    simulationOnline: stats.onlineFake,
    // Явные поля для админ-панели
    onlineReal: stats.realOnline,
    onlineFake: stats.onlineFake,
    totalReal: stats.totalReal,
    totalFake: stats.totalFake,
  };
  
  console.log('[STATS] Админу показано: онлайн=', adminStats.onlineShown, 
              '(реальных:', adminStats.realOnline, 'фиктивных:', adminStats.onlineFake, ')',
              'всего=', adminStats.totalShown,
              '(реальных:', adminStats.totalReal, 'фиктивных:', adminStats.totalFake, ')');
  
  const mockResponse: APIResponse<typeof adminStats> = {
    success: true,
    data: adminStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статистика для админа загружена:', mockResponse);
  return mockResponse;
};

// Имитация изменения онлайн пользователей
export const simulateOnlineChange = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Имитация изменения онлайн пользователей...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  
  // Если имитация выключена - показываем только реальных пользователей
  if (!currentStats.isOnlineSimulationActive) {
    console.log('[STATS] Имитация онлайн отключена, показываем только реальных пользователей');
    
    const updatedStats: StatsData = {
      ...currentStats,
      // ОБЯЗАТЕЛЬНО: при выключенной имитации фиктивных нет
      onlineFake: 0,
      onlineShown: currentStats.realOnline, // ВАЖНО: показываем реальных пользователей
      // Для обратной совместимости
      simulationOnline: 0,
      online: currentStats.realOnline,
      lastUpdate: new Date().toISOString()
    };
    
    saveStatsToStorage(updatedStats);
    
    console.log(`[STATS] Имитация выключена: onlineFake=0, realOnline=${currentStats.realOnline}, onlineShown=${currentStats.realOnline}`);
    
    return {
      success: true,
      data: updatedStats,
      timestamp: new Date().toISOString()
    };
  }
  
  // Если имитация включена - генерируем новые значения
  const newFakeOnline = generateFakeOnline(currentStats.onlineFake);
  const newOnlineShown = currentStats.realOnline + newFakeOnline;
  
  const updatedStats: StatsData = {
    ...currentStats,
    onlineFake: newFakeOnline,
    onlineShown: newOnlineShown,
    // Для обратной совместимости
    simulationOnline: newFakeOnline,
    online: newOnlineShown,
    lastUpdate: new Date().toISOString()
  };
  
  saveStatsToStorage(updatedStats);
  
  console.log(`[STATS] Имитация онлайн: ${currentStats.onlineFake} → ${newFakeOnline}`);
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: updatedStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Имитация завершена:', mockResponse);
  return mockResponse;
};

// Увеличить счетчики при регистрации
export const incrementOnRegistration = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Увеличение счетчиков при регистрации НОВОГО ПОЛЬЗОВАТЕЛЯ...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  
  // ВАЖНО: увеличиваем реальных зарегистрированных
  const newTotalReal = currentStats.totalReal + 1;
  
  // ВАЖНО: totalShown должен быть суммой реальных + фиктивных
  const newTotalShown = newTotalReal + currentStats.totalFake;
  
  const updatedStats: StatsData = {
    ...currentStats,
    totalReal: newTotalReal,           // Увеличили реальных
    totalShown: newTotalShown,         // Обновили сумму
    // Для обратной совместимости
    total: newTotalShown,
    lastUpdate: new Date().toISOString()
  };
  
  saveStatsToStorage(updatedStats);
  addHistoryRecord('Регистрация нового пользователя', { totalReal: `${currentStats.totalReal} → ${newTotalReal}` }, 'system');
  
  console.log('[API MOCKS] Регистрация: totalReal:', newTotalReal, 'totalShown:', newTotalShown);
  return {
    success: true,
    data: updatedStats,
    timestamp: new Date().toISOString()
  };
};

// === ФУНКЦИИ УПРАВЛЕНИЯ ДЛЯ АДМИНКИ ===

// Включение/выключение имитации онлайн
export const toggleOnlineSimulation = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Переключение имитации онлайн...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  const newState = !currentStats.isOnlineSimulationActive;
  
  const updatedStats: StatsData = {
    ...currentStats,
    isOnlineSimulationActive: newState,
    onlineFake: newState ? generateFakeOnline(currentStats.onlineFake) : 0,
    onlineShown: newState ? (currentStats.realOnline + generateFakeOnline(currentStats.onlineFake)) : currentStats.realOnline,
    // Для обратной совместимости
    simulationOnline: newState ? generateFakeOnline(currentStats.onlineFake) : 0,
    online: newState ? (currentStats.realOnline + generateFakeOnline(currentStats.onlineFake)) : currentStats.realOnline,
    lastUpdate: new Date().toISOString()
  };
  
  saveStatsToStorage(updatedStats);
  addHistoryRecord(newState ? 'Включение имитации онлайн' : 'Выключение имитации онлайн', 
    { onlineFake: `${currentStats.onlineFake} → ${updatedStats.onlineFake}` });
  
  console.log(`[STATS] Имитация онлайн ${newState ? 'включена' : 'выключена'}. 
               onlineFake=${updatedStats.onlineFake}, onlineShown=${updatedStats.onlineShown}`);
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: updatedStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Имитация онлайн переключена:', mockResponse);
  return mockResponse;
};

// Включение/выключение имитации "всего"
export const toggleTotalSimulation = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Админ: переключение показа фиктивных "всего"...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  const newState = !currentStats.isTotalSimulationActive;
  
  // ВАЖНО: если включаем - возвращаем стандартное значение 207, если выключаем - 0
  const newTotalFake = newState ? FAKE_TOTAL_CONSTANT : 0;
  // ВАЖНО: всегда totalShown = totalReal + totalFake
  const newTotalShown = currentStats.totalReal + newTotalFake;
  
  const updatedStats: StatsData = {
    ...currentStats,
    isTotalSimulationActive: newState,
    totalFake: newTotalFake,
    totalShown: newTotalShown,
    // Для обратной совместимости
    total: newTotalShown,
    lastUpdate: new Date().toISOString()
  };
  
  saveStatsToStorage(updatedStats);
  addHistoryRecord(newState ? 'Включение фиктивных "всего"' : 'Выключение фиктивных "всего"', 
    { totalFake: `${currentStats.totalFake} → ${newTotalFake}` });
  
  console.log(`[STATS] Показ фиктивных ${newState ? 'вкл' : 'выкл'}: totalFake=${newTotalFake}, totalShown=${newTotalShown}`);
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: updatedStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Показ фиктивных переключен:', mockResponse);
  return mockResponse;
};

// Увеличение фиктивных "всего" на 1
export const incrementTotalFake = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Админ: увеличение фиктивных "всего" на 1...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  
  // ВАЖНО: увеличиваем только фиктивных
  const newTotalFake = currentStats.totalFake + 1;
  // ВАЖНО: пересчитываем сумму
  const newTotalShown = currentStats.totalReal + newTotalFake;
  
  const updatedStats: StatsData = {
    ...currentStats,
    totalFake: newTotalFake,           // Увеличили фиктивных
    totalShown: newTotalShown,         // Обновили сумму
    // Для обратной совместимости
    total: newTotalShown,
    lastUpdate: new Date().toISOString()
  };
  
  saveStatsToStorage(updatedStats);
  addHistoryRecord('Увеличение фиктивных "всего"', { totalFake: `${currentStats.totalFake} → ${newTotalFake}` });
  
  console.log(`[STATS] Админ +1: totalFake ${currentStats.totalFake}→${newTotalFake}, totalShown=${newTotalShown}`);
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: updatedStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Фиктивные "всего" увеличены:', mockResponse);
  return mockResponse;
};

// Уменьшение фиктивных "всего" на 1
export const decrementTotalFake = async (): Promise<APIResponse<StatsData>> => {
  console.log('[API MOCKS] Админ: уменьшение фиктивных "всего" на 1...');
  await simulateNetworkDelay();
  
  const currentStats = loadStatsFromStorage();
  
  // ВАЖНО: уменьшаем фиктивных, но не ниже 0
  const newTotalFake = Math.max(0, currentStats.totalFake - 1);
  // ВАЖНО: пересчитываем сумму
  const newTotalShown = currentStats.totalReal + newTotalFake;
  
  const updatedStats: StatsData = {
    ...currentStats,
    totalFake: newTotalFake,           // Уменьшили фиктивных
    totalShown: newTotalShown,         // Обновили сумму
    // Для обратной совместимости
    total: newTotalShown,
    lastUpdate: new Date().toISOString()
  };
  
  saveStatsToStorage(updatedStats);
  addHistoryRecord('Уменьшение фиктивных "всего"', { totalFake: `${currentStats.totalFake} → ${newTotalFake}` });
  
  console.log(`[STATS] Админ -1: totalFake ${currentStats.totalFake}→${newTotalFake}, totalShown=${newTotalShown}`);
  
  const mockResponse: APIResponse<StatsData> = {
    success: true,
    data: updatedStats,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Фиктивные "всего" уменьшены:', mockResponse);
  return mockResponse;
};

// Получить детальную информацию
export const getDetailedStats = async (): Promise<APIResponse<{
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
    shownTotal: currentStats.totalShown,
    realTotal: currentStats.totalReal,
    fakeTotal: currentStats.totalFake,
    shownOnline: currentStats.onlineShown,
    realOnline: currentStats.realOnline,
    fakeOnline: currentStats.onlineFake,
    formula: `Фиктивные "всего": ${FAKE_TOTAL_CONSTANT} (константа)`,
    fakeTotalConstant: FAKE_TOTAL_CONSTANT,
    canEditFakeTotal: true // Теперь можно редактировать через кнопки
  };
  
  const mockResponse: APIResponse<typeof detailedInfo> = {
    success: true,
    data: detailedInfo,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Детальная статистика:', mockResponse);
  return mockResponse;
};

// Сбросить статистику (для разработки)
export const resetStats = async (): Promise<APIResponse<{ reset: boolean }>> => {
  console.log('[API MOCKS] Сброс статистики...');
  await simulateNetworkDelay();
  
  localStorage.removeItem(STATS_STORAGE_KEY);
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  
  const mockResponse: APIResponse<{ reset: boolean }> = {
    success: true,
    data: { reset: true },
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статистика сброшена:', mockResponse);
  return mockResponse;
};

// === ЭКСПОРТ СТАТИСТИКИ API ===

export const statsAPI = {
  // Основные функции
  getStats: getStatsForUsers,
  getStatsForUsers,
  getStatsForAdmin,
  simulateOnlineChange,
  incrementOnRegistration,
  resetStats,
  getHistory, // <-- ДОБАВЛЕНА НОВАЯ ФУНКЦИЯ
  
  // Функции управления для админки
  toggleOnlineSimulation,
  toggleTotalSimulation,
  incrementTotalFake,
  decrementTotalFake,
  getDetailedStats
};