"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRating, RatingRecord, USER_LEVELS, ACTIVITY_LEVELS } from '../api/mocks';
import { useAuth } from './useAuth';

interface RatingContextType {
  userRating: UserRating | null;
  addRatingRecord: (record: Omit<RatingRecord, 'id' | 'timestamp'>) => void;
  getTopActiveUsers: (limit?: number) => UserRating[];
  getUserLevel: (rating: number) => { name: string; icon: string };
  getActivityLevel: (activity: number) => string;
  checkDailyLogin: () => void;
}

const RatingContext = createContext<RatingContextType>({
  userRating: null,
  addRatingRecord: () => console.warn('RatingContext: функция addRatingRecord вызвана до инициализации'),
  getTopActiveUsers: () => [],
  getUserLevel: () => ({ name: "Загрузка...", icon: "?" }),
  getActivityLevel: () => "Загрузка...",
  checkDailyLogin: () => {}
});

export const useRating = () => {
  return useContext(RatingContext);
};

interface RatingProviderProps {
  children: ReactNode;
}

export const RatingProvider: React.FC<RatingProviderProps> = ({ children }) => {
  console.log('🎯 RatingProvider: МОНТИРУЕТСЯ (ПОЛНАЯ ВЕРСИЯ)');
  
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [allRatings, setAllRatings] = useState<UserRating[]>([]);

  // Функции для UserProfileRating
  const getUserLevel = (rating: number) => {
    const level = USER_LEVELS.find(l => rating >= l.min && rating <= l.max) || USER_LEVELS[0];
    return { name: level.name, icon: level.icon };
  };

  const getActivityLevel = (activity: number) => {
    const level = ACTIVITY_LEVELS.find(l => activity >= l.min && activity <= l.max) || ACTIVITY_LEVELS[0];
    return level.name;
  };

  const getTopActiveUsers = (limit: number = 30): UserRating[] => {
    return [...allRatings]
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, limit);
  };

  const checkDailyLogin = () => {
    console.log('checkDailyLogin вызвана');
  };

  // Инициализация при монтировании
  useEffect(() => {
    console.log('🔧 RatingProvider: эффект, user:', user?.id);
    
    if (user?.id) {
      console.log('✅ Есть пользователь:', user.id);
      
      const ratingKey = `rating_${user.id}`;
      const saved = localStorage.getItem(ratingKey);
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📂 Рейтинг загружен:', parsed);
          setUserRating(parsed);
          setAllRatings(prev => [...prev, parsed]);
        } catch (e) {
          console.error('❌ Ошибка:', e);
          createNewRating(user.id);
        }
      } else {
        console.log('🆕 Создаем новый рейтинг');
        createNewRating(user.id);
      }
    }
  }, [user]);

  const createNewRating = (userId: string) => {
    console.log('🚀 СОЗДАНИЕ рейтинга для:', userId);
    
    const newRating: UserRating = {
      userId,
      totalRating: 15,
      totalActivity: 0,
      ratingLevel: "Студент",
      activityLevel: "Новичок",
      ratingIcon: "★",
      lastDailyLogin: new Date(),
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
    
    console.log('💾 Сохраняем:', newRating);
    localStorage.setItem(`rating_${userId}`, JSON.stringify(newRating));
    setUserRating(newRating);
    setAllRatings(prev => [...prev, newRating]);
  };

  const addRatingRecord = (recordData: Omit<RatingRecord, 'id' | 'timestamp'>) => {
    console.log('➕ addRatingRecord:', recordData);
    
    if (!user?.id) {
      console.error('❌ Нет пользователя');
      return;
    }

    // Если рейтинга нет - создаем
    if (!userRating) {
      console.log('⚠️ Создаем рейтинг...');
      createNewRating(user.id);
    }

    // Получаем актуальный рейтинг
    const ratingKey = `rating_${user.id}`;
    const saved = localStorage.getItem(ratingKey);
    
    if (!saved) {
      console.error('❌ Рейтинг не найден');
      return;
    }

    try {
      const current = JSON.parse(saved);
      
      // Обновляем статистику
      const updatedStats = { ...current.stats };
      if (recordData.section === 'projects' && recordData.action === 'like_given') {
        updatedStats.likesGiven = (updatedStats.likesGiven || 0) + 1;
      }

      const updatedRating: UserRating = {
        ...current,
        totalRating: (current.totalRating || 0) + (recordData.ratingPoints || 0),
        totalActivity: (current.totalActivity || 0) + (recordData.activityPoints || 0),
        ratingLevel: getUserLevel((current.totalRating || 0) + (recordData.ratingPoints || 0)).name,
        activityLevel: getActivityLevel((current.totalActivity || 0) + (recordData.activityPoints || 0)),
        ratingIcon: "★",
        stats: updatedStats
      };

      console.log('📈 Обновленный рейтинг:', updatedRating);
      
      // Сохраняем
      localStorage.setItem(ratingKey, JSON.stringify(updatedRating));
      setUserRating(updatedRating);
      
      console.log('🎉 УСПЕХ: Рейтинг сохранен!');
      
      // Показываем все ключи
      const keys = Object.keys(localStorage).filter(k => k.startsWith('rating_'));
      console.log('🔑 Все ключи рейтинга:', keys);
      console.log('📋 Содержимое:', localStorage.getItem(ratingKey));
      
    } catch (error) {
      console.error('❌ Ошибка обновления рейтинга:', error);
    }
  };

  const contextValue: RatingContextType = {
    userRating,
    addRatingRecord,
    getTopActiveUsers,
    getUserLevel,
    getActivityLevel,
    checkDailyLogin
  };

  console.log('✅ RatingProvider: возвращаем контекст');

  return (
    <RatingContext.Provider value={contextValue}>
      {children}
    </RatingContext.Provider>
  );
};
