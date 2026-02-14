// backend/src/services/userService.ts
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

export class UserService {
  /**
   * Получение публичного профиля пользователя по ID
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        name: true,
        avatar: true,
        rating: true,
        activityPoints: true,
        createdAt: true,
        lastLogin: true,
        content: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            title: true,
            views: true,
            likes: true,
            comments: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      content: user.content.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      }))
    };
  }

  /**
   * Получение списка пользователей с фильтрацией и пагинацией
   */
  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    sortBy?: 'rating_desc' | 'rating_asc' | 'date_desc' | 'date_asc';
  }) {
    const { page = 1, limit = 20, search, role, sortBy = 'date_desc' } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { login: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'rating_desc':
        orderBy.rating = 'desc';
        break;
      case 'rating_asc':
        orderBy.rating = 'asc';
        break;
      case 'date_desc':
        orderBy.createdAt = 'desc';
        break;
      case 'date_asc':
        orderBy.createdAt = 'asc';
        break;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          login: true,
          name: true,
          avatar: true,
          role: true,
          rating: true,
          activityPoints: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              content: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
        totalPosts: user._count.content
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Обновление профиля пользователя (для самого пользователя)
   */
  static async updateOwnProfile(userId: string, data: {
    name?: string;
    avatar?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        login: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        rating: true,
        activityPoints: true,
        createdAt: true // <-- ИСПРАВЛЕНО: вместо updatedAt используем createdAt
      }
    });

    return {
      ...user,
      createdAt: user.createdAt.toISOString()
      // updatedAt убран, так как его нет в select
    };
  }

  /**
   * Получение статистики пользователя
   */
  static async getUserStats(userId: string) {
    const [user, contentStats, ratingHistory] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          login: true,
          name: true,
          rating: true,
          activityPoints: true,
          createdAt: true,
          lastLogin: true
        }
      }),
      prisma.content.groupBy({
        by: ['type'],
        _count: true,
        where: { userId }
      }),
      prisma.ratingAdjustment.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          reason: true,
          ratingChange: true,
          activityChange: true,
          timestamp: true,
          adminId: true // <-- ИСПРАВЛЕНО: вместо admin используем adminId
          // admin убран, так как его нет в модели
        }
      })
    ]);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const statsByType = contentStats.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Получаем имена админов отдельным запросом, если нужны
    const adminIds = ratingHistory
      .map(adj => adj.adminId)
      .filter((id): id is string => id !== null);

    const admins = adminIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: {
            id: true,
            login: true,
            name: true
          }
        })
      : [];

    const adminMap = admins.reduce((acc, admin) => {
      acc[admin.id] = admin;
      return acc;
    }, {} as Record<string, any>);

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      },
      content: statsByType,
      totalContent: Object.values(statsByType).reduce((sum, count) => sum + count, 0),
      recentRatingAdjustments: ratingHistory.map(adj => ({
        ...adj,
        timestamp: adj.timestamp.toISOString(),
        adminName: adj.adminId ? adminMap[adj.adminId]?.name || adminMap[adj.adminId]?.login : undefined // <-- ИСПРАВЛЕНО: используем adminId для поиска
      }))
    };
  }

  /**
   * Поиск пользователей по логину или имени (для упрощенного поиска)
   */
  static async searchUsers(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { login: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        login: true,
        name: true,
        avatar: true,
        rating: true
      },
      orderBy: { rating: 'desc' }
    });

    return users;
  }

  /**
   * Проверка существования пользователя по email или логину
   */
  static async checkUserExists(email: string, login: string) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { login }
        ]
      },
      select: {
        email: true,
        login: true
      }
    });

    return {
      emailExists: existingUser?.email === email,
      loginExists: existingUser?.login === login
    };
  }
}
