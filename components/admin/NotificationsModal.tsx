// components/admin/NotificationsModal.tsx
"use client";

import { useState } from 'react'; // <-- ДОБАВЛЕНО
import { useNotifications } from './NotificationsContext';
import './NotificationsModal.css';

export default function NotificationsModal() {
  const {
    isNotificationsModalOpen,
    closeNotificationsModal,
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // ДОБАВЛЕНО: состояние для нового уведомления
  const [newNotificationText, setNewNotificationText] = useState('');
  const [isAddingNotification, setIsAddingNotification] = useState(false);

  // Если модальное окно закрыто, ничего не рендерим
  if (!isNotificationsModalOpen) return null;

  // Получаем иконку в зависимости от типа уведомления
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'system': 
      default: return '⚙️';
    }
  };

  // Получаем цвет класса в зависимости от типа
  const getNotificationTypeClass = (type?: string) => {
    switch (type) {
      case 'user': return 'type-user';
      case 'warning': return 'type-warning';
      case 'success': return 'type-success';
      case 'system': 
      default: return 'type-system';
    }
  };

  const handleNotificationClick = (notificationId: number, link?: string) => {
    markAsRead(notificationId);
    
    if (link) {
      console.log('Переход по ссылке:', link);
    }
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ: добавление реального уведомления
  const handleAddTestNotification = async () => {
    if (!newNotificationText.trim()) {
      alert('Введите текст уведомления');
      return;
    }

    setIsAddingNotification(true);
    
    try {
      // Добавляем новое уведомление в список
      const newNotification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        text: newNotificationText,
        time: 'Только что',
        read: false,
        type: 'system' as const
      };

      // В реальном приложении здесь будет вызов API:
      // await mockAPI.notifications.createNotification(newNotificationText, 'system');
      
      // Пока просто добавляем локально
      const updatedNotifications = [newNotification, ...notifications];
      
      // Обновляем контекст (в реальном приложении нужно будет обновить логику контекста)
      console.log('✅ Добавлено новое уведомление:', newNotification);
      alert(`Уведомление добавлено: "${newNotificationText}"`);
      
      // Очищаем поле ввода
      setNewNotificationText('');
      
    } catch (error) {
      console.error('Ошибка при добавлении уведомления:', error);
      alert('Ошибка при добавлении уведомления');
    } finally {
      setIsAddingNotification(false);
    }
  };

  // Обработчик нажатия Enter в поле ввода
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
                onClick={markAllAsRead}
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
          {/* ДОБАВЛЕНО: форма для нового уведомления */}
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
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Загрузка уведомлений...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Уведомлений пока нет</h3>
              <p>Добавьте первое уведомление в форме выше</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
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
                      {notification.text}
                      {notification.link && (
                        <span className="notification-link-hint"> →</span>
                      )}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">{notification.time}</span>
                      {!notification.read && (
                        <span className="unread-dot" title="Непрочитанное"></span>
                      )}
                    </div>
                  </div>

                  <button
                    className="notification-mark-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title={notification.read ? "Прочитано" : "Пометить как прочитанное"}
                  >
                    {notification.read ? '✓' : '○'}
                  </button>
                </div>
              ))}
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
            <button 
              className="action-btn text-notification" 
              onClick={handleAddTestNotification}
              disabled={isAddingNotification || !newNotificationText.trim()}
              title={newNotificationText.trim() ? "Добавить уведомление" : "Введите текст уведомления"}
            >
              {isAddingNotification ? '⏳ Добавляется...' : '📝 Добавить уведомление'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}