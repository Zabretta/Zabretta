import express from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireModeratorOrAdmin } from '../middleware/admin';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticate);

// ===== РАЗДЕЛЫ ТОЛЬКО ДЛЯ АДМИНОВ =====
// Для этих маршрутов используем requireAdmin (только ADMIN)

router.get('/users', requireAdmin, AdminController.getUsers);
router.get('/users/:userId', requireAdmin, AdminController.getUserById);
router.put('/users/:userId', requireAdmin, AdminController.updateUser);
router.post('/users/bulk-update', requireAdmin, AdminController.bulkUpdateUsers);
router.post('/users/:userId/toggle-block', requireAdmin, AdminController.toggleUserBlock);
router.post('/users/reset-password', requireAdmin, AdminController.resetPassword);
router.post('/rating/adjust', requireAdmin, AdminController.adjustRating);
router.get('/audit-logs', requireAdmin, AdminController.getAuditLogs);

// ===== РАЗДЕЛЫ ДЛЯ МОДЕРАТОРОВ И АДМИНОВ =====
// Для этих маршрутов используем requireModeratorOrAdmin (ADMIN или MODERATOR)

// Статистика - доступна и модераторам
router.get('/stats', requireModeratorOrAdmin, AdminController.getStats);

// Модерация объявлений
router.get('/market/moderation', requireModeratorOrAdmin, AdminController.getMarketItemsForModeration);
router.get('/market/moderation/:id', requireModeratorOrAdmin, AdminController.getMarketItemForModeration);
router.post('/market/moderation/:id', requireModeratorOrAdmin, AdminController.moderateMarketItem);
router.put('/market/items/:id', requireModeratorOrAdmin, AdminController.updateMarketItem);
router.get('/market/moderation/stats', requireModeratorOrAdmin, AdminController.getMarketModerationStats);

export default router;