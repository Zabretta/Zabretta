// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/database';
import { setupSocket, getOnlineCount } from './socket';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import ratingRoutes from './routes/rating';
import statsRoutes from './routes/stats';
import userRoutes from './routes/user';
import notificationRoutes from './routes/notifications';
import adminNotificationRoutes from './routes/admin/notifications';
import settingsRoutes from './routes/settings';
import rulesRoutes from './routes/rules';
import marketRoutes from './routes/market';
import libraryRoutes from './routes/library'; // 👈 ТОЛЬКО ЭТА СТРОКА ДОБАВЛЕНА

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Инициализируем Socket.IO и получаем io instance
const io = setupSocket(server);

// Настройка middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));

// Парсинг JSON и URL-encoded данных
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Подключение к базе данных
connectDB().catch(console.error);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Samodelkin Backend API',
    websocket: 'enabled'
  });
});

// Эндпоинт для получения количества онлайн пользователей
app.get('/api/online', (req, res) => {
  try {
    res.json({ 
      success: true, 
      online: getOnlineCount() 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      online: 0,
      error: 'WebSocket не инициализирован'
    });
  }
});

// Подключение маршрутов
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/library', libraryRoutes); // 👈 ТОЛЬКО ЭТА СТРОКА ДОБАВЛЕНА

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.originalUrl
  });
});

// Глобальный обработчик ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Ошибка сервера:', err);
  
  if (err.type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: 'Файл слишком большой. Максимальный размер: 10MB'
    });
    return;
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log('🚀 Сервер запущен на порту', PORT);
  console.log('🔌 WebSocket подключен и готов к работе');
  console.log('📁 База данных:', process.env.DATABASE_URL?.split('@')[1] || 'не настроена');
  console.log('🌍 Окружение:', process.env.NODE_ENV || 'development');
  console.log('📦 Лимит загрузки: 10MB');
  console.log('👥 Онлайн пользователей:', getOnlineCount());
});

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log('🔄 Получен SIGTERM, завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Получен SIGINT, завершение работы...');
  process.exit(0);
});

export default app;
export { server };