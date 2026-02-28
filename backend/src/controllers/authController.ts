// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_CONFIG } from '../config/auth';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { RatingService } from '../services/ratingService';

interface RegisterRequest {
  login: string;
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  login: string;
  password: string;
}

export class AuthController {
  /**
   * Регистрация нового пользователя
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { login, email, password, name }: RegisterRequest = req.body;

      // Проверка на существующего пользователя
      const existingUser = await prisma.users.findFirst({
        where: {
          OR: [{ login }, { email }]
        }
      });

      if (existingUser) {
        res.status(400).json(createErrorResponse('Пользователь с таким логином или email уже существует'));
        return;
      }

      // Хеширование пароля
      const passwordHash = await bcrypt.hash(password, 10);

      // ИСПРАВЛЕНО: убрал (prisma as any)
      const user = await prisma.users.create({
        data: {
          login,
          email,
          name,
          passwordHash,
          role: 'USER',
          isActive: true,
          rating: 15,
          activityPoints: 0,
          totalPosts: 0,
          violations: 0
        },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });

      // 👇 ДОБАВЛЕНО: явное обновление lastLogin при регистрации
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: { 
          lastLogin: new Date()  // Устанавливаем время регистрации как первый вход
        },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });

      // 👇 СОЗДАЕМ ЗАПИСЬ В ИСТОРИИ О РЕГИСТРАЦИИ
      try {
        await RatingService.awardPoints(user.id, 'registration');
        console.log(`[Auth] Бонус за регистрацию начислен пользователю ${user.id}`);
      } catch (ratingError) {
        console.error('[Auth] Ошибка при начислении бонуса за регистрацию:', ratingError);
      }

      // Генерация токенов
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_CONFIG.refreshSecret,
        { expiresIn: JWT_CONFIG.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
      );

      // Сохранение refresh токена
      await prisma.users.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      console.log(`✅ Новый пользователь зарегистрирован: ${login}, lastLogin: ${updatedUser.lastLogin}`);

      res.json(createSuccessResponse({
        token,
        refreshToken,
        user: {
          ...updatedUser,
          createdAt: updatedUser.createdAt.toISOString(),
          lastLogin: updatedUser.lastLogin?.toISOString()
        }
      }));

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json(createErrorResponse('Ошибка при регистрации'));
    }
  }

  /**
   * Вход пользователя в систему
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { login, password }: LoginRequest = req.body;

      // Поиск пользователя по логину или email
      const user = await prisma.users.findFirst({
        where: {
          OR: [{ login }, { email: login }]
        }
      });

      if (!user) {
        res.status(401).json(createErrorResponse('Неверный логин или пароль'));
        return;
      }

      if (!user.isActive) {
        res.status(403).json(createErrorResponse('Аккаунт заблокирован'));
        return;
      }

      // Проверка пароля
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json(createErrorResponse('Неверный логин или пароль'));
        return;
      }

      // 👇 ПРОВЕРЯЕМ И НАЧИСЛЯЕМ БОНУС ЗА ЕЖЕДНЕВНЫЙ ВХОД
      let dailyLoginBonus = null;
      try {
        const bonusResult = await RatingService.checkAndAwardDailyLogin(user.id);
        if (bonusResult.awarded) {
          dailyLoginBonus = {
            awarded: true,
            message: bonusResult.message
          };
          console.log(`[Auth] Бонус за вход начислен пользователю ${user.id}`);
        }
      } catch (ratingError) {
        console.error('[Auth] Ошибка при начислении бонуса за вход:', ratingError);
      }

      // Генерация токенов
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_CONFIG.refreshSecret,
        { expiresIn: JWT_CONFIG.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
      );

      // ИСПРАВЛЕНО: явное обновление lastLogin при входе и получение обновленных данных
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: { 
          refreshToken,
          lastLogin: new Date()  // ОБЯЗАТЕЛЬНО обновляем lastLogin!
        },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });

      console.log(`✅ Пользователь ${user.login} вошел в систему, lastLogin обновлен: ${updatedUser.lastLogin}`);

      const userData = {
        id: updatedUser.id,
        login: updatedUser.login,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt.toISOString(),
        lastLogin: updatedUser.lastLogin?.toISOString(),
        rating: updatedUser.rating,
        activityPoints: updatedUser.activityPoints,
        totalPosts: updatedUser.totalPosts,
        violations: updatedUser.violations
      };

      res.json(createSuccessResponse({
        token,
        refreshToken,
        user: userData,
        bonus: dailyLoginBonus
      }));

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(createErrorResponse('Ошибка при входе в систему'));
    }
  }

  /**
   * Обновление access токена с помощью refresh токена
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json(createErrorResponse('Refresh token обязателен'));
        return;
      }

      // Верификация refresh токена
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret) as { userId: string };

      // Поиск пользователя с таким refresh токеном
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId, refreshToken }
      });

      if (!user) {
        res.status(401).json(createErrorResponse('Недействительный refresh token'));
        return;
      }

      if (!user.isActive) {
        res.status(403).json(createErrorResponse('Аккаунт заблокирован'));
        return;
      }

      // Генерация нового access токена
      const newToken = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
      );

      res.json(createSuccessResponse({
        token: newToken,
        refreshToken
      }));

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json(createErrorResponse('Недействительный refresh token'));
    }
  }

  /**
   * Выход из системы (удаление refresh токена)
   * POST /api/auth/logout
   */
  static async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      await prisma.users.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });

      console.log(`👋 Пользователь ${req.user.login} вышел из системы`);

      res.json(createSuccessResponse({ success: true, message: 'Выход выполнен успешно' }));

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(createErrorResponse('Ошибка при выходе из системы'));
    }
  }

  /**
   * Получение профиля текущего пользователя
   * GET /api/auth/me
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }

      res.json(createSuccessResponse({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      }));

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении профиля'));
    }
  }

  /**
   * Обновление профиля текущего пользователя
   * PUT /api/auth/profile
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { name, email, avatar } = req.body;

      // Проверка, не занят ли email другим пользователем
      if (email && email !== req.user.email) {
        const existingUser = await prisma.users.findFirst({
          where: {
            email,
            NOT: { id: req.user.id }
          }
        });

        if (existingUser) {
          res.status(400).json(createErrorResponse('Email уже используется'));
          return;
        }
      }

      const user = await prisma.users.update({
        where: { id: req.user.id },
        data: { name, email, avatar },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });

      res.json(createSuccessResponse({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      }));

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении профиля'));
    }
  }
}