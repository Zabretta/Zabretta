// backend/src/controllers/adminController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AdminService } from '../services/adminService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { GetAdminUsersParams, GetAdminAuditLogsParams } from '../types/api';
import { UserUpdateRequest, RatingAdjustmentRequest, BulkUpdateUsersRequest, ResetPasswordRequest } from '../types/admin';

export class AdminController {
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
      res.status(500).json(createErrorResponse('Ошибка при корректировке рейтинга'));
    }
  }

  static async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getAdminStats();
      res.json(createSuccessResponse(stats));
    } catch (error) {
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
      res.status(500).json(createErrorResponse('Ошибка при блокировке пользователя'));
    }
  }
}