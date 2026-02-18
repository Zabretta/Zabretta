// api/mocks.ts
// ==================== ГЛАВНЫЙ ФАЙЛ МОКОВ ====================

// Импорт только оставшихся модулей
import { marketAPI } from './mocks-market';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Типы для оставшихся моков
export type { 
  MarketItem, 
  ItemType,
  CreateItemData,
  ContactAuthorData,
  MarketFilters 
} from './mocks-market';

export const mockAPI = {
  // Барахолка
  marketplace: marketAPI
};

// Экспорт оставшихся API
export { marketAPI };