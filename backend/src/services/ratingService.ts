// backend/src/services/ratingService.ts
import { prisma } from '../config/database';
import { USER_LEVELS, ACTIVITY_LEVELS, UserRating, RatingAdjustment } from '../types/api';
import { RatingAdjustmentRequest } from '../types/admin';

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

export class RatingService {
  static async getUserRating(userId: string): Promise<UserRating> {
    // ИСПРАВЛЕНО: user → users
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        content: {
          where: { status: 'ACTIVE' }
        },
        rating_adjustments: {  // ИСПРАВЛЕНО: ratingAdjustments → rating_adjustments
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    
    const rating = user.rating || 0;
    const activity = user.activityPoints || 0;
    
    const userLevel = USER_LEVELS.find(level => rating >= level.min && rating <= level.max) || USER_LEVELS[0];
    const activityLevel = ACTIVITY_LEVELS.find(level => activity >= level.min && activity <= level.max) || ACTIVITY_LEVELS[0];
    
    // ИСПРАВЛЕНО: добавляем типы для acc и item
    const contentStats = (user.content || []).reduce<ContentStats>((acc: ContentStats, item: any) => {
      if (item.type === 'PROJECT') acc.projectsCreated++;
      if (item.type === 'MARKET') acc.mastersAdsCreated++;
      if (item.type === 'HELP') acc.helpRequestsCreated++;
      if (item.type === 'LIBRARY') acc.libraryPostsCreated++;
      return acc;
    }, {
      projectsCreated: 0,
      mastersAdsCreated: 0,
      helpRequestsCreated: 0,
      libraryPostsCreated: 0,
      likesGiven: 0,
      likesReceived: 0,
      commentsMade: 0
    });
    
    return {
      userId: user.id,
      totalRating: rating,
      totalActivity: activity,
      ratingLevel: userLevel.name,
      activityLevel: activityLevel.name,
      ratingIcon: userLevel.icon,
      lastDailyLogin: user.lastLogin || undefined,
      stats: contentStats
    };
  }
  
  static async getAllUserRatings(params: {
    page?: number;
    limit?: number;
    sortBy?: 'rating_desc' | 'rating_asc' | 'activity_desc' | 'activity_asc';
  }): Promise<{ ratings: UserRating[]; total: number; averageRating: number; averageActivity: number }> {
    const { page = 1, limit = 50, sortBy = 'rating_desc' } = params;
    const skip = (page - 1) * limit;
    
    const orderBy: any = {};
    switch (sortBy) {
      case 'rating_desc': orderBy.rating = 'desc'; break;
      case 'rating_asc': orderBy.rating = 'asc'; break;
      case 'activity_desc': orderBy.activityPoints = 'desc'; break;
      case 'activity_asc': orderBy.activityPoints = 'asc'; break;
    }
    
    // ИСПРАВЛЕНО: user → users
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          content: {
            where: { status: 'ACTIVE' }
          }
        }
      }),
      prisma.users.count()
    ]);
    
    const ratings = await Promise.all(
      users.map((user: any) => this.getUserRating(user.id))
    );
    
    // ИСПРАВЛЕНО: добавляем типы для sum и r
    const totalRating = ratings.reduce((sum: number, r: UserRating) => sum + r.totalRating, 0);
    const totalActivity = ratings.reduce((sum: number, r: UserRating) => sum + r.totalActivity, 0);
    
    return {
      ratings,
      total,
      averageRating: ratings.length > 0 ? Math.round(totalRating / ratings.length) : 0,
      averageActivity: ratings.length > 0 ? Math.round(totalActivity / ratings.length) : 0
    };
  }
  
  static async getRatingAdjustments(params: {
    userId?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ adjustments: RatingAdjustment[]; total: number; summary: any }> {
    const { userId, page = 1, limit = 20, startDate, endDate } = params;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }
    
    // ИСПРАВЛЕНО: ratingAdjustment → rating_adjustments
    const [adjustments, total] = await Promise.all([
      prisma.rating_adjustments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          users: {  // ИСПРАВЛЕНО: user → users
            select: {
              login: true,
              name: true
            }
          }
        }
      }),
      prisma.rating_adjustments.count({ where })
    ]);
    
    // ИСПРАВЛЕНО: добавляем тип для adj
    const formattedAdjustments: RatingAdjustment[] = adjustments.map((adj: any) => ({
      id: adj.id,
      userId: adj.userId,
      reason: adj.reason,
      ratingChange: adj.ratingChange,
      activityChange: adj.activityChange,
      adminId: adj.adminId || undefined,
      adminNote: adj.adminNote || undefined,
      timestamp: adj.timestamp.toISOString()
    }));
    
    // ИСПРАВЛЕНО: добавляем типы для sum и adj
    const summary = {
      totalRatingChanges: formattedAdjustments.reduce((sum: number, adj: RatingAdjustment) => sum + adj.ratingChange, 0),
      totalActivityChanges: formattedAdjustments.reduce((sum: number, adj: RatingAdjustment) => sum + adj.activityChange, 0),
      positiveAdjustments: formattedAdjustments.filter((adj: RatingAdjustment) => adj.ratingChange > 0).length,
      negativeAdjustments: formattedAdjustments.filter((adj: RatingAdjustment) => adj.ratingChange < 0).length
    };
    
    return {
      adjustments: formattedAdjustments,
      total,
      summary
    };
  }
  
  static async getRatingLevels() {
    const formulas = [
      { section: 'projects', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание проекта' },
      { section: 'projects', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Лайк проекту' },
      { section: 'projects', action: 'like_received', ratingPoints: 1, activityPoints: 0, description: 'Получение лайка' },
      { section: 'projects', action: 'comment', ratingPoints: 0, activityPoints: 3, description: 'Комментарий к проекту' },
      { section: 'masters', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание объявления мастера' },
      { section: 'masters', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Лайк мастеру' },
      { section: 'help', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание запроса о помощи' },
      { section: 'help', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Полезный ответ' },
      { section: 'library', action: 'create', ratingPoints: 5, activityPoints: 10, description: 'Создание публикации' },
      { section: 'library', action: 'like_given', ratingPoints: 0, activityPoints: 2, description: 'Лайк публикации' },
      { section: 'general', action: 'registration', ratingPoints: 15, activityPoints: 0, description: 'Регистрация на сайте' },
      { section: 'general', action: 'daily_login', ratingPoints: 0, activityPoints: 2, description: 'Ежедневный вход' },
    ];
    
    // ИСПРАВЛЕНО: ratingAdjustment → rating_adjustments
    const recentAdjustments = await prisma.rating_adjustments.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        users: {  // ИСПРАВЛЕНО: user → users
          select: {
            login: true,
            name: true
          }
        }
      }
    });
    
    // ИСПРАВЛЕНО: добавляем тип для adj
    return {
      userLevels: USER_LEVELS,
      activityLevels: ACTIVITY_LEVELS,
      formulas,
      currentAdjustments: recentAdjustments.map((adj: any) => ({
        id: adj.id,
        userId: adj.userId,
        userName: adj.users?.name || adj.users?.login || 'Неизвестно',
        reason: adj.reason,
        ratingChange: adj.ratingChange,
        activityChange: adj.activityChange,
        adminId: adj.adminId,
        adminNote: adj.adminNote,
        timestamp: adj.timestamp.toISOString()
      }))
    };
  }
}