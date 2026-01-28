"use client";

import { useState } from 'react';
import { useAuth } from '@/components/useAuth';
import './AdminHeader.css';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Новый пользователь зарегистрировался', time: '5 мин назад', read: false },
    { id: 2, text: 'Статистика обновлена', time: '10 мин назад', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onToggleSidebar} title="Меню">
          ☰
        </button>
        <h1 className="header-title">Административная панель</h1>
      </div>
      
      <div className="header-right">
        <div className="notifications">
          <button 
            className="notifications-btn"
            onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            title="Уведомления"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
        </div>
        
        <div className="user-menu">
          <button 
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user?.login || 'Администратор'}
          >
            <span className="user-avatar">👑</span>
            <span className="user-name">{user?.login || 'Админ'}</span>
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <p className="user-email">{user?.email || 'admin@samodelkin.ru'}</p>
                <p className="user-role">Администратор</p>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={logout}>
                🚪 Выйти
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showUserMenu && (
        <div className="dropdown-overlay" onClick={() => setShowUserMenu(false)} />
      )}
    </header>
  );
}
