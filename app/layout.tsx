// app/layout.tsx
import { AuthProvider } from '@/components/useAuth';
import { SettingsProvider } from '@/components/SettingsContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Самоделкин - Сообщество домашних мастеров',
  description: 'Первая социальная сеть для творческих и изобретательных людей, умеющих идею воплотить в жизнь своими руками.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0 }}>
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
