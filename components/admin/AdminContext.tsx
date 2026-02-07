"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface AdminContextType {
  // Управление сайдбаром
  sidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  isMobileView: boolean;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Управление пользователями (существующий функционал)
  selectedUsers: Set<string>;
  toggleUserSelection: (userId: string) => void;
  clearSelection: () => void;
  selectAllUsers: (userIds: string[]) => void;
  hasSelections: boolean;
  selectedCount: number;
  
  // НОВОЕ: Функция для обновления данных админки
  refreshAdminData?: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Состояния для управления сайдбаром
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Определение мобильного вида
  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      
      // Закрываем мобильное меню при переходе на десктоп
      if (!mobile && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, [isMobileSidebarOpen]);

  // Управление сайдбаром
  const toggleSidebar = useCallback(() => {
    if (isMobileView) {
      // На мобильных: открываем/закрываем меню
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      // На десктопе: сворачиваем/разворачиваем
      setSidebarCollapsedState(prev => !prev);
    }
  }, [isMobileView]);

  const closeMobileSidebar = useCallback(() => {
    if (isMobileView && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobileView, isMobileSidebarOpen]);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
  }, []);

  // Существующий функционал управления пользователями
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers(new Set());
  }, []);

  const selectAllUsers = useCallback((userIds: string[]) => {
    setSelectedUsers(new Set(userIds));
  }, []);

  const hasSelections = selectedUsers.size > 0;
  const selectedCount = selectedUsers.size;

  // НОВАЯ ФУНКЦИЯ: Обновление данных админки
  const refreshAdminData = useCallback(async () => {
    console.log('[AdminContext] Запрос на обновление данных админки');
    
    // Эта функция может быть использована для принудительного обновления
    // В текущей реализации просто логируем вызов
    // В будущем здесь можно добавить вызов API или эмит события
    // для обновления данных через AdminDataContext
    
    // Пример: можно отправить событие для обновления
    // window.dispatchEvent(new CustomEvent('admin-data-refresh'));
    
    return Promise.resolve();
  }, []);

  const contextValue: AdminContextType = {
    // Состояния сайдбара
    sidebarCollapsed,
    isMobileSidebarOpen,
    isMobileView,
    toggleSidebar,
    closeMobileSidebar,
    setSidebarCollapsed,
    
    // Существующий функционал
    selectedUsers,
    toggleUserSelection,
    clearSelection,
    selectAllUsers,
    hasSelections,
    selectedCount,
    
    // НОВОЕ: Функция для обновления данных
    refreshAdminData,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};