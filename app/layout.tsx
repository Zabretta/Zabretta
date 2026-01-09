import { AuthProvider } from '@/components/useAuth';

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
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}