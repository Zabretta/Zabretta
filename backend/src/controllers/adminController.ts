import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AdminService } from '../services/adminService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { 
  GetAdminUsersParams, 
  GetAdminAuditLogsParams,
  GetMarketModerationParams,
  ModerateMarketItemData,
  UpdateMarketItemData 
} from '../types/api';
import { UserUpdateRequest, RatingAdjustmentRequest, BulkUpdateUsersRequest, ResetPasswordRequest } from '../types/admin';

export class AdminController {
  // ===== СУЩЕСТВУЮЩИЕ МЕТОДЫ =====
  
  static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const params: GetAdminUsersParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string,
        role: req.query.role as string,
        sortBy: req.query.sortBy as string
      };
      
      const result = await AdminService.getAdminUsers(params);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('❌ Ошибка в getUsers:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении пользователей'));
    }
  }

  static async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const users = await AdminService.getAdminUsers({ search: userId, limit: 1 });
      
      if (users.users.length === 0) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      
      res.json(createSuccessResponse(users.users[0]));
    } catch (error) {
      console.error('❌ Ошибка в getUserById:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении пользователя'));
    }
  }

  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updates: UserUpdateRequest = req.body;
      
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      const user = await AdminService.updateUser(userId, updates, req.user.id);
      res.json(createSuccessResponse(user));
    } catch (error) {
      console.error('❌ Ошибка в updateUser:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении пользователя'));
    }
  }

  static async adjustRating(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adjustment: RatingAdjustmentRequest = req.body;
      
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      const result = await AdminService.adjustUserRating(adjustment, req.user.id);
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('❌ Ошибка в adjustRating:', error);
      res.status(500).json(createErrorResponse('Ошибка при корректировке рейтинга'));
    }
  }

  static async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getAdminStats();
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('❌ Ошибка в getStats:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики'));
    }
  }

  static async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const params: GetAdminAuditLogsParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        userId: req.query.userId as string,
        action: req.query.action as string
      };
      
      const logs = await AdminService.getAuditLogs(params);
      res.json(createSuccessResponse(logs));
    } catch (error) {
      console.error('❌ Ошибка в getAuditLogs:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении аудит-логов'));
    }
  }

  static async bulkUpdateUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userIds, updates }: BulkUpdateUsersRequest = req.body;
      
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      const results = [];
      for (const userId of userIds) {
        try {
          const user = await AdminService.updateUser(userId, updates, req.user.id);
          results.push({ userId, success: true, user });
        } catch (error) {
          results.push({ userId, success: false, error: 'Ошибка обновления' });
        }
      }
      
      res.json(createSuccessResponse({ results }));
    } catch (error) {
      console.error('❌ Ошибка в bulkUpdateUsers:', error);
      res.status(500).json(createErrorResponse('Ошибка при массовом обновлении'));
    }
  }

  static async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId, sendEmail, generateTemporaryPassword }: ResetPasswordRequest = req.body;
      
      // Временная реализация
      res.json(createSuccessResponse({
        success: true,
        emailSent: sendEmail || false,
        message: 'Ссылка для сброса пароля отправлена на email'
      }));
    } catch (error) {
      console.error('❌ Ошибка в resetPassword:', error);
      res.status(500).json(createErrorResponse('Ошибка при сбросе пароля'));
    }
  }

  static async toggleUserBlock(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      if (!req.user) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      // Получаем текущего пользователя
      const users = await AdminService.getAdminUsers({ search: userId, limit: 1 });
      if (users.users.length === 0) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      
      const currentUser = users.users[0];
      const updates: UserUpdateRequest = {
        isActive: !currentUser.isActive
      };
      
      const user = await AdminService.updateUser(userId, updates, req.user.id);
      res.json(createSuccessResponse({
        success: true,
        newStatus: user.isActive,
        user
      }));
    } catch (error) {
      console.error('❌ Ошибка в toggleUserBlock:', error);
      res.status(500).json(createErrorResponse('Ошибка при блокировке пользователя'));
    }
  }

  // ===== 🔥 НОВЫЕ МЕТОДЫ ДЛЯ МОДЕРАЦИИ ОБЪЯВЛЕНИЙ =====

  /**
   * GET /api/admin/market/moderation
   * Получить объявления для модерации
   */
  static async getMarketItemsForModeration(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/admin/market/moderation - Запрос получен');
      console.log('🔍 Query параметры:', req.query);

      if (!req.user) {
        console.warn('⚠️ Попытка доступа к модерации без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const params: GetMarketModerationParams = {
        status: req.query.status as any,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      };

      console.log('📊 Параметры модерации:', params);

      const result = await AdminService.getMarketItemsForModeration(params);
      
      console.log(`✅ Загружено ${result.items.length} объявлений на модерацию`);
      
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('❌ Ошибка в getMarketItemsForModeration:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении объявлений на модерацию'));
    }
  }

  /**
   * GET /api/admin/market/moderation/:id
   * Получить объявление для модерации по ID
   */
  static async getMarketItemForModeration(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.log(`📥 GET /api/admin/market/moderation/${id} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка доступа к модерации без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const item = await AdminService.getMarketItemForModeration(id);
      
      console.log(`✅ Объявление ${id} загружено для модерации`);
      
      res.json(createSuccessResponse(item));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      
      console.error('❌ Ошибка в getMarketItemForModeration:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении объявления'));
    }
  }

  /**
   * POST /api/admin/market/moderation/:id
   * Отмодерировать объявление (одобрить/отклонить)
   */
  static async moderateMarketItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ModerateMarketItemData = req.body;
      
      console.log(`📥 POST /api/admin/market/moderation/${id} - Запрос получен`);
      console.log('📦 Данные модерации:', data);

      if (!req.user) {
        console.warn('⚠️ Попытка модерации без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      if (!data.status || !['APPROVED', 'REJECTED'].includes(data.status)) {
        console.warn('⚠️ Некорректный статус модерации:', data.status);
        res.status(400).json(createErrorResponse('Некорректный статус модерации'));
        return;
      }

      const result = await AdminService.moderateMarketItem(
        id, 
        data, 
        req.user.id, 
        req.user.login
      );
      
      console.log(`✅ Объявление ${id} отмодерировано со статусом: ${data.status}`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      
      console.error('❌ Ошибка в moderateMarketItem:', error);
      res.status(500).json(createErrorResponse('Ошибка при модерации объявления'));
    }
  }

  /**
   * PUT /api/admin/market/items/:id
   * Обновить объявление (перед одобрением)
   */
  static async updateMarketItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateMarketItemData = req.body;
      
      console.log(`📥 PUT /api/admin/market/items/${id} - Запрос получен`);
      console.log('📦 Данные обновления:', data);

      if (!req.user) {
        console.warn('⚠️ Попытка обновления объявления без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      // Базовая валидация
      if (data.title && data.title.length < 5) {
        res.status(400).json(createErrorResponse('Название должно содержать минимум 5 символов'));
        return;
      }
      
      if (data.description && data.description.length < 20) {
        res.status(400).json(createErrorResponse('Описание должно содержать минимум 20 символов'));
        return;
      }

      const result = await AdminService.updateMarketItem(
        id, 
        data, 
        req.user.id, 
        req.user.login
      );
      
      console.log(`✅ Объявление ${id} обновлено модератором`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      
      console.error('❌ Ошибка в updateMarketItem:', error);
      res.status(500).json(createErrorResponse('Ошибка при обновлении объявления'));
    }
  }

  /**
   * GET /api/admin/market/moderation/stats
   * Получить статистику модерации
   */
  static async getMarketModerationStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/admin/market/moderation/stats - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка доступа к статистике без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const stats = await AdminService.getMarketModerationStats();
      
      console.log('✅ Статистика модерации:', stats);
      
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('❌ Ошибка в getMarketModerationStats:', error);
      res.status(500).json(createErrorResponse('Ошибка при получении статистики модерации'));
    }
  }
}