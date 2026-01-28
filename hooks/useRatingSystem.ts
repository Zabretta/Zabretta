// hooks/useRatingSystem.ts
import { useRating } from '../components/RatingContext';
import { useAuth } from '../components/useAuth';

export const useRatingSystem = () => {
  const { addRatingRecord } = useRating();
  const { user } = useAuth();

  // ===== ЛЕНТА ПРОЕКТОВ =====
  const recordProjectCreated = (projectId: string) => {
    if (!user) return;
    
    addRatingRecord({
      userId: user.id,
      type: 'project',
      section: 'projects',
      action: 'create',
      points: 15, // 10 + 5
      ratingPoints: 5,
      activityPoints: 10,
      targetId: projectId
    });
  };

  const recordProjectLikeGiven = (projectId: string, authorId: string) => {
    if (!user) return;
    
    // Пользователь ставит лайк - получает активность
    addRatingRecord({
      userId: user.id,
      type: 'project',
      section: 'projects',
      action: 'like_given',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: projectId
    });
    
    // Автор получает лайк - получает рейтинг
    addRatingRecord({
      userId: authorId,
      type: 'project',
      section: 'projects',
      action: 'like_received',
      points: 1,
      ratingPoints: 1,
      activityPoints: 0,
      targetId: projectId
    });
  };

  const recordProjectComment = (projectId: string) => {
    if (!user) return;
    
    addRatingRecord({
      userId: user.id,
      type: 'project',
      section: 'projects',
      action: 'comment',
      points: 3,
      ratingPoints: 0,
      activityPoints: 3,
      targetId: projectId
    });
  };

  // ===== МАСТЕРА РЯДОМ =====
  const recordMasterAdCreated = (adId: string) => {
    if (!user) return;
    
    addRatingRecord({
      userId: user.id,
      type: 'master',
      section: 'masters',
      action: 'create',
      points: 15, // 10 + 5
      ratingPoints: 5,
      activityPoints: 10,
      targetId: adId
    });
  };

  const recordMasterLikeGiven = (adId: string, masterId: string) => {
    if (!user) return;
    
    // Пользователь ставит лайк мастеру
    addRatingRecord({
      userId: user.id,
      type: 'master',
      section: 'masters',
      action: 'like_given',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: adId
    });
    
    // Мастер получает лайк
    addRatingRecord({
      userId: masterId,
      type: 'master',
      section: 'masters',
      action: 'like_received',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: adId
    });
  };

  // ===== ИЩУТ ПОМОЩИ =====
  const recordHelpRequestCreated = (requestId: string) => {
    if (!user) return;
    
    addRatingRecord({
      userId: user.id,
      type: 'help',
      section: 'help',
      action: 'create',
      points: 15, // 10 + 5
      ratingPoints: 5,
      activityPoints: 10,
      targetId: requestId
    });
  };

  const recordHelpfulAnswer = (requestId: string, helperId: string) => {
    if (!user) return;
    
    // Автор запроса отмечает полезный ответ
    addRatingRecord({
      userId: user.id,
      type: 'help',
      section: 'help',
      action: 'like_given',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: requestId
    });
    
    // Помощник получает лайк за полезный ответ
    addRatingRecord({
      userId: helperId,
      type: 'help',
      section: 'help',
      action: 'like_received',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: requestId
    });
  };

  // ===== БИБЛИОТЕКА =====
  const recordLibraryPostCreated = (postId: string) => {
    if (!user) return;
    
    addRatingRecord({
      userId: user.id,
      type: 'library',
      section: 'library',
      action: 'create',
      points: 15, // 10 + 5
      ratingPoints: 5,
      activityPoints: 10,
      targetId: postId
    });
  };

  const recordLibraryLike = (postId: string, authorId: string) => {
    if (!user) return;
    
    // Пользователь ставит лайк
    addRatingRecord({
      userId: user.id,
      type: 'library',
      section: 'library',
      action: 'like_given',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: postId
    });
    
    // Автор получает лайк
    addRatingRecord({
      userId: authorId,
      type: 'library',
      section: 'library',
      action: 'like_received',
      points: 2,
      ratingPoints: 0,
      activityPoints: 2,
      targetId: postId
    });
  };

  // ===== ОБЩИЕ МЕТОДЫ =====
  const recordUserRegistration = () => {
    if (!user) return;
    
    // Уже обрабатывается в RatingContext при инициализации
    console.log('Регистрация пользователя зарегистрирована в системе рейтинга');
  };

  const getRatingSummary = () => {
    return {
      sections: [
        {
          name: 'Лента проектов',
          actions: [
            { action: 'Создание проекта', points: '+5 рейтинг, +10 активность' },
            { action: 'Лайк проекту', points: '+2 активность' },
            { action: 'Получение лайка', points: '+1 рейтинг' },
            { action: 'Комментарий', points: '+3 активность' }
          ]
        },
        {
          name: 'Мастера рядом',
          actions: [
            { action: 'Создание объявления', points: '+5 рейтинг, +10 активность' },
            { action: 'Лайк мастеру', points: '+2 активность' }
          ]
        },
        {
          name: 'Ищут помощи',
          actions: [
            { action: 'Создание запроса', points: '+5 рейтинг, +10 активность' },
            { action: 'Полезный ответ', points: '+2 активность' }
          ]
        },
        {
          name: 'Библиотека',
          actions: [
            { action: 'Создание публикации', points: '+5 рейтинг, +10 активность' },
            { action: 'Лайк публикации', points: '+2 активность' }
          ]
        },
        {
          name: 'Общее',
          actions: [
            { action: 'Регистрация', points: '+15 рейтинг' },
            { action: 'Ежедневный вход', points: '+2 активность' }
          ]
        }
      ]
    };
  };

  return {
    // Лента проектов
    recordProjectCreated,
    recordProjectLikeGiven,
    recordProjectComment,
    
    // Мастера рядом
    recordMasterAdCreated,
    recordMasterLikeGiven,
    
    // Ищут помощи
    recordHelpRequestCreated,
    recordHelpfulAnswer,
    
    // Библиотека
    recordLibraryPostCreated,
    recordLibraryLike,
    
    // Общее
    recordUserRegistration,
    getRatingSummary
  };
};
