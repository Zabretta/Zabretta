// backend/src/routes/notifications.ts
import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticate);

// Основные маршруты для пользователей
router.get('/', NotificationController.getUserNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.post('/read-all', NotificationController.markAllAsRead);

// Настройки уведомлений
router.get('/settings', NotificationController.getSettings);
router.put('/settings', NotificationController.updateSettings);

// Работа с конкретным уведомлением
router.post('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.delete);

export default router;
