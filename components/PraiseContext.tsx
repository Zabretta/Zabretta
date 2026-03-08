// components/PraiseContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { praiseApi } from '@/lib/api/praise';

// Базовый URL API - можно вынести в .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Тип для контента, который можно похвалить
export interface PraisableContent {
  id: string;           // ID контента (проекта, материала в библиотеке и т.д.)
  authorId: string;     // ID автора (кому начислять баллы)
  title: string;        // Название для отображения в модалке
  type: 'PROJECT' | 'MASTER' | 'HELP' | 'LIBRARY';  // Тип контента
  authorName?: string;  // Имя автора (для отображения)
}

// Расширенный тип для статистики похвал
export interface PraiseStats {
  total: number;
  distribution: Record<string, number>;
  topEmoji: string;
  topCount: number;
  userPraised?: boolean;
  userPraiseType?: string;
}

// Тип для контекста
interface PraiseContextType {
  // Текущий активный контент (то, что сейчас открыто в модалке)
  currentContent: PraisableContent | null;
  
  // Установить текущий контент (вызывается при открытии модалки)
  setCurrentContent: (content: PraisableContent | null) => void;
  
  // Очистить текущий контент (при закрытии модалки)
  clearCurrentContent: () => void;
  
  // Проверить, есть ли активный контент
  hasActiveContent: boolean;
  
  // Обновить данные контента после похвалы
  refreshContent: (contentId: string, contentType: string) => Promise<void>;
  
  // Получить статистику похвал для контента
  getPraiseStats: (contentId: string, contentType: string) => Promise<PraiseStats | null>;
}

// Создаем контекст с дефолтными значениями
const PraiseContext = createContext<PraiseContextType>({
  currentContent: null,
  setCurrentContent: () => {},
  clearCurrentContent: () => {},
  hasActiveContent: false,
  refreshContent: async () => {},
  getPraiseStats: async () => null
});

// Хук для использования контекста
export const usePraise = () => {
  const context = useContext(PraiseContext);
  if (!context) {
    throw new Error('usePraise должен использоваться внутри PraiseProvider');
  }
  return context;
};

// Провайдер
interface PraiseProviderProps {
  children: ReactNode;
}

export const PraiseProvider = ({ children }: PraiseProviderProps) => {
  const [currentContent, setCurrentContent] = useState<PraisableContent | null>(null);

  const clearCurrentContent = useCallback(() => setCurrentContent(null), []);

  // Метод для обновления данных контента после похвалы
  const refreshContent = useCallback(async (contentId: string, contentType: string) => {
    try {
      console.log(`🔄 Обновление контента ${contentType} с ID ${contentId}`);
      
      if (contentType === 'LIBRARY') {
        // Загружаем обновленные данные документа из библиотеки
        const response = await fetch(`${API_BASE_URL}/api/library/items/${contentId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Ответ от сервера:', result);
        
        if (result.success && result.data) {
          // Обновляем currentContent если это тот же документ
          setCurrentContent(prev => {
            if (prev?.id === contentId && prev?.type === 'LIBRARY') {
              return {
                ...prev,
                title: result.data.title,
                authorName: result.data.author
              };
            }
            return prev;
          });
          
          // Вызываем событие для обновления UI в других компонентах
          window.dispatchEvent(new CustomEvent('content-updated', { 
            detail: { contentId, contentType, data: result.data }
          }));
          
          console.log('✅ Контент обновлен');
        }
      } else if (contentType === 'PROJECT') {
        // Здесь будет логика для проектов
        console.log('🔄 Обновление проекта', contentId);
      } else if (contentType === 'MASTER') {
        // Здесь будет логика для мастеров
        console.log('🔄 Обновление мастера', contentId);
      } else if (contentType === 'HELP') {
        // Здесь будет логика для помощи
        console.log('🔄 Обновление помощи', contentId);
      }
    } catch (error) {
      console.error('❌ Ошибка при обновлении контента:', error);
    }
  }, []);

  // Метод для получения статистики похвал
  const getPraiseStats = useCallback(async (contentId: string, contentType: string): Promise<PraiseStats | null> => {
    try {
      console.log(`📊 Получение статистики похвал для ${contentType} с ID ${contentId}`);
      
      let response;
      if (contentType === 'LIBRARY') {
        response = await fetch(`${API_BASE_URL}/api/library/items/${contentId}`);
      } else {
        response = await fetch(`${API_BASE_URL}/api/content/${contentId}/praises`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 Статистика:', result);
      
      if (result.success && result.data) {
        // Извлекаем статистику из данных
        const data = result.data;
        
        // Для библиотеки статистика уже приходит в поле praises
        if (contentType === 'LIBRARY' && data.praises) {
          return data.praises;
        }
        
        // Для других типов контента нужно сформировать статистику
        return {
          total: data.praisesCount || 0,
          distribution: data.praiseDistribution || {},
          topEmoji: data.topPraiseEmoji || '',
          topCount: data.topPraiseCount || 0,
          userPraised: data.userPraised || false,
          userPraiseType: data.userPraiseType
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Ошибка при получении статистики похвал:', error);
      return null;
    }
  }, []);

  const value: PraiseContextType = {
    currentContent,
    setCurrentContent,
    clearCurrentContent,
    hasActiveContent: currentContent !== null,
    refreshContent,
    getPraiseStats
  };

  return (
    <PraiseContext.Provider value={value}>
      {children}
    </PraiseContext.Provider>
  );
};