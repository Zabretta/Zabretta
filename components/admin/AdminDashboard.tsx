"use client";

import { AdminStats } from '@/types/admin';
import './AdminDashboard.css';

interface AdminDashboardProps {
  stats: AdminStats;
  onQuickAction: (action: string) => void;
  realtime: boolean;
  onToggleRealtime: () => void;
}

export default function AdminDashboard({ 
  stats, 
  onQuickAction, 
  realtime, 
  onToggleRealtime 
}: AdminDashboardProps) {
  const statCards = [
    {
      title: 'Онлайн сейчас',
      value: stats.shownOnline.toLocaleString(),
      subtitle: `Реальных: ${stats.realOnline} • Имитация: ${stats.fakeOnline}`,
      color: '#2E8B57',
      icon: '👥'
    },
    {
      title: 'Всего пользователей',
      value: stats.shownTotal.toLocaleString(),
      subtitle: `Реальных: ${stats.realTotal} • Имитация: ${stats.fakeTotal}`,
      color: '#4169E1',
      icon: '📊'
    },
    {
      title: 'Создано самоделок',
      value: stats.projectsCreated.toLocaleString(),
      subtitle: 'Статичное значение',
      color: '#FF8C00',
      icon: '🛠️'
    },
    {
      title: 'Ценных советов',
      value: stats.adviceGiven.toLocaleString(),
      subtitle: 'Статичное значение',
      color: '#9370DB',
      icon: '💡'
    }
  ];

  const quickActions = [
    {
      label: 'Сбросить счетчики',
      description: 'Установить "Кулибиных всего" на реальное значение',
      icon: '🔄',
      action: 'resetTotal'
    },
    {
      label: stats.isSimulationActive ? 'Выключить имитацию' : 'Имитация выключена',
      description: 'Отключить искусственных пользователей онлайн',
      icon: '⚡',
      action: 'toggleSimulation',
      disabled: !stats.isSimulationActive
    },
    {
      label: 'Обновить сейчас',
      description: 'Принудительное обновление всех данных',
      icon: '📈',
      action: 'refresh'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Панель управления</h2>
        <div className="header-controls">
          <button 
            className={`realtime-toggle ${realtime ? 'active' : ''}`}
            onClick={onToggleRealtime}
          >
            {realtime ? '🟢' : '⚫'} Реальное время
          </button>
          <span className="last-update">
            Обновлено: {new Date(stats.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card" style={{ borderTopColor: card.color }}>
            <div className="stat-card-header">
              <span className="stat-icon">{card.icon}</span>
              <h3>{card.title}</h3>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-subtitle">{card.subtitle}</div>
          </div>
        ))}
      </div>
      
      <div className="dashboard-section">
        <h3>Быстрые действия</h3>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => onQuickAction(action.action)}
              disabled={action.disabled}
              title={action.description}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="dashboard-section">
        <h3>Статус системы</h3>
        <div className="system-status-grid">
          <div className="status-item">
            <span className="status-label">Имитация онлайн</span>
            <span className={`status-value ${stats.isSimulationActive ? 'active' : 'inactive'}`}>
              {stats.isSimulationActive ? '🟢 Активна' : '🔴 Выключена'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Формула расчета</span>
            <span className="status-value">Показано = фиктивных(307 - реальные/2) + реальные</span>
          </div>
          <div className="status-item">
            <span className="status-label">Режим работы</span>
            <span className="status-value">{realtime ? '🟢 Реальное время' : '⚫ Ручное обновление'}</span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-section">
        <h3>График активности (заглушка)</h3>
        <div className="chart-placeholder">
          <div className="chart-bars">
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i} 
                className="chart-bar" 
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
          <p className="chart-note">Реальные графики будут подключены после интеграции с бэкендом</p>
        </div>
      </div>
    </div>
  );
}
