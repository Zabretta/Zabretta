// backend/src/routes/market.ts
import express from 'express';
import { MarketController } from '../controllers/marketController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Публичные маршруты (не требуют авторизации)
router.get('/items', MarketController.getItems);
router.get('/items/:id', MarketController.getItemById);
router.get('/categories', MarketController.getCategories);

// Защищенные маршруты (требуют авторизации)
router.use(authenticate);
router.post('/items', MarketController.createItem);
router.put('/items/:id', MarketController.updateItem);
router.delete('/items/:id', MarketController.deleteItem);
router.post('/contact', MarketController.contactAuthor);

export default router;