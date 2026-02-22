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

  // Загрузка уведомлений из API
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
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки уведомлений:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Клик по уведомлению - отмечаем как прочитанное
  const handleNotificationClick = async (notification: Notification) => {
    // Если уже прочитано - ничего не делаем
    if (notification.read) return;
    
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      await fetch(`http://localhost:3001/api/notifications/${notification.id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем локальное состояние
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      
      console.log(`✅ Уведомление ${notification.id} отмечено как прочитанное`);
    } catch (error) {
      console.error('❌ Ошибка при отметке уведомления:', error);
    }
  };

  // Удаление уведомления
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Предотвращаем срабатывание клика на уведомлении
    
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status}`);
      }
      
      // Удаляем из локального состояния
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      console.log(`✅ Уведомление ${notificationId} удалено`);
    } catch (error) {
      console.error('❌ Ошибка при удалении уведомления:', error);
    }
  };

  // Отметить все как прочитанные
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      console.log('✅ Все уведомления отмечены как прочитанные');
    } catch (error) {
      console.error('❌ Ошибка при отметке всех уведомлений:', error);
    }
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

                  {/* Подсказка для непрочитанных */}
                  {!notification.read && (
                    <div className="notification-click-hint" title="Нажмите чтобы отметить прочитанным">
                      ✓
                    </div>
                  )}

                  {/* Корзина для удаления */}
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    title="Удалить уведомление"
                  >
                    🗑️
                  </button>
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

        {/* Подвал с подсказкой */}
        <div className="notifications-footer">
          <p className="footer-note">
            Чтобы ответить на сообщение, перейдите в личный кабинет
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;