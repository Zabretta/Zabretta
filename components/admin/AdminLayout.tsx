"use client";

import { ReactNode, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthorized } = useAdminAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthorized) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">🛠️</div>
        <p>Проверка прав доступа...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <AdminHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="admin-content">
          {children}
        </div>
        <footer className="admin-footer">
          <p>Админ-панель "Самоделкин" • {new Date().getFullYear()}</p>
          <p className="admin-version">Версия 1.0.0 (Демо)</p>
        </footer>
      </div>
    </div>
  );
}