// backend/src/controllers/ratingController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RatingService } from '../services/ratingService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class RatingController {
  static async getUserRating(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const rating = await RatingService.getUserRating(userId);
      res.json(createSuccessResponse(rating));
    } catch (error) {
      if (error instanceof Error && error.message === 'Пользователь не найден') {
        res.status(404).json(createErrorResponse(error.message));
      } else {
        res.status(500).json(createErrorResponse('Ошибка при получении рейтинга пользователя'));
      }
    }
  }

  static async getAllRatings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const params = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as 'rating_desc' | 'rating_asc' | 'activity_desc' | 'activity_asc'
      };
      
      const result = await RatingService.getAllUserRatings(params);
      res.json(createSuccessResponse(result));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении рейтингов'));
    }
  }

  static async getRatingAdjustments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const params = {
        userId: req.query.userId as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };
      
      const result = await RatingService.getRatingAdjustments(params);
      res.json(createSuccessResponse(result));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении корректировок рейтинга'));
    }
  }

  static async getRatingLevels(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await RatingService.getRatingLevels();
      res.json(createSuccessResponse(result));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении уровней рейтинга'));
    }
  }

  static async getCurrentUserRating(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      const rating = await RatingService.getUserRating(req.user.id);
      res.json(createSuccessResponse(rating));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении рейтинга текущего пользователя'));
    }
  }

  static async getUserRatingStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const [rating, adjustments] = await Promise.all([
        RatingService.getUserRating(userId),
        RatingService.getRatingAdjustments({ userId, limit: 10 })
      ]);
      
      res.json(createSuccessResponse({
        rating,
        recentAdjustments: adjustments.adjustments,
        adjustmentStats: adjustments.summary
      }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении статистики рейтинга'));
    }
  }

  static async getRatingDistribution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const allRatings = await RatingService.getAllUserRatings({ limit: 1000 });
      
      const distribution = {
        totalUsers: allRatings.ratings.length,
        byRatingLevel: {} as Record<string, number>,
        byActivityLevel: {} as Record<string, number>,
        averageRating: allRatings.averageRating,
        averageActivity: allRatings.averageActivity,
        top10: allRatings.ratings.slice(0, 10),
        bottom10: allRatings.ratings.slice(-10).reverse()
      };
      
      // Распределение по уровням рейтинга
      const ratingLevels = [
        { name: 'Студент', min: 0, max: 200 },
        { name: 'Инженер', min: 201, max: 500 },
        { name: 'Инженер-конструктор', min: 501, max: 1000 },
        { name: 'Профессор Сомоделкин', min: 1001, max: 2000 },
        { name: 'Эксперт сообщества', min: 2001, max: Infinity }
      ];
      
      ratingLevels.forEach(level => {
        distribution.byRatingLevel[level.name] = allRatings.ratings.filter(
          r => r.totalRating >= level.min && r.totalRating <= level.max
        ).length;
      });
      
      // Распределение по уровням активности
      const activityLevels = [
        { name: 'Новичок', min: 0, max: 100 },
        { name: 'Активный', min: 101, max: 300 },
        { name: 'Очень активный', min: 301, max: 600 },
        { name: 'Лидер активности', min: 601, max: 1000 },
        { name: 'Легенда сообщества', min: 1001, max: Infinity }
      ];
      
      activityLevels.forEach(level => {
        distribution.byActivityLevel[level.name] = allRatings.ratings.filter(
          r => r.totalActivity >= level.min && r.totalActivity <= level.max
        ).length;
      });
      
      res.json(createSuccessResponse(distribution));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при получении распределения рейтинга'));
    }
  }

  static async searchUsersByRating(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { minRating, maxRating, minActivity, maxActivity, search } = req.query;
      
      const allRatings = await RatingService.getAllUserRatings({ limit: 1000 });
      
      let filtered = allRatings.ratings;
      
      if (minRating) {
        filtered = filtered.filter(r => r.totalRating >= Number(minRating));
      }
      
      if (maxRating) {
        filtered = filtered.filter(r => r.totalRating <= Number(maxRating));
      }
      
      if (minActivity) {
        filtered = filtered.filter(r => r.totalActivity >= Number(minActivity));
      }
      
      if (maxActivity) {
        filtered = filtered.filter(r => r.totalActivity <= Number(maxActivity));
      }
      
      if (search) {
        const searchLower = search.toString().toLowerCase();
        // Здесь нужен дополнительный запрос к пользователям для поиска по имени
        // Временно возвращаем без фильтрации по поиску
      }
      
      res.json(createSuccessResponse({
        users: filtered,
        total: filtered.length,
        averageRating: filtered.reduce((sum, r) => sum + r.totalRating, 0) / filtered.length || 0,
        averageActivity: filtered.reduce((sum, r) => sum + r.totalActivity, 0) / filtered.length || 0
      }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при поиске пользователей по рейтингу'));
    }
  }

  /**
   * НОВЫЙ МЕТОД: Начислить баллы пользователю за действие
   * POST /api/rating/award
   * Доступен только авторизованным пользователям
   */
  static async awardPoints(req: AuthRequest, res: Response): Promise<void> {
    try {
      // 1. Проверяем авторизацию
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      // 2. Получаем данные из тела запроса
      const { action, targetId, section } = req.body;

      // 3. Валидация обязательных полей
      if (!action) {
        res.status(400).json(createErrorResponse('Не указано действие (action)'));
        return;
      }

      // 4. Вызываем сервис для начисления баллов
      const result = await RatingService.awardPoints(
        req.user.id,
        action,
        targetId,
        section
      );

      // 5. Возвращаем результат
      if (result.awarded) {
        res.json(createSuccessResponse({
          awarded: true,
          ratingChange: result.ratingChange,
          activityChange: result.activityChange,
          message: result.message
        }));
      } else {
        // Если не начислено (например, уже получали сегодня), возвращаем 200 с флагом awarded: false
        res.json(createSuccessResponse({
          awarded: false,
          ratingChange: 0,
          activityChange: 0,
          message: result.message
        }));
      }

    } catch (error) {
      console.error('[RatingController] Ошибка при начислении баллов:', error);
      res.status(500).json(createErrorResponse('Ошибка при начислении баллов'));
    }
  }

  /**
   * НОВЫЙ МЕТОД: Получить историю начислений текущего пользователя
   * GET /api/rating/my-history
   */
  static async getMyRatingHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const adjustments = await RatingService.getRatingAdjustments({
        userId: req.user.id,
        limit: 50 // Последние 50 записей
      });

      res.json(createSuccessResponse(adjustments));

    } catch (error) {
      console.error('[RatingController] Ошибка при получении истории:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении истории начислений'));
    }
  }

  /**
   * НОВЫЙ МЕТОД: Проверить, был ли сегодня бонус за вход
   * GET /api/rating/check-daily-bonus
   */
  static async checkDailyBonus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      // Получаем пользователя с его последним входом
      const user = await prisma.users.findUnique({
        where: { id: req.user.id },
        select: { lastLogin: true }
      });

      if (!user) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }

      const today = new Date().toDateString();
      const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toDateString() : null;

      // Проверяем, были ли сегодня начисления за вход
      const todayAdjustments = await prisma.rating_adjustments.findMany({
        where: {
          userId: req.user.id,
          reason: { contains: 'Ежедневный вход' },
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      res.json(createSuccessResponse({
        canGetBonus: lastLoginDate !== today && todayAdjustments.length === 0,
        lastLogin: user.lastLogin,
        alreadyReceived: todayAdjustments.length > 0
      }));

    } catch (error) {
      console.error('[RatingController] Ошибка при проверке бонуса:', error);
      res.status(500).json(createErrorResponse('Ошибка при проверке бонуса'));
    }
  }
}

// 👇 ИМПОРТ ДЛЯ ПОСЛЕДНЕГО МЕТОДА
import { prisma } from '../config/database';
