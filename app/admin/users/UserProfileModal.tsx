// Файл 3 из 3: app/admin/users/UserProfileModal.tsx

"use client";

import './UserModals.css';

// Временный тип, позже перенесем в types/admin.ts
interface AdminUser {
  id: string;
  login: string;
  email: string;
  name?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  rating: number;
  activityPoints: number;
  totalPosts: number;
  violations: number;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

interface UserProfileModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleBlock: () => void;
  onResetPassword: () => void;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onEdit,
  onToggleBlock,
  onResetPassword
}: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  // Определяем уровень пользователя по рейтингу
  const getUserLevel = (rating: number = 0) => {
    if (rating >= 2001) return { name: 'Эксперт сообщества', color: '#FFD700' };
    if (rating >= 1001) return { name: 'Профессор Сомоделкин', color: '#A0522D' };
    if (rating >= 501) return { name: 'Инженер-конструктор', color: '#CD853F' };
    if (rating >= 201) return { name: 'Инженер', color: '#D2691E' };
    return { name: 'Студент', color: '#8B4513' };
  };

  const userLevel = getUserLevel(user.rating);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Профиль пользователя</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Основная информация */}
          <div className="profile-section">
            <div className="profile-header">
              <div className="user-avatar-large">
                {user.avatar || (user.role === 'admin' ? '👑' : '👤')}
              </div>
              <div className="user-main-info">
                <div className="user-title">
                  <h3>{user.login}</h3>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Администратор' : 
                     user.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                  </span>
                </div>
                <p className="user-email">{user.email}</p>
                <p className="user-name">{user.name || 'Имя не указано'}</p>
                <div className="user-status">
                  <span className={`status-badge ${user.isActive ? 'active' : 'blocked'}`}>
                    {user.isActive ? 'Активен' : 'Заблокирован'}
                  </span>
                  <span className="registration-date">
                    Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>

            {/* Рейтинг и активность */}
            <div className="rating-section">
              <div className="rating-card" style={{ borderLeftColor: userLevel.color }}>
                <div className="rating-icon">⭐</div>
                <div className="rating-info">
                  <div className="rating-label">Рейтинг</div>
                  <div className="rating-value">{user.rating || 0} баллов</div>
                  <div className="rating-level" style={{ color: userLevel.color }}>
                    Уровень: {userLevel.name}
                  </div>
                </div>
              </div>

              <div className="rating-card" style={{ borderLeftColor: '#4169E1' }}>
                <div className="rating-icon">⚡</div>
                <div className="rating-info">
                  <div className="rating-label">Активность</div>
                  <div className="rating-value">{user.activityPoints || 0} очков</div>
                  <div className="rating-level">
                    {user.activityPoints && user.activityPoints >= 1000 ? 'Легенда сообщества' : 
                     user.activityPoints && user.activityPoints >= 600 ? 'Лидер активности' : 
                     'Активный пользователь'}
                  </div>
                </div>
              </div>

              {user.lastLogin && (
                <div className="rating-card" style={{ borderLeftColor: '#2E8B57' }}>
                  <div className="rating-icon">🕒</div>
                  <div className="rating-info">
                    <div className="rating-label">Последний вход</div>
                    <div className="rating-value">
                      {new Date(user.lastLogin).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="rating-level">
                      {new Date(user.lastLogin).toLocaleTimeString('ru-RU')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Статистика */}
          <div className="profile-section">
            <h4>Статистика пользователя</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Создано проектов</div>
                <div className="stat-value">{user.totalPosts || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Нарушений</div>
                <div className="stat-value">{user.violations || 0}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Дней активности</div>
                <div className="stat-value">
                  {user.lastLogin 
                    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 0}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Средний рейтинг</div>
                <div className="stat-value">
                  {user.totalPosts && user.rating && user.totalPosts > 0
                    ? (user.rating / user.totalPosts).toFixed(1)
                    : '0.0'}
                </div>
              </div>
            </div>
          </div>

          {/* История активности (заглушка - будет заменена на реальные данные позже) */}
          <div className="profile-section">
            <h4>Последние действия</h4>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">📝</div>
                <div className="activity-details">
                  <div className="activity-text">Создал новый проект</div>
                  <div className="activity-time">2 дня назад</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">💬</div>
                <div className="activity-details">
                  <div className="activity-text">Оставил комментарий</div>
                  <div className="activity-time">3 дня назад</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">❤️</div>
                <div className="activity-details">
                  <div className="activity-text">Поставил лайк проекту</div>
                  <div className="activity-time">5 дней назад</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            <button className="action-btn primary" onClick={onEdit}>
              ✏️ Редактировать
            </button>
            <button 
              className={`action-btn ${user.isActive ? 'danger' : 'success'}`}
              onClick={onToggleBlock}
            >
              {user.isActive ? '⛔ Заблокировать' : '✅ Разблокировать'}
            </button>
            <button className="action-btn secondary" onClick={onResetPassword}>
              🔄 Сбросить пароль
            </button>
            <button className="action-btn tertiary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}