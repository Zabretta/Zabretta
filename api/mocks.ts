// api/mocks.ts

// Базовые типы
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'auto' | 'brown';
  brightness: number;
  fontSize: number;
  showAnimations: boolean;
}

type ItemType = "sell" | "buy" | "free" | "exchange" | "auction";

interface MarketItem {
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

interface User {
  id: string;
  login: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
}

interface RulesData {
  rules: string[];
  accepted: boolean;
  acceptedDate?: string;
}

interface AcceptRulesResponse {
  accepted: boolean;
  acceptedDate: string;
}

interface ResetAcceptanceResponse {
  reset: boolean;
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

// Имитация задержки сети
const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

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
      
      const mockResponse: APIResponse<User> = {
        success: true,
        data: {
          id: 'user_' + Date.now(),
          login: userData.login,
          email: userData.email,
          name: userData.login,
          avatar: `https://i.pravatar.cc/150?u=${userData.email}`,
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
      
      const mockResponse: APIResponse<{ user: User; token: string }> = {
        success: true,
        data: {
          user: {
            id: 'user_123',
            login: credentials.login,
            email: `${credentials.login}@example.com`,
            name: credentials.login,
            avatar: `https://i.pravatar.cc/150?u=${credentials.login}`,
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
  }
};
