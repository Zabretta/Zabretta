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
  // Проверяем, загружены ли данные статистики
  const isLoading = !stats || Object.keys(stats).length === 0;

  const statCards = [
    {
      title: 'Онлайн сейчас',
      value: isLoading ? '...' : stats.onlineShown?.toLocaleString() || '0',
      subtitle: isLoading 
        ? 'Загрузка...' 
        : `Реальных: ${stats.onlineReal || 0} • Имитация: ${stats.onlineFake || 0}`,
      color: '#2E8B57',
      icon: '👥'
    },
    {
      title: 'Всего пользователей',
      value: isLoading ? '...' : stats.totalShown?.toLocaleString() || '207',
      subtitle: isLoading 
        ? 'Загрузка...' 
        : `Реальных: ${stats.totalReal || 0} • Имитация: ${stats.totalFake || 207}`,
      color: '#4169E1',
      icon: '📊'
    },
    {
      title: 'Создано самоделок',
      value: isLoading ? '...' : stats.projectsCreated?.toLocaleString() || '7543',
      subtitle: 'Статичное значение',
      color: '#FF8C00',
      icon: '🛠️'
    },
    {
      title: 'Ценных советов',
      value: isLoading ? '...' : stats.adviceGiven?.toLocaleString() || '15287',
      subtitle: 'Статичное значение',
      color: '#9370DB',
      icon: '💡'
    }
  ];

  const quickActions = [
    {
      label: isLoading 
        ? 'Загрузка...' 
        : (stats.isOnlineSimulationActive ? 'Выключить имитацию онлайн' : 'Имитация онлайн выключена'),
      description: isLoading 
        ? 'Загрузка данных...' 
        : (stats.isOnlineSimulationActive 
            ? 'Отключить искусственных пользователей онлайн' 
            : 'Имитация онлайн отключена'),
      icon: isLoading ? '⏳' : (stats.isOnlineSimulationActive ? '⚡' : '🔌'),
      action: 'toggleOnlineSimulation',
      disabled: isLoading
    },
    {
      label: isLoading 
        ? 'Загрузка...' 
        : (stats.isTotalSimulationActive ? 'Скрыть фиктивных "всего"' : 'Фиктивные "всего" скрыты'),
      description: isLoading 
        ? 'Загрузка данных...' 
        : (stats.isTotalSimulationActive 
            ? 'Скрыть фиктивных пользователей из общего счёта' 
            : 'Фиктивные пользователи "всего" скрыты'),
      icon: isLoading ? '⏳' : (stats.isTotalSimulationActive ? '📉' : '📈'),
      action: 'toggleTotalSimulation',
      disabled: isLoading
    },
    {
      label: 'Обновить сейчас',
      description: 'Принудительное обновление всех данных',
      icon: '🔄',
      action: 'refresh',
      disabled: isLoading
    }
  ];

  // Если данные загружаются, показываем индикатор загрузки
  if (isLoading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-indicator">
          <div className="spinner">🛠️</div>
          <p>Загрузка данных статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Панель управления</h2>
        <div className="header-controls">
          <button 
            className={`realtime-toggle ${realtime ? 'active' : ''}`}
            onClick={onToggleRealtime}
            disabled={isLoading}
          >
            {realtime ? '🟢' : '⚫'} Реальное время
          </button>
          <span className="last-update">
            Обновлено: {new Date(stats.lastUpdate || new Date()).toLocaleTimeString()}
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
              onClick={() => !action.disabled && onQuickAction(action.action)}
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
            <span className={`status-value ${stats.isOnlineSimulationActive ? 'active' : 'inactive'}`}>
              {stats.isOnlineSimulationActive ? '🟢 Активна (100-200)' : '🔴 Выключена'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Имитация "всего"</span>
            <span className={`status-value ${stats.isTotalSimulationActive ? 'active' : 'inactive'}`}>
              {stats.isTotalSimulationActive ? `🟢 Активна (${stats.totalFake || 207} фиктивных)` : '🔴 Выключена'}
            </span>
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
