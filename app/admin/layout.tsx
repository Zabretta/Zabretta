// app/admin/layout.tsx
"use client";

import { ReactNode } from 'react';
import { AdminProvider } from '@/components/admin/AdminContext';
import { AdminDataProvider } from '@/components/admin/AdminDataContext'; // <-- ДОБАВЛЕН ИМПОРТ
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminDataProvider> {/* <-- ДОБАВЛЕН ПРОВАЙДЕР */}
        <AdminLayout>{children}</AdminLayout>
      </AdminDataProvider>
    </AdminProvider>
  );
}