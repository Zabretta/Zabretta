// backend/src/socket.ts
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from './config/auth';

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

  // Middleware для проверки JWT токена при подключении
  io.use(async (socket, next) => {
    try {
      // Пробуем получить токен из разных мест
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ WebSocket: нет токена');
        return next(new Error('Authentication error: token missing'));
      }

      // Проверяем токен
      const decoded = jwt.verify(token, JWT_CONFIG.secret) as { userId: string };
      
      // Сохраняем userId в socket.data для дальнейшего использования
      socket.data.userId = decoded.userId;
      
      console.log(`✅ WebSocket: пользователь ${decoded.userId} аутентифицирован`);
      next();
    } catch (error) {
      // ✅ ИСПРАВЛЕНО: правильная обработка unknown error
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.log('❌ WebSocket: ошибка токена', errorMessage);
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    
    console.log(`🔌 Новое WebSocket подключение: ${socket.id}${userId ? ` (пользователь: ${userId})` : ''}`);

    // Пользователь авторизовался и сообщил свой ID и login
    socket.on('user-online', (data: { userId: string; login: string }) => {
      const { userId: msgUserId, login } = data;
      
      // Проверяем, что userId совпадает с тем, что в токене (безопасность!)
      if (socket.data.userId && socket.data.userId !== msgUserId) {
        console.log(`⚠️ Попытка подмены userId: токен=${socket.data.userId}, запрос=${msgUserId}`);
        socket.emit('error', 'Invalid user ID');
        socket.disconnect();
        return;
      }

      // Удаляем предыдущую сессию этого пользователя если была
      const oldSocketId = userSockets.get(msgUserId);
      if (oldSocketId && oldSocketId !== socket.id) {
        onlineUsers.delete(oldSocketId);
        io.sockets.sockets.get(oldSocketId)?.disconnect();
        console.log(`♻️ Старое соединение для ${login} закрыто`);
      }

      // Сохраняем новое соединение
      onlineUsers.set(socket.id, { userId: msgUserId, login });
      userSockets.set(msgUserId, socket.id);
      
      console.log(`👤 Пользователь ${login} (${msgUserId}) онлайн. Всего онлайн: ${onlineUsers.size}`);
      
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
      // ✅ ИСПРАВЛЕНО: правильная обработка unknown error
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('❌ Ошибка WebSocket:', errorMessage);
    });
  });

  // Периодическая проверка соединений (каждые 30 секунд)
  setInterval(() => {
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