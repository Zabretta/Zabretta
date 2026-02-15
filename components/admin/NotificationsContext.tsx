"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AdminNotification } from '@/types/admin';
import { notificationsApi } from '@/lib/api/notifications';

interface NotificationsContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  isNotificationsModalOpen: boolean;
  openNotificationsModal: () => void;
  closeNotificationsModal: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createTestNotification: (text: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Загрузка уведомлений
  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загружаем при монтировании
  useEffect(() => {
    refreshNotifications();
    
    // Подписка на новые уведомления каждые 30 секунд
    const interval = setInterval(refreshNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const openNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(true);
    // Обновляем при открытии
    refreshNotifications();
  }, [refreshNotifications]);

  const closeNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(false);
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Ошибка при отметке уведомления:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
    }
  }, []);

  const createTestNotification = useCallback(async (text: string) => {
    try {
      const newNotification = await notificationsApi.createNotification(text, 'system');
      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Ошибка при создании уведомления:', error);
      throw error;
    }
  }, []);

  const contextValue: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    isNotificationsModalOpen,
    openNotificationsModal,
    closeNotificationsModal,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    createTestNotification,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
