// backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class UserController {
  static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const user = await prisma.user.findUnique({
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
      res.status(500).json(createErrorResponse('Ошибка при получении данных пользователя'));
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { name, email, avatar } = req.body;

      const user = await prisma.user.update({
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
      res.status(500).json(createErrorResponse('Ошибка при обновлении профиля'));
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Получаем текущего пользователя с паролем
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }

      // Проверяем текущий пароль
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        res.status(400).json(createErrorResponse('Неверный текущий пароль'));
        return;
      }

      // Хешируем новый пароль
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Обновляем пароль
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash }
      });

      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при изменении пароля'));
    }
  }

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
        content: content.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString()
        })),
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении контента пользователя'));
    }
  }

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
          totalContent: activity.reduce((sum, day) => sum + day.contentCreated, 0),
          totalRatingChanges: activity.reduce((sum, day) => sum + day.ratingChanges, 0),
          averageDailyActivity: activity.reduce((sum, day) => sum + day.totalActivity, 0) / activity.length
        }
      }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении активности пользователя'));
    }
  }

  static async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const [
        contentStats,
        ratingAdjustments,
        recentActivity,
        user
      ] = await Promise.all([
        prisma.content.groupBy({
          by: ['type', 'status'],
          _count: true,
          where: { userId: req.user.id }
        }),
        prisma.ratingAdjustment.findMany({
          where: { userId: req.user.id },
          orderBy: { timestamp: 'desc' },
          take: 5
        }),
        prisma.content.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            type: true,
            title: true,
            createdAt: true,
            views: true,
            likes: true,
            comments: true
          }
        }),
        prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            login: true,
            name: true,
            rating: true,
            activityPoints: true,
            totalPosts: true,
            violations: true,
            createdAt: true
          }
        })
      ]);

      const stats = {
        contentByType: {} as Record<string, number>,
        contentByStatus: {} as Record<string, number>,
        totalContent: 0
      };

      contentStats.forEach(stat => {
        stats.totalContent += stat._count;
        stats.contentByType[stat.type] = (stats.contentByType[stat.type] || 0) + stat._count;
        stats.contentByStatus[stat.status] = (stats.contentByStatus[stat.status] || 0) + stat._count;
      });

      res.json(createSuccessResponse({
        user: {
          ...user,
          createdAt: user?.createdAt.toISOString()
        },
        stats,
        recentRatingAdjustments: ratingAdjustments.map(adj => ({
          ...adj,
          timestamp: adj.timestamp.toISOString()
        })),
        recentActivity: recentActivity.map(act => ({
          ...act,
          createdAt: act.createdAt.toISOString()
        }))
      }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении статистики пользователя'));
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { confirmation } = req.body;

      if (confirmation !== req.user.login) {
        res.status(400).json(createErrorResponse('Подтверждение не совпадает с логином'));
        return;
      }

      // В реальном приложении здесь была бы мягкое удаление или деактивация
      await prisma.user.update({
        where: { id: req.user.id },
        data: { isActive: false }
      });

      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при удалении аккаунта'));
    }
  }
}