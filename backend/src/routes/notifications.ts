// backend/src/routes/notifications.ts
// Роуты для работы с уведомлениями

import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = express.Router();

// Все маршруты требуют авторизации и прав администратора
router.use(authenticate);
router.use(requireAdmin);

// Получение всех уведомлений
router.get('/', NotificationController.getNotifications);

// Получение количества непрочитанных
router.get('/unread/count', NotificationController.getUnreadCount);

// Создание нового уведомления (для тестирования)
router.post('/', NotificationController.createNotification);

// Пометить уведомление как прочитанное
router.put('/:id/read', NotificationController.markAsRead);

// Пометить все как прочитанные
router.put('/read-all', NotificationController.markAllAsRead);

// Удалить уведомление
router.delete('/:id', NotificationController.deleteNotification);

// Удалить все уведомления
router.delete('/', NotificationController.deleteAllNotifications);

export default router;
