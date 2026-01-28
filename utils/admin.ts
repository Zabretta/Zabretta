/**
 * Утилиты для админ-панели
 */

/**
 * Форматирует дату в удобный для чтения формат
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * Форматирует число с разделителями тысяч
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ru-RU');
};

/**
 * Возвращает цвет для статуса
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'активен':
      return '#2E8B57'; // Зеленый
    case 'blocked':
    case 'заблокирован':
      return '#CD5C5C'; // Красный
    case 'inactive':
    case 'неактивен':
      return '#A9A9A9'; // Серый
    case 'pending':
    case 'ожидает':
      return '#FF8C00'; // Оранжевый
    default:
      return '#A0522D'; // Коричневый (цвет темы)
  }
};

/**
 * Возвращает иконку для роли
 */
export const getRoleIcon = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'admin':
    case 'администратор':
      return '👑';
    case 'moderator':
    case 'модератор':
      return '🛡️';
    case 'user':
    case 'пользователь':
      return '👤';
    default:
      return '❓';
  }
};

/**
 * Возвращает текстовое представление роли
 */
export const getRoleLabel = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Администратор';
    case 'moderator':
      return 'Модератор';
    case 'user':
      return 'Пользователь';
    default:
      return role;
  }
};

/**
 * Возвращает текстовое представление статуса
 */
export const getStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'Активен';
    case 'blocked':
      return 'Заблокирован';
    case 'inactive':
      return 'Неактивен';
    default:
      return status;
  }
};

/**
 * Создает задержку (для имитации сетевых запросов)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Валидирует email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Обрезает текст до указанной длины
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Генерирует уникальный ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Преобразует объект в query string для URL
 */
export const objectToQueryString = (obj: Record<string, any>): string => {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};

/**
 * Копирует текст в буфер обмена
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback для старых браузеров
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Форматирует размер файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Байт';
  
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};