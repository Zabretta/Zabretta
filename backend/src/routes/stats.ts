// backend/src/routes/stats.ts
import express from 'express';
import { StatsController } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = express.Router();

// Публичные маршруты (базовая статистика)
router.get('/system', StatsController.getSystemStats);
router.get('/daily', StatsController.getDailyStats);
router.get('/content', StatsController.getContentStats);

// Защищенные маршруты (требуют авторизации)
router.use(authenticate);
router.get('/user-activity/:userId', StatsController.getUserActivityStats);

// Маршруты только для администраторов
router.use(requireAdmin);
// Дополнительные административные маршруты могут быть добавлены здесь

export default router;