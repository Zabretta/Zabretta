// backend/src/services/statsService.ts
import { prisma } from '../config/database';
import { getOnlineCount } from '../socket';

export class StatsService {

  /**
   * Получение общей статистики системы для админ-панели.
   */
  static async getSystemStats() {
    // Используем UTC для всех операций с датами
    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    
    console.log('📊 StatsService.getSystemStats:');
    console.log(`   Текущее время: ${now.toISOString()}`);

    // Получаем количество онлайн пользователей через WebSocket
    let onlineUsers = 0;
    try {
      onlineUsers = getOnlineCount();
      console.log(`   Онлайн через WebSocket: ${onlineUsers}`);
    } catch (error) {
      console.error('❌ Ошибка получения онлайн через WebSocket:', error);
      onlineUsers = 0;
    }

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

    console.log(`   Всего пользователей: ${totalUsers}`);
    console.log(`   Активных пользователей: ${activeUsers}`);
    console.log(`   Онлайн пользователей (WebSocket): ${onlineUsers}`);

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

    const recentActivity = await prisma.content.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        users: {
          select: {
            login: true,
            name: true
          }
        }
      }
    });

    const result = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        online: onlineUsers
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
        byRating: topRatedUsers.map((user) => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        })),
        byActivity: topActiveUsers.map((user) => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        }))
      },
      recentActivity: recentActivity.map((activity) => ({
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

    console.log('✅ StatsService результат:', JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Получение статистики по дням за указанный период.
   */
  static async getDailyStats(days: number = 7) {
    const stats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setUTCHours(0, 0, 0, 0));
      const end = new Date(date.setUTCHours(23, 59, 59, 999));

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

    const summary = {
      totalUsers: 0,
      totalContent: 0,
      totalComments: 0,
      totalLikes: 0,
      totalRatingAdjustments: 0
    };

    for (const day of stats) {
      summary.totalUsers += day.users;
      summary.totalContent += day.content;
      summary.totalComments += day.comments;
      summary.totalLikes += day.likes;
      summary.totalRatingAdjustments += day.ratingAdjustments;
    }

    return {
      period: `${days} дней`,
      stats,
      summary
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
          users: {
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
          users: {
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
          users: {
            select: {
              login: true,
              name: true
            }
          }
        }
      })
    ]);

    const byTypeObj: Record<string, number> = {};
    for (const item of byType) {
      byTypeObj[item.type] = item._count;
    }

    const byStatusObj: Record<string, number> = {};
    for (const item of byStatus) {
      byStatusObj[item.status] = item._count;
    }

    const byCategoryObj: Record<string, number> = {};
    for (const item of byCategory) {
      byCategoryObj[item.category || 'Без категории'] = item._count;
    }

    return {
      byType: byTypeObj,
      byStatus: byStatusObj,
      byCategory: byCategoryObj,
      topViewed: topViewed.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        views: item.views,
        author: item.users?.name || item.users?.login || 'Неизвестно'
      })),
      topLiked: topLiked.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        likes: item.likes,
        author: item.users?.name || item.users?.login || 'Неизвестно'
      })),
      topCommented: topCommented.map((item) => ({
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
          createdAt: true,
          lastLogin: true
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

    const contentByTypeObj: Record<string, number> = {};
    for (const item of contentByType) {
      contentByTypeObj[item.type] = item._count;
    }

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null
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
      contentByType: contentByTypeObj,
      recentContent: content.slice(0, 10).map((item) => ({
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