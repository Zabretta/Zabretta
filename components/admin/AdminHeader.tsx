"use client";

import { useState, useEffect, useRef } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Определение мобильного вида
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Закрытие выпадающих меню при клике снаружи
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button 
          className="mobile-toggle" 
          onClick={onToggleSidebar} 
          title="Меню"
          aria-label="Открыть меню"
        >
          ☰
        </button>
        <h1 className="header-title">
          {isMobile ? 'Админ-панель' : 'Административная панель'}
        </h1>
      </div>
      
      <div className="header-right">
        <div className="notifications" ref={notificationsRef}>
          <button 
            className="notifications-btn"
            onClick={handleMarkAllAsRead}
            title="Уведомления"
            aria-label={`Уведомления: ${unreadCount} непрочитанных`}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
        </div>
        
        <div className="user-menu" ref={userMenuRef}>
          <button 
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user?.login || 'Администратор'}
            aria-label="Меню пользователя"
            aria-expanded={showUserMenu}
          >
            <span className="user-avatar">👑</span>
            {!isMobile && <span className="user-name">{user?.login || 'Админ'}</span>}
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar-large">👑</div>
                <p className="user-display-name">{user?.login || 'Администратор'}</p>
                <p className="user-email">{user?.email || 'admin@samodelkin.ru'}</p>
                <p className="user-role">Администратор</p>
              </div>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item" 
                onClick={handleLogout}
                aria-label="Выйти из системы"
              >
                🚪 Выйти
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showUserMenu && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setShowUserMenu(false)} 
          aria-hidden="true"
        />
      )}
    </header>
  );
}
