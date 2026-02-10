// components/admin/AdminLayout.tsx
"use client";

import { ReactNode } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdmin } from '@/components/admin/AdminContext';
import { NotificationsProvider } from './NotificationsContext';
import NotificationsModal from './NotificationsModal';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthorized } = useAdminAuth();
  const { 
    sidebarCollapsed, 
    isMobileSidebarOpen, 
    isMobileView, 
    toggleSidebar, 
    closeMobileSidebar 
  } = useAdmin();

  if (!isAuthorized) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">🛠️</div>
        <p>Проверка прав доступа...</p>
      </div>
    );
  }

  return (
    <NotificationsProvider>
      <div className="admin-layout">
        {/* Оверлей для закрытия мобильного меню */}
        {isMobileView && isMobileSidebarOpen && (
          <div 
            className="mobile-sidebar-overlay"
            onClick={closeMobileSidebar}
          />
        )}
        
        <AdminSidebar 
          collapsed={sidebarCollapsed} 
          isMobileOpen={isMobileSidebarOpen}
          onToggle={toggleSidebar}
        />
        <div className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <AdminHeader onToggleSidebar={toggleSidebar} />
          <div className="admin-content" onClick={closeMobileSidebar}>
            {children}
          </div>
          <footer className="admin-footer">
            <p>Админ-панель "Самоделкин" • {new Date().getFullYear()}</p>
            <p className="admin-version">Версия 1.0.0 (Демо)</p>
          </footer>
        </div>
        
        <NotificationsModal />
      </div>
    </NotificationsProvider>
  );
}
