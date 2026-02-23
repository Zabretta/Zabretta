// backend/src/routes/rating.ts
import express from 'express';
import { RatingController } from '../controllers/ratingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// ========== ПУБЛИЧНЫЕ МАРШРУТЫ ==========
// Эти данные может смотреть любой пользователь без авторизации

// Получить уровни и формулы рейтинга
router.get('/levels', RatingController.getRatingLevels);

// Получить распределение пользователей по уровням
router.get('/distribution', RatingController.getRatingDistribution);

// Получить рейтинг пользователя по ID
router.get('/users/:userId/rating', RatingController.getUserRating);

// Получить статистику рейтинга пользователя
router.get('/users/:userId/stats', RatingController.getUserRatingStats);

// Получить историю корректировок
router.get('/adjustments', RatingController.getRatingAdjustments);

// ========== ЗАЩИЩЕННЫЕ МАРШРУТЫ (ТРЕБУЮТ АВТОРИЗАЦИИ) ==========
// Все маршруты ниже доступны только авторизованным пользователям
router.use(authenticate);

// 👇 НОВЫЙ МАРШРУТ: Начисление баллов за действие
// POST /api/rating/award
router.post('/award', RatingController.awardPoints);

// 👇 НОВЫЙ МАРШРУТ: История начислений текущего пользователя
// GET /api/rating/my-history
router.get('/my-history', RatingController.getMyRatingHistory);

// 👇 НОВЫЙ МАРШРУТ: Проверка бонуса за ежедневный вход
// GET /api/rating/check-daily-bonus
router.get('/check-daily-bonus', RatingController.checkDailyBonus);

// Получить рейтинг текущего пользователя
router.get('/my-rating', RatingController.getCurrentUserRating);

// Получить все рейтинги с пагинацией
router.get('/all', RatingController.getAllRatings);

// Поиск пользователей по рейтингу
router.get('/search', RatingController.searchUsersByRating);

export default router;
