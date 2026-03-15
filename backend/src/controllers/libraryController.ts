// backend/src/controllers/libraryController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LibraryService } from '../services/libraryService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class LibraryController {
  /**
   * GET /api/library/sections
   * Получить все разделы библиотеки (стеллажи)
   */
  static async getAllSections(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/library/sections - Запрос получен');
      
      const sections = await LibraryService.getAllSections(req.user?.id);
      
      console.log(`✅ Загружено ${sections.length} разделов библиотеки`);
      
      res.json(createSuccessResponse(sections));
    } catch (error) {
      console.error('❌ Ошибка получения разделов библиотеки:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении разделов библиотеки'));
    }
  }

  /**
   * GET /api/library/sections/:sectionId
   * Получить раздел по ID
   */
  static async getSectionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sectionId } = req.params;
      console.log(`📥 GET /api/library/sections/${sectionId} - Запрос получен`);

      if (!sectionId) {
        res.status(400).json(createErrorResponse('ID раздела не указан'));
        return;
      }

      const section = await LibraryService.getSectionById(sectionId, req.user?.id);
      
      console.log(`✅ Раздел "${section.title}" загружен`);
      
      res.json(createSuccessResponse(section));
    } catch (error: any) {
      if (error.message === 'Раздел не найден') {
        console.warn(`⚠️ Раздел с ID ${req.params.sectionId} не найден`);
        res.status(404).json(createErrorResponse('Раздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка получения раздела:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении раздела'));
    }
  }

  /**
   * GET /api/library/sections/:sectionId/subsections
   * Получить подразделы раздела
   */
  static async getSubsections(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sectionId } = req.params;
      console.log(`📥 GET /api/library/sections/${sectionId}/subsections - Запрос получен`);

      if (!sectionId) {
        res.status(400).json(createErrorResponse('ID раздела не указан'));
        return;
      }

      const subsections = await LibraryService.getSubsections(sectionId, req.user?.id);
      
      console.log(`✅ Загружено ${subsections.length} подразделов`);
      
      res.json(createSuccessResponse(subsections));
    } catch (error: any) {
      if (error.message === 'Раздел не найден') {
        console.warn(`⚠️ Раздел с ID ${req.params.sectionId} не найден`);
        res.status(404).json(createErrorResponse('Раздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка получения подразделов:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении подразделов'));
    }
  }

  /**
   * GET /api/library/subsections/:subsectionId
   * Получить подраздел по ID
   */
  static async getSubsectionById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subsectionId } = req.params;
      console.log(`📥 GET /api/library/subsections/${subsectionId} - Запрос получен`);

      if (!subsectionId) {
        res.status(400).json(createErrorResponse('ID подраздела не указан'));
        return;
      }

      const subsection = await LibraryService.getSubsectionById(subsectionId, req.user?.id);
      
      console.log(`✅ Подраздел "${subsection.title}" загружен, документов: ${subsection.itemCount}`);
      
      res.json(createSuccessResponse(subsection));
    } catch (error: any) {
      if (error.message === 'Подраздел не найден') {
        console.warn(`⚠️ Подраздел с ID ${req.params.subsectionId} не найден`);
        res.status(404).json(createErrorResponse('Подраздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка получения подраздела:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении подраздела'));
    }
  }

  /**
   * GET /api/library/subsections/:subsectionId/items
   * Получить элементы подраздела с пагинацией
   */
  static async getItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subsectionId } = req.params;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      console.log(`📥 GET /api/library/subsections/${subsectionId}/items - Запрос получен`);
      console.log('🔍 Параметры пагинации:', { page, limit });

      if (!subsectionId) {
        res.status(400).json(createErrorResponse('ID подраздела не указан'));
        return;
      }

      // Валидация page
      if (isNaN(page) || page < 1) {
        res.status(400).json(createErrorResponse('Некорректный номер страницы'));
        return;
      }

      // Валидация limit
      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json(createErrorResponse('Некорректный лимит (должен быть от 1 до 100)'));
        return;
      }

      const result = await LibraryService.getItems(subsectionId, req.user?.id, page, limit);
      
      console.log(`✅ Загружено ${result.data.length} из ${result.total} документов`);
      console.log(`📄 Страница ${result.page} из ${Math.ceil(result.total / result.limit)}`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Подраздел не найден') {
        console.warn(`⚠️ Подраздел с ID ${req.params.subsectionId} не найден`);
        res.status(404).json(createErrorResponse('Подраздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка получения документов:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении документов'));
    }
  }

  /**
   * GET /api/library/items/:itemId
   * Получить документ по ID
   */
  static async getItemById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      console.log(`📥 GET /api/library/items/${itemId} - Запрос получен`);

      if (!itemId) {
        res.status(400).json(createErrorResponse('ID документа не указан'));
        return;
      }

      const item = await LibraryService.getItemById(itemId, req.user?.id);
      
      console.log(`✅ Документ "${item.title}" загружен`);
      
      res.json(createSuccessResponse(item));
    } catch (error: any) {
      if (error.message === 'Документ не найден') {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      
      console.error('❌ Ошибка получения документа:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении документа'));
    }
  }

  /**
   * POST /api/library/items/:itemId/views
   * Увеличить счетчик просмотров документа
   */
  static async incrementViews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      console.log(`📥 POST /api/library/items/${itemId}/views - Запрос получен`);

      if (!itemId) {
        res.status(400).json(createErrorResponse('ID документа не указан'));
        return;
      }

      const result = await LibraryService.incrementViews(itemId);
      
      console.log(`✅ Просмотры документа ${itemId} увеличены: ${result.views}`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.code === 'P2025' || error.message?.includes('не найден')) {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      
      console.error('❌ Ошибка увеличения просмотров:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при увеличении счетчика просмотров'));
    }
  }

  /**
   * POST /api/library/subsections
   * Создать новый подраздел
   */
  static async createSubsection(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 POST /api/library/subsections - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка создания подраздела без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      console.log('👤 Пользователь:', req.user.id, req.user.login);
      console.log('📦 Тело запроса:', JSON.stringify(req.body, null, 2));

      const { title, sectionId } = req.body;

      // Валидация
      if (!title || title.trim().length < 3) {
        res.status(400).json(createErrorResponse('Название подраздела должно содержать минимум 3 символа'));
        return;
      }

      if (!sectionId) {
        res.status(400).json(createErrorResponse('ID раздела не указан'));
        return;
      }

      const subsection = await LibraryService.createSubsection({
        title: title.trim(),
        sectionId,
        createdBy: req.user.id
      });

      console.log(`✅ Подраздел "${subsection.title}" успешно создан с ID: ${subsection.id}`);
      
      res.json(createSuccessResponse(subsection));
    } catch (error: any) {
      if (error.message === 'Раздел не найден') {
        console.warn(`⚠️ Раздел с ID ${req.body.sectionId} не найден`);
        res.status(404).json(createErrorResponse('Раздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка создания подраздела:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      if (error.name === 'PrismaClientValidationError') {
        res.status(400).json(createErrorResponse('Ошибка валидации данных'));
        return;
      }
      
      res.status(500).json(createErrorResponse(error.message || 'Ошибка при создании подраздела'));
    }
  }

  /**
   * POST /api/library/items
   * Создать новый документ
   */
  static async createItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 POST /api/library/items - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка создания документа без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      console.log('👤 Пользователь:', req.user.id, req.user.login);
      console.log('📦 Тело запроса:', JSON.stringify(req.body, null, 2));

      const { title, content, type, sectionId, subsectionId, fileName, fileSize, fileType, fileUrl, thumbnail, images } = req.body;

      // Валидация
      if (!title || title.trim().length < 3) {
        res.status(400).json(createErrorResponse('Название документа должно содержать минимум 3 символа'));
        return;
      }

      if (!type || !['text', 'photo', 'drawing', 'video', 'other'].includes(type)) {
        res.status(400).json(createErrorResponse('Некорректный тип документа'));
        return;
      }

      if (!sectionId) {
        res.status(400).json(createErrorResponse('ID раздела не указан'));
        return;
      }

      if (!subsectionId) {
        res.status(400).json(createErrorResponse('ID подраздела не указан'));
        return;
      }

      // Для text типа проверяем наличие content
      if (type === 'text' && (!content || content.trim().length < 10)) {
        res.status(400).json(createErrorResponse('Содержание документа должно содержать минимум 10 символов'));
        return;
      }

      // Для других типов проверяем наличие файла
      if (type !== 'text' && !fileUrl && (!images || images.length === 0)) {
        res.status(400).json(createErrorResponse('Необходимо загрузить файл или фотографии'));
        return;
      }

      console.log('📸 Количество images в запросе:', images ? images.length : 0);

      const itemData: any = {
        title: title.trim(),
        content: content?.trim() || '',
        type,
        sectionId,
        subsectionId,
        createdBy: req.user.id,
        author: req.user.login,
        authorLogin: req.user.login,
        fileName,
        fileSize: fileSize ? Number(fileSize) : undefined,
        fileType,
        fileUrl,
        thumbnail
      };

      // 🔥 ВАЖНО: добавляем images в данные
      if (images && images.length > 0) {
        itemData.images = images;
        console.log('📸 Добавляем images в itemData:', images.length);
      }

      const item = await LibraryService.createItem(itemData);

      console.log(`✅ Документ "${item.title}" успешно создан с ID: ${item.id}`);
      if (item.images && (item.images as any[]).length > 0) {
        console.log(`📸 Сохранено фотографий: ${(item.images as any[]).length}`);
      }
      
      res.json(createSuccessResponse(item));
    } catch (error: any) {
      if (error.message === 'Раздел не найден') {
        console.warn(`⚠️ Раздел с ID ${req.body.sectionId} не найден`);
        res.status(404).json(createErrorResponse('Раздел не найден'));
        return;
      }
      if (error.message === 'Подраздел не найден') {
        console.warn(`⚠️ Подраздел с ID ${req.body.subsectionId} не найден`);
        res.status(404).json(createErrorResponse('Подраздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка создания документа:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      if (error.name === 'PrismaClientValidationError') {
        res.status(400).json(createErrorResponse('Ошибка валидации данных'));
        return;
      }
      
      res.status(500).json(createErrorResponse(error.message || 'Ошибка при создании документа'));
    }
  }

  /**
   * PUT /api/library/subsections/:subsectionId
   * Обновить подраздел
   */
  static async updateSubsection(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 PUT /api/library/subsections/${req.params.subsectionId} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка обновления подраздела без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { subsectionId } = req.params;
      const { title } = req.body;

      console.log('👤 Пользователь:', req.user.id, req.user.login);
      console.log('📦 Данные для обновления:', { title });

      if (!title || title.trim().length < 3) {
        res.status(400).json(createErrorResponse('Название подраздела должно содержать минимум 3 символа'));
        return;
      }

      const updatedSubsection = await LibraryService.updateSubsection(
        subsectionId,
        req.user.id,
        { title: title.trim() }
      );

      console.log(`✅ Подраздел "${updatedSubsection.title}" успешно обновлен`);
      
      res.json(createSuccessResponse(updatedSubsection));
    } catch (error: any) {
      if (error.message === 'Подраздел не найден') {
        console.warn(`⚠️ Подраздел с ID ${req.params.subsectionId} не найден`);
        res.status(404).json(createErrorResponse('Подраздел не найден'));
        return;
      }
      if (error.message === 'Нет прав на редактирование этого подраздела') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался редактировать чужой подраздел ${req.params.subsectionId}`);
        res.status(403).json(createErrorResponse('Нет прав на редактирование этого подраздела'));
        return;
      }
      
      console.error('❌ Ошибка обновления подраздела:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при обновлении подраздела'));
    }
  }

  /**
   * PUT /api/library/items/:itemId
   * Обновить документ
   */
  static async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 PUT /api/library/items/${req.params.itemId} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка обновления документа без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { itemId } = req.params;
      const { title, content, fileName, fileSize, fileType, fileUrl, thumbnail, images } = req.body;

      console.log('👤 Пользователь:', req.user.id, req.user.login);
      console.log('📦 Данные для обновления:', { title, content, fileName, fileSize, imagesCount: images?.length });

      // Валидация
      if (title && title.trim().length < 3) {
        res.status(400).json(createErrorResponse('Название документа должно содержать минимум 3 символа'));
        return;
      }

      const updateData: any = {};
      if (title) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content?.trim() || '';
      if (fileName) updateData.fileName = fileName;
      if (fileSize) updateData.fileSize = Number(fileSize);
      if (fileType) updateData.fileType = fileType;
      if (fileUrl) updateData.fileUrl = fileUrl;
      if (thumbnail) updateData.thumbnail = thumbnail;
      
      // 🔥 ВАЖНО: добавляем images в данные обновления
      if (images) {
        updateData.images = images;
        console.log('📸 Обновляем images:', images.length);
      }

      const updatedItem = await LibraryService.updateItem(
        itemId,
        req.user.id,
        updateData
      );

      console.log(`✅ Документ "${updatedItem.title}" успешно обновлен`);
      if (updatedItem.images && (updatedItem.images as any[]).length > 0) {
        console.log(`📸 Обновлено фотографий: ${(updatedItem.images as any[]).length}`);
      }
      
      res.json(createSuccessResponse(updatedItem));
    } catch (error: any) {
      if (error.message === 'Документ не найден') {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      if (error.message === 'Нет прав на редактирование этого документа') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался редактировать чужой документ ${req.params.itemId}`);
        res.status(403).json(createErrorResponse('Нет прав на редактирование этого документа'));
        return;
      }
      
      console.error('❌ Ошибка обновления документа:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при обновлении документа'));
    }
  }

  /**
   * DELETE /api/library/subsections/:subsectionId
   * Удалить подраздел
   */
  static async deleteSubsection(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 DELETE /api/library/subsections/${req.params.subsectionId} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка удаления подраздела без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { subsectionId } = req.params;
      console.log('👤 Пользователь:', req.user.id, req.user.login);

      const result = await LibraryService.deleteSubsection(subsectionId, req.user.id);
      
      console.log(`✅ Подраздел ${subsectionId} успешно удален`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Подраздел не найден') {
        console.warn(`⚠️ Подраздел с ID ${req.params.subsectionId} не найден`);
        res.status(404).json(createErrorResponse('Подраздел не найден'));
        return;
      }
      if (error.message === 'Нет прав на удаление этого подраздела') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался удалить чужой подраздел ${req.params.subsectionId}`);
        res.status(403).json(createErrorResponse('Нет прав на удаление этого подраздела'));
        return;
      }
      
      console.error('❌ Ошибка удаления подраздела:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при удалении подраздела'));
    }
  }

  /**
   * DELETE /api/library/items/:itemId
   * Удалить документ
   */
  static async deleteItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 DELETE /api/library/items/${req.params.itemId} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка удаления документа без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { itemId } = req.params;
      console.log('👤 Пользователь:', req.user.id, req.user.login);

      const result = await LibraryService.deleteItem(itemId, req.user.id);
      
      console.log(`✅ Документ ${itemId} успешно удален`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Документ не найден') {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      if (error.message === 'Нет прав на удаление этого документа') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался удалить чужой документ ${req.params.itemId}`);
        res.status(403).json(createErrorResponse('Нет прав на удаление этого документа'));
        return;
      }
      
      console.error('❌ Ошибка удаления документа:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при удалении документа'));
    }
  }

  /**
   * POST /api/library/items/:itemId/like
   * Поставить лайк документу
   */
  static async likeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 POST /api/library/items/${req.params.itemId}/like - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка лайка без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { itemId } = req.params;
      const userId = req.user.id;

      const result = await LibraryService.likeItem(itemId, userId);
      
      console.log(`✅ Лайк поставлен документу ${itemId}, всего лайков: ${result.likes}`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Документ не найден') {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      if (error.message === 'Вы уже лайкнули этот документ') {
        console.warn(`⚠️ Пользователь ${req.user?.id} уже лайкнул документ ${req.params.itemId}`);
        res.status(400).json(createErrorResponse('Вы уже лайкнули этот документ'));
        return;
      }
      
      console.error('❌ Ошибка при лайке:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при лайке документа'));
    }
  }

  /**
   * DELETE /api/library/items/:itemId/like
   * Убрать лайк с документа
   */
  static async unlikeItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 DELETE /api/library/items/${req.params.itemId}/like - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка убрать лайк без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { itemId } = req.params;
      const userId = req.user.id;

      const result = await LibraryService.unlikeItem(itemId, userId);
      
      console.log(`✅ Лайк убран с документа ${itemId}, всего лайков: ${result.likes}`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Документ не найден') {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      if (error.message === 'Вы еще не лайкнули этот документ') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытается убрать несуществующий лайк с документа ${req.params.itemId}`);
        res.status(400).json(createErrorResponse('Вы еще не лайкнули этот документ'));
        return;
      }
      
      console.error('❌ Ошибка при снятии лайка:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при снятии лайка'));
    }
  }

  /**
   * GET /api/library/items/:itemId/can-edit
   * Проверить права на редактирование документа
   */
  static async canEditItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      console.log(`📥 GET /api/library/items/${itemId}/can-edit - Запрос получен`);

      if (!req.user) {
        res.json(createSuccessResponse({ canEdit: false }));
        return;
      }

      const canEdit = await LibraryService.canEditItem(itemId, req.user.id);
      
      console.log(`✅ Права на редактирование документа ${itemId}: ${canEdit}`);
      
      res.json(createSuccessResponse({ canEdit }));
    } catch (error: any) {
      if (error.message === 'Документ не найден') {
        console.warn(`⚠️ Документ с ID ${req.params.itemId} не найден`);
        res.status(404).json(createErrorResponse('Документ не найден'));
        return;
      }
      
      console.error('❌ Ошибка проверки прав:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при проверке прав'));
    }
  }

  /**
   * GET /api/library/subsections/:subsectionId/can-edit
   * Проверить права на редактирование подраздела
   */
  static async canEditSubsection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { subsectionId } = req.params;
      console.log(`📥 GET /api/library/subsections/${subsectionId}/can-edit - Запрос получен`);

      if (!req.user) {
        res.json(createSuccessResponse({ canEdit: false }));
        return;
      }

      const canEdit = await LibraryService.canEditSubsection(subsectionId, req.user.id);
      
      console.log(`✅ Права на редактирование подраздела ${subsectionId}: ${canEdit}`);
      
      res.json(createSuccessResponse({ canEdit }));
    } catch (error: any) {
      if (error.message === 'Подраздел не найден') {
        console.warn(`⚠️ Подраздел с ID ${req.params.subsectionId} не найден`);
        res.status(404).json(createErrorResponse('Подраздел не найден'));
        return;
      }
      
      console.error('❌ Ошибка проверки прав:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при проверке прав'));
    }
  }

  /**
   * GET /api/library/stats
   * Получить статистику библиотеки
   */
  static async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/library/stats - Запрос получен');

      const stats = await LibraryService.getStats();
      
      console.log('✅ Статистика библиотеки получена');
      console.log(`📊 Всего документов: ${stats.totalItems}`);
      console.log(`📊 Всего разделов: ${stats.totalSections}`);
      console.log(`📊 Всего подразделов: ${stats.totalSubsections}`);
      
      res.json(createSuccessResponse(stats));
    } catch (error) {
      console.error('❌ Ошибка получения статистики библиотеки:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при получении статистики библиотеки'));
    }
  }

  /**
   * GET /api/library/search
   * Поиск по библиотеке
   */
  static async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/library/search - Запрос получен');
      console.log('🔍 Параметры поиска:', req.query);

      const { q, type, sectionId, page = 1, limit = 20 } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json(createErrorResponse('Поисковый запрос должен содержать минимум 2 символа'));
        return;
      }

      const searchParams = {
        query: q.trim(),
        type: type as string,
        sectionId: sectionId as string,
        page: Number(page),
        limit: Number(limit)
      };

      // Валидация page
      if (isNaN(searchParams.page) || searchParams.page < 1) {
        res.status(400).json(createErrorResponse('Некорректный номер страницы'));
        return;
      }

      // Валидация limit
      if (isNaN(searchParams.limit) || searchParams.limit < 1 || searchParams.limit > 50) {
        res.status(400).json(createErrorResponse('Некорректный лимит (должен быть от 1 до 50)'));
        return;
      }

      const results = await LibraryService.search(searchParams, req.user?.id);
      
      console.log(`✅ Найдено ${results.data.length} из ${results.total} документов по запросу "${q}"`);
      console.log(`📄 Страница ${results.page} из ${Math.ceil(results.total / results.limit)}`);
      
      res.json(createSuccessResponse(results));
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      res.status(500).json(createErrorResponse('Ошибка при поиске'));
    }
  }
}