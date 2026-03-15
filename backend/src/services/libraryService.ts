// backend/src/services/libraryService.ts
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

// ========== ИНТЕРФЕЙСЫ ==========

export interface CreateSubsectionData {
  title: string;
  sectionId: string;
  createdBy: string;
}

// 🔥 ОБНОВЛЕНО: добавлено поле images
export interface CreateItemData {
  title: string;
  content: string;
  type: "text" | "photo" | "drawing" | "video" | "other";
  sectionId: string;
  subsectionId: string;
  createdBy: string;
  author: string;
  authorLogin: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  thumbnail?: string;
  // 🔥 НОВОЕ ПОЛЕ для нескольких фото
  images?: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    thumbnail?: string;
  }>;
}

export interface UpdateSubsectionData {
  title?: string;
}

// 🔥 ОБНОВЛЕНО: добавлено поле images
export interface UpdateItemData {
  title?: string;
  content?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  thumbnail?: string;
  // 🔥 НОВОЕ ПОЛЕ для нескольких фото
  images?: Array<{
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    thumbnail?: string;
  }>;
}

export interface SearchParams {
  query: string;
  type?: string;
  sectionId?: string;
  page: number;
  limit: number;
}

export interface LibraryFilters {
  type?: string;
  sectionId?: string;
  subsectionId?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

const checkUserPermissions = (userId: string, itemUserId: string, userRole?: UserRole): boolean => {
  console.log('🔍 checkUserPermissions:', { 
    userId, 
    itemUserId, 
    userRole,
    isAdmin: userRole === 'ADMIN',
    isModerator: userRole === 'MODERATOR',
    isOwner: userId === itemUserId
  });
  
  // Админ может всё
  if (userRole === 'ADMIN') {
    console.log('✅ Админ - полный доступ');
    return true;
  }
  
  // Модератор может всё
  if (userRole === 'MODERATOR') {
    console.log('✅ Модератор - полный доступ');
    return true;
  }
  
  // Обычный пользователь может только своё
  const result = userId === itemUserId;
  console.log(`👤 Обычный пользователь - ${result ? 'доступ есть' : 'доступа нет'}`);
  return result;
};

// ========== ОСНОВНОЙ СЕРВИС ==========

export class LibraryService {
  /**
   * Увеличить счетчик просмотров документа
   */
  static async incrementViews(itemId: string): Promise<{ views: number }> {
    try {
      console.log(`📊 Увеличение счетчика просмотров для документа ${itemId}`);
      
      // Проверяем существование документа
      const existingItem = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false }
      });

      if (!existingItem) {
        throw new Error('Документ не найден');
      }
      
      const item = await prisma.libraryItem.update({
        where: { id: itemId, isDeleted: false },
        data: {
          views: {
            increment: 1
          }
        },
        select: {
          views: true
        }
      });

      console.log(`✅ Счетчик просмотров увеличен: ${item.views}`);
      
      return { views: item.views };
    } catch (error) {
      console.error('❌ Ошибка при увеличении счетчика просмотров:', error);
      throw error;
    }
  }

  /**
   * Получить все разделы библиотеки (стеллажи)
   */
  static async getAllSections(userId?: string) {
    try {
      console.log('🔍 getAllSections - userId:', userId || 'не авторизован');
      
      const sections = await prisma.librarySection.findMany({
        where: { 
          isDeleted: false,
          isActive: true
        },
        orderBy: { order: 'asc' },
        include: {
          subsections: {
            where: { isDeleted: false },
            include: {
              items: {
                where: { isDeleted: false },
                select: { id: true }
              }
            }
          }
        }
      });

      console.log(`📦 Найдено разделов: ${sections.length}`);

      // Форматируем ответ с подсчетом количества документов и правами
      const formattedSections = await Promise.all(sections.map(async (section) => {
        const itemCount = section.subsections.reduce(
          (acc, sub) => acc + sub.items.length, 0
        );

        // Проверка прав для раздела
        let canEdit = false;
        let canDelete = false;
        
        if (userId) {
          const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true }
          });
          
          console.log(`👤 Для раздела ${section.id} (createdBy: ${section.createdBy})`);
          canEdit = checkUserPermissions(userId, section.createdBy, user?.role);
          canDelete = checkUserPermissions(userId, section.createdBy, user?.role);
        }

        return {
          id: section.id,
          title: section.title,
          icon: section.icon,
          words: section.words,
          subsections: section.subsections.map(sub => ({
            id: sub.id,
            title: sub.title,
            itemCount: sub.items.length,
            createdBy: sub.createdBy,
            createdAt: sub.createdAt.toISOString()
          })),
          allowedTypes: section.allowedTypes,
          fileExtensions: section.fileExtensions,
          maxFileSize: section.maxFileSize,
          itemCount,
          subsectionCount: section.subsections.length,
          canEdit,
          canDelete
        };
      }));

      return formattedSections;
    } catch (error) {
      console.error('❌ Ошибка получения разделов библиотеки:', error);
      throw error;
    }
  }

  /**
   * Получить раздел по ID
   */
  static async getSectionById(sectionId: string, userId?: string) {
    try {
      console.log(`🔍 getSectionById - sectionId: ${sectionId}, userId: ${userId || 'не авторизован'}`);
      
      const section = await prisma.librarySection.findUnique({
        where: { id: sectionId, isDeleted: false },
        include: {
          subsections: {
            where: { isDeleted: false },
            include: {
              items: {
                where: { isDeleted: false },
                select: { id: true }
              }
            }
          }
        }
      });

      if (!section) {
        throw new Error('Раздел не найден');
      }

      const itemCount = section.subsections.reduce(
        (acc, sub) => acc + sub.items.length, 0
      );

      // Проверка прав
      let canEdit = false;
      let canDelete = false;
      
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        
        canEdit = checkUserPermissions(userId, section.createdBy, user?.role);
        canDelete = checkUserPermissions(userId, section.createdBy, user?.role);
      }

      return {
        id: section.id,
        title: section.title,
        icon: section.icon,
        words: section.words,
        subsections: section.subsections.map(sub => ({
          id: sub.id,
          title: sub.title,
          itemCount: sub.items.length,
          createdBy: sub.createdBy,
          createdAt: sub.createdAt.toISOString()
        })),
        allowedTypes: section.allowedTypes,
        fileExtensions: section.fileExtensions,
        maxFileSize: section.maxFileSize,
        itemCount,
        subsectionCount: section.subsections.length,
        canEdit,
        canDelete,
        createdBy: section.createdBy,
        createdAt: section.createdAt.toISOString(),
        updatedAt: section.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('❌ Ошибка получения раздела:', error);
      throw error;
    }
  }

  /**
   * Получить подразделы раздела
   */
  static async getSubsections(sectionId: string, userId?: string) {
    try {
      console.log(`🔍 getSubsections - sectionId: ${sectionId}, userId: ${userId || 'не авторизован'}`);
      
      // Проверяем существование раздела
      const section = await prisma.librarySection.findUnique({
        where: { id: sectionId, isDeleted: false }
      });

      if (!section) {
        throw new Error('Раздел не найден');
      }

      const subsections = await prisma.librarySubsection.findMany({
        where: { 
          sectionId,
          isDeleted: false 
        },
        orderBy: { order: 'asc' },
        include: {
          items: {
            where: { isDeleted: false },
            select: { id: true }
          }
        }
      });

      // Получаем роль пользователя для проверки прав
      let userRole: UserRole | undefined;
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        userRole = user?.role;
        console.log(`👤 Роль пользователя ${userId}: ${userRole}`);
      }

      return subsections.map(sub => {
        const canEdit = checkUserPermissions(userId || '', sub.createdBy, userRole);
        const canDelete = checkUserPermissions(userId || '', sub.createdBy, userRole);
        
        console.log(`📦 Подраздел ${sub.id} (createdBy: ${sub.createdBy}): canEdit=${canEdit}, canDelete=${canDelete}`);
        
        return {
          id: sub.id,
          title: sub.title,
          itemCount: sub.items.length,
          createdBy: sub.createdBy,
          createdAt: sub.createdAt.toISOString(),
          canEdit,
          canDelete
        };
      });
    } catch (error) {
      console.error('❌ Ошибка получения подразделов:', error);
      throw error;
    }
  }

  /**
   * Получить подраздел по ID
   */
  static async getSubsectionById(subsectionId: string, userId?: string) {
    try {
      console.log(`🔍 getSubsectionById - subsectionId: ${subsectionId}, userId: ${userId || 'не авторизован'}`);
      
      const subsection = await prisma.librarySubsection.findUnique({
        where: { id: subsectionId, isDeleted: false },
        include: {
          items: {
            where: { isDeleted: false },
            select: { id: true }
          },
          section: true
        }
      });

      if (!subsection) {
        throw new Error('Подраздел не найден');
      }

      // Получаем роль пользователя для проверки прав
      let userRole: UserRole | undefined;
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        userRole = user?.role;
      }

      const canEdit = checkUserPermissions(userId || '', subsection.createdBy, userRole);
      const canDelete = checkUserPermissions(userId || '', subsection.createdBy, userRole);

      return {
        id: subsection.id,
        title: subsection.title,
        sectionId: subsection.sectionId,
        sectionTitle: subsection.section.title,
        itemCount: subsection.items.length,
        createdBy: subsection.createdBy,
        createdAt: subsection.createdAt.toISOString(),
        canEdit,
        canDelete
      };
    } catch (error) {
      console.error('❌ Ошибка получения подраздела:', error);
      throw error;
    }
  }

  /**
   * Получить документы подраздела с пагинацией
   */
  static async getItems(subsectionId: string, userId?: string, page: number = 1, limit: number = 20) {
    try {
      console.log(`🔍 getItems - subsectionId: ${subsectionId}, userId: ${userId || 'не авторизован'}, page: ${page}, limit: ${limit}`);
      
      // Проверяем существование подраздела
      const subsection = await prisma.librarySubsection.findUnique({
        where: { id: subsectionId, isDeleted: false }
      });

      if (!subsection) {
        throw new Error('Подраздел не найден');
      }

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.libraryItem.findMany({
          where: { 
            subsectionId,
            isDeleted: false 
          },
          skip,
          take: limit,
          orderBy: { date: 'desc' },
          include: {
            creator: {
              select: {
                id: true,
                login: true,
                name: true,
                avatar: true
              }
            },
            praises: {
              select: {
                praiseType: true
              }
            }
          }
        }),
        prisma.libraryItem.count({
          where: { 
            subsectionId,
            isDeleted: false 
          }
        })
      ]);

      console.log(`📦 Найдено документов: ${items.length}, всего: ${total}`);

      // Получаем роль пользователя для проверки прав
      let userRole: UserRole | undefined;
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        userRole = user?.role;
        console.log(`👤 Роль пользователя ${userId}: ${userRole}`);
      }

      // Форматируем документы и считаем статистику похвал
      const formattedItems = items.map(item => {
        // Статистика похвал
        const praiseDistribution: Record<string, number> = {};
        item.praises.forEach(praise => {
          const type = praise.praiseType;
          praiseDistribution[type] = (praiseDistribution[type] || 0) + 1;
        });

        // Находим топ-эмодзи
        let topEmoji = '';
        let topCount = 0;
        Object.entries(praiseDistribution).forEach(([emoji, count]) => {
          if (count > topCount) {
            topEmoji = emoji;
            topCount = count;
          }
        });

        const canEdit = checkUserPermissions(userId || '', item.createdBy, userRole);
        const canDelete = checkUserPermissions(userId || '', item.createdBy, userRole);

        return {
          id: item.id,
          title: item.title,
          content: item.content,
          type: item.type,
          author: item.creator?.name || item.creator?.login || 'Пользователь',
          authorLogin: item.creator?.login || '',
          userId: item.createdBy,
          contentId: item.id,
          date: item.date.toISOString().split('T')[0],
          likes: item.likes,
          thumbnail: item.thumbnail,
          url: item.url,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          fileSize: item.fileSize,
          fileType: item.fileType,
          // 🔥 НОВОЕ ПОЛЕ для нескольких фото
          images: item.images,
          views: item.views,
          praises: {
            total: item.praises.length,
            distribution: praiseDistribution,
            topEmoji,
            topCount
          },
          canEdit,
          canDelete
        };
      });

      return {
        data: formattedItems,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('❌ Ошибка получения документов:', error);
      throw error;
    }
  }

  /**
   * Получить документ по ID
   */
  static async getItemById(itemId: string, userId?: string) {
    try {
      console.log(`🔍 getItemById - itemId: ${itemId}, userId: ${userId || 'не авторизован'}`);
      
      const item = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false },
        include: {
          creator: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          },
          section: {
            select: {
              id: true,
              title: true
            }
          },
          subsection: {
            select: {
              id: true,
              title: true
            }
          },
          praises: {
            select: {
              praiseType: true
            }
          }
        }
      });

      if (!item) {
        throw new Error('Документ не найден');
      }

      // 👇 ИСПОЛЬЗУЕМ ПРИВЕДЕНИЕ ТИПА ДЛЯ updatedAt
      const updatedAt = (item as any).updatedAt;

      // Увеличиваем счетчик просмотров
      await prisma.libraryItem.update({
        where: { id: itemId },
        data: { views: { increment: 1 } }
      });

      // Статистика похвал
      const praiseDistribution: Record<string, number> = {};
      item.praises.forEach(praise => {
        const type = praise.praiseType;
        praiseDistribution[type] = (praiseDistribution[type] || 0) + 1;
      });

      // Находим топ-эмодзи
      let topEmoji = '';
      let topCount = 0;
      Object.entries(praiseDistribution).forEach(([emoji, count]) => {
        if (count > topCount) {
          topEmoji = emoji;
          topCount = count;
        }
      });

      // Получаем роль пользователя для проверки прав
      let userRole: UserRole | undefined;
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        userRole = user?.role;
      }

      const canEdit = checkUserPermissions(userId || '', item.createdBy, userRole);
      const canDelete = checkUserPermissions(userId || '', item.createdBy, userRole);

      return {
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        author: item.creator?.name || item.creator?.login || 'Пользователь',
        authorLogin: item.creator?.login || '',
        userId: item.createdBy,
        contentId: item.id,
        date: item.date.toISOString().split('T')[0],
        likes: item.likes,
        thumbnail: item.thumbnail,
        url: item.url,
        fileUrl: item.fileUrl,
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileType: item.fileType,
        // 🔥 НОВОЕ ПОЛЕ для нескольких фото
        images: item.images,
        sectionId: item.sectionId,
        sectionTitle: item.section.title,
        subsectionId: item.subsectionId,
        subsectionTitle: item.subsection.title,
        views: item.views + 1,
        praises: {
          total: item.praises.length,
          distribution: praiseDistribution,
          topEmoji,
          topCount
        },
        canEdit,
        canDelete,
        createdAt: item.date.toISOString(),
        updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Ошибка получения документа:', error);
      throw error;
    }
  }

  /**
   * Создать новый подраздел
   */
  static async createSubsection(data: CreateSubsectionData) {
    try {
      console.log('📝 createSubsection - data:', data);
      
      // Проверяем существование раздела
      const section = await prisma.librarySection.findUnique({
        where: { id: data.sectionId, isDeleted: false }
      });

      if (!section) {
        throw new Error('Раздел не найден');
      }

      // Получаем следующий order
      const lastSubsection = await prisma.librarySubsection.findFirst({
        where: { sectionId: data.sectionId },
        orderBy: { order: 'desc' }
      });

      const newOrder = (lastSubsection?.order || 0) + 1;

      const subsection = await prisma.librarySubsection.create({
        data: {
          title: data.title,
          sectionId: data.sectionId,
          createdBy: data.createdBy,
          order: newOrder,
          editCount: 0,
          isDeleted: false
        }
      });

      console.log('✅ Подраздел создан:', subsection.id);

      return {
        id: subsection.id,
        title: subsection.title,
        sectionId: subsection.sectionId,
        createdBy: subsection.createdBy,
        createdAt: subsection.createdAt.toISOString()
      };
    } catch (error) {
      console.error('❌ Ошибка создания подраздела:', error);
      throw error;
    }
  }

  /**
   * Создать новый документ
   * 🔥 ОБНОВЛЕНО: добавлена поддержка images с подробными логами
   */
  static async createItem(data: CreateItemData) {
    try {
      console.log('📝 createItem - data:', data);
      console.log('📸 images в запросе:', data.images ? data.images.length : 0);
      
      // Проверяем существование раздела и подраздела
      const [section, subsection] = await Promise.all([
        prisma.librarySection.findUnique({
          where: { id: data.sectionId, isDeleted: false }
        }),
        prisma.librarySubsection.findUnique({
          where: { id: data.subsectionId, isDeleted: false }
        })
      ]);

      if (!section) {
        throw new Error('Раздел не найден');
      }

      if (!subsection) {
        throw new Error('Подраздел не найден');
      }

      // 🔥 Подготавливаем данные для создания
      const createData: any = {
        title: data.title,
        content: data.content,
        type: data.type,
        date: new Date(),
        likes: 0,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        thumbnail: data.thumbnail,
        views: 0,
        createdBy: data.createdBy,
        sectionId: data.sectionId,
        subsectionId: data.subsectionId,
        editCount: 0,
        isDeleted: false
      };

      // 🔥 Добавляем images, если они есть
      if (data.images && data.images.length > 0) {
        console.log('📸 Сохраняем images:', data.images.length);
        createData.images = JSON.parse(JSON.stringify(data.images));
      }

      const item = await prisma.libraryItem.create({
        data: createData,
        include: {
          creator: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      console.log('✅ Документ создан:', item.id);
      console.log('📸 Количество сохраненных images:', item.images ? (item.images as any[]).length : 0);

      return {
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        author: item.creator?.name || item.creator?.login || 'Пользователь',
        authorLogin: item.creator?.login || '',
        userId: item.createdBy,
        contentId: item.id,
        date: item.date.toISOString().split('T')[0],
        likes: 0,
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileType: item.fileType,
        fileUrl: item.fileUrl,
        thumbnail: item.thumbnail,
        // 🔥 НОВОЕ ПОЛЕ для нескольких фото
        images: item.images,
        views: 0,
        createdAt: item.date.toISOString()
      };
    } catch (error) {
      console.error('❌ Ошибка создания документа:', error);
      throw error;
    }
  }

  /**
   * Обновить подраздел
   */
  static async updateSubsection(subsectionId: string, userId: string, data: UpdateSubsectionData) {
    try {
      console.log(`📝 updateSubsection - subsectionId: ${subsectionId}, userId: ${userId}, data:`, data);
      
      const subsection = await prisma.librarySubsection.findUnique({
        where: { id: subsectionId, isDeleted: false }
      });

      if (!subsection) {
        throw new Error('Подраздел не найден');
      }

      // Проверка прав
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const canEdit = checkUserPermissions(userId, subsection.createdBy, user?.role);
      if (!canEdit) {
        throw new Error('Нет прав на редактирование этого подраздела');
      }

      const updatedSubsection = await prisma.librarySubsection.update({
        where: { id: subsectionId },
        data: {
          ...data,
          updatedBy: userId,
          editCount: { increment: 1 }
        }
      });

      console.log('✅ Подраздел обновлен:', updatedSubsection.id);

      return {
        id: updatedSubsection.id,
        title: updatedSubsection.title,
        updatedAt: updatedSubsection.updatedAt.toISOString(),
        editCount: updatedSubsection.editCount
      };
    } catch (error) {
      console.error('❌ Ошибка обновления подраздела:', error);
      throw error;
    }
  }

  /**
   * Обновить документ
   * 🔥 ОБНОВЛЕНО: добавлена поддержка images
   */
  static async updateItem(itemId: string, userId: string, data: UpdateItemData) {
    try {
      console.log(`📝 updateItem - itemId: ${itemId}, userId: ${userId}, data:`, data);
      
      const item = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false }
      });

      if (!item) {
        throw new Error('Документ не найден');
      }

      // Проверка прав
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const canEdit = checkUserPermissions(userId, item.createdBy, user?.role);
      if (!canEdit) {
        throw new Error('Нет прав на редактирование этого документа');
      }

      // 🔥 Подготавливаем данные для обновления
      const updateData: any = {
        ...data,
        updatedBy: userId,
        editCount: { increment: 1 }
      };

      // 🔥 Обрабатываем images отдельно, если они есть
      if (data.images) {
        console.log('📸 Обновляем images:', data.images.length);
        updateData.images = JSON.parse(JSON.stringify(data.images));
      }

      const updatedItem = await prisma.libraryItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              login: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // 👇 ИСПОЛЬЗУЕМ ПРИВЕДЕНИЕ ТИПА ДЛЯ updatedAt
      const updatedAt = (updatedItem as any).updatedAt;

      console.log('✅ Документ обновлен:', updatedItem.id);
      console.log('📸 Количество images после обновления:', updatedItem.images ? (updatedItem.images as any[]).length : 0);

      return {
        id: updatedItem.id,
        title: updatedItem.title,
        content: updatedItem.content,
        type: updatedItem.type,
        fileName: updatedItem.fileName,
        fileSize: updatedItem.fileSize,
        fileUrl: updatedItem.fileUrl,
        thumbnail: updatedItem.thumbnail,
        // 🔥 НОВОЕ ПОЛЕ для нескольких фото
        images: updatedItem.images,
        updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
        editCount: updatedItem.editCount
      };
    } catch (error) {
      console.error('❌ Ошибка обновления документа:', error);
      throw error;
    }
  }

  /**
   * Удалить подраздел (мягкое удаление)
   */
  static async deleteSubsection(subsectionId: string, userId: string) {
    try {
      console.log(`🗑️ deleteSubsection - subsectionId: ${subsectionId}, userId: ${userId}`);
      
      const subsection = await prisma.librarySubsection.findUnique({
        where: { id: subsectionId, isDeleted: false }
      });

      if (!subsection) {
        throw new Error('Подраздел не найден');
      }

      // Проверка прав
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const canDelete = checkUserPermissions(userId, subsection.createdBy, user?.role);
      if (!canDelete) {
        throw new Error('Нет прав на удаление этого подраздела');
      }

      // Мягкое удаление подраздела и всех его документов
      await prisma.$transaction([
        prisma.libraryItem.updateMany({
          where: { subsectionId },
          data: { 
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
          }
        }),
        prisma.librarySubsection.update({
          where: { id: subsectionId },
          data: { 
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
          }
        })
      ]);

      console.log('✅ Подраздел удален');

      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления подраздела:', error);
      throw error;
    }
  }

  /**
   * Удалить документ (мягкое удаление)
   */
  static async deleteItem(itemId: string, userId: string) {
    try {
      console.log(`🗑️ deleteItem - itemId: ${itemId}, userId: ${userId}`);
      
      const item = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false }
      });

      if (!item) {
        throw new Error('Документ не найден');
      }

      // Проверка прав
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const canDelete = checkUserPermissions(userId, item.createdBy, user?.role);
      if (!canDelete) {
        throw new Error('Нет прав на удаление этого документа');
      }

      await prisma.libraryItem.update({
        where: { id: itemId },
        data: { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId
        }
      });

      console.log('✅ Документ удален');

      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления документа:', error);
      throw error;
    }
  }

  /**
   * Поставить лайк документу
   */
  static async likeItem(itemId: string, userId: string) {
    try {
      console.log(`❤️ likeItem - itemId: ${itemId}, userId: ${userId}`);
      
      const item = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false }
      });

      if (!item) {
        throw new Error('Документ не найден');
      }

      // Проверяем, не лайкал ли пользователь уже
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          contentId: itemId
        }
      });

      if (existingLike) {
        throw new Error('Вы уже лайкнули этот документ');
      }

      // Создаем лайк
      await prisma.like.create({
        data: {
          userId,
          contentId: itemId
        }
      });

      // Увеличиваем счетчик лайков
      const updatedItem = await prisma.libraryItem.update({
        where: { id: itemId },
        data: { likes: { increment: 1 } }
      });

      // Создаем уведомление автору
      if (item.createdBy !== userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { login: true }
        });

        await prisma.userNotification.create({
          data: {
            userId: item.createdBy,
            type: 'LIKE',
            title: 'Новый лайк',
            message: `Пользователь ${user?.login} оценил ваш документ "${item.title}"`,
            link: `/library/item/${itemId}`,
            read: false
          }
        });
      }

      console.log(`✅ Лайк поставлен, всего лайков: ${updatedItem.likes}`);

      return { 
        likes: updatedItem.likes,
        userLiked: true 
      };
    } catch (error) {
      console.error('❌ Ошибка при лайке:', error);
      throw error;
    }
  }

  /**
   * Убрать лайк с документа
   */
  static async unlikeItem(itemId: string, userId: string) {
    try {
      console.log(`💔 unlikeItem - itemId: ${itemId}, userId: ${userId}`);
      
      const item = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false }
      });

      if (!item) {
        throw new Error('Документ не найден');
      }

      // Проверяем, лайкал ли пользователь
      const existingLike = await prisma.like.findFirst({
        where: {
          userId,
          contentId: itemId
        }
      });

      if (!existingLike) {
        throw new Error('Вы еще не лайкнули этот документ');
      }

      // Удаляем лайк
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      // Уменьшаем счетчик лайков
      const updatedItem = await prisma.libraryItem.update({
        where: { id: itemId },
        data: { likes: { decrement: 1 } }
      });

      console.log(`✅ Лайк убран, всего лайков: ${updatedItem.likes}`);

      return { 
        likes: updatedItem.likes,
        userLiked: false 
      };
    } catch (error) {
      console.error('❌ Ошибка при снятии лайка:', error);
      throw error;
    }
  }

  /**
   * Проверить права на редактирование документа
   */
  static async canEditItem(itemId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🔍 canEditItem - itemId: ${itemId}, userId: ${userId}`);
      
      const item = await prisma.libraryItem.findUnique({
        where: { id: itemId, isDeleted: false }
      });

      if (!item) {
        throw new Error('Документ не найден');
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const result = checkUserPermissions(userId, item.createdBy, user?.role);
      console.log(`✅ Результат проверки: ${result}`);

      return result;
    } catch (error) {
      console.error('❌ Ошибка проверки прав:', error);
      return false;
    }
  }

  /**
   * Проверить права на редактирование подраздела
   */
  static async canEditSubsection(subsectionId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🔍 canEditSubsection - subsectionId: ${subsectionId}, userId: ${userId}`);
      
      const subsection = await prisma.librarySubsection.findUnique({
        where: { id: subsectionId, isDeleted: false }
      });

      if (!subsection) {
        throw new Error('Подраздел не найден');
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const result = checkUserPermissions(userId, subsection.createdBy, user?.role);
      console.log(`✅ Результат проверки: ${result}`);

      return result;
    } catch (error) {
      console.error('❌ Ошибка проверки прав:', error);
      return false;
    }
  }

  /**
   * Получить статистику библиотеки
   */
  static async getStats() {
    try {
      console.log('📊 getStats - получение статистики библиотеки');
      
      const [totalItems, totalSections, totalSubsections, byType] = await Promise.all([
        prisma.libraryItem.count({ where: { isDeleted: false } }),
        prisma.librarySection.count({ where: { isDeleted: false, isActive: true } }),
        prisma.librarySubsection.count({ where: { isDeleted: false } }),
        prisma.libraryItem.groupBy({
          by: ['type'],
          _count: true,
          where: { isDeleted: false }
        })
      ]);

      const recentItems = await prisma.libraryItem.findMany({
        where: { isDeleted: false },
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          creator: {
            select: {
              login: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      const byTypeObj: Record<string, number> = {};
      byType.forEach(item => {
        byTypeObj[item.type] = item._count;
      });

      console.log('📊 Статистика получена');

      return {
        totalItems,
        totalSections,
        totalSubsections,
        byType: byTypeObj,
        recentItems: recentItems.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          author: item.creator?.name || item.creator?.login,
          date: item.date.toISOString().split('T')[0],
          views: item.views
        }))
      };
    } catch (error) {
      console.error('❌ Ошибка получения статистики библиотеки:', error);
      throw error;
    }
  }

  /**
   * Поиск по библиотеке
   */
  static async search(params: SearchParams, userId?: string) {
    try {
      console.log('🔍 search - params:', params, 'userId:', userId);
      
      const { query, type, sectionId, page, limit } = params;
      const skip = (page - 1) * limit;

      const where: any = {
        isDeleted: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      };

      if (type) {
        where.type = type;
      }

      if (sectionId) {
        where.sectionId = sectionId;
      }

      const [items, total] = await Promise.all([
        prisma.libraryItem.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: 'desc' },
          include: {
            creator: {
              select: {
                id: true,
                login: true,
                name: true,
                avatar: true
              }
            },
            section: {
              select: {
                id: true,
                title: true
              }
            },
            subsection: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }),
        prisma.libraryItem.count({ where })
      ]);

      // Получаем роль пользователя для проверки прав
      let userRole: UserRole | undefined;
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        userRole = user?.role;
      }

      const formattedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content.substring(0, 200) + '...',
        type: item.type,
        author: item.creator?.name || item.creator?.login,
        authorLogin: item.creator?.login,
        userId: item.createdBy,
        date: item.date.toISOString().split('T')[0],
        likes: item.likes,
        views: item.views,
        thumbnail: item.thumbnail,
        // 🔥 НОВОЕ ПОЛЕ для нескольких фото (опционально в поиске)
        images: item.images,
        sectionId: item.sectionId,
        sectionTitle: item.section.title,
        subsectionId: item.subsectionId,
        subsectionTitle: item.subsection.title,
        canEdit: checkUserPermissions(userId || '', item.createdBy, userRole)
      }));

      console.log(`✅ Найдено ${formattedItems.length} документов из ${total}`);

      return {
        data: formattedItems,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      throw error;
    }
  }
}