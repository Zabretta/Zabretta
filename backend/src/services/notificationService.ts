// backend/src/services/notificationService.ts
import { prisma } from '../config/database';
import { NotificationType } from '@prisma/client';

// Типы для создания уведомлений
export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Типы для массовой рассылки
export interface BulkNotificationData {
  userIds?: string[];
  all?: boolean;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Фильтры для получения уведомлений
export interface NotificationFilters {
  userId?: string;
  type?: NotificationType[];
  read?: boolean;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export class NotificationService {
  
  // ===== ОСНОВНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С УВЕДОМЛЕНИЯМИ =====

  /**
   * Создать одно уведомление
   */
  static async create(data: CreateNotificationData) {
    const notification = await prisma.userNotification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link
      }
    });
    
    return notification;
  }

  /**
   * Создать уведомления для нескольких пользователей (массовая рассылка)
   */
  static async createBulk(data: BulkNotificationData) {
    let userIds: string[] = [];
    
    if (data.all) {
      // Всем пользователям
      const users = await prisma.users.findMany({
        where: { isActive: true },
        select: { id: true }
      });
      userIds = users.map(u => u.id);
    } else if (data.userIds) {
      userIds = data.userIds;
    }

    if (userIds.length === 0) {
      return { count: 0 };
    }

    const notifications = userIds.map(userId => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link
    }));

    const result = await prisma.userNotification.createMany({
      data: notifications
    });

    return { count: result.count };
  }

  /**
   * Получить уведомления с фильтрацией
   */
  static async getNotifications(filters: NotificationFilters) {
    const { userId, type, read, page = 1, limit = 20, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (type && type.length > 0) {
      where.type = { in: type };
    }
    
    if (read !== undefined) {
      where.read = read;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [notifications, total] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              login: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.userNotification.count({ where })
    ]);

    const unreadCount = userId ? await this.getUnreadCount(userId) : 0;

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Получить количество непрочитанных уведомлений для пользователя
   */
  static async getUnreadCount(userId: string) {
    return prisma.userNotification.count({
      where: { userId, read: false }
    });
  }

  /**
   * Отметить уведомление как прочитанное
   */
  static async markAsRead(userId: string, notificationId: string) {
    return prisma.userNotification.updateMany({
      where: { 
        id: notificationId,
        userId 
      },
      data: { 
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Отметить все уведомления пользователя как прочитанные
   */
  static async markAllAsRead(userId: string) {
    return prisma.userNotification.updateMany({
      where: { 
        userId,
        read: false 
      },
      data: { 
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Удалить уведомление
   */
  static async delete(userId: string, notificationId: string) {
    return prisma.userNotification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
  }

  /**
   * Удалить уведомление (админский метод - можно удалять любые)
   */
  static async deleteAsAdmin(notificationId: string) {
    return prisma.userNotification.delete({
      where: { id: notificationId }
    });
  }

  // ===== МЕТОДЫ ДЛЯ НАСТРОЕК УВЕДОМЛЕНИЙ =====

  /**
   * Получить настройки уведомлений пользователя
   */
  static async getUserSettings(userId: string) {
    let settings = await prisma.notificationSetting.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.notificationSetting.create({
        data: { userId }
      });
    }

    return settings;
  }

  /**
   * Обновить настройки уведомлений
   */
  static async updateSettings(userId: string, data: any) {
    return prisma.notificationSetting.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data }
    });
  }

  // ===== МЕТОДЫ ДЛЯ АДМИНКИ (СТАТИСТИКА) =====

  /**
   * Получить статистику по уведомлениям
   */
  static async getStats() {
    const [total, unread, byType, recentActivity] = await Promise.all([
      prisma.userNotification.count(),
      prisma.userNotification.count({ where: { read: false } }),
      prisma.userNotification.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count 
        FROM user_notifications 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    ]);

    const typeStats: Record<string, number> = {};
    byType.forEach(item => {
      typeStats[item.type] = item._count;
    });

    return {
      total,
      unread,
      byType: typeStats,
      recentActivity
    };
  }
}
