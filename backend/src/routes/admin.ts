import express from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = express.Router();

// Все маршруты требуют авторизации и прав администратора
router.use(authenticate);
router.use(requireAdmin);

// ===== ПОЛЬЗОВАТЕЛИ =====
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserById);
router.put('/users/:userId', AdminController.updateUser);
router.post('/users/bulk-update', AdminController.bulkUpdateUsers);
router.post('/users/:userId/toggle-block', AdminController.toggleUserBlock);
router.post('/users/reset-password', AdminController.resetPassword);

// ===== РЕЙТИНГ =====
router.post('/rating/adjust', AdminController.adjustRating);

// ===== СТАТИСТИКА =====
router.get('/stats', AdminController.getStats);

// ===== АУДИТ-ЛОГИ =====
router.get('/audit-logs', AdminController.getAuditLogs);

// ===== 🔥 НОВЫЕ МАРШРУТЫ ДЛЯ МОДЕРАЦИИ ОБЪЯВЛЕНИЙ =====

/**
 * @route   GET /api/admin/market/moderation
 * @desc    Получить объявления для модерации (с фильтрацией по статусу)
 * @access  Private (Admin/Moderator)
 */
router.get('/market/moderation', AdminController.getMarketItemsForModeration);

/**
 * @route   GET /api/admin/market/moderation/:id
 * @desc    Получить конкретное объявление для модерации
 * @access  Private (Admin/Moderator)
 */
router.get('/market/moderation/:id', AdminController.getMarketItemForModeration);

/**
 * @route   POST /api/admin/market/moderation/:id
 * @desc    Отмодерировать объявление (одобрить/отклонить)
 * @access  Private (Admin/Moderator)
 */
router.post('/market/moderation/:id', AdminController.moderateMarketItem);

/**
 * @route   PUT /api/admin/market/items/:id
 * @desc    Обновить объявление (перед одобрением)
 * @access  Private (Admin/Moderator)
 */
router.put('/market/items/:id', AdminController.updateMarketItem);

/**
 * @route   GET /api/admin/market/moderation/stats
 * @desc    Получить статистику модерации
 * @access  Private (Admin/Moderator)
 */
router.get('/market/moderation/stats', AdminController.getMarketModerationStats);

export default router;