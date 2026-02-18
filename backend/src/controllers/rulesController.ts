// backend/src/controllers/rulesController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RulesService } from '../services/rulesService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class RulesController {
  /**
   * GET /api/rules
   * Получить все правила
   */
  static async getRules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const rules = await RulesService.getRules();
      res.json(createSuccessResponse(rules));
    } catch (error) {
      console.error('Ошибка получения правил:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении правил'));
    }
  }

  /**
   * GET /api/rules/acceptance
   * Проверить, принял ли пользователь правила
   */
  static async checkAcceptance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const result = await RulesService.checkAcceptance(req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка проверки принятия правил:', error);
      res.status(500).json(createErrorResponse('Ошибка при проверке принятия правил'));
    }
  }

  /**
   * POST /api/rules/accept
   * Принять правила
   */
  static async acceptRules(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const result = await RulesService.acceptRules(req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка принятия правил:', error);
      res.status(500).json(createErrorResponse('Ошибка при принятии правил'));
    }
  }

  /**
   * POST /api/rules/reset
   * Сбросить принятие правил (для тестирования)
   */
  static async resetAcceptance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const result = await RulesService.resetAcceptance(req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка сброса принятия правил:', error);
      res.status(500).json(createErrorResponse('Ошибка при сбросе принятия правил'));
    }
  }

  /**
   * GET /api/rules/with-acceptance
   * Получить правила вместе со статусом принятия
   */
  static async getRulesWithAcceptance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const result = await RulesService.getRulesWithAcceptance(req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка получения правил со статусом:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении данных'));
    }
  }
}