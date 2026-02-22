// backend/src/routes/user.ts
import express from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticate);

// Профиль пользователя
router.get('/me', UserController.getCurrentUser);
router.put('/me', UserController.updateProfile);
router.post('/change-password', UserController.changePassword);
router.post('/delete-account', UserController.deleteAccount);

// Контент пользователя
router.get('/content', UserController.getUserContent);

// Активность и статистика
router.get('/activity', UserController.getUserActivity);
router.get('/stats', UserController.getUserStats);

// ✅ НОВЫЙ МАРШРУТ: Статистика для личного кабинета
router.get('/dashboard-stats', UserController.getDashboardStats);

export default router;