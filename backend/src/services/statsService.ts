// backend/src/services/statsService.ts
import { prisma } from '../config/database';

export class StatsService {

  /**
   * Получение общей статистики системы для админ-панели.
   * Аналог AdminService.getAdminStats, но с данными из StatsController.
   */
  static async getSystemStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.content.count(),
      prisma.content.aggregate({ _sum: { comments: true } }),
      prisma.content.aggregate({ _sum: { likes: true } }),
      prisma.content.count({ where: { type: 'PROJECT' } }),
      prisma.content.count({ where: { type: 'MARKET' } }),
      prisma.content.count({ where: { type: 'HELP' } }),
      prisma.content.count({ where: { type: 'LIBRARY' } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.content.count({ where: { createdAt: { gte: today } } })
    ]);

    const topRatedUsers = await prisma.user.findMany({
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

    const topActiveUsers = await prisma.user.findMany({
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

    const recentActivity = await prisma.content.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        user: {
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
        byRating: topRatedUsers.map(user => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        })),
        byActivity: topActiveUsers.map(user => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        }))
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        createdAt: activity.createdAt.toISOString(),
        author: activity.user.name || activity.user.login
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

      const [users, content, comments, likes, ratingAdjustments] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.content.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.content.aggregate({
          _sum: { comments: true },
          where: { createdAt: { gte: start, lt: end } }
        }),
        prisma.content.aggregate({
          _sum: { likes: true },
          where: { createdAt: { gte: start, lt: end } }
        }),
        prisma.ratingAdjustment.count({ where: { timestamp: { gte: start, lt: end } } })
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

    return {
      period: `${days} дней`,
      stats,
      summary: {
        totalUsers: stats.reduce((sum, day) => sum + day.users, 0),
        totalContent: stats.reduce((sum, day) => sum + day.content, 0),
        totalComments: stats.reduce((sum, day) => sum + day.comments, 0),
        totalLikes: stats.reduce((sum, day) => sum + day.likes, 0),
        totalRatingAdjustments: stats.reduce((sum, day) => sum + day.ratingAdjustments, 0)
      }
    };
  }

  /**
   * Получение расширенной статистики по контенту.
   */
  static async getContentStats() {
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
          user: { select: { login: true, name: true } }
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
          user: { select: { login: true, name: true } }
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
          user: { select: { login: true, name: true } }
        }
      })
    ]);

    return {
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category || 'Без категории'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topViewed: topViewed.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        views: item.views,
        author: item.user.name || item.user.login
      })),
      topLiked: topLiked.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        likes: item.likes,
        author: item.user.name || item.user.login
      })),
      topCommented: topCommented.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        comments: item.comments,
        author: item.user.name || item.user.login
      }))
    };
  }

  /**
   * Получение статистики активности конкретного пользователя.
   */
  static async getUserActivityStats(userId: string) {
    const [user, content, totalViews, totalLikes, totalComments, contentByType] = await Promise.all([
      prisma.user.findUnique({
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
      contentByType: contentByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentContent: content.slice(0, 10).map(item => ({
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