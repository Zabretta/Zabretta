// backend/src/routes/settings.ts
import express from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticate);

router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);
router.post('/sync', SettingsController.syncSettings);
router.post('/reset', SettingsController.resetSettings);

export default router;