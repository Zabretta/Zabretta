// backend/src/controllers/statsController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StatsService } from '../services/statsService'; // <-- ИМПОРТ СЕРВИСА
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class StatsController {
  /**
   * Получение общей статистики системы
   * GET /api/stats/system
   */
  static async getSystemStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Вся логика перенесена в сервис
      const stats = await StatsService.getSystemStats();
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики системы'));
    }
  }

  /**
   * Получение статистики по дням
   * GET /api/stats/daily?days=7
   */
  static async getDailyStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const days = req.query.days ? Number(req.query.days) : 7;
      // Вся логика перенесена в сервис
      const stats = await StatsService.getDailyStats(days);
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('Daily stats error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении ежедневной статистики'));
    }
  }

  /**
   * Получение статистики по контенту
   * GET /api/stats/content
   */
  static async getContentStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Вся логика перенесена в сервис
      const stats = await StatsService.getContentStats();
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('Content stats error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики контента'));
    }
  }

  /**
   * Получение статистики активности пользователя
   * GET /api/stats/users/:userId
   */
  static async getUserActivityStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Вся логика перенесена в сервис
      const stats = await StatsService.getUserActivityStats(userId);
      res.json(createSuccessResponse(stats));
      
    } catch (error: any) {
      // Специальная обработка ошибки "Пользователь не найден"
      if (error.message === 'Пользователь не найден') {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      
      console.error('User activity stats error:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики активности пользователя'));
    }
  }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  