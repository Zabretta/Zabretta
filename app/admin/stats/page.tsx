"use client";

import { useState, useEffect } from 'react'; // 👈 ДОБАВЛЕНО
import { useAdminData } from '@/components/admin/AdminDataContext';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';

export default function AdminStatsPage() {
  // 👇 ДОБАВЛЕНО: флаг для определения клиентской стороны
  const [isClient, setIsClient] = useState(false);

  // 👇 ДОБАВЛЕНО: устанавливаем флаг клиента после монтирования
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Используем данные из общего контекста
  const { stats, history, loading, handleAction, isBackendAvailable, error } = useAdminData();

  if (loading || !stats) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">📊</div>
        <p>Загрузка статистики...</p>
        <p className="loading-subtext">
          {!isBackendAvailable ? '🔄 Бэкенд недоступен, используем демо-данные + симуляцию' : 'Получаем данные с сервера...'}
        </p>
      </div>
    );
  }

  // Показываем предупреждение, если бэкенд недоступен
  if (!isBackendAvailable) {
    return (
      <>
        <div className="admin-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h3>Бэкенд недоступен</h3>
            <p>Работа в автономном режиме. Отображаются демо-данные с активной симуляцией.</p>
            <p className="warning-hint">Запустите сервер разработки бэкенда для работы с реальными данными.</p>
          </div>
        </div>
        <AdminStatsPanel stats={stats} history={history} onAction={handleAction} />
      </>
    );
  }

  // Показываем ошибку, если есть
  if (error) {
    return (
      <>
        <div className="admin-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              🔄 Обновить страницу
            </button>
          </div>
        </div>
        <AdminStatsPanel stats={stats} history={history} onAction={handleAction} />
      </>
    );
  }

  // Нормальный режим работы
  return (
    <>
      <div className="stats-header-info">
        <div className="stats-badge">
          <span className="badge-icon">🌐</span>
          <span className="badge-text">
            Данные: {isBackendAvailable ? 'Реальные + Симуляция' : 'Только симуляция'}
          </span>
        </div>
        <div className="stats-timestamp">
          {/* 👇 ИСПРАВЛЕНО: показываем только на клиенте */}
          Последнее обновление: {isClient 
            ? (stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('ru-RU') : 'только что')
            : '...'
          }
        </div>
      </div>
      
      <AdminStatsPanel 
        stats={stats} 
        history={history} 
        onAction={handleAction} 
      />
    </>
  );
}