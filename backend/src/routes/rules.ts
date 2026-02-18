// backend/src/routes/rules.ts
import express from 'express';
import { RulesController } from '../controllers/rulesController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Публичные маршруты (не требуют авторизации)
router.get('/', RulesController.getRules);

// Защищенные маршруты (требуют авторизации)
router.use(authenticate);
router.get('/acceptance', RulesController.checkAcceptance);
router.post('/accept', RulesController.acceptRules);
router.post('/reset', RulesController.resetAcceptance);
router.get('/with-acceptance', RulesController.getRulesWithAcceptance);

export default router;