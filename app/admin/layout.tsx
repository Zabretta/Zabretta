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
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если загрузка закончена и пользователь не админ - редирект на главную
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

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

  // Если не админ - не рендерим содержимое
  if (!isAdmin) {
    return null;
  }

  // Если админ - показываем админку
  return (
    <AdminProvider>
      <AdminDataProvider>
        <AdminLayout>{children}</AdminLayout>
      </AdminDataProvider>
    </AdminProvider>
  );
}