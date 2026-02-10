// components/admin/NotificationsContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AdminNotification } from '@/types/admin';

// Статические данные для начала
const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  { id: 1, text: 'Система уведомлений работает', time: 'Только что', read: false, type: 'system' },
  { id: 2, text: 'Тестовое уведомление', time: '1 мин назад', read: true, type: 'success' },
];

interface NotificationsContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  isNotificationsModalOpen: boolean;
  openNotificationsModal: () => void;
  closeNotificationsModal: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const openNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(true);
  }, []);

  const closeNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(false);
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const contextValue: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading: false,
    isNotificationsModalOpen,
    openNotificationsModal,
    closeNotificationsModal,
    markAsRead,
    markAllAsRead,
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