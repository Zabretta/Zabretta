"use client";

import { useState, useEffect } from 'react';
import { useNotifications } from './NotificationsContext';
import './NotificationsModal.css';

// Типы для отправки сообщений
interface SendMessageData {
  type: 'SYSTEM';
  title: string;
  message: string;
  link?: string;
  userId?: string;        // Если указан - адресное
  userLogin?: string;     // Альтернативный способ указать пользователя
}

interface User {
  id: string;
  login: string;
  name: string | null;
}

export default function NotificationsModal() {
  const {
    isNotificationsModalOpen,
    closeNotificationsModal,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications  // Добавляем метод обновления из контекста
  } = useNotifications();

  // Состояния для формы отправки
  const [messageTitle, setMessageTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageLink, setMessageLink] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'single'>('all');
  const [recipientInput, setRecipientInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Для отслеживания удаления

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isNotificationsModalOpen) {
      resetForm();
    }
  }, [isNotificationsModalOpen]);

  // Поиск пользователей при вводе
  useEffect(() => {
    const searchUsers = async () => {
      if (recipientType !== 'single' || !recipientInput.trim() || recipientInput.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem('samodelkin_auth_token');
        const response = await fetch(
          `http://localhost:3001/api/admin/users/search?q=${encodeURIComponent(recipientInput)}&limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          setSearchResults(result.data || []);
        }
      } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [recipientInput, recipientType]);

  const resetForm = () => {
    setMessageTitle('');
    setMessageText('');
    setMessageLink('');
    setRecipientType('all');
    setRecipientInput('');
    setSearchResults([]);
    setSelectedUser(null);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setRecipientInput('');
    setSearchResults([]);
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setRecipientInput('');
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageText.trim()) {
      alert('Заполните заголовок и текст сообщения');
      return;
    }

    if (recipientType === 'single' && !selectedUser && !recipientInput.trim()) {
      alert('Укажите получателя (логин или ID)');
      return;
    }

    setIsSending(true);

    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      
      // Выбираем правильный endpoint в зависимости от типа отправки
      let url = 'http://localhost:3001/api/admin/notifications/';
      if (recipientType === 'all') {
        url += 'broadcast';  // для рассылки
      } else {
        url += 'send';       // для адресной отправки
      }
      
      // Подготавливаем данные для отправки
      const messageData: SendMessageData = {
        type: 'SYSTEM',
        title: messageTitle,
        message: messageText,
        link: messageLink.trim() || undefined
      };

      // Добавляем получателя только для адресной отправки
      if (recipientType === 'single') {
        if (selectedUser) {
          messageData.userId = selectedUser.id;
        } else {
          messageData.userLogin = recipientInput.trim();
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка отправки');
      }

      const result = await response.json();
      
      alert(`✅ Сообщение успешно отправлено ${result.data.recipientCount > 1 ? `${result.data.recipientCount} пользователям` : 'пользователю'}`);
      
      // Очищаем форму
      resetForm();
      
      // Обновляем список уведомлений
      await refreshNotifications();
      
    } catch (error: any) {
      console.error('Ошибка отправки сообщения:', error);
      alert(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

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

  // Функция для открытия профиля пользователя
  const handleOpenUserProfile = (userId: string) => {
    closeNotificationsModal();
    sessionStorage.setItem('openUserModalId', userId);
    window.location.href = '/admin/users';
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Удаление уведомления без перезагрузки
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string | number) => {
    e.stopPropagation(); // Предотвращаем всплытие клика на само уведомление
    
    if (!confirm('Вы уверены, что хотите удалить это уведомление?')) {
      return;
    }
    
    const id = String(notificationId);
    setIsDeleting(id); // Показываем индикатор удаления
    
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch(`http://localhost:3001/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      
      // Обновляем список уведомлений через контекст
      await refreshNotifications();
      
      // Показываем уведомление об успехе (можно заменить на более красивое)
      console.log('✅ Уведомление удалено');
      
    } catch (error: any) {
      console.error('Ошибка удаления уведомления:', error);
      alert(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isNotificationsModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeNotificationsModal}>
      <div 
        className="modal-container notifications-modal admin-notifications-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header notifications-header">
          <h2>
            🔔 Управление уведомлениями
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
          {/* Форма для отправки сообщений */}
          <div className="send-message-section">
            <h3>📨 Отправить сообщение</h3>
            
            <div className="form-group">
              <label htmlFor="message-title">Заголовок:</label>
              <input
                id="message-title"
                type="text"
                className="message-input"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Например: Важное объявление"
                disabled={isSending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message-text">Текст сообщения:</label>
              <textarea
                id="message-text"
                className="message-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите текст сообщения..."
                rows={3}
                disabled={isSending}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message-link">Ссылка (необязательно):</label>
              <input
                id="message-link"
                type="text"
                className="message-input"
                value={messageLink}
                onChange={(e) => setMessageLink(e.target.value)}
                placeholder="/profile?tab=messages"
                disabled={isSending}
              />
              <span className="input-hint">Например: /profile?tab=messages</span>
            </div>

            <div className="form-group">
              <label>Тип отправки:</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipientType"
                    value="all"
                    checked={recipientType === 'all'}
                    onChange={() => {
                      setRecipientType('all');
                      setSelectedUser(null);
                      setRecipientInput('');
                    }}
                    disabled={isSending}
                  />
                  <span>📢 Рассылка всем пользователям</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipientType"
                    value="single"
                    checked={recipientType === 'single'}
                    onChange={() => setRecipientType('single')}
                    disabled={isSending}
                  />
                  <span>👤 Конкретному пользователю</span>
                </label>
              </div>
            </div>

            {recipientType === 'single' && (
              <div className="form-group recipient-search">
                {selectedUser ? (
                  <div className="selected-user">
                    <span className="selected-user-info">
                      Получатель: <strong>{selectedUser.name || selectedUser.login}</strong> (ID: {selectedUser.id})
                    </span>
                    <button
                      className="clear-user-btn"
                      onClick={handleClearSelectedUser}
                      disabled={isSending}
                      title="Выбрать другого пользователя"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="recipient-input">Логин или ID пользователя:</label>
                    <input
                      id="recipient-input"
                      type="text"
                      className="message-input"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="Введите логин или ID..."
                      disabled={isSending}
                    />
                    {isSearching && <span className="search-spinner">🔍 Поиск...</span>}
                    
                    {searchResults.length > 0 && (
                      <div className="search-results">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="search-result-item"
                            onClick={() => handleSelectUser(user)}
                          >
                            <span className="result-avatar">👤</span>
                            <span className="result-login">{user.login}</span>
                            {user.name && <span className="result-name">({user.name})</span>}
                            <span className="result-id">ID: {user.id.slice(0, 8)}...</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!isSearching && searchResults.length === 0 && recipientInput.length >= 2 && (
                      <div className="no-results">Пользователи не найдены</div>
                    )}
                  </>
                )}
              </div>
            )}

            <button 
              className="action-btn send-notification-btn"
              onClick={handleSendMessage}
              disabled={isSending || !messageTitle.trim() || !messageText.trim()}
            >
              {isSending ? (
                <span>⏳ Отправка...</span>
              ) : (
                <span>📨 {recipientType === 'all' ? 'Отправить рассылку' : 'Отправить сообщение'}</span>
              )}
            </button>
          </div>

          {/* Разделитель */}
          <div className="section-divider">
            <span>📋 История уведомлений</span>
          </div>

          {/* Список уведомлений */}
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Уведомлений пока нет</h3>
              <p>Отправьте первое сообщение через форму выше</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => {
                const isDeletingThis = isDeleting === String(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${getNotificationTypeClass(notification.type)} ${
                      notification.read ? 'read' : 'unread'
                    } ${isDeletingThis ? 'deleting' : ''}`}
                    onClick={() => !isDeletingThis && handleNotificationClick(notification.id, notification.link)}
                    style={isDeletingThis ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-time">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <div className="notification-text">
                        {getNotificationText(notification)}
                        {notification.link && (
                          <span className="notification-link-hint"> →</span>
                        )}
                      </div>
                      
                      {notification.userId && (
                        <div 
                          className="notification-recipient clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            !isDeletingThis && handleOpenUserProfile(notification.userId);
                          }}
                          title="Посмотреть профиль пользователя"
                        >
                          👤 Для пользователя: {notification.user?.login || notification.userId.slice(0, 8)}...
                        </div>
                      )}
                    </div>

                    {/* Кнопка удаления - иконка мусорного ведра */}
                    <button
                      className="notification-delete-btn"
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      disabled={isDeletingThis}
                      title="Удалить уведомление"
                    >
                      {isDeletingThis ? '⏳' : '🗑️'}
                    </button>

                    <button
                      className="notification-mark-btn"
                      onClick={(e) => !isDeletingThis && handleMarkButtonClick(e, notification.id)}
                      disabled={isDeletingThis}
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