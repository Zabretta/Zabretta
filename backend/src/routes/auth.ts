// backend/src/routes/auth.ts
import express from 'express';
import { AuthController } from '../controllers/authController';

const router = express.Router();

// Регистрация и аутентификация
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Профиль (требует авторизации через отдельный middleware)
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);

export default router;