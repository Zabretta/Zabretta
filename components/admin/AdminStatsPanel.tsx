"use client";

import { useState, useEffect } from 'react'; // 👈 ДОБАВЛЕНО
import { AdminStats, AdminStatsHistory } from '@/types/admin';
import './AdminStatsPanel.css';

interface AdminStatsPanelProps {
  stats: AdminStats;
  history: AdminStatsHistory[];
  onAction: (action: string, value?: any) => void;
}

export default function AdminStatsPanel({ 
  stats, 
  history, 
  onAction 
}: AdminStatsPanelProps) {
  // 👇 ДОБАВЛЕНО: флаг для определения клиентской стороны
  const [isClient, setIsClient] = useState(false);

  // 👇 ДОБАВЛЕНО: устанавливаем флаг клиента после монтирования
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Проверяем, загружены ли данные
  const isLoading = !stats || Object.keys(stats).length === 0;

  // ИСПРАВЛЕНО: Защита от undefined с опциональной цепочкой и запасными значениями
  const detailedStats = [
    {
      label: 'Кулибиных на сайте',
      value: isLoading ? '...' : stats.onlineShown?.toLocaleString() || '150',
      details: isLoading 
        ? 'Загрузка...' 
        : `Реальных: ${stats.onlineReal || 0} • Имитация: ${stats.onlineFake || 150}`,
      color: '#2E8B57',
      tooltip: isLoading 
        ? 'Загрузка данных...' 
        : (stats.isOnlineSimulationActive 
            ? 'Диапазон имитации: 100-200 пользователей' 
            : 'Имитация отключена, показываются только реальные')
    },
    {
      label: 'Кулибиных всего',
      value: isLoading ? '...' : stats.totalShown?.toLocaleString() || '207',
      details: isLoading 
        ? 'Загрузка...' 
        : `Реальных: ${stats.totalReal || 0} • Имитация: ${stats.totalFake || 207}`,
      color: '#4169E1',
      tooltip: `Фиктивная константа: 207 (регулируется кнопками)`
    },
    {
      label: 'Статус имитации онлайн',
      value: isLoading 
        ? '...' 
        : (stats.isOnlineSimulationActive ? '🟢 Активна' : '🔴 Выключена'),
      details: isLoading 
        ? 'Загрузка...' 
        : (stats.isOnlineSimulationActive 
            ? 'Искусственные изменения каждые 5 сек (100-200)' 
            : 'Только реальные пользователи онлайн'),
      color: isLoading ? '#CCCCCC' : (stats.isOnlineSimulationActive ? '#FF8C00' : '#CD5C5C')
    },
    {
      label: 'Статус имитации "всего"',
      value: isLoading 
        ? '...' 
        : (stats.isTotalSimulationActive ? '🟢 Активна' : '🔴 Выключена'),
      details: isLoading 
        ? 'Загрузка...' 
        : (stats.isTotalSimulationActive 
            ? `Показываются реальные + ${stats.totalFake || 207} фиктивных` 
            : 'Показываются только реальные зарегистрированные'),
      color: isLoading ? '#CCCCCC' : (stats.isTotalSimulationActive ? '#32CD32' : '#DC143C')
    }
  ];

  // ИСПРАВЛЕНО: Защита от undefined для кнопок управления
  const manualControls = [
    {
      label: isLoading 
        ? 'Загрузка...' 
        : (stats.isOnlineSimulationActive ? 'Выключить имитацию онлайн' : 'Включить имитацию онлайн'),
      description: isLoading 
        ? 'Загрузка данных...' 
        : (stats.isOnlineSimulationActive 
            ? 'Отключить искусственных пользователей онлайн' 
            : 'Включить искусственных пользователей онлайн (диапазон 100-200)'),
      action: 'toggleOnlineSimulation',
      icon: isLoading ? '⏳' : (stats.isOnlineSimulationActive ? '🔌' : '⚡'),
      color: isLoading ? '#CCCCCC' : (stats.isOnlineSimulationActive ? '#CD5C5C' : '#2E8B57'),
      disabled: isLoading
    },
    {
      label: isLoading 
        ? 'Загрузка...' 
        : (stats.isTotalSimulationActive ? 'Скрыть фиктивных "всего"' : 'Показать фиктивных "всего"'),
      description: isLoading 
        ? 'Загрузка данных...' 
        : (stats.isTotalSimulationActive 
            ? 'Скрыть фиктивных пользователей из общего счёта' 
            : `Показать фиктивных пользователей в общем счёте (${stats.totalFake || 207})`),
      action: 'toggleTotalSimulation',
      icon: isLoading ? '⏳' : (stats.isTotalSimulationActive ? '📉' : '📈'),
      color: isLoading ? '#CCCCCC' : (stats.isTotalSimulationActive ? '#DC143C' : '#32CD32'),
      disabled: isLoading
    },
    {
      label: isLoading ? 'Загрузка...' : 'Добавить +1 фиктивного "всего"',
      description: isLoading 
        ? 'Загрузка данных...' 
        : `+1 к фиктивным пользователям "всего" (${stats.totalFake || 207} → ${(stats.totalFake || 207) + 1})`,
      action: 'incrementTotalFake',
      icon: isLoading ? '⏳' : '➕',
      color: '#4169E1',
      disabled: isLoading
    },
    {
      label: isLoading ? 'Загрузка...' : 'Убрать -1 фиктивного "всего"',
      description: isLoading 
        ? 'Загрузка данных...' 
        : `-1 от фиктивных пользователей "всего" (${stats.totalFake || 207} → ${Math.max(0, (stats.totalFake || 207) - 1)})`,
      action: 'decrementTotalFake',
      icon: isLoading ? '⏳' : '➖',
      color: '#FF8C00',
      disabled: isLoading
    }
  ];

  return (
    <div className="admin-stats-panel">
      <div className="stats-header">
        <h2>Управление статистикой</h2>
        <p className="stats-subtitle">Две независимые системы имитации</p>
      </div>
      
      <div className="stats-details">
        <h3>Текущие значения</h3>
        {isLoading ? (
          <div className="loading-stats">
            <div className="loading-spinner">🛠️</div>
            <p>Загрузка данных статистики...</p>
          </div>
        ) : (
          <div className="details-grid">
            {detailedStats.map((stat, index) => (
              <div 
                key={index} 
                className="detail-card" 
                style={{ borderLeftColor: stat.color }}
                title={stat.tooltip || stat.details}
              >
                <div className="detail-label">{stat.label}</div>
                <div className="detail-value">{stat.value}</div>
                <div className="detail-info">{stat.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="stats-section">
        <h3>Информация о системах</h3>
        <div className="systems-info">
          <div className="system-info-card">
            <div className="system-icon">👥</div>
            <div className="system-content">
              <h4>Система 1: "Кулибиных на сайте"</h4>
              <p>Имитирует онлайн-пользователей в диапазоне <strong>100-200</strong> человек.</p>
              <p>Генератор работает каждые 5 секунд, если система включена.</p>
              <p>Показывает: <strong>реальные онлайн + фиктивные онлайн</strong></p>
            </div>
          </div>
          
          <div className="system-info-card">
            <div className="system-icon">📊</div>
            <div className="system-content">
              <h4>Система 2: "Кулибиных всего"</h4>
              <p>Использует фиктивную константу <strong>207</strong> пользователей.</p>
              <p>Админ может регулировать значение кнопками "+1" и "-1".</p>
              <p>Показывает: <strong>реальные зарегистрированные + фиктивные "всего"</strong></p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stats-section">
        <h3>Ручное управление</h3>
        {isLoading ? (
          <div className="loading-controls">
            <div className="loading-spinner-small">⏳</div>
            <p>Загрузка элементов управления...</p>
          </div>
        ) : (
          <div className="manual-controls">
            {manualControls.map((control, index) => (
              <button
                key={index}
                className="control-btn"
                onClick={() => !control.disabled && onAction(control.action)}
                disabled={control.disabled}
                style={{ borderLeftColor: control.color }}
                title={control.description}
              >
                <span className="control-icon">{control.icon}</span>
                <span className="control-label">{control.label}</span>
                <span className="control-description">{control.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="stats-section">
        <h3>История изменений</h3>
        {isLoading ? (
          <div className="loading-history">
            <div className="loading-spinner">📊</div>
            <p>Загрузка истории изменений...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="history-list">
            {history.map((record, index) => (
              <div key={index} className="history-item">
                <div className="history-time">
                  {/* 👇 ИСПРАВЛЕНО: показываем только на клиенте */}
                  {isClient ? new Date(record.timestamp).toLocaleString() : '...'}
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