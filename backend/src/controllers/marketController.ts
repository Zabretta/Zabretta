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
        limit: req.query.limit ? Number(req.query.limit) : undefined
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
      
      // Детальная информация об ошибке
      if (error instanceof Error) {
        console.error('📚 Сообщение ошибки:', error.message);
        console.error('📚 Stack:', error.stack);
        
        // Ошибки Prisma
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
      console.log(`📥 GET /api/market/items/${id} - Запрос получен`);

      if (!id) {
        res.status(400).json(createErrorResponse('ID объявления не указан'));
        return;
      }

      const item = await MarketService.getItemById(id);
      console.log(`✅ Объявление найдено: ${item.title}`);
      
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

      // Преобразуем тип из запроса в enum Prisma
      let type = req.body.type;
      if (type) {
        // "sell" → "SELL"
        type = type.toUpperCase();
      }

      // Преобразуем категорию из запроса в enum Prisma
      let category = req.body.category;
      if (category) {
        // "tools" → "TOOLS"
        category = category.toUpperCase();
      }

      // Преобразуем длительность из запроса в enum Prisma
      let duration = req.body.duration;
      if (duration) {
        // "2weeks" → "TWOWEEKS"
        const durationMap: Record<string, string> = {
          '2weeks': 'TWOWEEKS',
          '1month': 'ONEMONTH',
          '2months': 'TWOMONTHS'
        };
        duration = durationMap[duration] || duration;
      }

      const itemData = {
        ...req.body,
        type,
        category,
        duration,
        authorId: req.user.id,
        author: req.user.login
      };

      console.log('📝 Подготовленные данные:', JSON.stringify(itemData, null, 2));

      const result = await MarketService.createItem(itemData);
      
      console.log(`✅ Объявление "${result.title}" успешно создано с ID: ${result.id}`);
      
      res.json(createSuccessResponse(result));
    } catch (error: any) {
      console.error('❌ Ошибка создания объявления:', error);
      if (error instanceof Error) {
        console.error('📚 Stack:', error.stack);
      }
      
      // Ошибки валидации Prisma
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
      const item = await MarketService.getItemById(itemId);
      
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
}
