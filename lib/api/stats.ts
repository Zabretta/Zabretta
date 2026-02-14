// lib/api/stats.ts
// API-клиент для публичной статистики на главной странице

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PublicStats {
  online: number;      // реальные онлайн
  total: number;       // реальные всего
  projectsCreated: number;
  adviceGiven: number;
}

// Функция для получения статистики для главной страницы
export const getPublicStats = async (): Promise<PublicStats> => {
  try {
    // ИСПРАВЛЕНО: добавляем /api в путь
    const response = await fetch(`${API_BASE}/api/stats/system`);
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки статистики');
    }
    
    const result = await response.json();
    const data = result.data;
    
    return {
      online: data.users?.online || 0,
      total: data.users?.total || 0,
      projectsCreated: data.content?.projects || data.content?.totalPosts || 0,
      adviceGiven: data.content?.totalComments || 0
    };
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    throw error;
  }
};
