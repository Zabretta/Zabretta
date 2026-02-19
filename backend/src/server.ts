// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import ratingRoutes from './routes/rating';
import statsRoutes from './routes/stats';
import userRoutes from './routes/user';
import notificationRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';
import rulesRoutes from './routes/rules';
import marketRoutes from './routes/market';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));

// 🔥 УВЕЛИЧИВАЕМ ЛИМИТ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ
app.use(express.json({ limit: '10mb' })); // Увеличиваем до 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Подключение к базе данных
connectDB().catch(console.error);

// Основной маршрут для проверки работы
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Samodelkin Backend API'
  });
});

// Регистрация маршрутов
app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/market', marketRoutes);

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.originalUrl
  });
});

// Обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Ошибка сервера:', err);
  
  // Специальная обработка ошибки "Payload Too Large"
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
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📁 База данных: ${process.env.DATABASE_URL?.split('@')[1] || 'не настроена'}`);
  console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Лимит загрузки: 10MB`);
});

// Обработка завершения работы
process.on('SIGTERM', () => {
  console.log('🔄 Получен SIGTERM, завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Получен SIGINT, завершение работы...');
  process.exit(0);
});

export default app;