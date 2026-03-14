// backend/src/controllers/marketController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MarketService } from '../services/marketService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

export class MarketController {
  /**
   * GET /api/market/items
   * Получить объявления с фильтрацией
   */
  static async getItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/market/items - Запрос получен');
      console.log('🔍 Query параметры:', req.query);

      const filters = {
        type: req.query.type as string,
        category: req.query.category as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        moderationStatus: req.query.moderationStatus as string
      };

      console.log('📊 Обработанные фильтры:', filters);

      // Валидация type
      if (filters.type) {
        const validTypes = ['sell', 'buy', 'free', 'exchange', 'auction'];
        if (!validTypes.includes(filters.type)) {
          console.warn(`⚠️ Некорректный тип объявления: ${filters.type}`);
          res.status(400).json(createErrorResponse('Некорректный тип объявления'));
          return;
        }
      }

      // Валидация category
      if (filters.category) {
        const validCategories = [
          'tools', 'materials', 'furniture', 'electronics', 'cooking',
          'auto', 'sport', 'robot', 'handmade', 'stolar', 'hammer', 'other'
        ];
        if (!validCategories.includes(filters.category)) {
          console.warn(`⚠️ Некорректная категория: ${filters.category}`);
          res.status(400).json(createErrorResponse('Некорректная категория'));
          return;
        }
      }

      // Валидация для moderationStatus
      if (filters.moderationStatus) {
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'];
        if (!validStatuses.includes(filters.moderationStatus.toUpperCase())) {
          console.warn(`⚠️ Некорректный статус модерации: ${filters.moderationStatus}`);
          res.status(400).json(createErrorResponse('Некорректный статус модерации'));
          return;
        }
        filters.moderationStatus = filters.moderationStatus.toUpperCase();
      }

      // Валидация page
      if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
        res.status(400).json(createErrorResponse('Некорректный номер страницы'));
        return;
      }

      // Валидация limit
      if (filters.limit && (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100)) {
        res.status(400).json(createErrorResponse('Некорректный лимит (должен быть от 1 до 100)'));
        return;
      }

      const result = await MarketService.getItems(filters);
      
      console.log(`✅ Успешно загружено ${result.items.length} из ${result.total} объявлений`);
      console.log(`📄 Страница ${result.page} из ${result.totalPages}`);
      
      res.json(createSuccessResponse(result));
    } catch (error) {
      console.error('❌ Ошибка получения объявлений:', error);
      
      if (error instanceof Error) {
        console.error('📚 Сообщение ошибки:', error.message);
        console.error('📚 Stack:', error.stack);
        
        if (error.name === 'PrismaClientValidationError') {
          console.error('🔴 Ошибка валидации Prisma:', error.message);
          res.status(500).json(createErrorResponse('Ошибка валидации данных в БД'));
          return;
        }
        if (error.name === 'PrismaClientKnownRequestError') {
          console.error('🔴 Известная ошибка Prisma:', error.message);
          res.status(500).json(createErrorResponse('Ошибка запроса к БД'));
          return;
        }
        if (error.name === 'PrismaClientInitializationError') {
          console.error('🔴 Ошибка инициализации Prisma:', error.message);
          res.status(500).json(createErrorResponse('Ошибка подключения к БД'));
          return;
        }
      }
      
      res.status(500).json(createErrorResponse('Ошибка при получении объявлений'));
    }
  }

  /**
   * GET /api/market/items/:id
   * Получить объявление по ID
   */
  static async getItemById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      console.log(`📥 GET /api/market/items/${id} - Запрос получен`);
      console.log(`👤 Текущий пользователь: ${userId || 'не авторизован'}`);

      if (!id) {
        res.status(400).json(createErrorResponse('ID объявления не указан'));
        return;
      }

      const item = await MarketService.getItemById(id, userId);
      console.log(`✅ Объявление найдено: ${item.title}`);
      console.log(`👁️ Просмотров: ${item.views}`);
      
      res.json(createSuccessResponse(item));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      
      console.error('❌ Ошибка получения объявления:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при получении объявления'));
    }
  }

  /**
   * POST /api/market/items
   * Создать новое объявление
   */
  static async createItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 POST /api/market/items - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка создания объявления без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      console.log('👤 Пользователь:', req.user.id, req.user.login);
      console.log('📦 Тело запроса:', JSON.stringify(req.body, null, 2));

      // Базовая валидация
      const { title, description, location } = req.body;
      
      if (!title || title.length < 5) {
        res.status(400).json(createErrorResponse('Название должно содержать минимум 5 символов'));
        return;
      }
      
      if (!description || description.length < 20) {
        res.status(400).json(createErrorResponse('Описание должно содержать минимум 20 символов'));
        return;
      }
      
      if (!location) {
        res.status(400).json(createErrorResponse('Укажите местоположение'));
        return;
      }

      // Валидация для полей модерации
      if (!req.body.moderationStatus) {
        console.warn('⚠️ Отсутствует статус модерации');
        res.status(400).json(createErrorResponse('Отсутствует статус модерации'));
        return;
      }

      if (!req.body.moderationFlags || !Array.isArray(req.body.moderationFlags)) {
        console.warn('⚠️ Отсутствуют флаги модерации или они не являются массивом');
        res.status(400).json(createErrorResponse('Некорректные флаги модерации'));
        return;
      }

      // Преобразуем тип из запроса в enum Prisma
      let type = req.body.type;
      if (type) {
        type = type.toUpperCase();
      }

      // Преобразуем категорию из запроса в enum Prisma
      let category = req.body.category;
      if (category) {
        category = category.toUpperCase();
      }

      // Преобразуем длительность из запроса в enum Prisma
      let duration = req.body.duration;
      if (duration) {
        const durationMap: Record<string, string> = {
          '2weeks': 'TWOWEEKS',
          '1month': 'ONEMONTH',
          '2months': 'TWOMONTHS'
        };
        duration = durationMap[duration] || duration;
      }

      // Преобразуем статус модерации в enum Prisma
      let moderationStatus = req.body.moderationStatus;
      if (moderationStatus) {
        moderationStatus = moderationStatus.toUpperCase();
      }

      const itemData = {
        ...req.body,
        type,
        category,
        duration,
        moderationStatus,
        authorId: req.user.id,
        author: req.user.login
      };

      console.log('📝 Подготовленные данные:', JSON.stringify(itemData, null, 2));

      const result = await MarketService.createItem(itemData);
      
      console.log(`✅ Объявление "${result.title}" успешно создано с ID: ${result.id}`);
      if (result.moderationFlags && result.moderationFlags.length > 0) {
        console.log(`🚩 Флаги модерации: ${result.moderationFlags.join(', ')}`);
        console.log(`📊 Статус модерации: ${result.moderationStatus}`);
      }
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      console.error('❌ Ошибка создания объявления:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      if (error.name === 'PrismaClientValidationError') {
        res.status(400).json(createErrorResponse('Ошибка валидации данных'));
        return;
      }
      
      res.status(500).json(createErrorResponse(error.message || 'Ошибка при создании объявления'));
    }
  }

  /**
   * PUT /api/market/items/:id
   * Обновить объявление
   */
  static async updateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 PUT /api/market/items/${req.params.id} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка обновления объявления без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { id } = req.params;
      console.log('👤 Пользователь:', req.user.id, req.user.login);
      console.log('📦 Тело запроса:', JSON.stringify(req.body, null, 2));

      // Преобразуем типы, если они есть в запросе
      const updateData: any = { ...req.body };
      
      if (updateData.type) {
        updateData.type = updateData.type.toUpperCase();
      }
      
      if (updateData.category) {
        updateData.category = updateData.category.toUpperCase();
      }
      
      if (updateData.duration) {
        const durationMap: Record<string, string> = {
          '2weeks': 'TWOWEEKS',
          '1month': 'ONEMONTH',
          '2months': 'TWOMONTHS'
        };
        updateData.duration = durationMap[updateData.duration] || updateData.duration;
      }

      // Преобразуем статус модерации, если он есть
      if (updateData.moderationStatus) {
        updateData.moderationStatus = updateData.moderationStatus.toUpperCase();
      }

      console.log('📝 Подготовленные данные для обновления:', JSON.stringify(updateData, null, 2));

      const result = await MarketService.updateItem(id, req.user.id, updateData);
      
      console.log(`✅ Объявление ${id} успешно обновлено`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      if (error.message === 'Нет прав на редактирование этого объявления') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался редактировать чужое объявление ${req.params.id}`);
        res.status(403).json(createErrorResponse('Нет прав на редактирование этого объявления'));
        return;
      }
      
      console.error('❌ Ошибка обновления объявления:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при обновлении объявления'));
    }
  }

  /**
   * DELETE /api/market/items/:id
   * Удалить объявление
   */
  static async deleteItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 DELETE /api/market/items/${req.params.id} - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка удаления объявления без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { id } = req.params;
      console.log('👤 Пользователь:', req.user.id, req.user.login);

      const result = await MarketService.deleteItem(id, req.user.id);
      
      console.log(`✅ Объявление ${id} успешно удалено`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      if (error.message === 'Нет прав на удаление этого объявления') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался удалить чужое объявление ${req.params.id}`);
        res.status(403).json(createErrorResponse('Нет прав на удаление этого объявления'));
        return;
      }
      
      console.error('❌ Ошибка удаления объявления:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при удалении объявления'));
    }
  }

  /**
   * POST /api/market/items/:id/views
   * Увеличить счетчик просмотров объявления
   * 🔥 ИСПРАВЛЕНО: добавляем запасной вариант получения userId из тела запроса
   */
  static async incrementViews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 🔥 ПРОБУЕМ ПОЛУЧИТЬ userId ИЗ РАЗНЫХ ИСТОЧНИКОВ
      // 1. Сначала пробуем из авторизации (req.user)
      let userId = req.user?.id;
      
      // 2. Если нет в авторизации, пробуем из тела запроса
      if (!userId && req.body && req.body.userId) {
        console.log('📥 userId из тела запроса:', req.body.userId);
        userId = req.body.userId;
      }
      
      // 3. Если нет в теле, пробуем из query параметров
      if (!userId && req.query && req.query.userId) {
        console.log('📥 userId из query параметров:', req.query.userId);
        userId = req.query.userId as string;
      }
      
      console.log(`📥 POST /api/market/items/${id}/views - Запрос получен`);
      console.log(`👤 Текущий пользователь (итоговый): ${userId || 'не авторизован'}`);
      console.log(`🔍 Источники: req.user=${req.user?.id || 'нет'}, req.body.userId=${req.body?.userId || 'нет'}`);

      if (!id) {
        res.status(400).json(createErrorResponse('ID объявления не указан'));
        return;
      }

      const result = await MarketService.incrementViews(id, userId);
      
      if (result.incremented) {
        console.log(`✅ Счетчик просмотров для объявления ${id} увеличен до ${result.views}`);
      } else {
        console.log(`ℹ️ Счетчик просмотров для объявления ${id} НЕ увеличен (текущее значение: ${result.views})`);
      }
      
      // 🔥 Возвращаем полный результат с views
      res.json(createSuccessResponse({ 
        success: true, 
        incremented: result.incremented,
        views: result.views 
      }));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      
      console.error('❌ Ошибка увеличения счетчика просмотров:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при увеличении счетчика просмотров'));
    }
  }

  /**
   * POST /api/market/contact
   * Связаться с автором объявления
   */
  static async contactAuthor(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 POST /api/market/contact - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка отправки сообщения без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { itemId, message, contactMethod } = req.body;
      
      console.log('👤 Отправитель:', req.user.id, req.user.login);
      console.log('📦 Данные сообщения:', { itemId, message, contactMethod });

      if (!itemId) {
        res.status(400).json(createErrorResponse('ID объявления не указан'));
        return;
      }

      if (!message || message.length < 10) {
        res.status(400).json(createErrorResponse('Сообщение должно содержать минимум 10 символов'));
        return;
      }

      if (!contactMethod) {
        res.status(400).json(createErrorResponse('Способ связи не указан'));
        return;
      }
      
      // Получаем информацию об объявлении, чтобы узнать автора
      const item = await MarketService.getItemById(itemId, req.user.id);
      
      const contactData = {
        itemId,
        message,
        contactMethod,
        fromUserId: req.user.id,
        toUserId: item.authorId
      };

      const result = await MarketService.contactAuthor(contactData);
      
      console.log(`✅ Сообщение по объявлению ${itemId} успешно отправлено`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Объявление не найдено') {
        console.warn(`⚠️ Объявление с ID ${req.body.itemId} не найдено`);
        res.status(404).json(createErrorResponse('Объявление не найдено'));
        return;
      }
      
      console.error('❌ Ошибка отправки сообщения:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при отправке сообщения'));
    }
  }

  /**
   * GET /api/market/categories
   * Получить список категорий
   */
  static async getCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/market/categories - Запрос получен');
      
      const categories = await MarketService.getCategories();
      
      console.log(`✅ Загружено ${categories.length} категорий`);
      
      res.json(createSuccessResponse(categories));
    } catch (error) {
      console.error('❌ Ошибка получения категорий:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при получении категорий'));
    }
  }

  // ===== МЕТОДЫ ДЛЯ СООБЩЕНИЙ =====

  /**
   * GET /api/market/messages
   * Получить сообщения текущего пользователя
   */
  static async getUserMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/market/messages - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка получения сообщений без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const messages = await MarketService.getUserMessages(req.user.id);
      
      console.log(`✅ Загружено ${messages.length} сообщений`);
      
      res.json(createSuccessResponse(messages));
    } catch (error) {
      console.error('❌ Ошибка получения сообщений:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при получении сообщений'));
    }
  }

  /**
   * GET /api/market/messages/:id/thread
   * Получить переписку по сообщению
   */
  static async getMessageThread(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 GET /api/market/messages/${req.params.id}/thread - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка получения переписки без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { id } = req.params;

      const thread = await MarketService.getMessageThread(id, req.user.id);
      
      console.log(`✅ Загружено ${thread.thread.length} сообщений в переписке`);
      
      res.json(createSuccessResponse(thread));
    } catch (error: any) {
      if (error.message === 'Сообщение не найдено') {
        console.warn(`⚠️ Сообщение с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Сообщение не найдено'));
        return;
      }
      if (error.message === 'Доступ запрещен') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался получить доступ к чужой переписке ${req.params.id}`);
        res.status(403).json(createErrorResponse('Доступ запрещен'));
        return;
      }
      if (error.message === 'Пользователь не найдено') {
        console.warn(`⚠️ Пользователь не найден для переписки ${req.params.id}`);
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      
      console.error('❌ Ошибка получения переписки:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при получении переписки'));
    }
  }

  /**
   * POST /api/market/messages/:id/reply
   * Отправить ответ на сообщение
   */
  static async sendReply(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 POST /api/market/messages/${req.params.id}/reply - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка отправки ответа без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { id } = req.params;
      const { message } = req.body;

      console.log('👤 Отправитель:', req.user.id, req.user.login);
      console.log('📦 Данные ответа:', { messageId: id, message });

      if (!message || message.length < 1) {
        res.status(400).json(createErrorResponse('Сообщение не может быть пустым'));
        return;
      }

      const result = await MarketService.sendReply({
        messageId: id,
        fromUserId: req.user.id,
        text: message
      });
      
      console.log(`✅ Ответ на сообщение ${id} успешно отправлен`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Исходное сообщение не найдено') {
        console.warn(`⚠️ Исходное сообщение с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Исходное сообщение не найдено'));
        return;
      }
      
      console.error('❌ Ошибка отправки ответа:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при отправке ответа'));
    }
  }

  /**
   * PUT /api/market/messages/:id/read
   * Отметить сообщение как прочитанное
   */
  static async markMessageAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(`📥 PUT /api/market/messages/${req.params.id}/read - Запрос получен`);

      if (!req.user) {
        console.warn('⚠️ Попытка отметки сообщения без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const { id } = req.params;

      const result = await MarketService.markMessageAsRead(id, req.user.id);
      
      console.log(`✅ Сообщение ${id} отмечено как прочитанное`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      if (error.message === 'Сообщение не найдено') {
        console.warn(`⚠️ Сообщение с ID ${req.params.id} не найдено`);
        res.status(404).json(createErrorResponse('Сообщение не найдено'));
        return;
      }
      if (error.message === 'Нет прав на отметку этого сообщения') {
        console.warn(`⚠️ Пользователь ${req.user?.id} пытался отметить чужое сообщение ${req.params.id}`);
        res.status(403).json(createErrorResponse('Нет прав на отметку этого сообщения'));
        return;
      }
      
      console.error('❌ Ошибка отметки сообщения:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при отметке сообщения'));
    }
  }

  /**
   * GET /api/market/messages/unread/count
   * Получить количество непрочитанных сообщений
   */
  static async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📥 GET /api/market/messages/unread/count - Запрос получен');

      if (!req.user) {
        console.warn('⚠️ Попытка получения количества сообщений без авторизации');
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }

      const count = await MarketService.getUnreadCount(req.user.id);
      
      console.log(`✅ Непрочитанных сообщений: ${count}`);
      
      res.json(createSuccessResponse({ count }));
    } catch (error) {
      console.error('❌ Ошибка получения количества непрочитанных:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      res.status(500).json(createErrorResponse('Ошибка при получении количества непрочитанных'));
    }
  }
}