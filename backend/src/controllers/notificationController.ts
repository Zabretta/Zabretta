// backend/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class NotificationController {
  
  // ===== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ =====

  /**
   * GET /api/notifications
   * Получить уведомления текущего пользователя
   */
  static async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      const { type, read, page, limit } = req.query;
      
      const typeArray = type 
        ? (type as string).split(',').map(t => t.toUpperCase()) as any
        : undefined;

      const filters = {
        userId: req.user.id,
        type: typeArray,
        read: read !== undefined ? read === 'true' : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20
      };

      const result = await NotificationService.getNotifications(filters);
      
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении уведомлений'));
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Получить количество непрочитанных уведомлений текущего пользователя
   */
  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      const count = await NotificationService.getUnreadCount(req.user.id);
      
      res.json(createSuccessResponse({ count }));
    } catch (error) {
      console.error('Ошибка получения количества уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении количества уведомлений'));
    }
  }

  /**
   * POST /api/notifications/:id/read
   * Отметить своё уведомление как прочитанное
   */
  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      const { id } = req.params;
      
      await NotificationService.markAsRead(req.user.id, id);
      
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      console.error('Ошибка при отметке уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при отметке уведомления'));
    }
  }

  /**
   * POST /api/notifications/read-all
   * Отметить все свои уведомления как прочитанные
   */
  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      await NotificationService.markAllAsRead(req.user.id);
      
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при отметке всех уведомлений'));
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Удалить своё уведомление
   */
  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      const { id } = req.params;
      
      await NotificationService.delete(req.user.id, id);
      
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при удалении уведомления'));
    }
  }

  /**
   * GET /api/notifications/settings
   * Получить настройки уведомлений текущего пользователя
   */
  static async getSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      const settings = await NotificationService.getUserSettings(req.user.id);
      
      res.json(createSuccessResponse(settings));
    } catch (error) {
      console.error('Ошибка получения настроек уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении настроек'));
    }
  }

  /**
   * PUT /api/notifications/settings
   * Обновить настройки уведомлений текущего пользователя
   */
  static async updateSettings(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(createErrorResponse('Требуется авторизация'));
      }

      const settings = await NotificationService.updateSettings(req.user.id, req.body);
      
      res.json(createSuccessResponse(settings));
    } catch (error) {
      console.error('Ошибка обновления настроек уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении настроек'));
    }
  }

  // ===== МЕТОДЫ ДЛЯ АДМИНИСТРАТОРОВ =====

  /**
   * GET /api/admin/notifications
   * Получить все уведомления (с фильтрацией)
   */
  static async getAllNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(createErrorResponse('Доступ запрещён'));
      }

      const { userId, type, read, page, limit, startDate, endDate } = req.query;
      
      const typeArray = type 
        ? (type as string).split(',').map(t => t.toUpperCase()) as any
        : undefined;

      const filters = {
        userId: userId as string,
        type: typeArray,
        read: read !== undefined ? read === 'true' : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const result = await NotificationService.getNotifications(filters);
      
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении уведомлений'));
    }
  }

  /**
   * POST /api/admin/notifications
   * Создать уведомление для конкретного пользователя
   */
  static async createNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(createErrorResponse('Доступ запрещён'));
      }

      const { userId, type, title, message, link } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json(createErrorResponse('Не все обязательные поля заполнены'));
      }

      const notification = await NotificationService.create({
        userId,
        type: type.toUpperCase(),
        title,
        message,
        link
      });
      
      res.json(createSuccessResponse(notification));
    } catch (error) {
      console.error('Ошибка создания уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при создании уведомления'));
    }
  }

  /**
   * POST /api/admin/notifications/bulk
   * Массовая рассылка уведомлений
   */
  static async sendBulkNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(createErrorResponse('Доступ запрещён'));
      }

      const { userIds, all, type, title, message, link } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json(createErrorResponse('Не все обязательные поля заполнены'));
      }

      if (!all && (!userIds || userIds.length === 0)) {
        return res.status(400).json(createErrorResponse('Нужно указать получателей'));
      }

      const result = await NotificationService.createBulk({
        userIds,
        all,
        type: type.toUpperCase(),
        title,
        message,
        link
      });
      
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('Ошибка массовой рассылки:', error);
      res.status(500).json(createErrorResponse('Ошибка при массовой рассылке'));
    }
  }

  /**
   * GET /api/admin/notifications/stats
   * Получить статистику по уведомлениям
   */
  static async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(createErrorResponse('Доступ запрещён'));
      }

      const stats = await NotificationService.getStats();
      
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики'));
    }
  }

  /**
   * DELETE /api/admin/notifications/:id
   * Удалить любое уведомление (админский метод)
   */
  static async deleteAsAdmin(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json(createErrorResponse('Доступ запрещён'));
      }

      const { id } = req.params;
      
      await NotificationService.deleteAsAdmin(id);
      
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
      res.status(500).json(createErrorResponse('Ошибка при удалении уведомления'));
    }
  }
}
