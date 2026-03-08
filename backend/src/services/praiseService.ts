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
      console.log('\n========== [PraiseService] Начало создания похвалы ==========');
      console.log(`📤 fromUserId: ${fromUserId}`);
      console.log(`📤 toUserId: ${data.toUserId}`);
      console.log(`📤 praiseType: ${data.praiseType}`);
      console.log(`📤 contentId: ${data.contentId || 'null'}`);
      console.log(`📤 libraryItemId: ${data.libraryItemId || 'null'}`);

      // 1. Проверка: нельзя похвалить самого себя
      if (fromUserId === data.toUserId) {
        console.log('❌ Ошибка: попытка похвалить самого себя');
        return {
          success: false,
          error: 'Нельзя похвалить самого себя'
        };
      }
      console.log('✅ Проверка на самопохвалу пройдена');

      // 2. Проверка: существует ли пользователь, которого хвалят
      console.log(`🔍 Поиск пользователя с ID: ${data.toUserId}`);
      const toUser = await prisma.users.findUnique({
        where: { id: data.toUserId }
      });

      if (!toUser) {
        console.log('❌ Пользователь не найден');
        return {
          success: false,
          error: 'Пользователь не найден'
        };
      }
      console.log('✅ Пользователь найден:', toUser.login);

      // 3. Если указан contentId, проверяем существование контента и уникальность
      if (data.contentId) {
        console.log(`🔍 Поиск контента с ID: ${data.contentId}`);
        const content = await prisma.content.findUnique({
          where: { id: data.contentId }
        });

        if (!content) {
          console.log('❌ Контент не найден');
          return {
            success: false,
            error: 'Контент не найден'
          };
        }
        console.log('✅ Контент найден:', content.title);

        // Проверка на уникальность для контента
        console.log(`🔍 Проверка уникальности для контента`);
        const existingPraise = await prisma.praise.findUnique({
          where: {
            fromUserId_contentId: {
              fromUserId,
              contentId: data.contentId
            }
          }
        });

        if (existingPraise) {
          console.log('❌ Пользователь уже хвалил этот контент');
          return {
            success: false,
            error: 'Вы уже похвалили этот контент'
          };
        }
        console.log('✅ Уникальность подтверждена');
      }

      // 4. Если указан libraryItemId, проверяем существование документа и уникальность
      if (data.libraryItemId) {
        console.log(`🔍 Поиск документа библиотеки с ID: ${data.libraryItemId}`);
        const libraryItem = await prisma.libraryItem.findUnique({
          where: { id: data.libraryItemId }
        });

        if (!libraryItem) {
          console.log('❌ Документ не найден');
          return {
            success: false,
            error: 'Документ не найден'
          };
        }
        console.log('✅ Документ найден:', libraryItem.title);

        // Проверка на уникальность для документа библиотеки
        console.log(`🔍 Проверка уникальности для документа библиотеки`);
        const existingPraise = await prisma.praise.findUnique({
          where: {
            fromUserId_libraryItemId: {
              fromUserId,
              libraryItemId: data.libraryItemId
            }
          }
        });

        if (existingPraise) {
          console.log('❌ Пользователь уже хвалил этот документ');
          return {
            success: false,
            error: 'Вы уже похвалили этот документ'
          };
        }
        console.log('✅ Уникальность подтверждена');
      }

      // 5. Создаем запись о похвале в БД
      console.log('📝 Создание записи о похвале в БД...');
      const praise = await prisma.praise.create({
        data: {
          fromUserId,
          toUserId: data.toUserId,
          contentId: data.contentId,
          libraryItemId: data.libraryItemId,
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
          } : undefined,
          libraryItem: data.libraryItemId ? {
            select: {
              id: true,
              title: true,
              type: true
            }
          } : undefined
        }
      });
      console.log('✅ Похвала создана с ID:', praise.id);

      // 6. Начисляем баллы автору контента (тому, кого похвалили)
      console.log('\n--- Начисление баллов автору (praise_received) ---');
      console.log(`   Кому: ${data.toUserId}`);
      console.log(`   Действие: praise_received`);
      console.log(`   targetId: ${praise.id}`);
      
      const awardResult = await RatingService.awardPoints(
        data.toUserId,           // кому начисляем
        'praise_received',       // действие
        praise.id,               // targetId = ID похвалы
        'praise'                 // section
      );
      console.log('   Результат awardPoints для автора:', JSON.stringify(awardResult, null, 2));

      // 👇 ДОБАВЛЕНО: начисляем баллы за активность тому, кто похвалил
      console.log('\n--- Начисление баллов пользователю (praise_given) ---');
      console.log(`   Кому: ${fromUserId}`);
      console.log(`   Действие: praise_given`);
      console.log(`   targetId: ${praise.id}`);
      
      const activityResult = await RatingService.awardPoints(
        fromUserId,              // кто похвалил
        'praise_given',          // действие
        praise.id,               // targetId
        'praise'                 // section
      );
      console.log('   Результат awardPoints для пользователя:', JSON.stringify(activityResult, null, 2));

      // 7. Обновляем счетчик полученных похвал у пользователя
      console.log('\n--- Обновление счетчика похвал ---');
      console.log(`   Пользователь: ${data.toUserId}`);
      const updatedUser = await prisma.users.update({
        where: { id: data.toUserId },
        data: {
          praisesCount: { increment: 1 }
        }
      });
      console.log(`   Новый praisesCount: ${updatedUser.praisesCount}`);

      // 8. Форматируем ответ
      const formattedPraise: PraiseData = {
        id: praise.id,
        fromUserId: praise.fromUserId,
        toUserId: praise.toUserId,
        contentId: praise.contentId,
        libraryItemId: praise.libraryItemId,
        praiseType: praise.praiseType,
        message: praise.message,
        createdAt: praise.createdAt.toISOString(),
        fromUser: praise.fromUser,
        toUser: praise.toUser,
        content: praise.content,
        libraryItem: praise.libraryItem
      };

      console.log('\n✅ [PraiseService] Похвала успешно создана');
      console.log(`   from=${fromUserId}, to=${data.toUserId}, type=${data.praiseType}`);
      console.log(`   Баллы начислены: автору +2 рейтинга, +3 активности; пользователю +1 активность`);
      console.log('========== Конец создания похвалы ==========\n');

      return {
        success: true,
        praise: formattedPraise
      };

    } catch (error: unknown) {
      console.error('\n❌ [PraiseService] Ошибка при создании похвалы:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        console.log('❌ Ошибка уникальности: пользователь уже хвалил этот материал');
        return {
          success: false,
          error: 'Вы уже похвалили этот материал'
        };
      }
      
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

    } catch (error: unknown) {
      console.error('[PraiseService] Ошибка при удалении похвалы:', error);
      
      if (error && typeof error === 'object' && 'code' in error) {
        // Можно обработать специфические ошибки Prisma
      }
      
      return {
        success: false,
        error: 'Внутренняя ошибка сервера'
      };
    }
  }
}