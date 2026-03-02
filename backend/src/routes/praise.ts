// backend/src/routes/praise.ts
import { Router } from 'express';
import { PraiseController } from '../controllers/praiseController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/praise
 * @desc    Создать новую похвалу
 * @access  Private
 */
router.post('/', authenticate, PraiseController.createPraise);

/**
 * @route   GET /api/praise
 * @desc    Получить список похвал с фильтрацией
 * @access  Public
 */
router.get('/', PraiseController.getPraises);

/**
 * @route   GET /api/praise/me
 * @desc    Получить похвалы текущего пользователя
 * @access  Private
 */
router.get('/me', authenticate, PraiseController.getMyPraises);

/**
 * @route   GET /api/praise/stats/:userId
 * @desc    Получить статистику похвал пользователя
 * @access  Public
 */
router.get('/stats/:userId', PraiseController.getUserStats);

/**
 * @route   GET /api/praise/check/:contentId
 * @desc    Проверить, хвалил ли текущий пользователь контент
 * @access  Private
 */
router.get('/check/:contentId', authenticate, PraiseController.checkUserPraised);

/**
 * @route   DELETE /api/praise/:praiseId
 * @desc    Удалить похвалу (только для админов)
 * @access  Private/Admin
 */
router.delete('/:praiseId', authenticate, requireAdmin, PraiseController.deletePraise);

export default router;