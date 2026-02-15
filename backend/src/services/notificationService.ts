// backend/src/services/notificationService.ts
import { prisma } from '../config/database';

export interface CreateNotificationData {
  userId: string;
  text: string;
  type?: 'SYSTEM' | 'USER' | 'WARNING' | 'SUCCESS';
  link?: string;
}

export class NotificationService {
  /**
   * Получение уведомлений для администратора
   */
  static async getNotifications(adminId: string) {
    const notifications = await prisma.notifications.findMany({
      where: { userId: adminId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return notifications.map((n: any) => ({
      id: n.id,
      text: n.text,
      time: this.formatTime(n.createdAt),
      read: n.read,
      type: n.type.toLowerCase(),
      link: n.link || undefined,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  /**
   * Получение количества непрочитанных уведомлений
   */
  static async getUnreadCount(adminId: string): Promise<number> {
    return prisma.notifications.count({
      where: {
        userId: adminId,
        read: false,
      },
    });
  }

  /**
   * Отметить уведомление как прочитанное
   */
  static async markAsRead(id: number, adminId: string) {
    const notification = await prisma.notifications.update({
      where: {
        id,
        userId: adminId,
      },
      data: { read: true },
    });

    return {
      id: notification.id,
      text: notification.text,
      time: this.formatTime(notification.createdAt),
      read: notification.read,
      type: notification.type.toLowerCase(),
      link: notification.link || undefined,
    };
  }

  /**
   * Пометить все уведомления как прочитанные
   */
  static async markAllAsRead(adminId: string) {
    const result = await prisma.notifications.updateMany({
      where: {
        userId: adminId,
        read: false,
      },
      data: { read: true },
    });

    return { updatedCount: result.count };
  }

  /**
   * Создать новое уведомление - ИСПРАВЛЕНО с updatedAt
   */
  static async createNotification(data: CreateNotificationData) {
    const now = new Date();
    const notification = await prisma.notifications.create({
      data: {
        userId: data.userId,
        text: data.text,
        type: data.type || 'SYSTEM',
        link: data.link,
        read: false,
        createdAt: now,
        updatedAt: now,  // ← ЯВНО ДОБАВЛЯЕМ updatedAt
      },
    });

    return {
      id: notification.id,
      text: notification.text,
      time: this.formatTime(notification.createdAt),
      read: notification.read,
      type: notification.type.toLowerCase(),
      link: notification.link || undefined,
    };
  }

  /**
   * Удалить уведомление
   */
  static async deleteNotification(id: number, adminId: string) {
    await prisma.notifications.delete({
      where: {
        id,
        userId: adminId,
      },
    });

    return { success: true };
  }

  /**
   * Удалить все уведомления администратора
   */
  static async deleteAllNotifications(adminId: string) {
    const result = await prisma.notifications.deleteMany({
      where: { userId: adminId },
    });

    return { deletedCount: result.count };
  }

  /**
   * Форматирование времени в удобочитаемый формат
   */
  private static formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'только что';
    if (diffMin < 60) return `${diffMin} мин назад`;
    if (diffHour < 24) return `${diffHour} ч назад`;
    if (diffDay < 7) return `${diffDay} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  }
}