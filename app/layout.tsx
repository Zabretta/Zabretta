// app/layout.tsx - ГЛАВНЫЙ layout для всего приложения
"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/useAuth';
import { SettingsProvider } from '@/components/SettingsContext';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}