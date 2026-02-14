// components/admin/AdminHeader.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/useAuth';
import { useNotifications } from './NotificationsContext';
import './AdminHeader.css';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { user } = useAuth(); // Убрали logout - не используется
  const { 
    unreadCount, 
    openNotificationsModal
  } = useNotifications();
  
  const [isMobile, setIsMobile] = useState(false);

  // Определение мобильного вида
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNotificationsClick = () => {
    openNotificationsModal();
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
        <div className="notifications">
          <button 
            className="notifications-btn"
            onClick={handleNotificationsClick}
            title="Уведомления"
            aria-label={`Уведомления: ${unreadCount} непрочитанных`}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
        </div>
        
        {/* Упрощенная кнопка админа - только для красоты */}
        <div className="user-info-static">
          <div className="user-avatar">👑</div>
          {!isMobile && (
            <div className="user-text">
              <div className="user-name">{user?.login || 'Администратор'}</div>
              <div className="user-role">Админ</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}