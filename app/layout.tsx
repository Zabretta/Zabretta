import { AuthProvider } from '../components/useAuth';
import { SettingsProvider } from '../components/SettingsContext';
import type { Metadata } from 'next'; // Импортируем тип для TypeScript

// Используем тип Metadata для лучшей типизации
export const metadata: Metadata = {
  title: 'Самоделкин - Сообщество домашних мастеров',
  description: 'Первая социальная сеть для творческих и изобретательных людей, умеющих идею воплотить в жизнь своими руками.',
  // Добавляем критически важный тег viewport
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* Добавляем базовый тег viewport для поддержки в старых браузерах */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}