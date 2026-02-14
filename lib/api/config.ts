// lib/api/config.ts
// Переключатель моков - централизованное управление

// Читаем из .env.local
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// URL бэкенда
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// В режиме разработки можно принудительно отключить моки
export const FORCE_REAL_API = true; // Ставим true для работы с бэкендом

// Итоговый флаг
export const IS_MOCK_ENABLED = USE_MOCKS && !FORCE_REAL_API;

// Логируем режим работы
if (typeof window !== 'undefined') {
  console.log(`🔧 API режим: ${IS_MOCK_ENABLED ? 'МОКИ' : 'РЕАЛЬНЫЙ БЭКЕНД'}`);
}