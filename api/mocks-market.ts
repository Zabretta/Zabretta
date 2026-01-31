// api/mocks-market.ts
// ==================== БАРАХОЛКА (MARKETPLACE) API ====================

import { APIResponse } from './types';

// === ТИПЫ БАРАХОЛКИ ===

export type ItemType = "sell" | "buy" | "free" | "exchange" | "auction";

export interface MarketItem {
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
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  contacts?: number;
}

export interface CreateItemData {
  title: string;
  description: string;
  price: number | "free";
  location: string;
  type: ItemType;
  imageUrl?: string;
  negotiable?: boolean;
}

export interface ContactAuthorData {
  itemId: number;
  message?: string;
  contactMethod: 'email' | 'phone' | 'message';
  contactInfo?: string;
}

export interface MarketFilters {
  type?: ItemType | 'all';
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating';
}

// === УТИЛИТЫ ===

const simulateNetworkDelay = () => new Promise(resolve => 
  setTimeout(resolve, Math.random() * 500 + 200)
);

// Демо данные для барахолки
const DEMO_ITEMS: MarketItem[] = [
  {
    id: 1,
    title: "Набор инструментов для начинающего мастера",
    description: "Полный набор инструментов: молоток, отвертки, пассатижи, уровень, рулетка. Отличное состояние, все инструменты в рабочем состоянии. Набор идеально подходит для домашнего использования.",
    price: 2500,
    location: "Москва",
    author: "Иван Кулибин",
    rating: 4.8,
    type: "sell",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7…",
    negotiable: true,
    createdAt: "2024-03-10T14:30:00Z",
    updatedAt: "2024-03-12T09:15:00Z",
    views: 124,
    contacts: 8
  },
  {
    id: 2,
    title: "Ищу 3D принтер для моделирования",
    description: "Ищу 3D принтер с областью печати не менее 200x200x200 мм. Рассмотрю варианты как новые, так и б/у в хорошем состоянии. Готов забрать сам в пределах Москвы и области.",
    price: 15000,
    location: "Москва",
    author: "Алексей Техников",
    rating: 4.5,
    type: "buy",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12…",
    negotiable: true,
    createdAt: "2024-03-14T11:20:00Z",
    updatedAt: "2024-03-14T11:20:00Z",
    views: 89,
    contacts: 5
  },
  {
    id: 3,
    title: "Отдам даром деревянные заготовки",
    description: "Остались деревянные заготовки разных размеров: доски, бруски, фанера. Идеально для столярных проектов, поделок, обучения. Забирайте всё или частично. Самовывоз.",
    price: "free",
    location: "Санкт-Петербург",
    author: "Мастер Деревяшкин",
    rating: 4.9,
    type: "free",
    imageUrl: "https://images.unsplash.com/photo-1505932799465-2933a69b647e…",
    negotiable: false,
    createdAt: "2024-03-13T16:45:00Z",
    updatedAt: "2024-03-13T16:45:00Z",
    views: 156,
    contacts: 12
  },
  {
    id: 4,
    title: "Обменяю паяльник на мультиметр",
    description: "Паяльная станция Lukey 702, отличное состояние, почти не использовалась. Хочу обменять на качественный цифровой мультиметр. Рассмотрю другие предложения по инструментам.",
    price: 0,
    location: "Екатеринбург",
    author: "Электроник Сергеич",
    rating: 4.3,
    type: "exchange",
    imageUrl: "https://images.unsplash.com/photo-1565262353505-4c4113c9c5b9…",
    negotiable: true,
    createdAt: "2024-03-12T09:30:00Z",
    updatedAt: "2024-03-12T09:30:00Z",
    views: 67,
    contacts: 3
  },
  {
    id: 5,
    title: "Аукцион: винтажный рубанок Stanley №5",
    description: "Винтажный рубанок Stanley №5, 1950-х годов выпуска. Отличное коллекционное состояние, полностью рабочий. Начальная цена 2000 руб. Аукцион продлится 7 дней.",
    price: 2000,
    location: "Новосибирск",
    author: "Коллекционер Инструментов",
    rating: 4.7,
    type: "auction",
    imageUrl: "https://images.unsplash.com/photo-1572985025050-4d1855c57b2c…",
    negotiable: false,
    createdAt: "2024-03-11T13:15:00Z",
    updatedAt: "2024-03-11T13:15:00Z",
    views: 203,
    contacts: 15
  },
  {
    id: 6,
    title: "Продам набор сверл по металлу",
    description: "Набор сверл по металлу от 1 до 10 мм, 25 штук. Качественный металл, острые кромки. Использовался пару раз, состояние как новое.",
    price: 800,
    location: "Казань",
    author: "Слесарь Михаил",
    rating: 4.6,
    type: "sell",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12…",
    negotiable: true,
    createdAt: "2024-03-15T10:00:00Z",
    updatedAt: "2024-03-15T10:00:00Z",
    views: 45,
    contacts: 2
  }
];

// Вспомогательная функция для фильтрации
const applyFilters = (items: MarketItem[], filters: MarketFilters): MarketItem[] => {
  let result = [...items];
  
  // Фильтр по типу
  if (filters.type && filters.type !== 'all') {
    result = result.filter(item => item.type === filters.type);
  }
  
  // Фильтр по местоположению
  if (filters.location) {
    const locationLower = filters.location.toLowerCase();
    result = result.filter(item => 
      item.location.toLowerCase().includes(locationLower)
    );
  }
  
  // Фильтр по цене
  if (filters.minPrice !== undefined) {
    result = result.filter(item => {
      if (item.price === "free") return true;
      return item.price >= filters.minPrice!;
    });
  }
  
  if (filters.maxPrice !== undefined) {
    result = result.filter(item => {
      if (item.price === "free") return true;
      return item.price <= filters.maxPrice!;
    });
  }
  
  // Поиск по названию и описанию
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
    );
  }
  
  // Сортировка
  if (filters.sortBy) {
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'price_low':
          const priceA = a.price === "free" ? 0 : a.price;
          const priceB = b.price === "free" ? 0 : b.price;
          return priceA - priceB;
        case 'price_high':
          const priceAHigh = a.price === "free" ? 0 : a.price;
          const priceBHigh = b.price === "free" ? 0 : b.price;
          return priceBHigh - priceAHigh;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  }
  
  return result;
};

// === ФУНКЦИИ БАРАХОЛКИ ===

// Загрузка объявлений с фильтрами
export const loadMarketItems = async (filters?: MarketFilters): Promise<APIResponse<MarketItem[]>> => {
  console.log(`[API MOCKS] Загрузка объявлений с фильтрами:`, filters);
  await simulateNetworkDelay();
  
  // 1. Загружаем пользовательские объявления из localStorage
  let userItems: MarketItem[] = [];
  try {
    const userItemsStr = localStorage.getItem('marketplace_user_items');
    if (userItemsStr) {
      userItems = JSON.parse(userItemsStr);
      console.log('[MARKET] Загружено пользовательских объявлений:', userItems.length);
    }
  } catch (error) {
    console.error('[MARKET] Ошибка загрузки пользовательских объявлений:', error);
  }
  
  // 2. Создаем полный список объявлений
  // Сначала пользовательские (новые сверху), потом фиктивные
  const allItems = [...userItems, ...DEMO_ITEMS];
  
  console.log('[MARKET] Всего объявлений:', allItems.length, 
              '(Пользовательских:', userItems.length, 
              'Фейковых:', DEMO_ITEMS.length, ')');
  
  // 3. Применяем фильтры ко всем объявлениям
  let filteredItems = allItems;
  if (filters) {
    filteredItems = applyFilters(allItems, filters);
    console.log('[MARKET] После фильтров:', filteredItems.length);
  }
  
  const mockResponse: APIResponse<MarketItem[]> = {
    success: true,
    data: filteredItems,
    timestamp: new Date().toISOString()
  };
  
  console.log('[API MOCKS] Объявления загружены');
  return mockResponse;
};

// Создание нового объявления
export const createMarketItem = async (itemData: CreateItemData): Promise<APIResponse<MarketItem>> => {
  console.log('[API MOCKS] Создание объявления:', itemData);
  await simulateNetworkDelay();
  
  // Валидация данных
  if (!itemData.title || itemData.title.trim().length < 5) {
    return {
      success: false,
      error: 'Название должно содержать минимум 5 символов',
      timestamp: new Date().toISOString()
    };
  }
  
  if (!itemData.description || itemData.description.trim().length < 20) {
    return {
      success: false,
      error: 'Описание должно содержать минимум 20 символов',
      timestamp: new Date().toISOString()
    };
  }
  
  if (!itemData.location) {
    return {
      success: false,
      error: 'Укажите местоположение',
      timestamp: new Date().toISOString()
    };
  }
  
  // Создаем новое объявление
  const newItem: MarketItem = {
    ...itemData,
    id: Date.now(),
    rating: 4.5, // Начальный рейтинг
    author: "Текущий пользователь",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    contacts: 0
  };
  
  // Сохраняем в localStorage
  try {
    const userItems = JSON.parse(localStorage.getItem('marketplace_user_items') || '[]');
    userItems.unshift(newItem); // Добавляем в начало
    localStorage.setItem('marketplace_user_items', JSON.stringify(userItems));
    
    console.log('[API MOCKS] Объявление создано и сохранено:', newItem);
    
  } catch (error) {
    console.error('[MARKET] Ошибка сохранения объявления:', error);
    return {
      success: false,
      error: 'Ошибка сохранения объявления',
      timestamp: new Date().toISOString()
    };
  }
  
  const mockResponse: APIResponse<MarketItem> = {
    success: true,
    data: newItem,
    timestamp: new Date().toISOString()
  };
  
  return mockResponse;
};

// Связь с автором объявления
export const contactItemAuthor = async (contactData: ContactAuthorData): Promise<APIResponse<{ sent: boolean; messageId?: string }>> => {
  console.log(`[API MOCKS] Связь с автором #${contactData.itemId}`, contactData);
  await simulateNetworkDelay();
  
  if (!contactData.itemId) {
    return {
      success: false,
      error: 'Не указан ID объявления',
      timestamp: new Date().toISOString()
    };
  }
  
  // Создаем запись о контакте
  const contactLog = {
    itemId: contactData.itemId,
    message: contactData.message || "Хочу связаться по поводу вашего объявления",
    contactMethod: contactData.contactMethod,
    contactInfo: contactData.contactInfo,
    timestamp: new Date().toISOString(),
  };
  
  // Сохраняем в localStorage
  try {
    const savedContacts = JSON.parse(localStorage.getItem("marketplace_contacts") || '[]');
    savedContacts.push(contactLog);
    localStorage.setItem("marketplace_contacts", JSON.stringify(savedContacts));
    
    console.log('[API MOCKS] Контакт сохранен:', contactLog);
    
  } catch (error) {
    console.error('[MARKET] Ошибка сохранения контакта:', error);
    return {
      success: false,
      error: 'Ошибка отправки сообщения',
      timestamp: new Date().toISOString()
    };
  }
  
  const mockResponse: APIResponse<{ sent: boolean; messageId?: string }> = {
    success: true,
    data: { 
      sent: true,
      messageId: `msg_${Date.now()}`
    },
    timestamp: new Date().toISOString()
  };
  
  return mockResponse;
};

// Получение деталей объявления по ID
export const getMarketItemById = async (itemId: number): Promise<APIResponse<MarketItem>> => {
  console.log(`[API MOCKS] Получение объявления #${itemId}`);
  await simulateNetworkDelay();
  
  // Сначала ищем в пользовательских объявлениях
  try {
    const userItems = JSON.parse(localStorage.getItem('marketplace_user_items') || '[]');
    const userItem = userItems.find((item: MarketItem) => item.id === itemId);
    
    if (userItem) {
      console.log(`[MARKET] Найдено пользовательское объявление #${itemId}`);
      return {
        success: true,
        data: userItem,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('[MARKET] Ошибка поиска пользовательского объявления:', error);
  }
  
  // Ищем в демо-данных
  const demoItem = DEMO_ITEMS.find(item => item.id === itemId);
  
  if (demoItem) {
    console.log(`[MARKET] Найдено фиктивное объявление #${itemId}`);
    return {
      success: true,
      data: demoItem,
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    success: false,
    error: 'Объявление не найдено',
    timestamp: new Date().toISOString()
  };
};

// Обновление объявления
export const updateMarketItem = async (itemId: number, updates: Partial<MarketItem>): Promise<APIResponse<MarketItem>> => {
  console.log(`[API MOCKS] Обновление объявления #${itemId}:`, updates);
  await simulateNetworkDelay();
  
  try {
    const userItems = JSON.parse(localStorage.getItem('marketplace_user_items') || '[]');
    const itemIndex = userItems.findIndex((item: MarketItem) => item.id === itemId);
    
    if (itemIndex === -1) {
      return {
        success: false,
        error: 'Объявление не найдено или вы не являетесь его автором',
        timestamp: new Date().toISOString()
      };
    }
    
    // Обновляем объявление
    const updatedItem = {
      ...userItems[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    userItems[itemIndex] = updatedItem;
    localStorage.setItem('marketplace_user_items', JSON.stringify(userItems));
    
    console.log('[API MOCKS] Объявление обновлено:', updatedItem);
    
    const mockResponse: APIResponse<MarketItem> = {
      success: true,
      data: updatedItem,
      timestamp: new Date().toISOString()
    };
    
    return mockResponse;
    
  } catch (error) {
    console.error('[MARKET] Ошибка обновления объявления:', error);
    return {
      success: false,
      error: 'Ошибка обновления объявления',
      timestamp: new Date().toISOString()
    };
  }
};

// Удаление объявления
export const deleteMarketItem = async (itemId: number): Promise<APIResponse<{ deleted: boolean }>> => {
  console.log(`[API MOCKS] Удаление объявления #${itemId}`);
  await simulateNetworkDelay();
  
  try {
    const userItems = JSON.parse(localStorage.getItem('marketplace_user_items') || '[]');
    const initialLength = userItems.length;
    
    const filteredItems = userItems.filter((item: MarketItem) => item.id !== itemId);
    
    if (filteredItems.length === initialLength) {
      return {
        success: false,
        error: 'Объявление не найдено или вы не являетесь его автором',
        timestamp: new Date().toISOString()
      };
    }
    
    localStorage.setItem('marketplace_user_items', JSON.stringify(filteredItems));
    
    console.log(`[API MOCKS] Объявление #${itemId} удалено`);
    
    const mockResponse: APIResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString()
    };
    
    return mockResponse;
    
  } catch (error) {
    console.error('[MARKET] Ошибка удаления объявления:', error);
    return {
      success: false,
      error: 'Ошибка удаления объявления',
      timestamp: new Date().toISOString()
    };
  }
};

// Получение статистики барахолки (для админки)
export const getMarketStats = async (): Promise<APIResponse<{
  totalItems: number;
  itemsByType: Record<ItemType | 'total', number>;
  dailyAverage: number;
  topLocations: Array<{ location: string; count: number }>;
  recentActivity: Array<{ date: string; created: number; contacts: number }>;
}>> => {
  console.log('[API MOCKS] Получение статистики барахолки');
  await simulateNetworkDelay();
  
  try {
    const userItems = JSON.parse(localStorage.getItem('marketplace_user_items') || '[]');
    const allItems = [...DEMO_ITEMS, ...userItems];
    
    // Статистика по типам
    const itemsByType: Record<ItemType | 'total', number> = {
      sell: allItems.filter(item => item.type === 'sell').length,
      buy: allItems.filter(item => item.type === 'buy').length,
      free: allItems.filter(item => item.type === 'free').length,
      exchange: allItems.filter(item => item.type === 'exchange').length,
      auction: allItems.filter(item => item.type === 'auction').length,
      total: allItems.length
    };
    
    // Топ локаций
    const locationCounts: Record<string, number> = {};
    allItems.forEach(item => {
      locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
    });
    
    const topLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Демо данные для активности
    const recentActivity = [
      { date: '2024-03-15', created: 3, contacts: 12 },
      { date: '2024-03-14', created: 2, contacts: 8 },
      { date: '2024-03-13', created: 4, contacts: 15 },
      { date: '2024-03-12', created: 1, contacts: 5 },
      { date: '2024-03-11', created: 3, contacts: 10 }
    ];
    
    const mockResponse: APIResponse<{
      totalItems: number;
      itemsByType: Record<ItemType | 'total', number>;
      dailyAverage: number;
      topLocations: Array<{ location: string; count: number }>;
      recentActivity: Array<{ date: string; created: number; contacts: number }>;
    }> = {
      success: true,
      data: {
        totalItems: allItems.length,
        itemsByType,
        dailyAverage: Math.round(allItems.length / 30),
        topLocations,
        recentActivity
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('[API MOCKS] Статистика барахолки:', mockResponse.data);
    return mockResponse;
    
  } catch (error) {
    console.error('[MARKET] Ошибка получения статистики:', error);
    return {
      success: false,
      error: 'Ошибка получения статистики',
      timestamp: new Date().toISOString()
    };
  }
};

// === ЭКСПОРТ БАРАХОЛКИ API ===

export const marketAPI = {
  // Основные функции
  loadItems: loadMarketItems,
  createItem: createMarketItem,
  contactAuthor: contactItemAuthor,
  getItemById: getMarketItemById,
  updateItem: updateMarketItem,
  deleteItem: deleteMarketItem,
  
  // Дополнительные функции
  getStats: getMarketStats
};