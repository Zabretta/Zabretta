"use client";

import { useState } from 'react';

export default function AdminRatingPage() {
  const [activeTab, setActiveTab] = useState('levels');

  const tabs = [
    { id: 'levels', label: 'Уровни', icon: '📊' },
    { id: 'formulas', label: 'Формулы', icon: '🧮' },
    { id: 'adjustments', label: 'Корректировки', icon: '⚖️' },
    { id: 'stats', label: 'Статистика', icon: '📈' },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Управление рейтинговой системой</h2>
        <p className="page-subtitle">Настройка уровней, формул и корректировка рейтинга</p>
      </div>

      <div className="page-content">
        <div className="tabs-container">
          <div className="tabs-header">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'levels' && (
              <div className="placeholder">
                <div className="placeholder-icon">⭐</div>
                <h3>Настройка уровней пользователей</h3>
                <p>Интеграция с RatingContext будет на следующем этапе</p>
                <div className="placeholder-list">
                  <p>• Студент: 0-200 очков</p>
                  <p>• Инженер: 201-500 очков</p>
                  <p>• Инженер-конструктор: 501-1000 очков</p>
                  <p>• Профессор Самоделкин: 1001-2000 очков</p>
                  <p>• Эксперт сообщества: 2001+ очков</p>
                </div>
              </div>
            )}

            {activeTab === 'formulas' && (
              <div className="placeholder">
                <div className="placeholder-icon">🧮</div>
                <h3>Настройка формул начисления</h3>
                <p>Конфигурация системы начисления рейтинговых очков</p>
              </div>
            )}

            {activeTab === 'adjustments' && (
              <div className="placeholder">
                <div className="placeholder-icon">⚖️</div>
                <h3>Ручная корректировка рейтинга</h3>
                <p>Административная корректировка рейтинга пользователей</p>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="placeholder">
                <div className="placeholder-icon">📈</div>
                <h3>Статистика активности</h3>
                <p>Анализ активности пользователей по типам действий</p>
              </div>
            )}
          </div>
        </div>

        <div className="system-info">
          <h4>📋 Краткий обзор системы рейтинга</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Типы действий:</span>
              <span className="info-value">Проекты, Мастера, Помощь, Библиотека</span>
            </div>
            <div className="info-item">
              <span className="info-label">Баллы за создание:</span>
              <span className="info-value">+5 рейтинг, +10 активность</span>
            </div>
            <div className="info-item">
              <span className="info-label">Баллы за лайк:</span>
              <span className="info-value">+2 активность</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ежедневный вход:</span>
              <span className="info-value">+2 активность</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
