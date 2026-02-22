// backend/src/routes/market.ts
import express from 'express';
import { MarketController } from '../controllers/marketController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Публичные маршруты (не требуют авторизации)
router.get('/items', MarketController.getItems);
router.get('/items/:id', MarketController.getItemById);
router.get('/categories', MarketController.getCategories);

// Защищенные маршруты (требуют авторизации)
router.use(authenticate);
router.post('/items', MarketController.createItem);
router.put('/items/:id', MarketController.updateItem);
router.delete('/items/:id', MarketController.deleteItem);
router.post('/contact', MarketController.contactAuthor);

// ===== ПОЛНЫЙ НАБОР МАРШРУТОВ ДЛЯ СООБЩЕНИЙ =====

/**
 * @route   GET /api/market/messages
 * @desc    Получить все сообщения текущего пользователя
 * @access  Private
 */
router.get('/messages', MarketController.getUserMessages);

/**
 * @route   GET /api/market/messages/:id/thread
 * @desc    Получить полную переписку по сообщению
 * @access  Private
 */
router.get('/messages/:id/thread', MarketController.getMessageThread);

/**
 * @route   POST /api/market/messages/:id/reply
 * @desc    Отправить ответ на сообщение
 * @access  Private
 */
router.post('/messages/:id/reply', MarketController.sendReply);

/**
 * @route   PUT /api/market/messages/:id/read
 * @desc    Отметить сообщение как прочитанное
 * @access  Private
 */
router.put('/messages/:id/read', MarketController.markMessageAsRead);

/**
 * @route   GET /api/market/messages/unread/count
 * @desc    Получить количество непрочитанных сообщений
 * @access  Private
 */
router.get('/messages/unread/count', MarketController.getUnreadCount);

export default router;