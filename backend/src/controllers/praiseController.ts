// backend/src/controllers/praiseController.ts
import { Request, Response } from 'express';
import { PraiseService } from '../services/praiseService';
import { CreatePraiseRequest, GetPraisesParams } from '../types/api';

export class PraiseController {
  /**
   * Создать новую похвалу
   * POST /api/praise
   */
  static async createPraise(req: Request, res: Response) {
    try {
      // Получаем ID текущего пользователя из middleware аутентификации
      const fromUserId = (req as any).user?.id;
      
      if (!fromUserId) {
        return res.status(401).json({
          success: false,
          error: 'Не авторизован',
          timestamp: new Date().toISOString()
        });
      }

      const data: CreatePraiseRequest = req.body;

      // Валидация обязательных полей
      if (!data.toUserId) {
        return res.status(400).json({
          success: false,
          error: 'Не указан получатель похвалы',
          timestamp: new Date().toISOString()
        });
      }

      if (!data.praiseType) {
        return res.status(400).json({
          success: false,
          error: 'Не указан тип похвалы',
          timestamp: new Date().toISOString()
        });
      }

      // Валидация типа похвалы
      const validTypes = ['GREAT', 'EXCELLENT', 'MASTER', 'INSPIRING', 'CREATIVE', 'DETAILED', 'HELPFUL', 'THANKS'];
      if (!validTypes.includes(data.praiseType)) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный тип похвалы',
          timestamp: new Date().toISOString()
        });
      }

      // Создаем похвалу через сервис
      const result = await PraiseService.createPraise(fromUserId, data);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }

      // Возвращаем успешный результат
      return res.status(201).json({
        success: true,
        data: result.praise,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[PraiseController] Ошибка при создании похвалы:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Получить список похвал
   * GET /api/praise
   */
  static async getPraises(req: Request, res: Response) {
    try {
      const params: GetPraisesParams = {
        userId: req.query.userId as string,
        contentId: req.query.contentId as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      // Валидация page и limit
      if (params.page && params.page < 1) {
        return res.status(400).json({
          success: false,
          error: 'Номер страницы должен быть >= 1',
          timestamp: new Date().toISOString()
        });
      }

      if (params.limit && (params.limit < 1 || params.limit > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Лимит должен быть от 1 до 100',
          timestamp: new Date().toISOString()
        });
      }

      const praises = await PraiseService.getPraises(params);

      return res.status(200).json({
        success: true,
        data: praises,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[PraiseController] Ошибка при получении похвал:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Получить статистику похвал пользователя
   * GET /api/praise/stats/:userId
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Не указан ID пользователя',
          timestamp: new Date().toISOString()
        });
      }

      const stats = await PraiseService.getUserPraisesStats(userId);

      return res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[PraiseController] Ошибка при получении статистики:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Проверить, хвалил ли пользователь контент
   * GET /api/praise/check/:contentId
   */
  static async checkUserPraised(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { contentId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Не авторизован',
          timestamp: new Date().toISOString()
        });
      }

      if (!contentId) {
        return res.status(400).json({
          success: false,
          error: 'Не указан ID контента',
          timestamp: new Date().toISOString()
        });
      }

      const hasPraised = await PraiseService.hasUserPraisedContent(userId, contentId);

      return res.status(200).json({
        success: true,
        data: { hasPraised },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[PraiseController] Ошибка при проверке похвалы:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Удалить похвалу (только для админов)
   * DELETE /api/praise/:praiseId
   */
  static async deletePraise(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id;
      const { praiseId } = req.params;

      // Проверка прав администратора
      if ((req as any).user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Доступ запрещен. Требуются права администратора',
          timestamp: new Date().toISOString()
        });
      }

      if (!praiseId) {
        return res.status(400).json({
          success: false,
          error: 'Не указан ID похвалы',
          timestamp: new Date().toISOString()
        });
      }

      const result = await PraiseService.deletePraise(praiseId, adminId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: { message: 'Похвала успешно удалена' },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[PraiseController] Ошибка при удалении похвалы:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Получить похвалы текущего пользователя
   * GET /api/praise/me
   */
  static async getMyPraises(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Не авторизован',
          timestamp: new Date().toISOString()
        });
      }

      const params: GetPraisesParams = {
        userId,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const praises = await PraiseService.getPraises(params);

      return res.status(200).json({
        success: true,
        data: praises,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[PraiseController] Ошибка при получении своих похвал:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString()
      });
    }
  }
}
