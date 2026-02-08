// backend/src/routes/rating.ts
import express from 'express';
import { RatingController } from '../controllers/ratingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Публичные маршруты
router.get('/levels', RatingController.getRatingLevels);
router.get('/distribution', RatingController.getRatingDistribution);
router.get('/users/:userId/rating', RatingController.getUserRating);
router.get('/users/:userId/stats', RatingController.getUserRatingStats);
router.get('/adjustments', RatingController.getRatingAdjustments);

// Защищенные маршруты (требуют авторизации)
router.use(authenticate);
router.get('/my-rating', RatingController.getCurrentUserRating);
router.get('/all', RatingController.getAllRatings);
router.get('/search', RatingController.searchUsersByRating);

export default router;