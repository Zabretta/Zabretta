import { prisma } from '../config/database';
import { ItemType, DurationType, ItemCategory } from '@prisma/client';

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
}

export interface MarketFilters {
  type?: string; // Приходит из запроса как строка (sell, buy и т.д.)
  category?: string; // Приходит из запроса как строка (tools, materials и т.д.)
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContactAuthorData {
  itemId: string;
  message: string;
  contactMethod: string;
  fromUserId: string;
  toUserId: string;
}

export class MarketService {
  /**
   * Получить объявления с фильтрацией
   */
  static async getItems(filters?: MarketFilters) {
    const { type, category, search, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    // 🔥 ИСПРАВЛЕНИЕ: Преобразуем строковые значения в enum Prisma
    if (type) {
      // Преобразуем "sell" → "SELL", "buy" → "BUY" и т.д.
      const typeEnum = type.toUpperCase() as ItemType;
      where.type = typeEnum;
      console.log(`🔍 Фильтр по типу: "${type}" → "${typeEnum}"`);
    }

    if (category) {
      // Преобразуем "tools" → "TOOLS" и т.д.
      const categoryEnum = category.toUpperCase() as ItemCategory;
      where.category = categoryEnum;
      console.log(`🔍 Фильтр по категории: "${category}" → "${categoryEnum}"`);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
      console.log(`🔍 Поиск по строке: "${search}"`);
    }

    console.log('📦 Итоговый where для Prisma:', JSON.stringify(where, null, 2));

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

      console.log(`✅ Найдено ${items.length} из ${total} объявлений`);

      // Преобразуем в формат для фронтенда (строчные буквы)
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
        type: item.type.toLowerCase() as any, // SELL → sell
        imageUrl: item.imageUrl || undefined,
        negotiable: item.negotiable,
        expirationDate: item.expirationDate?.toISOString(),
        duration: item.duration?.toLowerCase() as any, // ONEMONTH → 1month
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        views: item.views,
        contacts: item.contacts,
        category: item.category?.toLowerCase() as any // TOOLS → tools
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
    console.log('📝 Создание объявления:', data);

    // Рассчитываем дату истечения
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

    // Подготавливаем цену
    const price = data.price === 'free' ? 'free' : data.price.toString();
    const priceValue = data.price === 'free' ? null : Number(data.price);

    try {
      const item = await prisma.marketItem.create({
        data: {
          title: data.title,
          description: data.description,
          price,
          priceValue,
          location: data.location,
          author: data.author,
          authorId: data.authorId,
          type: data.type, // Уже приходит как SELL, BUY и т.д.
          category: data.category,
          imageUrl: data.imageUrl,
          negotiable: data.negotiable || false,
          duration: data.duration,
          expirationDate,
          rating: 4.5,
          views: 0,
          contacts: 0
        }
      });

      console.log(`✅ Объявление создано с ID: ${item.id}`);

      return {
        id: item.id,
        title: item.title,
        price: item.price === 'free' ? 'free' : parseInt(item.price),
        expirationDate: item.expirationDate?.toISOString()
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
    console.log('📧 Отправка сообщения:', data);

    try {
      // Создаём сообщение
      await prisma.marketMessage.create({
        data: {
          itemId: data.itemId,
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          message: data.message,
          contactMethod: data.contactMethod,
          read: false
        }
      });

      // Увеличиваем счётчик контактов
      await prisma.marketItem.update({
        where: { id: data.itemId },
        data: { contacts: { increment: 1 } }
      });

      console.log('✅ Сообщение отправлено');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      throw error;
    }
  }

  /**
   * Получить объявление по ID
   */
  static async getItemById(id: string) {
    console.log(`🔍 Поиск объявления по ID: ${id}`);

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

      // Увеличиваем счётчик просмотров
      await prisma.marketItem.update({
        where: { id },
        data: { views: { increment: 1 } }
      });

      console.log(`✅ Объявление найдено: ${item.title}`);

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
        views: item.views + 1,
        contacts: item.contacts,
        category: item.category?.toLowerCase() as any
      };
    } catch (error) {
      console.error('❌ Ошибка получения объявления:', error);
      throw error;
    }
  }

  /**
   * Удалить объявление
   */
  static async deleteItem(id: string, userId: string) {
    console.log(`🗑️ Удаление объявления ${id} пользователем ${userId}`);

    try {
      // Проверяем, что пользователь - автор
      const item = await prisma.marketItem.findUnique({
        where: { id }
      });

      if (!item) {
        throw new Error('Объявление не найдено');
      }

      if (item.authorId !== userId) {
        throw new Error('Нет прав на удаление этого объявления');
      }

      await prisma.marketItem.delete({
        where: { id }
      });

      console.log('✅ Объявление удалено');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления объявления:', error);
      throw error;
    }
  }

  /**
   * Обновить объявление
   */
  static async updateItem(id: string, userId: string, data: Partial<CreateItemData>) {
    console.log(`📝 Обновление объявления ${id} пользователем ${userId}`);

    try {
      // Проверяем, что пользователь - автор
      const item = await prisma.marketItem.findUnique({
        where: { id }
      });

      if (!item) {
        throw new Error('Объявление не найдено');
      }

      if (item.authorId !== userId) {
        throw new Error('Нет прав на редактирование этого объявления');
      }

      const updateData: any = { ...data };

      // Обрабатываем цену, если передана
      if (data.price !== undefined) {
        updateData.price = data.price === 'free' ? 'free' : data.price.toString();
        updateData.priceValue = data.price === 'free' ? null : Number(data.price);
      }

      // Обрабатываем тип, если передан (преобразуем в верхний регистр для enum)
      if (data.type) {
        updateData.type = data.type; // Уже должен быть SELL, BUY и т.д.
      }

      // Обрабатываем категорию, если передана
      if (data.category) {
        updateData.category = data.category; // Уже должна быть TOOLS, MATERIALS и т.д.
      }

      // Обрабатываем длительность, если передана
      if (data.duration) {
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

        updateData.expirationDate = expirationDate;
      }

      const updatedItem = await prisma.marketItem.update({
        where: { id },
        data: updateData
      });

      console.log('✅ Объявление обновлено');

      return {
        id: updatedItem.id,
        title: updatedItem.title,
        price: updatedItem.price === 'free' ? 'free' : parseInt(updatedItem.price),
        expirationDate: updatedItem.expirationDate?.toISOString()
      };
    } catch (error) {
      console.error('❌ Ошибка обновления объявления:', error);
      throw error;
    }
  }

  /**
   * Получить категории
   */
  static async getCategories() {
    console.log('📋 Запрос категорий');
    
    // В реальном проекте здесь может быть отдельная таблица категорий
    // Пока возвращаем статичный список
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
}
