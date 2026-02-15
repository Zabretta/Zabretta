// backend/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class NotificationController {
  /**
   * Получить все уведомления
   * GET /api/admin/notifications
   */
  static async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const notifications = await NotificationService.getNotifications(req.user.id);
      res.json(createSuccessResponse(notifications));
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении уведомлений'));
    }
  }

  /**
   * Получить количество непрочитанных
   * GET /api/admin/notifications/unread/count
   */
  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const count = await NotificationService.getUnreadCount(req.user.id);
      res.json(createSuccessResponse({ count }));
    } catch (error) {
      console.error('Ошибка при получении количества уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении количества уведомлений'));
    }
  }

  /**
   * Отметить уведомление как прочитанное
   * PUT /api/admin/notifications/:id/read
   */
  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Неверный идентификатор уведомления'));
        return;
      }

      const notification = await NotificationService.markAsRead(id, req.user.id);
      res.json(createSuccessResponse(notification));
    } catch (error) {
      console.error('Ошибка при отметке уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении уведомления'));
    }
  }

  /**
   * Пометить все уведомления как прочитанные
   * PUT /api/admin/notifications/read-all
   */
  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const result = await NotificationService.markAllAsRead(req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении уведомлений'));
    }
  }

  /**
   * Создать новое уведомление (для тестирования)
   * POST /api/admin/notifications
   */
  static async createNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { text, type, link } = req.body;

      if (!text) {
        res.status(400).json(createErrorResponse('Текст уведомления обязателен'));
        return;
      }

      const notification = await NotificationService.createNotification({
        userId: req.user.id,
        text,
        type: type || 'SYSTEM',
        link,
      });

      res.json(createSuccessResponse(notification));
    } catch (error) {
      console.error('Ошибка при создании уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при создании уведомления'));
    }
  }

  /**
   * Удалить уведомление
   * DELETE /api/admin/notifications/:id
   */
  static async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('Неверный идентификатор уведомления'));
        return;
      }

      const result = await NotificationService.deleteNotification(id, req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при удалении уведомления'));
    }
  }

  /**
   * Удалить все уведомления
   * DELETE /api/admin/notifications
   */
  static async deleteAllNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const result = await NotificationService.deleteAllNotifications(req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка при удалении всех уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при удалении уведомлений'));
    }
  }
}