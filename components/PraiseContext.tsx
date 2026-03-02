// components/PraiseContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Тип для контента, который можно похвалить
export interface PraisableContent {
  id: string;           // ID контента (проекта, материала в библиотеке и т.д.)
  authorId: string;     // ID автора (кому начислять баллы)
  title: string;        // Название для отображения в модалке
  type: 'PROJECT' | 'MASTER' | 'HELP' | 'LIBRARY';  // Тип контента
  authorName?: string;  // Имя автора (для отображения)
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
}

// Создаем контекст с дефолтными значениями
const PraiseContext = createContext<PraiseContextType>({
  currentContent: null,
  setCurrentContent: () => {},
  clearCurrentContent: () => {},
  hasActiveContent: false
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

  const clearCurrentContent = () => setCurrentContent(null);

  const value: PraiseContextType = {
    currentContent,
    setCurrentContent,
    clearCurrentContent,
    hasActiveContent: currentContent !== null
  };

  return (
    <PraiseContext.Provider value={value}>
      {children}
    </PraiseContext.Provider>
  );
};