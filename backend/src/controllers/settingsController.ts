// backend/src/controllers/settingsController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SettingsService, SettingsData } from '../services/settingsService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class SettingsController {
  /**
   * GET /api/settings
   */
  static async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const settings = await SettingsService.getSettings(req.user.id);
      res.json(createSuccessResponse(settings));
    } catch (error) {
      console.error('Ошибка получения настроек:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении настроек'));
    }
  }

  /**
   * PUT /api/settings
   */
  static async updateSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const data: Partial<SettingsData> = req.body;
      
      // Валидация
      if (data.brightness !== undefined && (data.brightness < 50 || data.brightness > 150)) {
        res.status(400).json(createErrorResponse('Яркость должна быть от 50 до 150'));
        return;
      }
      
      if (data.fontSize !== undefined && (data.fontSize < 75 || data.fontSize > 150)) {
        res.status(400).json(createErrorResponse('Размер шрифта должен быть от 75 до 150'));
        return;
      }

      const settings = await SettingsService.updateSettings(req.user.id, data);
      res.json(createSuccessResponse(settings));
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении настроек'));
    }
  }

  /**
   * POST /api/settings/sync
   */
  static async syncSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const clientSettings: SettingsData = req.body;
      const result = await SettingsService.syncSettings(req.user.id, clientSettings);
      
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка синхронизации настроек:', error);
      res.status(500).json(createErrorResponse('Ошибка при синхронизации настроек'));
    }
  }

  /**
   * POST /api/settings/reset
   */
  static async resetSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const settings = await SettingsService.resetSettings(req.user.id);
      res.json(createSuccessResponse(settings));
    } catch (error) {
      console.error('Ошибка сброса настроек:', error);
      res.status(500).json(createErrorResponse('Ошибка при сбросе настроек'));
    }
  }
}
