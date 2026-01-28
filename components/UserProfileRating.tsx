// components/UserProfileRating.tsx
"use client";

import React from 'react';
import './UserProfileRating.css';
import { useRating } from './RatingContext';
import { useAuth } from './useAuth';

const UserProfileRating: React.FC = () => {
  const { userRating, getTopActiveUsers, getUserLevel, getActivityLevel } = useRating();
  const { user } = useAuth();

  if (!userRating || !user) return null;

  const topUsers = getTopActiveUsers(50);
  const userRank = topUsers.findIndex(u => u.userId === user.id) + 1;
  const isInTop = userRank > 0 && userRank <= 50;
  
  const { name: ratingLevel, icon: ratingIcon } = getUserLevel(userRating.totalRating);
  const activityLevel = getActivityLevel(userRating.totalActivity);

  // Процент заполнения до следующего уровня
  const getNextLevelProgress = () => {
    const levels = [
      { min: 0, max: 200 },
      { min: 201, max: 500 },
      { min: 501, max: 1000 },
      { min: 1001, max: 2000 },
      { min: 2001, max: Infinity }
    ];
    
    const currentLevelIndex = levels.findIndex(l => 
      userRating.totalRating >= l.min && userRating.totalRating <= l.max
    );
    
    if (currentLevelIndex === -1 || currentLevelIndex === levels.length - 1) return 100;
    
    const currentLevel = levels[currentLevelIndex];
    const nextLevel = levels[currentLevelIndex + 1];
    const progressInLevel = userRating.totalRating - currentLevel.min;
    const levelRange = currentLevel.max - currentLevel.min;
    
    return Math.min(Math.round((progressInLevel / levelRange) * 100), 100);
  };

  // Следующий уровень
  const getNextLevelInfo = () => {
    const levels = [
      { min: 0, max: 200, name: "Студент" },
      { min: 201, max: 500, name: "Инженер" },
      { min: 501, max: 1000, name: "Инженер-конструктор" },
      { min: 1001, max: 2000, name: "Профессор Сомоделкин" },
      { min: 2001, max: Infinity, name: "Эксперт сообщества" }
    ];
    
    const currentLevelIndex = levels.findIndex(l => 
      userRating.totalRating >= l.min && userRating.totalRating <= l.max
    );
    
    if (currentLevelIndex === -1 || currentLevelIndex === levels.length - 1) {
      return { name: "Максимальный уровень", pointsNeeded: 0 };
    }
    
    const nextLevel = levels[currentLevelIndex + 1];
    const pointsNeeded = nextLevel.min - userRating.totalRating;
    
    return { name: nextLevel.name, pointsNeeded };
  };

  const nextLevelInfo = getNextLevelInfo();
  const progress = getNextLevelProgress();

  return (
    <div className="user-profile-rating">
      <div className="profile-rating-header">
        <h2 className="rating-title">
          <span className="title-icon">🏆</span>
          Ваш рейтинг и активность
        </h2>
        <div className="rating-subtitle">
          Уровень в сообществе САМОДЕЛКИН
        </div>
      </div>
      
      {/* Основные показатели */}
      <div className="rating-overview">
        <div className="overview-card rating-card">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <div className="card-value">{userRating.totalRating}</div>
            <div className="card-label">Общий рейтинг</div>
            <div className="card-level">
              <span className="level-icon">{ratingIcon}</span>
              <span className="level-name">{ratingLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="overview-card activity-card">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <div className="card-value">{userRating.totalActivity}</div>
            <div className="card-label">Активность</div>
            <div className="card-level">
              <span className="level-name">{activityLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="overview-card rank-card">
          <div className="card-icon">🏅</div>
          <div className="card-content">
            <div className="card-value">
              {isInTop ? `#${userRank}` : ">50"}
            </div>
            <div className="card-label">Позиция в топе</div>
            <div className="card-level">
              <span className="level-name">
                {isInTop ? `Топ-${userRank}` : "Вне топа"}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Прогресс до следующего уровня */}
      <div className="level-progress">
        <div className="progress-header">
          <h3 className="progress-title">Прогресс до следующего уровня</h3>
          <div className="progress-info">
            {nextLevelInfo.pointsNeeded > 0 ? (
              <span className="points-needed">
                Осталось: <strong>{nextLevelInfo.pointsNeeded}</strong> баллов
              </span>
            ) : (
              <span className="max-level">Максимальный уровень достигнут!</span>
            )}
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          >
            <span className="progress-text">{progress}%</span>
          </div>
        </div>
        
        <div className="progress-levels">
          <div className="level-current">
            <span className="level-label">Текущий:</span>
            <span className="level-name">{ratingLevel}</span>
          </div>
          <div className="level-next">
            <span className="level-label">Следующий:</span>
            <span className="level-name">{nextLevelInfo.name}</span>
          </div>
        </div>
      </div>
      
      {/* Статистика по разделам */}
      <div className="rating-stats">
        <h3 className="stats-title">
          <span className="title-icon">📊</span>
          Статистика по разделам
        </h3>
        
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-icon">📁</span>
            <div className="stat-content">
              <div className="stat-label">Создано проектов</div>
              <div className="stat-value">{userRating.stats.projectsCreated}</div>
            </div>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <div className="stat-content">
              <div className="stat-label">Объявлений мастеров</div>
              <div className="stat-value">{userRating.stats.mastersAdsCreated}</div>
            </div>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">❓</span>
            <div className="stat-content">
              <div className="stat-label">Запросов о помощи</div>
              <div className="stat-value">{userRating.stats.helpRequestsCreated}</div>
            </div>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">📚</span>
            <div className="stat-content">
              <div className="stat-label">Публикаций в библиотеке</div>
              <div className="stat-value">{userRating.stats.libraryPostsCreated}</div>
            </div>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">❤️</span>
            <div className="stat-content">
              <div className="stat-label">Лайков получено</div>
              <div className="stat-value">{userRating.stats.likesReceived}</div>
            </div>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">👍</span>
            <div className="stat-content">
              <div className="stat-label">Лайков поставлено</div>
              <div className="stat-value">{userRating.stats.likesGiven}</div>
            </div>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">💬</span>
            <div className="stat-content">
              <div className="stat-label">Комментариев</div>
              <div className="stat-value">{userRating.stats.commentsMade}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Советы по повышению рейтинга */}
      <div className="rating-tips">
        <h3 className="tips-title">
          <span className="title-icon">💡</span>
          Как повысить рейтинг?
        </h3>
        
        <div className="tips-grid">
          <div className="tip-item">
            <div className="tip-icon">📁</div>
            <div className="tip-content">
              <div className="tip-title">Создавайте проекты</div>
              <div className="tip-description">
                +10 к активности, +5 к рейтингу за каждый проект
              </div>
            </div>
          </div>
          
          <div className="tip-item">
            <div className="tip-icon">👍</div>
            <div className="tip-content">
              <div className="tip-title">Получайте лайки</div>
              <div className="tip-description">
                +1 к рейтингу за каждый полученный лайк
              </div>
            </div>
          </div>
          
          <div className="tip-item">
            <div className="tip-icon">🤝</div>
            <div className="tip-content">
              <div className="tip-title">Помогайте другим</div>
              <div className="tip-description">
                +2 к активности за полезные ответы
              </div>
            </div>
          </div>
          
          <div className="tip-item">
            <div className="tip-icon">📚</div>
            <div className="tip-content">
              <div className="tip-title">Публикуйте материалы</div>
              <div className="tip-description">
                +10 к активности, +5 к рейтингу за публикацию
              </div>
            </div>
          </div>
          
          <div className="tip-item">
            <div className="tip-icon">📅</div>
            <div className="tip-content">
              <div className="tip-title">Заходите ежедневно</div>
              <div className="tip-description">
                +2 к активности за ежедневный вход
              </div>
            </div>
          </div>
          
          <div className="tip-item">
            <div className="tip-icon">💬</div>
            <div className="tip-content">
              <div className="tip-title">Оставляйте комментарии</div>
              <div className="tip-description">
                +3 к активности за комментарий
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileRating;
