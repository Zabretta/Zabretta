import { AuthProvider } from '../components/useAuth';
import { SettingsProvider } from '../components/SettingsContext'; // Импорт из ../components

export const metadata = {
  title: 'Самоделкин - Сообщество домашних мастеров',
  description: 'Первая социальная сеть для творческих и изобретательных людей, умеющих идею воплотить в жизнь своими руками.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <SettingsProvider> {/* Новый провайдер */}
            {children}
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}