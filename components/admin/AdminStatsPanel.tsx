"use client";

import { AdminStats, AdminStatsHistory } from '@/types/admin';
import { useState } from 'react';
import './AdminStatsPanel.css';

interface AdminStatsPanelProps {
  stats: AdminStats;
  history: AdminStatsHistory[];
  formula: string;
  onAction: (action: string, value?: any) => void;
}

export default function AdminStatsPanel({ 
  stats, 
  history, 
  formula, 
  onAction 
}: AdminStatsPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({
    fakeTotal: 307,
    realTotal: stats.realTotal
  });

  const detailedStats = [
    {
      label: 'Показано онлайн',
      value: stats.shownOnline.toLocaleString(),
      details: `Реальных: ${stats.realOnline} • Имитация: ${stats.fakeOnline}`,
      color: '#2E8B57'
    },
    {
      label: 'Показано всего',
      value: stats.shownTotal.toLocaleString(),
      details: `Реальных: ${stats.realTotal} • Имитация: ${stats.fakeTotal}`,
      color: '#4169E1'
    },
    {
      label: 'Статус имитации',
      value: stats.isSimulationActive ? '🟢 Активна' : '🔴 Выключена',
      details: stats.isSimulationActive ? 'Искусственные изменения каждые 5 сек' : 'Только реальные пользователи',
      color: stats.isSimulationActive ? '#FF8C00' : '#CD5C5C'
    }
  ];

  const manualControls = [
    {
      label: 'Добавить реального онлайн',
      description: '+1 к реальным пользователям онлайн',
      action: 'addRealOnline',
      icon: '➕'
    },
    {
      label: 'Убрать реального онлайн',
      description: '-1 от реальных пользователей онлайн',
      action: 'removeRealOnline',
      icon: '➖'
    },
    {
      label: stats.areFakeTotalsHidden ? 'Показать фиктивных' : 'Скрыть фиктивных',
      description: stats.areFakeTotalsHidden 
        ? 'Восстановить отображение фиктивных пользователей' 
        : 'Скрыть фиктивных пользователей из общего счёта',
      action: 'resetTotal',
      icon: stats.areFakeTotalsHidden ? '📈' : '🚫'
    },
    {
      label: stats.isSimulationActive ? 'Выключить имитацию' : 'Включить имитацию',
      description: stats.isSimulationActive 
        ? 'Отключить искусственных пользователей' 
        : 'Включить искусственных пользователей',
      action: 'toggleSimulation',
      icon: stats.isSimulationActive ? '🔌' : '⚡',
      disabled: false // Убираем блокировку полностью
    }
  ];

  return (
    <div className="admin-stats-panel">
      <div className="stats-header">
        <h2>Управление статистикой</h2>
        <p className="stats-subtitle">Детальный контроль системных счетчиков</p>
      </div>
      
      <div className="stats-details">
        <h3>Текущие значения</h3>
        <div className="details-grid">
          {detailedStats.map((stat, index) => (
            <div key={index} className="detail-card" style={{ borderLeftColor: stat.color }}>
              <div className="detail-label">{stat.label}</div>
              <div className="detail-value">{stat.value}</div>
              <div className="detail-info">{stat.details}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="stats-section">
        <div className="section-header">
          <h3>Формула расчета</h3>
          <button 
            className="edit-btn"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '💾 Сохранить' : '✏️ Редактировать'}
          </button>
        </div>
        
        <div className="formula-container">
          {editMode ? (
            <div className="formula-edit">
              <div className="formula-input">
                <label>Фиктивных изначально:</label>
                <input
                  type="number"
                  value={editValues.fakeTotal}
                  onChange={(e) => setEditValues({...editValues, fakeTotal: parseInt(e.target.value)})}
                  min="0"
                  max="1000"
                />
              </div>
              <div className="formula-preview">
                <code>
                  Показано = фиктивных({editValues.fakeTotal} - реальные/2) + реальные
                </code>
              </div>
              <button 
                className="apply-btn"
                onClick={() => {
                  onAction('updateFormula', `Показано = фиктивных(${editValues.fakeTotal} - реальные/2) + реальные`);
                  setEditMode(false);
                }}
              >
                Применить
              </button>
            </div>
          ) : (
            <div className="formula-display">
              <code>{formula}</code>
              <div className="formula-explanation">
                <p>Каждые 2 реальных пользователя уменьшают фиктивных на 1</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="stats-section">
        <h3>Ручное управление</h3>
        <div className="manual-controls">
          {manualControls.map((control, index) => (
            <button
              key={index}
              className="control-btn"
              onClick={() => onAction(control.action)}
              disabled={control.disabled}
              title={control.description}
            >
              <span className="control-icon">{control.icon}</span>
              <span className="control-label">{control.label}</span>
              <span className="control-description">{control.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="stats-section">
        <h3>История изменений</h3>
        {history.length > 0 ? (
          <div className="history-list">
            {history.map((record, index) => (
              <div key={index} className="history-item">
                <div className="history-time">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
                <div className="history-action">{record.action}</div>
                <div className="history-changes">
                  {Object.entries(record.changes).map(([key, value]) => (
                    <span key={key} className="change-item">
                      {key}: {value}
                    </span>
                  ))}
                </div>
                <div className="history-admin">
                  {record.admin === 'admin' ? '👑 Администратор' : '🛠️ Система'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-history">
            <p>История изменений пуста</p>
            <p className="note">Все изменения будут фиксироваться здесь</p>
          </div>
        )}
      </div>
    </div>
  );
}