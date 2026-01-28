"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './AdminSidebar.css';

interface AdminSidebarProps {
  collapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/admin', icon: '📊', label: 'Панель управления' },
  { path: '/admin/stats', icon: '📈', label: 'Статистика' },
  { path: '/admin/users', icon: '👥', label: 'Пользователи' },
  { path: '/admin/rating', icon: '⭐', label: 'Рейтинг' },
  { path: '/', icon: '🏠', label: 'На сайт' },
];

export default function AdminSidebar({ collapsed, isMobileOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(pathname);

  const handleItemClick = (path: string) => {
    setActiveItem(path);
    // Закрываем мобильное меню при клике на пункт (если мы на мобильном)
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
        {menuItems.map((item) => (
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
            <span>Администратор</span>
          </div>
        </div>
      )}
    </aside>
  );
}