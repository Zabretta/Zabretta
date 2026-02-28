// backend/src/socket.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

// Хранилище онлайн пользователей
// key: socketId, value: { userId: string, login: string }
const onlineUsers = new Map<string, { userId: string; login: string }>();

// Для быстрого поиска по userId
const userSockets = new Map<string, string>(); // key: userId, value: socketId

let io: Server;

export function setupSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    // Настройки для надежного соединения
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('🔌 Новое WebSocket подключение:', socket.id);

    // Пользователь авторизовался и сообщил свой ID
    socket.on('user-online', (data: { userId: string; login: string }) => {
      const { userId, login } = data;
      
      // Удаляем предыдущую сессию этого пользователя если была
      const oldSocketId = userSockets.get(userId);
      if (oldSocketId) {
        onlineUsers.delete(oldSocketId);
        io.sockets.sockets.get(oldSocketId)?.disconnect();
        console.log(`♻️ Старое соединение для ${login} закрыто`);
      }

      // Сохраняем новое соединение
      onlineUsers.set(socket.id, { userId, login });
      userSockets.set(userId, socket.id);
      
      console.log(`👤 Пользователь ${login} (${userId}) онлайн. Всего онлайн: ${onlineUsers.size}`);
      
      // Отправляем всем клиентам обновленное количество онлайн
      broadcastOnlineCount();
    });

    // Пользователь отключается
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        console.log(`👋 Пользователь ${user.login} отключился`);
        userSockets.delete(user.userId);
        onlineUsers.delete(socket.id);
      } else {
        console.log(`🔌 Соединение ${socket.id} закрыто (неавторизованный)`);
      }
      
      // Отправляем всем обновленное количество онлайн
      broadcastOnlineCount();
    });

    // Пользователь вышел явно (кнопка "Выйти")
    socket.on('user-logout', () => {
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        console.log(`🚪 Пользователь ${user.login} вышел из системы`);
        userSockets.delete(user.userId);
        onlineUsers.delete(socket.id);
        
        // Отправляем всем обновленное количество онлайн
        broadcastOnlineCount();
      }
    });

    // Ошибки сокета
    socket.on('error', (error) => {
      console.error('❌ Ошибка WebSocket:', error);
    });
  });

  // Периодическая проверка соединений (каждые 30 секунд)
  setInterval(() => {
    const now = Date.now();
    io.sockets.sockets.forEach((socket, socketId) => {
      // Если соединение "мертвое" - удаляем
      if (!socket.connected) {
        const user = onlineUsers.get(socketId);
        if (user) {
          console.log(`🧹 Очистка мертвого соединения: ${user.login}`);
          userSockets.delete(user.userId);
          onlineUsers.delete(socketId);
        }
      }
    });
    
    if (onlineUsers.size > 0) {
      console.log(`📊 Текущий онлайн: ${onlineUsers.size} пользователей`);
    }
  }, 30000);

  return io;
}

// Функция для рассылки количества онлайн всем клиентам
function broadcastOnlineCount() {
  if (io) {
    const count = onlineUsers.size;
    io.emit('online-count', count);
    console.log(`📢 Отправлено обновление онлайн: ${count}`);
  }
}

// Получить количество онлайн пользователей
export function getOnlineCount(): number {
  return onlineUsers.size;
}

// Получить список онлайн пользователей (для админки)
export function getOnlineUsersList(): Array<{ userId: string; login: string }> {
  return Array.from(onlineUsers.values());
}

// Проверить, онлайн ли конкретный пользователь
export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId);
}

// Отключить пользователя (например, при блокировке)
export function disconnectUser(userId: string): boolean {
  const socketId = userSockets.get(userId);
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('force-disconnect', 'Вы были отключены администратором');
      socket.disconnect();
      return true;
    }
  }
  return false;
}

// Отправить уведомление конкретному пользователю
export function sendToUser(userId: string, event: string, data: any): boolean {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}

// Отправить уведомление всем онлайн пользователям
export function broadcastToAll(event: string, data: any) {
  io.emit(event, data);
}

// Получить статистику по соединениям
export function getSocketStats() {
  return {
    totalConnections: onlineUsers.size,
    users: Array.from(onlineUsers.values()).map(u => u.login),
    timestamp: new Date().toISOString()
  };
}