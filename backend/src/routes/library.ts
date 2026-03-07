// backend/src/routes/library.ts
import express from 'express';
import { LibraryController } from '../controllers/libraryController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = express.Router();

// ===== ПУБЛИЧНЫЕ МАРШРУТЫ С ОПЦИОНАЛЬНОЙ АВТОРИЗАЦИЕЙ =====
// Все GET-запросы могут получать пользователя, если есть токен

/**
 * @route   GET /api/library/sections
 * @desc    Получить все разделы библиотеки (стеллажи)
 * @access  Public (с опциональной авторизацией)
 */
router.get('/sections', optionalAuth, LibraryController.getAllSections);

/**
 * @route   GET /api/library/sections/:sectionId
 * @desc    Получить раздел по ID
 * @access  Public (с опциональной авторизацией)
 */
router.get('/sections/:sectionId', optionalAuth, LibraryController.getSectionById);

/**
 * @route   GET /api/library/sections/:sectionId/subsections
 * @desc    Получить подразделы раздела
 * @access  Public (с опциональной авторизацией)
 */
router.get('/sections/:sectionId/subsections', optionalAuth, LibraryController.getSubsections);

/**
 * @route   GET /api/library/subsections/:subsectionId
 * @desc    Получить подраздел по ID
 * @access  Public (с опциональной авторизацией)
 */
router.get('/subsections/:subsectionId', optionalAuth, LibraryController.getSubsectionById);

/**
 * @route   GET /api/library/subsections/:subsectionId/items
 * @desc    Получить документы подраздела (с пагинацией)
 * @access  Public (с опциональной авторизацией)
 */
router.get('/subsections/:subsectionId/items', optionalAuth, LibraryController.getItems);

/**
 * @route   GET /api/library/items/:itemId
 * @desc    Получить документ по ID
 * @access  Public (с опциональной авторизацией)
 */
router.get('/items/:itemId', optionalAuth, LibraryController.getItemById);

/**
 * @route   GET /api/library/stats
 * @desc    Получить статистику библиотеки
 * @access  Public (с опциональной авторизацией)
 */
router.get('/stats', optionalAuth, LibraryController.getStats);

/**
 * @route   GET /api/library/search
 * @desc    Поиск по библиотеке
 * @access  Public (с опциональной авторизацией)
 */
router.get('/search', optionalAuth, LibraryController.search);

/**
 * @route   POST /api/library/items/:itemId/views
 * @desc    Увеличить счетчик просмотров документа
 * @access  Public (с опциональной авторизацией)
 */
router.post('/items/:itemId/views', optionalAuth, LibraryController.incrementViews);

// ===== ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют авторизации) =====
router.use(authenticate);

/**
 * @route   POST /api/library/subsections
 * @desc    Создать новый подраздел
 * @access  Private
 */
router.post('/subsections', LibraryController.createSubsection);

/**
 * @route   POST /api/library/items
 * @desc    Создать новый документ
 * @access  Private
 */
router.post('/items', LibraryController.createItem);

/**
 * @route   PUT /api/library/subsections/:subsectionId
 * @desc    Обновить подраздел
 * @access  Private
 */
router.put('/subsections/:subsectionId', LibraryController.updateSubsection);

/**
 * @route   PUT /api/library/items/:itemId
 * @desc    Обновить документ
 * @access  Private
 */
router.put('/items/:itemId', LibraryController.updateItem);

/**
 * @route   DELETE /api/library/subsections/:subsectionId
 * @desc    Удалить подраздел (мягкое удаление)
 * @access  Private
 */
router.delete('/subsections/:subsectionId', LibraryController.deleteSubsection);

/**
 * @route   DELETE /api/library/items/:itemId
 * @desc    Удалить документ (мягкое удаление)
 * @access  Private
 */
router.delete('/items/:itemId', LibraryController.deleteItem);

// ===== МАРШРУТЫ ДЛЯ ЛАЙКОВ =====

/**
 * @route   POST /api/library/items/:itemId/like
 * @desc    Поставить лайк документу
 * @access  Private
 */
router.post('/items/:itemId/like', LibraryController.likeItem);

/**
 * @route   DELETE /api/library/items/:itemId/like
 * @desc    Убрать лайк с документа
 * @access  Private
 */
router.delete('/items/:itemId/like', LibraryController.unlikeItem);

// ===== МАРШРУТЫ ДЛЯ ПРОВЕРКИ ПРАВ =====

/**
 * @route   GET /api/library/items/:itemId/can-edit
 * @desc    Проверить права на редактирование документа
 * @access  Private
 */
router.get('/items/:itemId/can-edit', LibraryController.canEditItem);

/**
 * @route   GET /api/library/subsections/:subsectionId/can-edit
 * @desc    Проверить права на редактирование подраздела
 * @access  Private
 */
router.get('/subsections/:subsectionId/can-edit', LibraryController.canEditSubsection);

export default router;