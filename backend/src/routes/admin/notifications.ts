import express from 'express';
import { NotificationController } from '../../controllers/notificationController';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = express.Router();

// Все маршруты требуют авторизации и прав администратора
router.use(authenticate);
router.use(requireAdmin);

// Управление уведомлениями
router.get('/', NotificationController.getAllNotifications);
router.post('/', NotificationController.createNotification);
router.post('/bulk', NotificationController.sendBulkNotification);
router.get('/stats', NotificationController.getStats);

// ✅ НОВЫЕ МАРШРУТЫ ДЛЯ ОТПРАВКИ СООБЩЕНИЙ
router.post('/send', NotificationController.sendToUser);        // адресная отправка
router.post('/broadcast', NotificationController.sendToAll);    // рассылка всем
router.get('/users/search', NotificationController.searchUsers); // поиск пользователей

// ✅ МАРШРУТЫ ДЛЯ ОТМЕТКИ ПРОЧИТАННЫХ УВЕДОМЛЕНИЙ
router.post('/:id/read', NotificationController.markAdminAsRead);
router.post('/read-all', NotificationController.markAdminAllAsRead);

// Удаление уведомления
router.delete('/:id', NotificationController.deleteAsAdmin);

export default router;