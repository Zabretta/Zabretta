// components/RatingBadge.tsx
"use client";

import React from 'react';
import './RatingBadge.css';

interface RatingBadgeProps {
  rating: number;
  activity: number;
  level: string;
  icon: string;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  showOnlyIcon?: boolean;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  activity,
  level,
  icon,
  size = 'medium',
  showDetails = false,
  showOnlyIcon = false
}) => {
  console.log('🎨 RatingBadge рендер:', { rating, activity, level, icon, size });

  const getBadgeClass = () => {
    if (rating >= 2001) return 'rating-expert';
    if (rating >= 1001) return 'rating-professor';
    if (rating >= 501) return 'rating-engineer';
    if (rating >= 201) return 'rating-senior';
    return 'rating-student';
  };

  const getActivityColor = () => {
    if (activity >= 1001) return '#FFD700';
    if (activity >= 601) return '#1E90FF';
    if (activity >= 301) return '#32CD32';
    if (activity >= 101) return '#FFA500';
    return '#808080';
  };

  if (showOnlyIcon) {
    return (
      <div className={`rating-badge-icon ${size}`} title={`${level} | Рейтинг: ${rating} | Активность: ${activity}`}>
        <span className="rating-icon-mini">{icon}</span>
      </div>
    );
  }

  return (
    <div className={`rating-badge ${size} ${getBadgeClass()}`}>
      <div className="rating-main">
        <div className="rating-header">
          <span className="rating-icon">{icon}</span>
          <span className="rating-level">{level}</span>
        </div>
        
        <div className="rating-numbers">
          <div className="rating-number-item">
            <span className="rating-number-label">🏆</span>
            <span className="rating-number-value">{rating}</span>
          </div>
          <div className="rating-number-item">
            <span className="rating-number-label" style={{ color: getActivityColor() }}>⚡</span>
            <span className="rating-number-value">{activity}</span>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="rating-details">
          <div className="rating-stat">
            <span className="stat-label">Рейтинг:</span>
            <span className="stat-value">{rating} баллов</span>
          </div>
          <div className="rating-stat">
            <span className="stat-label">Активность:</span>
            <span className="stat-value">{activity} баллов</span>
          </div>
          <div className="rating-stat">
            <span className="stat-label">Уровень:</span>
            <span className="stat-value">{level}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingBadge;