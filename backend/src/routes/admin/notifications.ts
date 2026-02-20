// backend/src/routes/admin/notifications.ts
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
router.delete('/:id', NotificationController.deleteAsAdmin);

export default router;