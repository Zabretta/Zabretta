// components/NotificationsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import './NotificationsModal.css';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'MESSAGE' | 'SYSTEM' | 'ACHIEVEMENT';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  image?: string;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  // Загрузка уведомлений при открытии
  useEffect(() => {
    if (isOpen && user) {
      loadNotifications(1);
    }
  }, [isOpen, user]);

  // ✅ ИСПРАВЛЕНО: Функция загрузки уведомлений из реального API
  const loadNotifications = async (pageNum: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch(`http://localhost:3001/api/notifications?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const { notifications: newNotifications, totalPages } = result.data;
        
        if (pageNum === 1) {
          setNotifications(newNotifications || []);
        } else {
          setNotifications(prev => [...prev, ...(newNotifications || [])]);
        }
        
        setHasMore(pageNum < (totalPages || 1));
        setPage(pageNum);
        
        console.log(`✅ Загружено ${newNotifications?.length || 0} уведомлений`);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки уведомлений:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ИСПРАВЛЕНО: Отметить как прочитанное через API
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка отметки: ${response.status}`);
      }
      
      // Обновляем локальное состояние
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      console.log(`✅ Уведомление ${notificationId} отмечено как прочитанное`);
    } catch (error) {
      console.error('❌ Ошибка при отметке уведомления:', error);
    }
  };

  // ✅ ИСПРАВЛЕНО: Отметить все как прочитанные через API
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка отметки всех: ${response.status}`);
      }
      
      // Обновляем локальное состояние
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      console.log('✅ Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('❌ Ошибка при отметке всех уведомлений:', error);
    }
  };

  // Клик по уведомлению
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    onClose();
  };

  // Загрузить ещё
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  // Получить иконку для типа уведомления
  const getIcon = (type: string) => {
    switch(type) {
      case 'LIKE': return '❤️';
      case 'COMMENT': return '💬';
      case 'MESSAGE': return '📦';
      case 'ACHIEVEMENT': return '🏆';
      case 'SYSTEM': return '⚙️';
      default: return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div className="notifications-modal-container" onClick={e => e.stopPropagation()}>
        {/* Шапка */}
        <div className="notifications-modal-header">
          <h2>Уведомления</h2>
          <div className="notifications-header-actions">
            {notifications.some(n => !n.read) && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="Отметить все как прочитанные"
              >
                ✓ Прочитать все
              </button>
            )}
            <button 
              className="notifications-modal-close" 
              onClick={onClose}
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Список уведомлений */}
        <div className="notifications-list">
          {isLoading && page === 1 ? (
            <div className="notifications-loading">
              <div className="loading-spinner">🔔</div>
              <p>Загрузка уведомлений...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <span className="empty-icon">🔔</span>
              <p>У вас пока нет уведомлений</p>
              <p className="empty-note">
                Когда кто-то оценит ваш проект или оставит комментарий,<br />
                уведомление появится здесь
              </p>
            </div>
          ) : (
            <>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    <div className="notification-icon">
                      {getIcon(notification.type)}
                    </div>
                    {!notification.read && (
                      <div className="notification-unread-dot"></div>
                    )}
                  </div>
                  
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <button
                  className="notifications-load-more"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Подвал со ссылкой на все уведомления */}
        <div className="notifications-footer">
          <button 
            className="view-all-btn"
            onClick={() => {
              onClose();
              // TODO: Открыть профиль на вкладке уведомлений
              console.log('Открыть все уведомления в профиле');
            }}
          >
            Все уведомления в профиле →
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
