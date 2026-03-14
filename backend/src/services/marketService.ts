// backend/src/services/marketService.ts
import { prisma } from '../config/database';
import { ItemType, DurationType, ItemCategory, ModerationStatus, ModerationFlag } from '@prisma/client';

export interface CreateItemData {
  title: string;
  description: string;
  price: number | 'free';
  location: string;
  type: ItemType;
  author: string;
  authorId: string;
  category?: ItemCategory;
  imageUrl?: string;
  negotiable?: boolean;
  duration: DurationType;
  // ПОЛЯ ДЛЯ МОДЕРАЦИИ
  moderationStatus: ModerationStatus;
  moderationFlags: ModerationFlag[];
}

export interface MarketFilters {
  type?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  // ФИЛЬТР ДЛЯ МОДЕРАЦИИ
  moderationStatus?: string;
}

export interface ContactAuthorData {
  itemId: string;
  message: string;
  contactMethod: string;
  fromUserId: string;
  toUserId: string;
}

export interface SendReplyData {
  messageId: string;
  fromUserId: string;
  text: string;
}

export interface MessageThreadResponse {
  thread: any[];
  otherUser: {
    id: string;
    login: string;
    name: string | null;
    avatar: string | null;
    phone?: string | null;
    email?: string | null;
    showPhone?: boolean;
    showEmail?: boolean;
  };
  item: {
    id: string;
    title: string;
    price: string | number;
    imageUrl: string | null;
  };
}

export class MarketService {
  /**
   * Получить объявления с фильтрацией
   */
  static async getItems(filters?: MarketFilters) {
    const { type, category, search, page = 1, limit = 20, moderationStatus } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      const typeEnum = type.toUpperCase() as ItemType;
      where.type = typeEnum;
    }

    if (category) {
      const categoryEnum = category.toUpperCase() as ItemCategory;
      where.category = categoryEnum;
    }

    // ФИЛЬТР ПО СТАТУСУ МОДЕРАЦИИ
    if (moderationStatus) {
      const statusEnum = moderationStatus.toUpperCase() as ModerationStatus;
      where.moderationStatus = statusEnum;
    } else {
      // По умолчанию не показываем REJECTED объявления
      where.moderationStatus = {
        not: 'REJECTED'
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const [items, total] = await Promise.all([
        prisma.marketItem.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            users: {
              select: {
                login: true,
                rating: true,
                avatar: true
              }
            }
          }
        }),
        prisma.marketItem.count({ where })
      ]);

      const formattedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price === 'free' ? 'free' : parseInt(item.price),
        priceValue: item.priceValue,
        location: item.location,
        author: item.author,
        authorId: item.authorId,
        rating: item.rating,
        type: item.type.toLowerCase() as any,
        imageUrl: item.imageUrl || undefined,
        negotiable: item.negotiable,
        expirationDate: item.expirationDate?.toISOString(),
        duration: item.duration?.toLowerCase() as any,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        views: item.views,
        contacts: item.contacts,
        category: item.category?.toLowerCase() as any,
        // ПОЛЯ ДЛЯ МОДЕРАЦИИ
        moderationStatus: item.moderationStatus,
        moderationFlags: item.moderationFlags,
        moderatedAt: item.moderatedAt?.toISOString(),
        moderatedBy: item.moderatedBy,
        moderatorNote: item.moderatorNote,
        // ПОЛЯ ДЛЯ РЕДАКТИРОВАНИЯ
        editCount: item.editCount,
        lastEditedAt: item.lastEditedAt?.toISOString()
      }));

      return {
        items: formattedItems,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('❌ Ошибка в getItems:', error);
      throw error;
    }
  }

  /**
   * Создать новое объявление
   */
  static async createItem(data: CreateItemData) {
    try {
      const now = new Date();
      const expirationDate = new Date(now);

      switch (data.duration) {
        case 'TWOWEEKS':
          expirationDate.setDate(now.getDate() + 14);
          break;
        case 'ONEMONTH':
          expirationDate.setMonth(now.getMonth() + 1);
          break;
        case 'TWOMONTHS':
          expirationDate.setMonth(now.getMonth() + 2);
          break;
      }

      const price = data.price === 'free' ? 'free' : data.price.toString();
      const priceValue = data.price === 'free' ? null : Number(data.price);

      const item = await prisma.marketItem.create({
        data: {
          title: data.title,
          description: data.description,
          price,
          priceValue,
          location: data.location,
          author: data.author,
          authorId: data.authorId,
          type: data.type,
          category: data.category,
          imageUrl: data.imageUrl,
          negotiable: data.negotiable || false,
          duration: data.duration,
          expirationDate,
          rating: 4.5,
          views: 0,
          contacts: 0,
          // ПОЛЯ ДЛЯ МОДЕРАЦИИ
          moderationStatus: data.moderationStatus,
          moderationFlags: data.moderationFlags,
          moderatedAt: null,
          moderatedBy: null,
          moderatorNote: null,
          // ПОЛЯ ПРИ СОЗДАНИИ
          editCount: 0,
          lastEditedAt: null
        }
      });

      return {
        id: item.id,
        title: item.title,
        price: item.price === 'free' ? 'free' : parseInt(item.price),
        expirationDate: item.expirationDate?.toISOString(),
        // ПОЛЯ ДЛЯ МОДЕРАЦИИ
        moderationStatus: item.moderationStatus,
        moderationFlags: item.moderationFlags
      };
    } catch (error) {
      console.error('❌ Ошибка создания объявления:', error);
      throw error;
    }
  }

  /**
   * Связаться с автором объявления
   */
  static async contactAuthor(data: ContactAuthorData) {
    try {
      const message = await prisma.marketMessage.create({
        data: {
          itemId: data.itemId,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          message: data.message,
          contactMethod: data.contactMethod,
          read: false
        }
      });

      await prisma.marketItem.update({
        where: { id: data.itemId },
        data: { contacts: { increment: 1 } }
      });

      const item = await prisma.marketItem.findUnique({
        where: { id: data.itemId },
        select: { title: true }
      });

      const fromUser = await prisma.users.findUnique({
        where: { id: data.fromUserId },
        select: { login: true }
      });

      if (item && fromUser) {
        await prisma.userNotification.create({
          data: {
            userId: data.toUserId,
            type: 'MESSAGE',
            title: 'Новый запрос по объявлению',
            message: `Пользователь ${fromUser.login} хочет связаться по поводу "${item.title}"`,
            link: `/profile?tab=messages`,
            read: false
          }
        });
      }

      return { success: true, message };
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      throw error;
    }
  }

  /**
   * Получить объявление по ID
   */
  static async getItemById(id: string, userId?: string) {
    try {
      const item = await prisma.marketItem.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              login: true,
              rating: true,
              avatar: true
            }
          }
        }
      });

      if (!item) {
        throw new Error('Объявление не найдено');
      }

      // 🔥 ПРОВЕРЯЕМ: если пользователь авторизован и это НЕ автор - увеличиваем просмотры
      const shouldIncrementViews = userId && userId !== item.authorId;
      
      let finalViews = item.views;
      
      if (shouldIncrementViews) {
        console.log(`👁️ Пользователь ${userId} (НЕ автор) просматривает объявление ${id} - увеличиваем счетчик`);
        
        // Проверяем, смотрел ли уже этот пользователь
        const existingView = await prisma.itemView.findUnique({
          where: {
            itemId_userId: {
              itemId: id,
              userId: userId
            }
          }
        });

        if (!existingView) {
          // Первый просмотр - увеличиваем и запоминаем
          const result = await prisma.$transaction([
            prisma.itemView.create({
              data: {
                itemId: id,
                userId: userId
              }
            }),
            prisma.marketItem.update({
              where: { id },
              data: { views: { increment: 1 } }
            })
          ]);
          
          finalViews = result[1].views;
          console.log(`👁️✅ Первый просмотр от пользователя ${userId}, новый счетчик: ${finalViews}`);
        } else {
          console.log(`👁️ℹ️ Пользователь ${userId} уже смотрел это объявление, просмотр не засчитывается`);
          finalViews = item.views;
        }
      } else if (userId && userId === item.authorId) {
        console.log(`👁️ Автор просматривает свое объявление ${id} - счетчик НЕ увеличиваем`);
        finalViews = item.views;
      } else {
        console.log(`👁️ Неавторизованный пользователь просматривает объявление ${id} - счетчик НЕ увеличиваем`);
        finalViews = item.views;
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price === 'free' ? 'free' : parseInt(item.price),
        priceValue: item.priceValue,
        location: item.location,
        author: item.author,
        authorId: item.authorId,
        rating: item.rating,
        type: item.type.toLowerCase() as any,
        imageUrl: item.imageUrl || undefined,
        negotiable: item.negotiable,
        expirationDate: item.expirationDate?.toISOString(),
        duration: item.duration?.toLowerCase() as any,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        views: finalViews,
        contacts: item.contacts,
        category: item.category?.toLowerCase() as any,
        // ПОЛЯ ДЛЯ МОДЕРАЦИИ
        moderationStatus: item.moderationStatus,
        moderationFlags: item.moderationFlags,
        moderatedAt: item.moderatedAt?.toISOString(),
        moderatedBy: item.moderatedBy,
        moderatorNote: item.moderatorNote,
        // ПОЛЯ ДЛЯ РЕДАКТИРОВАНИЯ
        editCount: item.editCount,
        lastEditedAt: item.lastEditedAt?.toISOString()
      };
    } catch (error) {
      console.error('❌ Ошибка получения объявления:', error);
      throw error;
    }
  }

  /**
   * УДАЛИТЬ объявление ПОЛНОСТЬЮ из БД
   */
  static async deleteItem(id: string, userId: string) {
    try {
      const item = await prisma.marketItem.findUnique({
        where: { id }
      });

      if (!item) {
        throw new Error('Объявление не найдено');
      }

      // Проверка прав: автор, админ или модератор
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const isAdmin = user?.role === 'ADMIN';
      const isModerator = user?.role === 'MODERATOR';
      const isAuthor = item.authorId === userId;

      if (!isAuthor && !isAdmin && !isModerator) {
        throw new Error('Нет прав на удаление этого объявления');
      }

      // Сначала удаляем связанные сообщения
      await prisma.marketMessage.deleteMany({
        where: { itemId: id }
      });

      // Потом удаляем само объявление
      const deletedItem = await prisma.marketItem.delete({
        where: { id }
      });

      console.log(`🗑️ Объявление ${id} (${deletedItem.title}) ПОЛНОСТЬЮ удалено из БД пользователем ${userId}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления объявления:', error);
      throw error;
    }
  }

  /**
   * Автоматическое удаление просроченных объявлений
   */
  static async expireOldItems() {
    try {
      console.log('⏰ Запуск автоматического удаления просроченных объявлений');
      
      const now = new Date();
      
      const expiredItems = await prisma.marketItem.findMany({
        where: {
          expirationDate: { lt: now }
        }
      });

      console.log(`📦 Найдено просроченных объявлений: ${expiredItems.length}`);

      for (const item of expiredItems) {
        // Сначала удаляем сообщения
        await prisma.marketMessage.deleteMany({
          where: { itemId: item.id }
        });
        
        // Потом удаляем объявление
        await prisma.marketItem.delete({
          where: { id: item.id }
        });
        
        console.log(`🗑️ Просроченное объявление ${item.id} (${item.title}) ПОЛНОСТЬЮ удалено из БД`);
      }

      return { success: true, count: expiredItems.length };
    } catch (error) {
      console.error('❌ Ошибка при автоматическом удалении:', error);
      throw error;
    }
  }

  /**
   * Обновить объявление
   */
  static async updateItem(id: string, userId: string, data: Partial<CreateItemData>) {
    try {
      console.log(`🔍 [UPDATE] Начало обновления объявления ID: ${id}`);
      console.log(`🔍 [UPDATE] Пользователь ID: ${userId}`);
      console.log(`🔍 [UPDATE] Данные для обновления:`, JSON.stringify(data, null, 2));

      const item = await prisma.marketItem.findUnique({
        where: { id }
      });

      if (!item) {
        console.log(`❌ [UPDATE] Объявление с ID ${id} не найдено`);
        throw new Error('Объявление не найдено');
      }

      console.log(`🔍 [UPDATE] Найденное объявление:`, {
        id: item.id,
        authorId: item.authorId,
        title: item.title
      });

      if (item.authorId !== userId) {
        console.log(`❌ [UPDATE] Нет прав на редактирование. authorId: ${item.authorId}, userId: ${userId}`);
        throw new Error('Нет прав на редактирование этого объявления');
      }

      const updateData: any = { ...data };
      console.log(`🔍 [UPDATE] Подготовка данных для обновления...`);

      // Удаляем поля, которые не нужно обновлять напрямую
      delete updateData.id;
      delete updateData.authorId;
      delete updateData.author;
      delete updateData.createdAt;
      delete updateData.views;
      delete updateData.contacts;

      if (data.price !== undefined) {
        console.log(`🔍 [UPDATE] Обработка цены:`, data.price);
        updateData.price = data.price === 'free' ? 'free' : data.price.toString();
        updateData.priceValue = data.price === 'free' ? null : Number(data.price);
        console.log(`🔍 [UPDATE] Цена после обработки:`, { price: updateData.price, priceValue: updateData.priceValue });
      }

      // Преобразуем duration в верхний регистр для Prisma enum
      if (data.duration) {
        console.log(`🔍 [UPDATE] Обработка длительности:`, data.duration);
        
        // Преобразуем duration в верхний регистр
        const durationMap: Record<string, string> = {
          '2weeks': 'TWOWEEKS',
          '1month': 'ONEMONTH',
          '2months': 'TWOMONTHS',
          'twoweeks': 'TWOWEEKS',
          'onemonth': 'ONEMONTH',
          'twomonths': 'TWOMONTHS'
        };
        
        let durationValue = data.duration.toString().toLowerCase();
        let durationEnum = durationMap[durationValue] || durationValue.toUpperCase();
        
        console.log(`🔍 [UPDATE] Duration после преобразования:`, durationEnum);
        updateData.duration = durationEnum;
        
        // Пересчитываем expirationDate
        const now = new Date();
        const expirationDate = new Date(now);

        switch (durationEnum) {
          case 'TWOWEEKS':
            expirationDate.setDate(now.getDate() + 14);
            break;
          case 'ONEMONTH':
            expirationDate.setMonth(now.getMonth() + 1);
            break;
          case 'TWOMONTHS':
            expirationDate.setMonth(now.getMonth() + 2);
            break;
          default:
            console.log(`⚠️ [UPDATE] Неизвестный duration: ${durationEnum}, используем ONEMONTH`);
            expirationDate.setMonth(now.getMonth() + 1);
        }

        updateData.expirationDate = expirationDate;
        console.log(`🔍 [UPDATE] Новая дата истечения:`, expirationDate);
      }

      if (data.moderationStatus) {
        updateData.moderationStatus = data.moderationStatus;
      }
      if (data.moderationFlags) {
        updateData.moderationFlags = data.moderationFlags;
      }

      // Обновляем счетчик редактирований
      updateData.editCount = {
        increment: 1
      };
      updateData.lastEditedAt = new Date();

      console.log(`🔍 [UPDATE] Финальные данные для обновления:`, JSON.stringify(updateData, null, 2));

      const updatedItem = await prisma.marketItem.update({
        where: { id },
        data: updateData
      });

      console.log(`✅ [UPDATE] Объявление успешно обновлено:`, {
        id: updatedItem.id,
        title: updatedItem.title,
        editCount: updatedItem.editCount,
        lastEditedAt: updatedItem.lastEditedAt
      });

      return {
        id: updatedItem.id,
        title: updatedItem.title,
        price: updatedItem.price === 'free' ? 'free' : parseInt(updatedItem.price),
        expirationDate: updatedItem.expirationDate?.toISOString(),
        // ПОЛЯ ДЛЯ МОДЕРАЦИИ
        moderationStatus: updatedItem.moderationStatus,
        moderationFlags: updatedItem.moderationFlags,
        // ПОЛЯ ДЛЯ РЕДАКТИРОВАНИЯ
        editCount: updatedItem.editCount,
        lastEditedAt: updatedItem.lastEditedAt?.toISOString()
      };
    } catch (error) {
      console.error('❌ [UPDATE] Ошибка обновления объявления:', error);
      if (error instanceof Error) {
        console.error('❌ [UPDATE] Сообщение ошибки:', error.message);
        console.error('❌ [UPDATE] Stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Увеличить счетчик просмотров объявления
   * 🔥 ИСПРАВЛЕНО: с защитой от накрутки (один пользователь = +1)
   */
  static async incrementViews(id: string, userId?: string) {
    try {
      console.log('\n👁️ ===== INCREMENT VIEWS DEBUG =====');
      console.log('👁️ Время:', new Date().toISOString());
      console.log('👁️ ID товара:', id);
      console.log('👁️ userId:', userId);

      const item = await prisma.marketItem.findUnique({
        where: { id }
      });

      if (!item) {
        console.log('❌ Товар не найден');
        throw new Error('Объявление не найдено');
      }

      console.log('👁️ Автор товара:', item.authorId);
      
      // 🔥 Если пользователь не авторизован или это автор - не увеличиваем
      if (!userId || userId === item.authorId) {
        console.log(`👁️❌ НЕ увеличиваем: ${!userId ? 'не авторизован' : 'автор'}`);
        return { success: true, incremented: false, views: item.views };
      }

      // 🔥 ПРОВЕРЯЕМ, СМОТРЕЛ ЛИ УЖЕ ЭТОТ ПОЛЬЗОВАТЕЛЬ
      const existingView = await prisma.itemView.findUnique({
        where: {
          itemId_userId: {
            itemId: id,
            userId: userId
          }
        }
      });

      if (existingView) {
        console.log(`👁️❌ Пользователь ${userId} УЖЕ СМОТРЕЛ это объявление (первый просмотр был: ${existingView.viewedAt})`);
        return { success: true, incremented: false, views: item.views };
      }

      // 🔥 ПЕРВЫЙ ПРОСМОТР - УВЕЛИЧИВАЕМ И ЗАПОМИНАЕМ
      console.log(`👁️✅ Первый просмотр от пользователя ${userId} - УВЕЛИЧИВАЕМ!`);
      
      // Используем транзакцию для гарантии целостности
      const result = await prisma.$transaction([
        // Создаем запись о просмотре
        prisma.itemView.create({
          data: {
            itemId: id,
            userId: userId
          }
        }),
        // Увеличиваем счетчик
        prisma.marketItem.update({
          where: { id },
          data: { views: { increment: 1 } }
        })
      ]);

      const updatedItem = result[1];
      console.log(`👁️✅ Новое значение просмотров: ${updatedItem.views}`);
      console.log('👁️ ===== КОНЕЦ INCREMENT VIEWS =====\n');
      
      return { 
        success: true, 
        incremented: true, 
        views: updatedItem.views 
      };
    } catch (error) {
      console.error('❌ [VIEWS] Ошибка увеличения счетчика просмотров:', error);
      throw error;
    }
  }

  /**
   * Получить категории
   */
  static async getCategories() {
    return [
      { id: 'tools', name: 'tools', label: 'Инструменты', icon: '🔧' },
      { id: 'materials', name: 'materials', label: 'Материалы', icon: '📦' },
      { id: 'furniture', name: 'furniture', label: 'Мебель', icon: '🪑' },
      { id: 'electronics', name: 'electronics', label: 'Электроника', icon: '💻' },
      { id: 'cooking', name: 'cooking', label: 'Кулинария', icon: '🍳' },
      { id: 'auto', name: 'auto', label: 'Авто', icon: '🚗' },
      { id: 'sport', name: 'sport', label: 'Спорт', icon: '⚽' },
      { id: 'robot', name: 'robot', label: 'Робототехника', icon: '🤖' },
      { id: 'handmade', name: 'handmade', label: 'Рукоделие', icon: '🧶' },
      { id: 'stolar', name: 'stolar', label: 'Столярка', icon: '🪚' },
      { id: 'hammer', name: 'hammer', label: 'Кузнечное дело', icon: '🔨' },
      { id: 'other', name: 'other', label: 'Другое', icon: '📌' }
    ];
  }

  // ===== МЕТОДЫ ДЛЯ СООБЩЕНИЙ =====

  /**
   * Получить все сообщения пользователя
   */
  static async getUserMessages(userId: string) {
    try {
      const messages = await prisma.marketMessage.findMany({
        where: {
          OR: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        },
        include: {
          fromUser: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true,
              phone: true,
              email: true,
              showPhone: true,
              showEmail: true
            }
          },
          toUser: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true,
              phone: true,
              email: true,
              showPhone: true,
              showEmail: true
            }
          },
          item: {
            select: {
              id: true,
              title: true,
              price: true,
              imageUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return messages;
    } catch (error) {
      console.error('❌ Ошибка получения сообщений:', error);
      throw error;
    }
  }

  /**
   * Получить переписку по сообщению
   */
  static async getMessageThread(messageId: string, userId: string): Promise<MessageThreadResponse> {
    try {
      const originalMessage = await prisma.marketMessage.findUnique({
        where: { id: messageId },
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
          item: {
            select: {
              id: true,
              title: true,
              price: true,
              imageUrl: true
            }
          }
        }
      });

      if (!originalMessage) {
        throw new Error('Сообщение не найдено');
      }

      if (originalMessage.fromUserId !== userId && originalMessage.toUserId !== userId) {
        throw new Error('Доступ запрещен');
      }

      const thread = await prisma.marketMessage.findMany({
        where: {
          itemId: originalMessage.itemId,
          OR: [
            {
              fromUserId: originalMessage.fromUserId,
              toUserId: originalMessage.toUserId
            },
            {
              fromUserId: originalMessage.toUserId,
              toUserId: originalMessage.fromUserId
            }
          ]
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
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const otherUserId = originalMessage.fromUserId === userId 
        ? originalMessage.toUserId 
        : originalMessage.fromUserId;

      const otherUser = await prisma.users.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          login: true,
          name: true,
          avatar: true,
          phone: true,
          email: true,
          showPhone: true,
          showEmail: true
        }
      });

      if (!otherUser) {
        throw new Error('Пользователь не найден');
      }

      return {
        thread,
        otherUser: {
          id: otherUser.id,
          login: otherUser.login,
          name: otherUser.name,
          avatar: otherUser.avatar,
          phone: otherUser.phone,
          email: otherUser.email,
          showPhone: otherUser.showPhone || false,
          showEmail: otherUser.showEmail || false
        },
        item: {
          id: originalMessage.item.id,
          title: originalMessage.item.title,
          price: originalMessage.item.price,
          imageUrl: originalMessage.item.imageUrl
        }
      };
    } catch (error) {
      console.error('❌ Ошибка получения переписки:', error);
      throw error;
    }
  }

  /**
   * Отправить ответ на сообщение
   */
  static async sendReply(data: SendReplyData) {
    try {
      const originalMessage = await prisma.marketMessage.findUnique({
        where: { id: data.messageId },
        include: {
          item: {
            select: {
              title: true
            }
          }
        }
      });

      if (!originalMessage) {
        throw new Error('Исходное сообщение не найдено');
      }

      const toUserId = originalMessage.fromUserId === data.fromUserId 
        ? originalMessage.toUserId 
        : originalMessage.fromUserId;

      const newMessage = await prisma.marketMessage.create({
        data: {
          parentId: data.messageId,
          itemId: originalMessage.itemId,
          fromUserId: data.fromUserId,
          toUserId,
          message: data.text,
          contactMethod: originalMessage.contactMethod,
          read: false
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
          item: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      await prisma.userNotification.create({
        data: {
          userId: toUserId,
          type: 'MESSAGE',
          title: 'Новый ответ',
          message: `Вам ответили по объявлению "${originalMessage.item?.title || 'Без названия'}"`,
          link: `/profile?tab=messages`,
          read: false
        }
      });

      return newMessage;
    } catch (error) {
      console.error('❌ Ошибка отправки ответа:', error);
      throw error;
    }
  }

  /**
   * Отметить сообщение как прочитанное
   */
  static async markMessageAsRead(messageId: string, userId: string) {
    try {
      const message = await prisma.marketMessage.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        throw new Error('Сообщение не найдено');
      }

      if (message.toUserId !== userId) {
        throw new Error('Нет прав на отметку этого сообщения');
      }

      const updatedMessage = await prisma.marketMessage.update({
        where: { id: messageId },
        data: { read: true }
      });

      return updatedMessage;
    } catch (error) {
      console.error('❌ Ошибка отметки сообщения:', error);
      throw error;
    }
  }

  /**
   * Получить количество непрочитанных сообщений
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.marketMessage.count({
        where: {
          toUserId: userId,
          read: false
        }
      });

      return count;
    } catch (error) {
      console.error('❌ Ошибка получения количества непрочитанных:', error);
      throw error;
    }
  }
}