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

// ===== НОВЫЕ ТИПЫ ДЛЯ АДМИНСКОЙ ОТПРАВКИ =====

/**
 * Данные для отправки сообщения от администратора
 */
export interface AdminSendMessageData {
  type: 'SYSTEM';
  title: string;
  message: string;
  link?: string;
  userId?: string;      // для адресной отправки
  userLogin?: string;   // альтернативный способ
}

/**
 * Результат отправки сообщения
 */
export interface AdminSendMessageResult {
  success: boolean;
  recipientCount: number;
  message: string;
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

  // ===== НОВЫЕ МЕТОДЫ ДЛЯ АДМИНСКОЙ ОТПРАВКИ =====

  /**
   * Отправить сообщение конкретному пользователю (по ID или логину)
   * @param data - данные сообщения
   * @param adminId - ID администратора (для создания уведомления админу)
   */
  static async sendToUser(data: AdminSendMessageData, adminId: string): Promise<AdminSendMessageResult> {
    let userId = data.userId;

    // Если указан логин, ищем пользователя по логину
    if (!userId && data.userLogin) {
      const user = await prisma.users.findUnique({
        where: { login: data.userLogin },
        select: { id: true }
      });

      if (!user) {
        throw new Error(`Пользователь с логином "${data.userLogin}" не найден`);
      }
      userId = user.id;
    }

    if (!userId) {
      throw new Error('Не указан получатель (userId или userLogin)');
    }

    // Проверяем, что пользователь существует
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, login: true }
    });

    if (!user) {
      throw new Error(`Пользователь с ID "${userId}" не найден`);
    }

    // Создаем уведомление для получателя
    await prisma.userNotification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link
      }
    });

    // ✅ СОЗДАЕМ ОТДЕЛЬНОЕ УВЕДОМЛЕНИЕ ДЛЯ АДМИНА
    await prisma.userNotification.create({
      data: {
        userId: adminId,
        type: 'SYSTEM',
        title: '📨 Сообщение отправлено',
        message: `Вы отправили сообщение "${data.title}" пользователю ${user.login}`,
        link: '/admin/notifications'
      }
    });

    return {
      success: true,
      recipientCount: 1,
      message: `Сообщение отправлено пользователю ${user.login}`
    };
  }

  /**
   * Отправить сообщение всем пользователям (рассылка)
   * @param data - данные сообщения
   * @param adminId - ID администратора (для создания уведомления админу)
   */
  static async sendToAll(data: Omit<AdminSendMessageData, 'userId' | 'userLogin'>, adminId: string): Promise<AdminSendMessageResult> {
    // Получаем всех активных пользователей
    const users = await prisma.users.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    if (users.length === 0) {
      return {
        success: true,
        recipientCount: 0,
        message: 'Нет активных пользователей для рассылки'
      };
    }

    // Создаем уведомления для всех пользователей
    const notifications = users.map(user => ({
      userId: user.id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link
    }));

    await prisma.userNotification.createMany({
      data: notifications
    });

    // ✅ СОЗДАЕМ ОТДЕЛЬНОЕ УВЕДОМЛЕНИЕ ДЛЯ АДМИНА
    await prisma.userNotification.create({
      data: {
        userId: adminId,
        type: 'SYSTEM',
        title: '📢 Рассылка выполнена',
        message: `Вы отправили сообщение "${data.title}" ${users.length} пользователям`,
        link: '/admin/notifications'
      }
    });

    return {
      success: true,
      recipientCount: users.length,
      message: `Рассылка отправлена ${users.length} пользователям`
    };
  }

  /**
   * Поиск пользователей для адресной отправки
   */
  static async searchUsers(query: string, limit: number = 5) {
    return prisma.users.findMany({
      where: {
        OR: [
          { login: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        login: true,
        name: true,
        avatar: true
      },
      take: limit,
      orderBy: { login: 'asc' }
    });
  }

  // ===== МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ УВЕДОМЛЕНИЙ =====

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

  // ===== МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ УВЕДОМЛЕНИЯМИ =====

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
   * Получить все уведомления (для админки) - УСТАРЕЛО, используйте getNotifications с userId
   * @deprecated
   */
  static async getAllNotifications() {
    return prisma.userNotification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            login: true,
            name: true
          }
        }
      },
      take: 100 // Ограничиваем до 100 последних
    });
  }

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