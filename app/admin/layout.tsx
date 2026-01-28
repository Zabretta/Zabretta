"use client";

import { ReactNode } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider } from '@/components/admin/AdminContext';

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminProvider>
  );
}