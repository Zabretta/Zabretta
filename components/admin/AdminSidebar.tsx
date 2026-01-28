"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './AdminSidebar.css';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/admin', icon: '📊', label: 'Панель управления' },
  { path: '/admin/stats', icon: '📈', label: 'Статистика' },
  { path: '/admin/users', icon: '👥', label: 'Пользователи' },
  { path: '/admin/rating', icon: '⭐', label: 'Рейтинг' },
  { path: '/', icon: '🏠', label: 'На сайт' },
];

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(pathname);

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={onToggle} title="Свернуть меню">
          {collapsed ? '→' : '←'}
        </button>
        {!collapsed && (
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
            onClick={() => setActiveItem(item.path)}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
            {!collapsed && activeItem === item.path && (
              <span className="sidebar-active-indicator"></span>
            )}
          </Link>
        ))}
      </nav>
      
      {!collapsed && (
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