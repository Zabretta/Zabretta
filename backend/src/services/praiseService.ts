// backend/src/services/praiseService.ts
import { prisma } from '../config/database';
import { RatingService } from './ratingService';
import { PraiseData, CreatePraiseRequest, GetPraisesParams, PraisesResponse } from '../types/api';

export class PraiseService {
  /**
   * Создать новую похвалу
   */
  static async createPraise(
    fromUserId: string,
    data: CreatePraiseRequest
  ): Promise<{ success: boolean; praise?: PraiseData; error?: string }> {
    try {
      // 1. Проверка: нельзя похвалить самого себя
      if (fromUserId === data.toUserId) {
        return {
          success: false,
          error: 'Нельзя похвалить самого себя'
        };
      }

      // 2. Проверка: существует ли пользователь, которого хвалят
      const toUser = await prisma.users.findUnique({
        where: { id: data.toUserId }
      });

      if (!toUser) {
        return {
          success: false,
          error: 'Пользователь не найден'
        };
      }

      // 3. Если указан contentId, проверяем существование контента
      if (data.contentId) {
        const content = await prisma.content.findUnique({
          where: { id: data.contentId }
        });

        if (!content) {
          return {
            success: false,
            error: 'Контент не найден'
          };
        }

        // 4. Проверка на уникальность (один пользователь может похвалить контент только раз)
        const existingPraise = await prisma.praise.findUnique({
          where: {
            fromUserId_contentId: {
              fromUserId,
              contentId: data.contentId
            }
          }
        });

        if (existingPraise) {
          return {
            success: false,
            error: 'Вы уже похвалили этот контент'
          };
        }
      }

      // 5. Создаем запись о похвале в БД
      const praise = await prisma.praise.create({
        data: {
          fromUserId,
          toUserId: data.toUserId,
          contentId: data.contentId,
          praiseType: data.praiseType,
          message: data.message
        },
        include: {
          fromUser: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          },
          toUser: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          },
          content: data.contentId ? {
            select: {
              id: true,
              title: true,
              type: true
            }
          } : undefined
        }
      });

      // 6. Начисляем баллы автору контента (тому, кого похвалили)
      const awardResult = await RatingService.awardPoints(
        data.toUserId,           // кому начисляем
        'praise_received',       // действие
        praise.id,               // targetId = ID похвалы
        'praise'                 // section
      );

      // 7. Обновляем счетчик полученных похвал у пользователя
      await prisma.users.update({
        where: { id: data.toUserId },
        data: {
          praisesCount: { increment: 1 }
        }
      });

      // 8. Форматируем ответ
      const formattedPraise: PraiseData = {
        id: praise.id,
        fromUserId: praise.fromUserId,
        toUserId: praise.toUserId,
        contentId: praise.contentId,
        praiseType: praise.praiseType,
        message: praise.message,
        createdAt: praise.createdAt.toISOString(),
        fromUser: praise.fromUser,
        toUser: praise.toUser,
        content: praise.content
      };

      console.log(`[PraiseService] Похвала создана: from=${fromUserId}, to=${data.toUserId}, type=${data.praiseType}`);

      return {
        success: true,
        praise: formattedPraise
      };

    } catch (error) {
      console.error('[PraiseService] Ошибка при создании похвалы:', error);
      return {
        success: false,
        error: 'Внутренняя ошибка сервера'
      };
    }
  }

  /**
   * Получить список похвал с фильтрацией
   */
  static async getPraises(params: GetPraisesParams): Promise<PraisesResponse> {
    const {
      userId,
      contentId,
      page = 1,
      limit = 20
    } = params;

    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: any = {};
    if (userId) {
      where.OR = [
        { fromUserId: userId },
        { toUserId: userId }
      ];
    }
    if (contentId) {
      where.contentId = contentId;
    }

    // Получаем похвалы и общее количество
    const [praises, total] = await Promise.all([
      prisma.praise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          },
          toUser: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          },
          content: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        }
      }),
      prisma.praise.count({ where })
    ]);

    // Форматируем ответ
    const formattedPraises: PraiseData[] = praises.map(praise => ({
      id: praise.id,
      fromUserId: praise.fromUserId,
      toUserId: praise.toUserId,
      contentId: praise.contentId,
      praiseType: praise.praiseType,
      message: praise.message,
      createdAt: praise.createdAt.toISOString(),
      fromUser: praise.fromUser,
      toUser: praise.toUser,
      content: praise.content
    }));

    return {
      praises: formattedPraises,
      total,
      page,
      limit
    };
  }

  /**
   * Получить статистику похвал пользователя
   */
  static async getUserPraisesStats(userId: string): Promise<{
    given: number;
    received: number;
    receivedByType: Record<string, number>;
  }> {
    // Получаем все похвалы пользователя
    const [given, received] = await Promise.all([
      prisma.praise.count({
        where: { fromUserId: userId }
      }),
      prisma.praise.findMany({
        where: { toUserId: userId },
        select: {
          praiseType: true
        }
      })
    ]);

    // Группируем полученные похвалы по типам
    const receivedByType: Record<string, number> = {};
    received.forEach(p => {
      const type = p.praiseType;
      receivedByType[type] = (receivedByType[type] || 0) + 1;
    });

    return {
      given,
      received: received.length,
      receivedByType
    };
  }

  /**
   * Проверить, хвалил ли пользователь этот контент
   */
  static async hasUserPraisedContent(
    userId: string,
    contentId: string
  ): Promise<boolean> {
    const praise = await prisma.praise.findUnique({
      where: {
        fromUserId_contentId: {
          fromUserId: userId,
          contentId
        }
      }
    });

    return !!praise;
  }

  /**
   * Удалить похвалу (если потребуется админ-функция)
   */
  static async deletePraise(
    praiseId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Находим похвалу
      const praise = await prisma.praise.findUnique({
        where: { id: praiseId }
      });

      if (!praise) {
        return {
          success: false,
          error: 'Похвала не найдена'
        };
      }

      // Удаляем похвалу
      await prisma.praise.delete({
        where: { id: praiseId }
      });

      // Уменьшаем счетчик у пользователя
      await prisma.users.update({
        where: { id: praise.toUserId },
        data: {
          praisesCount: { decrement: 1 }
        }
      });

      // Здесь можно также откатить начисленные баллы, если нужно
      // Но это сложная логика, лучше оставить как есть

      console.log(`[PraiseService] Похвала ${praiseId} удалена администратором ${adminId}`);

      return { success: true };

    } catch (error) {
      console.error('[PraiseService] Ошибка при удалении похвалы:', error);
      return {
        success: false,
        error: 'Внутренняя ошибка сервера'
      };
    }
  }
}