// backend/src/services/statsService.ts
import { prisma } from '../config/database';

export class StatsService {

  /**
   * Получение общей статистики системы для админ-панели.
   */
  static async getSystemStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ИСПРАВЛЕНО: user → users, content → content (оставляем как есть)
    const [
      totalUsers,
      activeUsers,
      totalContent,
      totalComments,
      totalLikes,
      totalProjects,
      totalMarketItems,
      totalHelpRequests,
      totalLibraryPosts,
      newUsersToday,
      newContentToday
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { isActive: true } }),
      prisma.content.count(),
      prisma.content.aggregate({ _sum: { comments: true } }),
      prisma.content.aggregate({ _sum: { likes: true } }),
      prisma.content.count({ where: { type: 'PROJECT' } }),
      prisma.content.count({ where: { type: 'MARKET' } }),
      prisma.content.count({ where: { type: 'HELP' } }),
      prisma.content.count({ where: { type: 'LIBRARY' } }),
      prisma.users.count({ where: { createdAt: { gte: today } } }),
      prisma.content.count({ where: { createdAt: { gte: today } } })
    ]);

    // ИСПРАВЛЕНО: user → users
    const topRatedUsers = await prisma.users.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        login: true,
        name: true,
        rating: true,
        activityPoints: true
      }
    });

    const topActiveUsers = await prisma.users.findMany({
      take: 5,
      orderBy: { activityPoints: 'desc' },
      select: {
        id: true,
        login: true,
        name: true,
        rating: true,
        activityPoints: true
      }
    });

    // ИСПРАВЛЕНО: добавляем тип для include
    const recentActivity = await prisma.content.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        users: {  // ИСПРАВЛЕНО: user → users
          select: {
            login: true,
            name: true
          }
        }
      }
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        online: Math.floor(activeUsers * 0.1)
      },
      content: {
        total: totalContent,
        newToday: newContentToday,
        projects: totalProjects,
        marketItems: totalMarketItems,
        helpRequests: totalHelpRequests,
        libraryPosts: totalLibraryPosts,
        totalComments: totalComments._sum.comments || 0,
        totalLikes: totalLikes._sum.likes || 0
      },
      topUsers: {
        byRating: topRatedUsers.map((user: any) => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        })),
        byActivity: topActiveUsers.map((user: any) => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        }))
      },
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        createdAt: activity.createdAt.toISOString(),
        author: activity.users?.name || activity.users?.login || 'Неизвестно'
      })),
      system: {
        uptime: '99.8%',
        memoryUsage: 65,
        responseTime: 120,
        errors: 3,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Получение статистики по дням за указанный период.
   */
  static async getDailyStats(days: number = 7) {
    const stats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      // ИСПРАВЛЕНО: user → users, ratingAdjustment → rating_adjustments
      const [users, content, comments, likes, ratingAdjustments] = await Promise.all([
        prisma.users.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.content.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.content.aggregate({
          _sum: { comments: true },
          where: { createdAt: { gte: start, lt: end } }
        }),
        prisma.content.aggregate({
          _sum: { likes: true },
          where: { createdAt: { gte: start, lt: end } }
        }),
        prisma.rating_adjustments.count({ where: { timestamp: { gte: start, lt: end } } })
      ]);

      stats.push({
        date: start.toISOString().split('T')[0],
        users,
        content,
        comments: comments._sum.comments || 0,
        likes: likes._sum.likes || 0,
        ratingAdjustments
      });
    }

    // ИСПРАВЛЕНО: добавляем типы для sum и day
    return {
      period: `${days} дней`,
      stats,
      summary: {
        totalUsers: stats.reduce((sum: number, day: any) => sum + day.users, 0),
        totalContent: stats.reduce((sum: number, day: any) => sum + day.content, 0),
        totalComments: stats.reduce((sum: number, day: any) => sum + day.comments, 0),
        totalLikes: stats.reduce((sum: number, day: any) => sum + day.likes, 0),
        totalRatingAdjustments: stats.reduce((sum: number, day: any) => sum + day.ratingAdjustments, 0)
      }
    };
  }

  /**
   * Получение расширенной статистики по контенту.
   */
  static async getContentStats() {
    // ИСПРАВЛЕНО: добавляем типы для всех select
    const [byType, byStatus, byCategory, topViewed, topLiked, topCommented] = await Promise.all([
      prisma.content.groupBy({ by: ['type'], _count: true }),
      prisma.content.groupBy({ by: ['status'], _count: true }),
      prisma.content.groupBy({ by: ['category'], _count: true }),
      prisma.content.findMany({
        take: 10,
        orderBy: { views: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          views: true,
          users: {  // ИСПРАВЛЕНО: user → users
            select: {
              login: true,
              name: true
            }
          }
        }
      }),
      prisma.content.findMany({
        take: 10,
        orderBy: { likes: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          likes: true,
          users: {  // ИСПРАВЛЕНО: user → users
            select: {
              login: true,
              name: true
            }
          }
        }
      }),
      prisma.content.findMany({
        take: 10,
        orderBy: { comments: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          comments: true,
          users: {  // ИСПРАВЛЕНО: user → users
            select: {
              login: true,
              name: true
            }
          }
        }
      })
    ]);

    // ИСПРАВЛЕНО: добавляем типы для reduce
    return {
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc: Record<string, number>, item: any) => {
        acc[item.category || 'Без категории'] = item._count;
        return acc;
      }, {}),
      topViewed: topViewed.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        views: item.views,
        author: item.users?.name || item.users?.login || 'Неизвестно'
      })),
      topLiked: topLiked.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        likes: item.likes,
        author: item.users?.name || item.users?.login || 'Неизвестно'
      })),
      topCommented: topCommented.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        comments: item.comments,
        author: item.users?.name || item.users?.login || 'Неизвестно'
      }))
    };
  }

  /**
   * Получение статистики активности конкретного пользователя.
   */
  static async getUserActivityStats(userId: string) {
    // ИСПРАВЛЕНО: user → users
    const [user, content, totalViews, totalLikes, totalComments, contentByType] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          login: true,
          name: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true,
          createdAt: true
        }
      }),
      prisma.content.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          views: true,
          likes: true,
          comments: true,
          createdAt: true,
          status: true
        }
      }),
      prisma.content.aggregate({
        _sum: { views: true },
        where: { userId }
      }),
      prisma.content.aggregate({
        _sum: { likes: true },
        where: { userId }
      }),
      prisma.content.aggregate({
        _sum: { comments: true },
        where: { userId }
      }),
      prisma.content.groupBy({
        by: ['type'],
        _count: true,
        where: { userId }
      })
    ]);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // ИСПРАВЛЕНО: добавляем типы для reduce
    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString()
      },
      stats: {
        totalContent: content.length,
        totalViews: totalViews._sum.views || 0,
        totalLikes: totalLikes._sum.likes || 0,
        totalComments: totalComments._sum.comments || 0,
        averageViews: content.length > 0 ? (totalViews._sum.views || 0) / content.length : 0,
        averageLikes: content.length > 0 ? (totalLikes._sum.likes || 0) / content.length : 0,
        averageComments: content.length > 0 ? (totalComments._sum.comments || 0) / content.length : 0
      },
      contentByType: contentByType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      recentContent: content.slice(0, 10).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        views: item.views,
        likes: item.likes,
        comments: item.comments,
        status: item.status,
        createdAt: item.createdAt.toISOString()
      }))
    };
  }
}
