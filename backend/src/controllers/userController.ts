// backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/userService';
import { prisma } from '../config/database';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export class UserController {
  /**
   * Получение данных текущего пользователя
   * GET /api/user/me
   */
  static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const userProfile = await UserService.getUserProfile(req.user.id);
      res.json(createSuccessResponse(userProfile));
      
    } catch (error: any) {
      if (error.message === 'Пользователь не найден') {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      console.error('Get current user error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении данных пользователя'));
    }
  }

  /**
   * Обновление профиля пользователя
   * PUT /api/user/me
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { name, avatar } = req.body;

      const updatedUser = await UserService.updateOwnProfile(req.user.id, {
        name,
        avatar
      });

      res.json(createSuccessResponse(updatedUser));
      
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении профиля'));
    }
  }

  /**
   * Изменение пароля
   * POST /api/user/change-password
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        res.status(400).json(createErrorResponse('Неверный текущий пароль'));
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash }
      });

      res.json(createSuccessResponse({ success: true, message: 'Пароль успешно изменен' }));
      
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json(createErrorResponse('Ошибка при изменении пароля'));
    }
  }

  /**
   * Удаление аккаунта пользователя
   * POST /api/user/delete-account
   */
  static async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { confirmation } = req.body;

      // Проверка подтверждения (нужно ввести логин)
      if (!confirmation || confirmation !== req.user.login) {
        res.status(400).json(createErrorResponse('Подтверждение не совпадает с логином'));
        return;
      }

      // Вместо полного удаления - деактивируем аккаунт
      await prisma.user.update({
        where: { id: req.user.id },
        data: { 
          isActive: false,
          // Опционально: можно заменить email и логин на анонимные
          // email: `deleted_${req.user.id}@deleted.com`,
          // login: `deleted_user_${req.user.id}`
        }
      });

      res.json(createSuccessResponse({ 
        success: true, 
        message: 'Аккаунт успешно деактивирован' 
      }));
      
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json(createErrorResponse('Ошибка при удалении аккаунта'));
    }
  }

  /**
   * Получение контента пользователя с фильтрацией
   * GET /api/user/content?type=PROJECT&status=ACTIVE&page=1&limit=10
   */
  static async getUserContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { type, status, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { userId: req.user.id };
      
      if (type) where.type = type;
      if (status) where.status = status;

      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            category: true,
            status: true,
            views: true,
            likes: true,
            comments: true,
            rating: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.content.count({ where })
      ]);

      res.json(createSuccessResponse({
        content: content.map((item: any) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt?.toISOString()
        })),
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }));
      
    } catch (error) {
      console.error('Get user content error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении контента пользователя'));
    }
  }

  /**
   * Получение активности пользователя за период
   * GET /api/user/activity?days=30
   */
  static async getUserActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { days = 30 } = req.query;
      const activity = [];

      for (let i = Number(days) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));

        const [contentCreated, ratingChanges] = await Promise.all([
          prisma.content.count({
            where: {
              userId: req.user.id,
              createdAt: { gte: start, lt: end }
            }
          }),
          prisma.ratingAdjustment.count({
            where: {
              userId: req.user.id,
              timestamp: { gte: start, lt: end }
            }
          })
        ]);

        activity.push({
          date: start.toISOString().split('T')[0],
          contentCreated,
          ratingChanges,
          totalActivity: contentCreated + ratingChanges
        });
      }

      res.json(createSuccessResponse({
        period: `${days} дней`,
        activity,
        summary: {
          totalContent: activity.reduce((sum: number, day: any) => sum + day.contentCreated, 0),
          totalRatingChanges: activity.reduce((sum: number, day: any) => sum + day.ratingChanges, 0),
          averageDailyActivity: activity.reduce((sum: number, day: any) => sum + day.totalActivity, 0) / activity.length
        }
      }));
      
    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении активности пользователя'));
    }
  }

  /**
   * Получение статистики пользователя
   * GET /api/user/stats
   */
  static async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const stats = await UserService.getUserStats(req.user.id);
      res.json(createSuccessResponse(stats));
      
    } catch (error: any) {
      if (error.message === 'Пользователь не найден') {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      console.error('Get user stats error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики пользователя'));
    }
  }

  /**
   * Поиск пользователей
   * GET /api/user/search?q=query&limit=10
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.json(createSuccessResponse([]));
        return;
      }

      const users = await UserService.searchUsers(q, Number(limit));
      res.json(createSuccessResponse(users));
      
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json(createErrorResponse('Ошибка при поиске пользователей'));
    }
  }

  /**
   * Проверка существования пользователя (при регистрации)
   * POST /api/user/check-exists
   */
  static async checkExists(req: Request, res: Response): Promise<void> {
    try {
      const { email, login } = req.body;
      
      if (!email && !login) {
        res.status(400).json(createErrorResponse('Не указан email или логин'));
        return;
      }

      const result = await UserService.checkUserExists(email, login);
      res.json(createSuccessResponse(result));
      
    } catch (error) {
      console.error('Check user exists error:', error);
      res.status(500).json(createErrorResponse('Ошибка при проверке пользователя'));
    }
  }

  /**
   * Публичный профиль пользователя
   * GET /api/user/:userId
   */
  static async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const userProfile = await UserService.getUserProfile(userId);
      
      const publicProfile = {
        id: userProfile.id,
        login: userProfile.login,
        name: userProfile.name,
        avatar: userProfile.avatar,
        rating: userProfile.rating,
        activityPoints: userProfile.activityPoints,
        createdAt: userProfile.createdAt,
        lastLogin: userProfile.lastLogin,
        content: userProfile.content
      };

      res.json(createSuccessResponse(publicProfile));
      
    } catch (error: any) {
      if (error.message === 'Пользователь не найден') {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      console.error('Get user profile error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении профиля пользователя'));
    }
  }
}
