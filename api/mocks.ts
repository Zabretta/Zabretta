// api/mocks.ts
// ==================== ГЛАВНЫЙ ФАЙЛ МОКОВ (единая точка входа) ====================

// Импорт только оставшихся модулей
import { rulesAPI } from './mocks-rules';
import { marketAPI } from './mocks-market';
import { sessionsAPI } from './mocks-sessions';

// === БАЗОВЫЕ ТИПЫ ===

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Типы импортируются из отдельных файлов
export type { 
  RulesData, 
  AcceptRulesResponse, 
  ResetAcceptanceResponse 
} from './mocks-rules';
export type { 
  MarketItem, 
  ItemType,
  CreateItemData,
  ContactAuthorData,
  MarketFilters 
} from './mocks-market';

// === mockAPI ОБЪЕКТ (только оставшиеся модули) ===

export const mockAPI = {
  // Барахолка
  marketplace: marketAPI,

  // Правила сообщества
  rules: rulesAPI,

  // Система сессий
  sessions: sessionsAPI
};

// Экспорт оставшихся API
export { rulesAPI, marketAPI, sessionsAPI };