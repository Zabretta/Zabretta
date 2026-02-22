// components/admin/NotificationsModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useNotifications } from './NotificationsContext';
import './NotificationsModal.css';

export default function NotificationsModal() {
  const {
    isNotificationsModalOpen,
    closeNotificationsModal,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [newNotificationText, setNewNotificationText] = useState('');
  const [isAddingNotification, setIsAddingNotification] = useState(false);

  useEffect(() => {
    if (isNotificationsModalOpen && notifications.length > 0) {
      console.log('📨 Уведомления в модалке:', notifications);
      console.log('📊 unreadCount:', unreadCount);
    }
  }, [isNotificationsModalOpen, notifications, unreadCount]);

  if (!isNotificationsModalOpen) return null;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'system': 
      default: return '⚙️';
    }
  };

  const getNotificationTypeClass = (type?: string) => {
    switch (type) {
      case 'user': return 'type-user';
      case 'warning': return 'type-warning';
      case 'success': return 'type-success';
      case 'system': 
      default: return 'type-system';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Неизвестно';
    
    try {
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
    } catch (e) {
      return 'Неизвестно';
    }
  };

  const getNotificationText = (notification: any): string => {
    return notification.text || 
           notification.message || 
           notification.description || 
           notification.content || 
           'Нет текста';
  };

  const handleNotificationClick = (notificationId: string | number, link?: string) => {
    const id = String(notificationId);
    markAsRead(id);
    
    if (link) {
      window.location.href = link;
    }
  };

  const handleMarkButtonClick = (e: React.MouseEvent, notificationId: string | number) => {
    e.stopPropagation();
    const id = String(notificationId);
    markAsRead(id);
  };

  const handleMarkAllClick = () => {
    markAllAsRead();
  };

  // ✅ ВРЕМЕННАЯ ФУНКЦИЯ для тестирования
  const handleAddTestNotification = async () => {
    if (!newNotificationText.trim()) {
      alert('Введите текст уведомления');
      return;
    }

    setIsAddingNotification(true);
    
    try {
      // Пока просто имитируем отправку
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`✅ Уведомление отправлено (тест): "${newNotificationText}"`);
      setNewNotificationText('');
      
    } catch (error) {
      console.error('Ошибка при добавлении уведомления:', error);
      alert('Ошибка при добавлении уведомления');
    } finally {
      setIsAddingNotification(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTestNotification();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeNotificationsModal}>
      <div 
        className="modal-container notifications-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header notifications-header">
          <h2>
            🔔 Уведомления
            {unreadCount > 0 && (
              <span className="unread-counter"> ({unreadCount} новых)</span>
            )}
          </h2>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button 
                className="action-btn tertiary mark-all-btn"
                onClick={handleMarkAllClick}
                title="Пометить все как прочитанные"
              >
                📋 Прочитать все
              </button>
            )}
            <button 
              className="modal-close" 
              onClick={closeNotificationsModal}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-content notifications-content">
          {/* Форма для нового уведомления */}
          <div className="add-notification-form">
            <div className="form-group">
              <label htmlFor="notification-text">Новое уведомление:</label>
              <textarea
                id="notification-text"
                className="notification-textarea"
                value={newNotificationText}
                onChange={(e) => setNewNotificationText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Введите текст уведомления..."
                rows={3}
                disabled={isAddingNotification}
              />
              <button 
                className="action-btn text-notification" // ✅ ИСПРАВЛЕНО: используем правильный класс
                onClick={handleAddTestNotification}
                disabled={isAddingNotification || !newNotificationText.trim()}
              >
                {isAddingNotification ? '⏳ Добавление...' : '📝 Добавить уведомление'}
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Уведомлений пока нет</h3>
              <p>Добавьте первое уведомление в форме выше</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => {
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${getNotificationTypeClass(notification.type)} ${
                      notification.read ? 'read' : 'unread'
                    }`}
                    onClick={() => handleNotificationClick(notification.id, notification.link)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-text">
                        {getNotificationText(notification)}
                        {notification.link && (
                          <span className="notification-link-hint"> →</span>
                        )}
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatDate(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <span className="unread-dot" title="Непрочитанное"></span>
                        )}
                      </div>
                    </div>

                    <button
                      className="notification-mark-btn"
                      onClick={(e) => handleMarkButtonClick(e, notification.id)}
                      title={notification.read ? "Прочитано" : "Пометить как прочитанное"}
                    >
                      {notification.read ? '✓' : '○'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer notifications-footer">
          <div className="footer-stats">
            <span className="stat-total">
              Всего: <strong>{notifications.length}</strong>
            </span>
            <span className="stat-unread">
              Непрочитанных: <strong>{unreadCount}</strong>
            </span>
          </div>
          <div className="footer-actions">
            <button 
              className="action-btn tertiary" 
              onClick={closeNotificationsModal}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
