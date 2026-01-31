// api/mocks-rules.ts
// ==================== ПРАВИЛА СООБЩЕСТВА API ====================

import { APIResponse } from './types';

// === ТИПЫ ПРАВИЛ ===

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

export interface AcceptanceStatus {
  accepted: boolean;
  acceptedDate?: string;
}

// === УТИЛИТЫ ===

const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

// Правила сообщества (можно вынести в константы или загружать с сервера)
const COMMUNITY_RULES = [
  "Уважаемые пользователи, приветствуем вас на нашем сайте САМОДЕЛКИН!",
  "На нашей площадке после регистрации вы получаете возможность:",
  "1. Размещать свои самоделки в разделе 'Проекты'",
  "2. Задавать вопросы и получать помощь в разделе 'Помощь'",
  "3. Продавать или отдавать инструменты в разделе 'Барахолка'",
  "4. Читать полезные статьи в 'Библиотеке'",
  "",
  "На сайте для каждого пользователя создана рейтинговая система:",
  "- За каждое действие на сайте вы получаете рейтинговые баллы",
  "- Баллы суммируются и повышают ваш уровень",
  "- Уровень отображается в вашем профиле",
  "",
  "На сайте есть возможность разместить обьявление о продаже:",
  "- Вы можете продавать инструменты, материалы, готовые изделия",
  "- Указывайте реальные цены и состояние товара",
  "- Фотографии повышают доверие к объявлению",
  "",
  "На сайте запрещено:",
  "1. Распространять стороннюю рекламу и спам",
  "2. Оскорблять других пользователей",
  "3. Размещать незаконный контент",
  "4. Обманывать при продаже товаров",
  "",
  "Уважаемые пользователи, просьба относиться друг к другу с уважением,",
  "помогать новичкам и создавать полезный контент для сообщества!"
];

// === ФУНКЦИИ ПРАВИЛ ===

// Загрузка правил сообщества
export const loadRules = async (): Promise<APIResponse<RulesData>> => {
  console.log('[API MOCKS] Загрузка правил сообщества');
  await simulateNetworkDelay();
  
  const accepted = localStorage.getItem('samodelkin_rules_accepted') === 'true';
  const acceptedDate = localStorage.getItem('samodelkin_rules_accepted_date') || undefined;
  
  const mockResponse: APIResponse<RulesData> = {
    success: true,
    data: { 
      rules: COMMUNITY_RULES, 
      accepted,
      acceptedDate
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Правила загружены. Приняты:', accepted);
  return mockResponse;
};

// Принятие правил сообщества
export const acceptRules = async (): Promise<APIResponse<AcceptRulesResponse>> => {
  console.log('[API MOCKS] Принятие правил сообщества');
  await simulateNetworkDelay();
  
  const acceptedDate = new Date().toISOString();
  
  // Сохраняем в localStorage
  localStorage.setItem('samodelkin_rules_accepted', 'true');
  localStorage.setItem('samodelkin_rules_accepted_date', acceptedDate);
  
  // Логируем событие (в реальном приложении здесь был бы запрос к API)
  const acceptLog = {
    action: 'rules_accepted',
    timestamp: acceptedDate,
    userAgent: navigator.userAgent
  };
  
  const acceptanceLogs = JSON.parse(localStorage.getItem('samodelkin_acceptance_logs') || '[]');
  acceptanceLogs.push(acceptLog);
  localStorage.setItem('samodelkin_acceptance_logs', JSON.stringify(acceptanceLogs));
  
  console.log('[API MOCKS] Правила приняты:', acceptLog);
  
  const mockResponse: APIResponse<AcceptRulesResponse> = {
    success: true,
    data: { 
      accepted: true, 
      acceptedDate 
    },
    timestamp: new Date().toISOString()
  };
  
  return mockResponse;
};

// Сброс принятия правил (для разработки)
export const resetAcceptance = async (): Promise<APIResponse<ResetAcceptanceResponse>> => {
  console.log('[API MOCKS] Сброс принятия правил (для разработки)');
  await simulateNetworkDelay();
  
  // Удаляем данные о принятии
  localStorage.removeItem('samodelkin_rules_accepted');
  localStorage.removeItem('samodelkin_rules_accepted_date');
  
  // Логируем сброс
  const resetLog = {
    action: 'rules_reset',
    timestamp: new Date().toISOString(),
    reason: 'development_reset'
  };
  
  const resetLogs = JSON.parse(localStorage.getItem('samodelkin_reset_logs') || '[]');
  resetLogs.push(resetLog);
  localStorage.setItem('samodelkin_reset_logs', JSON.stringify(resetLogs));
  
  console.log('[API MOCKS] Согласие сброшено:', resetLog);
  
  const mockResponse: APIResponse<ResetAcceptanceResponse> = {
    success: true,
    data: { reset: true },
    timestamp: new Date().toISOString()
  };
  
  return mockResponse;
};

// Проверка статуса принятия правил
export const checkAcceptance = async (): Promise<APIResponse<AcceptanceStatus>> => {
  console.log('[API MOCKS] Проверка статуса принятия правил');
  await simulateNetworkDelay();
  
  const accepted = localStorage.getItem('samodelkin_rules_accepted') === 'true';
  const acceptedDate = localStorage.getItem('samodelkin_rules_accepted_date') || undefined;
  
  const mockResponse: APIResponse<AcceptanceStatus> = {
    success: true,
    data: { accepted, acceptedDate },
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статус проверен. Приняты:', accepted);
  return mockResponse;
};

// Получение статистики принятия правил (для админки)
export const getAcceptanceStats = async (): Promise<APIResponse<{
  totalAccepted: number;
  lastAcceptedDate?: string;
  acceptanceRate: number;
  recentAccepts: Array<{
    timestamp: string;
    userAgent?: string;
  }>;
}>> => {
  console.log('[API MOCKS] Получение статистики принятия правил');
  await simulateNetworkDelay();
  
  // В реальном приложении здесь был бы запрос к БД
  // Для демо используем localStorage
  
  const acceptanceLogs = JSON.parse(localStorage.getItem('samodelkin_acceptance_logs') || '[]');
  const resetLogs = JSON.parse(localStorage.getItem('samodelkin_reset_logs') || '[]');
  
  const totalAccepted = acceptanceLogs.length;
  const lastAccepted = acceptanceLogs[acceptanceLogs.length - 1];
  
  // Простая логика для демо: 85% пользователей принимают правила
  const acceptanceRate = 85;
  
  const mockResponse: APIResponse<{
    totalAccepted: number;
    lastAcceptedDate?: string;
    acceptanceRate: number;
    recentAccepts: Array<{
      timestamp: string;
      userAgent?: string;
    }>;
  }> = {
    success: true,
    data: {
      totalAccepted,
      lastAcceptedDate: lastAccepted?.timestamp,
      acceptanceRate,
      recentAccepts: acceptanceLogs.slice(-5).reverse() // Последние 5 принятий
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Статистика принятия:', mockResponse.data);
  return mockResponse;
};

// Обновление правил (для админки)
export const updateRules = async (newRules: string[]): Promise<APIResponse<{
  updated: boolean;
  oldRulesCount: number;
  newRulesCount: number;
}>> => {
  console.log('[API MOCKS] Обновление правил сообщества');
  await simulateNetworkDelay();
  
  // В реальном приложении здесь был бы запрос к API для обновления правил
  // Для демо просто логируем
  
  const updateLog = {
    action: 'rules_updated',
    timestamp: new Date().toISOString(),
    oldRulesCount: COMMUNITY_RULES.length,
    newRulesCount: newRules.length,
    changes: `Правила обновлены: ${COMMUNITY_RULES.length} → ${newRules.length} пунктов`
  };
  
  const updateLogs = JSON.parse(localStorage.getItem('samodelkin_rules_update_logs') || '[]');
  updateLogs.push(updateLog);
  localStorage.setItem('samodelkin_rules_update_logs', JSON.stringify(updateLogs));
  
  console.log('[API MOCKS] Правила обновлены:', updateLog);
  
  const mockResponse: APIResponse<{
    updated: boolean;
    oldRulesCount: number;
    newRulesCount: number;
  }> = {
    success: true,
    data: {
      updated: true,
      oldRulesCount: COMMUNITY_RULES.length,
      newRulesCount: newRules.length
    },
    timestamp: new Date().toISOString()
  };
  
  return mockResponse;
};

// Получение истории обновлений правил (для админки)
export const getRulesHistory = async (): Promise<APIResponse<Array<{
  timestamp: string;
  oldRulesCount: number;
  newRulesCount: number;
  changes: string;
}>>> => {
  console.log('[API MOCKS] Получение истории обновлений правил');
  await simulateNetworkDelay();
  
  const updateLogs = JSON.parse(localStorage.getItem('samodelkin_rules_update_logs') || '[]');
  
  // Если нет истории, создаем демо-данные
  if (updateLogs.length === 0) {
    const demoHistory = [
      {
        timestamp: '2024-01-15T10:00:00Z',
        oldRulesCount: 12,
        newRulesCount: 15,
        changes: 'Добавлены правила о рейтинговой системе'
      },
      {
        timestamp: '2024-02-20T14:30:00Z',
        oldRulesCount: 15,
        newRulesCount: 20,
        changes: 'Расширены правила поведения в сообществе'
      },
      {
        timestamp: '2024-03-01T09:15:00Z',
        oldRulesCount: 20,
        newRulesCount: 25,
        changes: 'Добавлены правила для раздела "Барахолка"'
      }
    ];
    
    localStorage.setItem('samodelkin_rules_update_logs', JSON.stringify(demoHistory));
  }
  
  const history = JSON.parse(localStorage.getItem('samodelkin_rules_update_logs') || '[]');
  
  const mockResponse: APIResponse<typeof history> = {
    success: true,
    data: history,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] История правил загружена. Записей:', history.length);
  return mockResponse;
};

// === ЭКСПОРТ ПРАВИЛ API ===

export const rulesAPI = {
  // Основные функции
  loadRules,
  acceptRules,
  resetAcceptance,
  checkAcceptance,
  
  // Дополнительные функции (для админки)
  getAcceptanceStats,
  updateRules,
  getRulesHistory
};
