// components/admin/NotificationsContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationsApi, AdminNotification } from '@/lib/api/notifications';
import { useAuth } from '@/components/useAuth';

interface NotificationsContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  isNotificationsModalOpen: boolean;
  openNotificationsModal: () => void;
  closeNotificationsModal: () => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(n => !n.read).length 
    : 0;

  const refreshNotifications = useCallback(async () => {
    try {
      console.log('🔄 Загрузка уведомлений...');
      const data = await notificationsApi.getNotifications() as any;
      
      let notificationsArray: AdminNotification[] = [];
      
      if (Array.isArray(data)) {
        notificationsArray = data;
      } else if (data && typeof data === 'object') {
        if (data.data && typeof data.data === 'object' && data.data.notifications && Array.isArray(data.data.notifications)) {
          notificationsArray = data.data.notifications;
        } else if (data.notifications && Array.isArray(data.notifications)) {
          notificationsArray = data.notifications;
        } else if (data.id || (data.userId && data.type)) {
          notificationsArray = [data as AdminNotification];
        }
      }
      
      setNotifications(notificationsArray);
      console.log(`✅ Загружено ${notificationsArray.length} уведомлений`);
    } catch (error) {
      console.error('❌ Ошибка загрузки уведомлений:', error);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    console.log('🔍 markAsRead вызван с ID:', id, 'тип:', typeof id);
    
    try {
      console.log('📋 Текущие уведомления:', notifications.map(n => ({ id: n.id, read: n.read })));
      
      const apiId = Number(id) || id;
      console.log('📤 Отправка запроса к API с ID:', apiId);
      
      await notificationsApi.markAsRead(apiId as any);
      console.log('✅ API запрос успешен');
      
      setNotifications(prev => {
        const updated = prev.map(n => {
          const match = String(n.id) === String(id);
          if (match) {
            console.log('🔄 Обновление уведомления:', n.id, 'было:', n.read, 'станет: true');
            return { ...n, read: true };
          }
          return n;
        });
        console.log('📊 Новое состояние уведомлений:', updated.map(n => ({ id: n.id, read: n.read })));
        return updated;
      });
      
      console.log(`✅ Уведомление ${id} отмечено как прочитанное`);
    } catch (error) {
      console.error(`❌ Ошибка при отметке уведомления ${id}:`, error);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    console.log('🔍 markAllAsRead вызван');
    
    try {
      if (!user) {
        console.error('❌ Нет пользователя в контексте');
        return;
      }

      console.log('📤 Отправка запроса markAllAsRead к API с userId:', user.id);
      
      await notificationsApi.markAllAsRead(user.id);
      
      console.log('✅ API запрос markAllAsRead успешен');
      
      setNotifications(prev => {
        console.log('🔄 Обновление всех уведомлений на read: true');
        const updated = prev.map(n => ({ ...n, read: true }));
        console.log('📊 Новое состояние:', updated.map(n => ({ id: n.id, read: n.read })));
        return updated;
      });
      
      console.log('✅ Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('❌ Ошибка при отметке всех уведомлений:', error);
    }
  }, [user]);

  const openNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(true);
  }, []);

  const closeNotificationsModal = useCallback(() => {
    setIsNotificationsModalOpen(false);
  }, []);

  const value = {
    notifications,
    unreadCount,
    isNotificationsModalOpen,
    openNotificationsModal,
    closeNotificationsModal,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};