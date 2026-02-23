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

// Тип для формулы начисления
interface RatingFormula {
  section: string;
  action: string;
  ratingPoints: number;
  activityPoints: number;
  description: string;
}

export class RatingService {
  /**
   * Получить рейтинг пользователя
   */
  static async getUserRating(userId: string): Promise<UserRating> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        content: {
          where: { status: 'ACTIVE' }
        },
        rating_adjustments: {
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
  
  /**
   * Получить рейтинги всех пользователей с пагинацией
   */
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
    
    const totalRating = ratings.reduce((sum: number, r: UserRating) => sum + r.totalRating, 0);
    const totalActivity = ratings.reduce((sum: number, r: UserRating) => sum + r.totalActivity, 0);
    
    return {
      ratings,
      total,
      averageRating: ratings.length > 0 ? Math.round(totalRating / ratings.length) : 0,
      averageActivity: ratings.length > 0 ? Math.round(totalActivity / ratings.length) : 0
    };
  }
  
  /**
   * Получить историю корректировок рейтинга
   */
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
    
    const [adjustments, total] = await Promise.all([
      prisma.rating_adjustments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          users: {
            select: {
              login: true,
              name: true
            }
          }
        }
      }),
      prisma.rating_adjustments.count({ where })
    ]);
    
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
  
  /**
   * Получить уровни и формулы рейтинга
   */
  static async getRatingLevels() {
    const formulas: RatingFormula[] = [
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
    
    const recentAdjustments = await prisma.rating_adjustments.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        users: {
          select: {
            login: true,
            name: true
          }
        }
      }
    });
    
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

  /**
   * Начислить баллы пользователю за действие
   */
  static async awardPoints(
    userId: string, 
    action: string, 
    targetId?: string,
    section?: string
  ): Promise<{ awarded: boolean; ratingChange: number; activityChange: number; message: string }> {
    try {
      // 1. Получаем все формулы
      const { formulas } = await this.getRatingLevels();
      
      // 2. Ищем подходящую формулу
      let formula = formulas.find(f => f.action === action);
      
      if (section) {
        const exactFormula = formulas.find(f => f.section === section && f.action === action);
        if (exactFormula) formula = exactFormula;
      }
      
      if (!formula) {
        console.warn(`[RatingService] Формула не найдена для действия: ${action}`);
        return {
          awarded: false,
          ratingChange: 0,
          activityChange: 0,
          message: `Формула не найдена для действия: ${action}`
        };
      }

      // 👇 ИСПРАВЛЕНО: Проверяем daily_login ТОЛЬКО если это не вызов из админки
      if (action === 'daily_login' && !targetId?.startsWith('admin_')) {
        const today = new Date().toDateString();
        
        const todayAdjustments = await prisma.rating_adjustments.findMany({
          where: {
            userId,
            reason: formula.description,
            timestamp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });
        
        if (todayAdjustments.length > 0) {
          return {
            awarded: false,
            ratingChange: 0,
            activityChange: 0,
            message: 'Бонус за сегодня уже получен'
          };
        }
      }

      // 4. Создаем запись в истории
      const adjustment = await prisma.rating_adjustments.create({
        data: {
          userId,
          reason: `${formula.description}${targetId ? ` (ID: ${targetId})` : ''}`,
          ratingChange: formula.ratingPoints,
          activityChange: formula.activityPoints,
          adminId: null,
          adminNote: targetId ? `targetId: ${targetId}` : null,
          timestamp: new Date()
        }
      });

      // 5. Обновляем суммарные поля пользователя
      await prisma.users.update({
        where: { id: userId },
        data: {
          rating: { increment: formula.ratingPoints },
          activityPoints: { increment: formula.activityPoints }
        }
      });

      console.log(`[RatingService] Начислено ${formula.ratingPoints} рейтинга и ${formula.activityPoints} активности пользователю ${userId} за ${action}`);

      return {
        awarded: true,
        ratingChange: formula.ratingPoints,
        activityChange: formula.activityPoints,
        message: `+${formula.ratingPoints} рейтинга, +${formula.activityPoints} активности`
      };

    } catch (error) {
      console.error('[RatingService] Ошибка при начислении баллов:', error);
      return {
        awarded: false,
        ratingChange: 0,
        activityChange: 0,
        message: 'Ошибка при начислении баллов'
      };
    }
  }

  /**
   * Проверить и начислить бонус за ежедневный вход
   */
  static async checkAndAwardDailyLogin(userId: string): Promise<{ awarded: boolean; message: string }> {
    // 👇 ИСПРАВЛЕНО: Убрали дублирующую проверку, доверяем awardPoints
    const result = await this.awardPoints(userId, 'daily_login');
    
    return {
      awarded: result.awarded,
      message: result.awarded ? 'Бонус за вход начислен' : result.message
    };
  }
}
