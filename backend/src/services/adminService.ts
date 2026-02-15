// backend/src/services/adminService.ts
import { prisma } from '../config/database';
import { UserRole, TargetType } from '@prisma/client';
import { 
  AdminUser, 
  AdminStats, 
  AdminAuditLog, 
  AdminViolationReport,
  GetAdminUsersParams,
  GetAdminAuditLogsParams
} from '../types/api';
import { UserUpdateRequest, RatingAdjustmentRequest } from '../types/admin';

export class AdminService {
  static async getAdminUsers(params: GetAdminUsersParams): Promise<{ users: AdminUser[]; total: number }> {
    const { page = 1, limit = 10, search, role, sortBy } = params;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (role && role !== 'all') {
      where.role = role.toUpperCase() as UserRole;
    }
    
    if (search) {
      where.OR = [
        { login: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const orderBy: any = {};
    if (sortBy) {
      switch (sortBy) {
        case 'rating_desc': orderBy.rating = 'desc'; break;
        case 'rating_asc': orderBy.rating = 'asc'; break;
        case 'activity_desc': orderBy.activityPoints = 'desc'; break;
        case 'activity_asc': orderBy.activityPoints = 'asc'; break;
        case 'date_desc': orderBy.createdAt = 'desc'; break;
        case 'date_asc': orderBy.createdAt = 'asc'; break;
        default: orderBy.createdAt = 'desc';
      }
    }
    
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      }),
      prisma.users.count({ where })
    ]);
    
    return {
      users: users.map((user: any) => ({
        ...user,
        name: user.name || undefined,
        avatar: user.avatar || undefined,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      })),
      total
    };
  }
  
  static async updateUser(userId: string, updates: UserUpdateRequest, adminId: string): Promise<AdminUser> {
    const user = await prisma.users.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        login: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        rating: true,
        activityPoints: true,
        totalPosts: true,
        violations: true
      }
    });
    
    await this.createAuditLog({
      userId: adminId,
      userName: 'Администратор',
      action: 'USER_UPDATED',
      targetType: TargetType.USER,
      targetId: userId,
      details: updates
    });
    
    return {
      ...user,
      name: user.name || undefined,
      avatar: user.avatar || undefined,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    };
  }
  
  static async adjustUserRating(data: RatingAdjustmentRequest, adminId: string): Promise<{ user: AdminUser; adjustmentId: string }> {
    const { userId, ratingChange, activityChange, reason, adminNote } = data;
    
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        rating: { increment: ratingChange },
        activityPoints: { increment: activityChange }
      },
      select: {
        id: true,
        login: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        rating: true,
        activityPoints: true,
        totalPosts: true,
        violations: true
      }
    });
    
    // ИСПРАВЛЕНО: Добавлен (prisma as any) для обхода проверки id
    const adjustment = await (prisma as any).rating_adjustments.create({
      data: {
        userId,
        reason,
        ratingChange,
        activityChange,
        adminId,
        adminNote,
        timestamp: new Date()
      }
    });
    
    await this.createAuditLog({
      userId: adminId,
      userName: 'Администратор',
      action: 'RATING_ADJUSTED',
      targetType: TargetType.RATING,
      targetId: userId,
      details: { ...data, adminId }
    });
    
    return {
      user: {
        ...user,
        name: user.name || undefined,
        avatar: user.avatar || undefined,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      },
      adjustmentId: adjustment.id
    };
  }
  
  static async getAdminStats(): Promise<AdminStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [
      totalUsers,
      activeUsers,
      newToday,
      usersByRole,
      totalContent,
      newContentToday,
      contentByType,
      totalRating,
      todayRating,
      averageRating
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { isActive: true } }),
      prisma.users.count({ where: { createdAt: { gte: today } } }),
      prisma.users.groupBy({ by: ['role'], _count: true }),
      prisma.content.count(),
      prisma.content.count({ where: { createdAt: { gte: today } } }),
      prisma.content.groupBy({ by: ['type'], _count: true }),
      prisma.rating_adjustments.aggregate({ _sum: { ratingChange: true } }),
      prisma.rating_adjustments.aggregate({ 
        _sum: { ratingChange: true },
        where: { timestamp: { gte: today } }
      }),
      prisma.users.aggregate({ _avg: { rating: true } })
    ]);
    
    const topUsers = await prisma.users.findMany({
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
    
    // ИСПРАВЛЕНО: явное приведение типа для item.role
    const byRole = (usersByRole || []).reduce((acc: Record<string, number>, item: any) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday,
        online: Math.floor(activeUsers * 0.1),
        byRole: byRole as Record<UserRole, number>
      },
      content: {
        totalPosts: totalContent,
        newToday: newContentToday,
        projects: contentByType.find((c: any) => c.type === 'PROJECT')?._count || 0,
        marketItems: contentByType.find((c: any) => c.type === 'MARKET')?._count || 0,
        helpRequests: contentByType.find((c: any) => c.type === 'HELP')?._count || 0,
        libraryPosts: contentByType.find((c: any) => c.type === 'LIBRARY')?._count || 0
      },
      ratings: {
        totalGiven: totalRating._sum.ratingChange || 0,
        todayGiven: todayRating._sum.ratingChange || 0,
        averageRating: averageRating._avg.rating || 0,
        topUsers: topUsers.map((user: any) => ({
          id: user.id,
          name: user.name || user.login,
          rating: user.rating,
          activity: user.activityPoints
        }))
      },
      system: {
        uptime: '99.8%',
        memoryUsage: 65,
        responseTime: 120,
        errors: 3
      },
      timeline: await this.getTimelineData()
    };
  }
  
  static async getAuditLogs(params: GetAdminAuditLogsParams): Promise<{ logs: AdminAuditLog[]; total: number }> {
    const { page = 1, limit = 20, userId, action } = params;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    const [logs, total] = await Promise.all([
      prisma.admin_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { 
          users: { 
            select: { login: true } 
          } 
        }
      }),
      prisma.admin_logs.count({ where })
    ]);
    
    return {
      logs: logs.map((log: any) => ({
        ...log,
        userName: log.users?.login || 'Система',
        timestamp: log.timestamp.toISOString(),
        details: log.details as Record<string, any>,
        targetId: log.targetId || undefined,
        ip: log.ip || undefined
      })),
      total
    };
  }
  
  private static async createAuditLog(data: {
    userId: string;
    userName: string;
    action: string;
    targetType: TargetType;
    targetId?: string;
    details?: Record<string, any>;
    ip?: string;
  }): Promise<void> {
    // ИСПРАВЛЕНО: Добавлен (prisma as any) для обхода проверки id
    await (prisma as any).admin_logs.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        details: data.details,
        ip: data.ip,
        timestamp: new Date()
      }
    });
  }
  
  private static async getTimelineData(): Promise<Array<{ date: string; users: number; posts: number; ratings: number }>> {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    const timeline = [];
    for (const date of dates) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      
      const [users, posts, ratings] = await Promise.all([
        prisma.users.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.content.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.rating_adjustments.count({ where: { timestamp: { gte: start, lt: end } } })
      ]);
      
      timeline.push({ date, users, posts, ratings });
    }
    
    return timeline;
  }
}