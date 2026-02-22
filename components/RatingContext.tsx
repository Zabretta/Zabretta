// components/RatingContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserRating, RatingRecord, USER_LEVELS, ACTIVITY_LEVELS } from '@/types/admin';
import { useAuth } from './useAuth';
import { userApi } from '@/lib/api/user';

interface RatingContextType {
  userRating: UserRating | null;
  addRatingRecord: (record: Omit<RatingRecord, 'id' | 'timestamp'>) => void;
  getTopActiveUsers: (limit?: number) => UserRating[];
  getUserLevel: (rating: number) => { name: string; icon: string };
  getActivityLevel: (activity: number) => string;
  checkDailyLogin: () => void;
  refreshRating: () => Promise<void>;
}

const RatingContext = createContext<RatingContextType>({
  userRating: null,
  addRatingRecord: () => console.warn('RatingContext: функция addRatingRecord вызвана до инициализации'),
  getTopActiveUsers: () => [],
  getUserLevel: () => ({ name: "Загрузка...", icon: "?" }),
  getActivityLevel: () => "Загрузка...",
  checkDailyLogin: () => {},
  refreshRating: async () => {}
});

export const useRating = () => {
  return useContext(RatingContext);
};

interface RatingProviderProps {
  children: ReactNode;
}

export const RatingProvider: React.FC<RatingProviderProps> = ({ children }) => {
  console.log('🎯 RatingProvider: МОНТИРУЕТСЯ (С ИНТЕГРАЦИЕЙ С БД)');
  
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [allRatings, setAllRatings] = useState<UserRating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Функции для определения уровней
  const getUserLevel = (rating: number) => {
    const level = USER_LEVELS.find(l => rating >= l.min && rating <= l.max) || USER_LEVELS[0];
    return { name: level.name, icon: level.icon };
  };

  const getActivityLevel = (activity: number) => {
    const level = ACTIVITY_LEVELS.find(l => activity >= l.min && activity <= l.max) || ACTIVITY_LEVELS[0];
    return level.name;
  };

  // Загрузка рейтинга из БД
  const refreshRating = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Загрузка рейтинга из БД для пользователя:', user.id);
      
      // Получаем статистику из API - используем any чтобы временно отключить проверку типов
      const stats: any = await userApi.getDashboardStats();
      
      // 🔍 ДИАГНОСТИКА
      console.log('📦 Ответ от API (полный):', stats);
      console.log('🔍 Тип ответа:', typeof stats);
      console.log('🔍 Ключи объекта:', Object.keys(stats));

      // Извлекаем данные пользователя из ответа
      const userData = stats.user || stats.data?.user || stats;
      const statsData = stats.stats || stats.data?.stats || {};
      
      // Преобразуем в формат UserRating
      const ratingFromDB: UserRating = {
        userId: user.id,
        totalRating: userData.rating ?? 15,
        totalActivity: userData.activityPoints ?? 0,
        ratingLevel: getUserLevel(userData.rating ?? 15).name,
        activityLevel: getActivityLevel(userData.activityPoints ?? 0),
        ratingIcon: "★",
        stats: {
          projectsCreated: statsData.projectsCreated ?? 0,
          mastersAdsCreated: statsData.mastersAdsCreated ?? 0,
          helpRequestsCreated: statsData.helpRequestsCreated ?? 0,
          libraryPostsCreated: statsData.libraryPostsCreated ?? 0,
          likesGiven: statsData.likesGiven ?? 0,
          likesReceived: statsData.likesReceived ?? 0,
          commentsMade: statsData.commentsMade ?? 0
        }
      };
      
      console.log('✅ Рейтинг загружен из БД:', ratingFromDB);
      setUserRating(ratingFromDB);
      
      // Обновляем общий список рейтингов
      setAllRatings(prev => {
        const filtered = prev.filter(r => r.userId !== user.id);
        return [...filtered, ratingFromDB];
      });
      
    } catch (error) {
      console.error('❌ Ошибка загрузки рейтинга из БД:', error);
      
      // Временное решение - загружаем из localStorage
      console.log('⚠️ Загружаем временный рейтинг из localStorage');
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Загрузка из localStorage (временное решение)
  const loadFromLocalStorage = useCallback(() => {
    if (!user?.id) return;
    
    const ratingKey = `rating_${user.id}`;
    const saved = localStorage.getItem(ratingKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('📂 Рейтинг загружен из localStorage:', parsed);
        setUserRating(parsed);
        setAllRatings(prev => [...prev, parsed]);
      } catch (e) {
        console.error('❌ Ошибка парсинга:', e);
        createNewRating(user.id);
      }
    } else {
      createNewRating(user.id);
    }
  }, [user]);

  // Создание нового рейтинга (временное)
  const createNewRating = (userId: string) => {
    console.log('🚀 СОЗДАНИЕ временного рейтинга для:', userId);
    
    const newRating: UserRating = {
      userId,
      totalRating: 15,
      totalActivity: 0,
      ratingLevel: "Студент",
      activityLevel: "Новичок",
      ratingIcon: "★",
      stats: {
        projectsCreated: 0,
        mastersAdsCreated: 0,
        helpRequestsCreated: 0,
        libraryPostsCreated: 0,
        likesGiven: 0,
        likesReceived: 0,
        commentsMade: 0
      }
    };
    
    console.log('💾 Сохраняем в localStorage:', newRating);
    localStorage.setItem(`rating_${userId}`, JSON.stringify(newRating));
    setUserRating(newRating);
    setAllRatings(prev => [...prev, newRating]);
  };

  // Загрузка при монтировании
  useEffect(() => {
    if (user?.id) {
      refreshRating();
    }
  }, [user, refreshRating]);

  const getTopActiveUsers = (limit: number = 30): UserRating[] => {
    return [...allRatings]
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, limit);
  };

  const checkDailyLogin = () => {
    console.log('checkDailyLogin вызвана');
  };

  const addRatingRecord = (recordData: Omit<RatingRecord, 'id' | 'timestamp'>) => {
    console.log('➕ addRatingRecord:', recordData);
    
    if (!user?.id) {
      console.error('❌ Нет пользователя');
      return;
    }

    alert('Функция добавления записи рейтинга будет реализована позже');
    refreshRating();
  };

  const contextValue: RatingContextType = {
    userRating,
    addRatingRecord,
    getTopActiveUsers,
    getUserLevel,
    getActivityLevel,
    checkDailyLogin,
    refreshRating
  };

  console.log('✅ RatingProvider: возвращаем контекст', userRating);

  return (
    <RatingContext.Provider value={contextValue}>
      {children}
    </RatingContext.Provider>
  );
};
