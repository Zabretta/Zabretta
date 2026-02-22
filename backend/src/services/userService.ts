// backend/src/services/userService.ts
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';


// Типы для внутреннего использования
interface ContentStats {
  projectsCreated: number;
  mastersAdsCreated: number;
  helpRequestsCreated: number;
  libraryPostsCreated: number;
  likesGiven: number;
  likesReceived: number;
  commentsMade: number;
}

interface RatingAdjustmentData {
  id: string;
  reason: string;
  ratingChange: number;
  activityChange: number;
  timestamp: Date;
  adminId: string | null;
}

export class UserService {
  /**
   * Получение публичного профиля пользователя по ID
   */
  static async getUserProfile(userId: string) {
    // ИСПРАВЛЕНО: user → users
    const user = await prisma.users.findUnique({
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
      throw new Error('Пользователь не найдено');
    }

    // ИСПРАВЛЕНО: добавляем тип для item
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      content: user.content.map((item: any) => ({
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

    // ИСПРАВЛЕНО: user → users
    const [users, total] = await Promise.all([
      prisma.users.findMany({
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
      prisma.users.count({ where })
    ]);

    // ИСПРАВЛЕНО: добавляем тип для user
    return {
      users: users.map((user: any) => ({
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
    // ИСПРАВЛЕНО: user → users
    const user = await prisma.users.update({
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
        createdAt: true
      }
    });

    return {
      ...user,
      createdAt: user.createdAt.toISOString()
    };
  }

  /**
   * Получение статистики пользователя
   */
  static async getUserStats(userId: string) {
    // ИСПРАВЛЕНО: user → users, ratingAdjustment → rating_adjustments
    const [user, contentStats, ratingHistory] = await Promise.all([
      prisma.users.findUnique({
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
      prisma.rating_adjustments.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          reason: true,
          ratingChange: true,
          activityChange: true,
          timestamp: true,
          adminId: true
        }
      })
    ]);

    if (!user) {
      throw new Error('Пользователь не найдено');
    }

    // ИСПРАВЛЕНО: добавляем типы для acc и item
    const statsByType = (contentStats || []).reduce((acc: Record<string, number>, item: any) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Получаем имена админов отдельным запросом
    const adminIds = (ratingHistory || [])
      .map((adj: any) => adj.adminId)
      .filter((id: string | null): id is string => id !== null);

    // ИСПРАВЛЕНО: users вместо user
    const admins = adminIds.length > 0
      ? await prisma.users.findMany({
          where: { id: { in: adminIds } },
          select: {
            id: true,
            login: true,
            name: true
          }
        })
      : [];

    // ИСПРАВЛЕНО: добавляем типы для acc и admin
    const adminMap = admins.reduce((acc: Record<string, any>, admin: any) => {
      acc[admin.id] = admin;
      return acc;
    }, {} as Record<string, any>);

    // ИСПРАВЛЕНО: добавляем типы для sum и count
    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      },
      content: statsByType,
      totalContent: Object.values(statsByType).reduce((sum: number, count: number) => sum + count, 0),
      recentRatingAdjustments: (ratingHistory || []).map((adj: any) => ({
        ...adj,
        timestamp: adj.timestamp.toISOString(),
        adminName: adj.adminId ? adminMap[adj.adminId]?.name || adminMap[adj.adminId]?.login : undefined
      }))
    };
  }

  /**
   * Поиск пользователей по логину или имени (для упрощенного поиска)
   */
  static async searchUsers(query: string, limit: number = 10) {
    // ИСПРАВЛЕНО: user → users
    const users = await prisma.users.findMany({
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
    // ИСПРАВЛЕНО: user → users
    const existingUser = await prisma.users.findFirst({
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

  // ===== НОВЫЙ МЕТОД =====

  /**
   * Получение полной статистики пользователя для личного кабинета
   */
  static async getUserDashboardStats(userId: string) {
    // Получаем базовую информацию о пользователе
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        name: true,
        avatar: true,
        rating: true,
        activityPoints: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      throw new Error('Пользователь не найдено');
    }

    // Получаем статистику по контенту (разбивка по типам)
    const contentByType = await prisma.content.groupBy({
      by: ['type'],
      _count: true,
      where: { userId }
    });

    // Получаем статистику по лайкам
    const [likesGiven, likesReceived] = await Promise.all([
      // Лайки, которые поставил пользователь
      prisma.like.count({
        where: { userId }
      }),
      // Лайки, которые получили проекты пользователя
      prisma.like.count({
        where: {
          content: {
            userId: userId
          }
        }
      })
    ]);

    // Получаем статистику по комментариям
    const [commentsMade, commentsReceived] = await Promise.all([
      // Комментарии, которые написал пользователь
      prisma.comment.count({
        where: { userId }
      }),
      // Комментарии к проектам пользователя
      prisma.comment.count({
        where: {
          content: {
            userId: userId
          }
        }
      })
    ]);

    // Получаем общую статистику просмотров
    const totalViews = await prisma.content.aggregate({
      _sum: { views: true },
      where: { userId }
    });

    // Формируем статистику по типам контента
    const statsByType = {
      projectsCreated: 0,
      mastersAdsCreated: 0,
      helpRequestsCreated: 0,
      libraryPostsCreated: 0
    };

    contentByType.forEach(item => {
      switch(item.type) {
        case 'PROJECT':
          statsByType.projectsCreated = item._count;
          break;
        case 'MARKET':
          statsByType.mastersAdsCreated = item._count;
          break;
        case 'HELP':
          statsByType.helpRequestsCreated = item._count;
          break;
        case 'LIBRARY':
          statsByType.libraryPostsCreated = item._count;
          break;
      }
    });

    return {
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar: user.avatar,
        rating: user.rating,
        activityPoints: user.activityPoints,
        registeredAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      },
      stats: {
        ...statsByType,
        likesGiven,
        likesReceived,
        commentsMade,
        commentsReceived,
        totalViews: totalViews._sum.views || 0
      },
      totalContent: contentByType.reduce((sum, item) => sum + item._count, 0)
    };
  }
}
