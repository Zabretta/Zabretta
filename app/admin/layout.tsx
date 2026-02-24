// app/admin/layout.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/useAuth';
import { AdminProvider } from '@/components/admin/AdminContext';
import { AdminDataProvider } from '@/components/admin/AdminDataContext';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 🔥 Приводим роль к верхнему регистру для сравнения
  const userRole = user?.role?.toUpperCase(); // 'ADMIN', 'MODERATOR' или undefined
  const hasAccess = userRole === 'ADMIN' || userRole === 'MODERATOR';

  useEffect(() => {
    // Если загрузка закончена и пользователь не имеет доступа - редирект на главную
    if (!isLoading && !hasAccess) {
      router.push('/');
    }
  }, [hasAccess, isLoading, router]);

  // Показываем загрузку, пока проверяем права
  if (isLoading) {
    return (
      <div className="admin-loading" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f5f5f5',
        color: '#5a3e2b',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
        <p style={{ fontSize: '18px' }}>Проверка прав доступа...</p>
      </div>
    );
  }

  // Если нет доступа - не рендерим содержимое
  if (!hasAccess) {
    return null;
  }

  // Если есть доступ - показываем админку
  return (
    <AdminProvider>
      <AdminDataProvider>
        <AdminLayout>{children}</AdminLayout>
      </AdminDataProvider>
    </AdminProvider>
  );
}