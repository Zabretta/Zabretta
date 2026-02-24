"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/useAuth';
import './AdminSidebar.css';

interface AdminSidebarProps {
  collapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
}

// Пункты меню в верхнем регистре (как в БД)
const menuItems = [
  { path: '/admin', icon: '📊', label: 'Панель управления', roles: ['ADMIN', 'MODERATOR'] },
  { path: '/admin/stats', icon: '📈', label: 'Статистика', roles: ['ADMIN'] },
  { path: '/admin/users', icon: '👥', label: 'Пользователи', roles: ['ADMIN'] },
  { path: '/admin/rating', icon: '⭐', label: 'Рейтинг', roles: ['ADMIN'] },
  { path: '/admin/market-moderation', icon: '🛒', label: 'Модерация объявлений', roles: ['ADMIN', 'MODERATOR'] },
  { path: '/', icon: '🏠', label: 'На сайт', roles: ['ADMIN', 'MODERATOR'] },
];

export default function AdminSidebar({ collapsed, isMobileOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(pathname);
  
  // 🔥 ПОЛУЧАЕМ РОЛЬ ПОЛЬЗОВАТЕЛЯ
  const { user } = useAuth();
  // 🔥 ПРИВОДИМ К ВЕРХНЕМУ РЕГИСТРУ ДЛЯ СРАВНЕНИЯ
  const userRole = (user?.role || '').toUpperCase(); 

  // 🔥 ФИЛЬТРУЕМ ПУНКТЫ МЕНЮ ПО РОЛИ
  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleItemClick = (path: string) => {
    setActiveItem(path);
    if (isMobileOpen) {
      onToggle();
    }
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-toggle" 
          onClick={onToggle} 
          title={isMobileOpen ? "Закрыть меню" : "Свернуть меню"}
          aria-label={isMobileOpen ? "Закрыть меню" : "Свернуть меню"}
        >
          {isMobileOpen ? '✕' : collapsed ? '→' : '←'}
        </button>
        {(!collapsed || isMobileOpen) && (
          <div className="sidebar-title">
            <h2>🛠️ Админ-панель</h2>
            <p className="sidebar-subtitle">Самоделкин</p>
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`sidebar-item ${activeItem === item.path ? 'active' : ''}`}
            onClick={() => handleItemClick(item.path)}
            title={collapsed && !isMobileOpen ? item.label : ''}
            aria-current={activeItem === item.path ? 'page' : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {(!collapsed || isMobileOpen) && <span className="sidebar-label">{item.label}</span>}
            {(!collapsed || isMobileOpen) && activeItem === item.path && (
              <span className="sidebar-active-indicator"></span>
            )}
          </Link>
        ))}
      </nav>
      
      {(!collapsed || isMobileOpen) && (
        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-indicator active"></div>
            <span>Система активна</span>
          </div>
          <div className="admin-info">
            <span>
              {userRole === 'ADMIN' ? 'Администратор' : 
               userRole === 'MODERATOR' ? 'Модератор' : 
               'Администратор'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}