// api/mocks.ts
// ==================== ГЛАВНЫЙ ФАЙЛ МОКОВ (единая точка входа) ====================

// Импорт всех модулей
import { adminAPI } from './mocks-admin';
import { statsAPI } from './mocks-stats';
import { authAPI } from './mocks-auth';
import { rulesAPI } from './mocks-rules';
import { marketAPI } from './mocks-market';
import { sessionsAPI } from './mocks-sessions'; // <-- ДОБАВЛЕН ИМПОРТ СЕССИЙ

// === БАЗОВЫЕ ТИПЫ (ВЫНЕСТИ В api/types.ts - УЖЕ ВЫНЕСЛИ) ===

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

// Типы теперь импортируются из отдельных файлов
export type { StatsData } from './mocks-stats';
export type { User } from './mocks-auth';
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

// === mockAPI ОБЪЕКТ (единая точка входа) ===

export const mockAPI = {
  // Настройки
  settings: {
    loadSettings: async (): Promise<APIResponse<AppSettings>> => {
      console.log('[API MOCKS] Загрузка настроек с сервера...');
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
      
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
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
      
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
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
      
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

  // Барахолка (теперь импортируется)
  marketplace: marketAPI,

  // Аутентификация (теперь импортируется)
  auth: authAPI,

  // Правила сообщества (теперь импортируется)
  rules: rulesAPI,

  // Система статистики (теперь импортируется)
  stats: statsAPI,

  // Админ-панель API (теперь импортируется)
  admin: adminAPI,

  // Система сессий (НОВЫЙ МОДУЛЬ)
  sessions: sessionsAPI
};

// Экспорт всех API для гибкости
export { adminAPI, statsAPI, authAPI, rulesAPI, marketAPI, sessionsAPI };
