// components/RatingContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserRating, RatingRecord, USER_LEVELS, ACTIVITY_LEVELS } from '@/types/admin';
import { useAuth } from './useAuth';
import { userApi } from '@/lib/api/user';
import { ratingApi } from '@/lib/api/rating';

interface RatingContextType {
  userRating: UserRating | null;
  addRatingRecord: (record: Omit<RatingRecord, 'id' | 'timestamp'>) => void;
  getTopActiveUsers: (limit?: number) => UserRating[];
  getUserLevel: (rating: number) => { name: string; icon: string };
  getActivityLevel: (activity: number) => string;
  checkDailyLogin: () => Promise<void>;
  refreshRating: () => Promise<void>;
}

const RatingContext = createContext<RatingContextType>({
  userRating: null,
  addRatingRecord: () => {},
  getTopActiveUsers: () => [],
  getUserLevel: () => ({ name: "Загрузка...", icon: "?" }),
  getActivityLevel: () => "Загрузка...",
  checkDailyLogin: async () => {},
  refreshRating: async () => {}
});

export const useRating = () => {
  return useContext(RatingContext);
};

interface RatingProviderProps {
  children: ReactNode;
}

export const RatingProvider: React.FC<RatingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [allRatings, setAllRatings] = useState<UserRating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUserLevel = (rating: number) => {
    const level = USER_LEVELS.find(l => rating >= l.min && rating <= l.max) || USER_LEVELS[0];
    return { name: level.name, icon: level.icon };
  };

  const getActivityLevel = (activity: number) => {
    const level = ACTIVITY_LEVELS.find(l => activity >= l.min && activity <= l.max) || ACTIVITY_LEVELS[0];
    return level.name;
  };

  const refreshRating = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const stats: any = await userApi.getDashboardStats();
      
      const userData = stats.user || stats.data?.user || stats;
      const statsData = stats.stats || stats.data?.stats || {};
      
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
      
      setUserRating(ratingFromDB);
      
      setAllRatings(prev => {
        const filtered = prev.filter(r => r.userId !== user.id);
        return [...filtered, ratingFromDB];
      });
      
    } catch (error) {
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadFromLocalStorage = useCallback(() => {
    if (!user?.id) return;
    
    const ratingKey = `rating_${user.id}`;
    const saved = localStorage.getItem(ratingKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserRating(parsed);
        setAllRatings(prev => [...prev, parsed]);
      } catch (e) {
        createNewRating(user.id);
      }
    } else {
      createNewRating(user.id);
    }
  }, [user]);

  const createNewRating = (userId: string) => {
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
    
    localStorage.setItem(`rating_${userId}`, JSON.stringify(newRating));
    setUserRating(newRating);
    setAllRatings(prev => [...prev, newRating]);
  };

  const checkDailyLogin = useCallback(async () => {
    if (!user?.id) return;

    try {
      const bonusStatus = await ratingApi.checkDailyBonus();
      
      if (bonusStatus.canGetBonus) {
        const result = await ratingApi.awardPoints({ 
          action: 'daily_login',
          section: 'general'
        });
        
        if (result.awarded) {
          await refreshRating();
        }
      }
    } catch (error) {
      // Тихая обработка ошибки
    }
  }, [user, refreshRating]);

  useEffect(() => {
    if (user?.id) {
      refreshRating();
      checkDailyLogin();
    }
  }, [user, refreshRating, checkDailyLogin]);

  const getTopActiveUsers = (limit: number = 30): UserRating[] => {
    return [...allRatings]
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, limit);
  };

  const addRatingRecord = async (recordData: Omit<RatingRecord, 'id' | 'timestamp'>) => {
    if (!user?.id) return;

    try {
      const result = await ratingApi.awardPoints({
        action: recordData.action as any,
        section: recordData.section as any,
        targetId: recordData.targetId
      });
      
      if (result.awarded) {
        await refreshRating();
      }
    } catch (error) {
      // Тихая обработка ошибки
    }
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

  return (
    <RatingContext.Provider value={contextValue}>
      {children}
    </RatingContext.Provider>
  );
};
