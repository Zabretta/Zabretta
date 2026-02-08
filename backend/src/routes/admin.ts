// backend/src/routes/admin.ts
import express from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = express.Router();

// Все маршруты требуют авторизации и прав администратора
router.use(authenticate);
router.use(requireAdmin);

// Пользователи
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserById);
router.put('/users/:userId', AdminController.updateUser);
router.post('/users/bulk-update', AdminController.bulkUpdateUsers);
router.post('/users/:userId/toggle-block', AdminController.toggleUserBlock);
router.post('/users/reset-password', AdminController.resetPassword);

// Рейтинг
router.post('/rating/adjust', AdminController.adjustRating);

// Статистика
router.get('/stats', AdminController.getStats);

// Аудит-логи
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;