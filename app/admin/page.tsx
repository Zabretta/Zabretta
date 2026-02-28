"use client";

import { useState, useEffect } from 'react'; // 👈 ДОБАВЛЕНО useState
import { useAdminData } from '@/components/admin/AdminDataContext';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/components/useAuth';

export default function AdminPage() {
  // 👇 ДОБАВЛЕНО: флаг для определения клиентской стороны
  const [isClient, setIsClient] = useState(false);
  
  // Используем данные из общего контекста
  const { stats, loading, realtime, toggleRealtime, handleAction } = useAdminData();
  
  // 👇 ПОЛУЧАЕМ onlineCount ИЗ КОНТЕКСТА АУТЕНТИФИКАЦИИ
  const { onlineCount } = useAuth();

  // 👇 ДОБАВЛЕНО: устанавливаем флаг клиента после монтирования
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Адаптируем handleAction для совместимости с AdminDashboard
  const handleQuickAction = async (action: string) => {
    // Маппинг старых action на новые
    const actionMap: Record<string, string> = {
      'toggleSimulation': 'toggleOnlineSimulation',
      'refresh': 'refresh'
    };
    
    const newAction = actionMap[action] || action;
    
    if (action === 'resetTotal') {
      await handleAction('toggleTotalSimulation');
      return;
    }
    
    await handleAction(newAction);
  };

  if (loading || !stats) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">🛠️</div>
        <p>Загрузка панели управления...</p>
      </div>
    );
  }

  // 👇 создаем stats с учетом реального онлайн из WebSocket
  const statsWithRealOnline = {
    ...stats,
    onlineReal: onlineCount,
    onlineShown: stats.isOnlineSimulationActive 
      ? onlineCount + stats.onlineFake 
      : onlineCount,
  };

  // Преобразуем stats из нового формата в старый для совместимости с AdminDashboard
  const compatibleStats = {
    // Система 1: "Кулибиных на сайте" с реальными данными
    onlineShown: statsWithRealOnline.onlineShown,
    onlineReal: onlineCount,
    onlineFake: stats.onlineFake,
    isOnlineSimulationActive: stats.isOnlineSimulationActive,
    
    // Система 2: "Кулибиных всего"
    totalShown: stats.totalShown,
    totalReal: stats.totalReal,
    totalFake: stats.totalFake,
    isTotalSimulationActive: stats.isTotalSimulationActive,
    
    // Статические данные
    projectsCreated: stats.projectsCreated,
    adviceGiven: stats.adviceGiven,
    lastUpdate: stats.lastUpdate,
    
    // Старые поля для обратной совместимости
    shownOnline: statsWithRealOnline.onlineShown,
    realOnline: onlineCount,
    fakeOnline: stats.onlineFake,
    shownTotal: stats.totalShown,
    realTotal: stats.totalReal,
    fakeTotal: stats.totalFake,
    isSimulationActive: stats.isOnlineSimulationActive
  };

  // 👇 информация для отладки
  console.log('📊 AdminPage: онлайн через WebSocket =', onlineCount);
  console.log('📊 AdminPage: итоговые stats =', compatibleStats);

  return (
    <>
      {/* 👇 ИСПРАВЛЕНО: виджет реального онлайн появляется только на клиенте */}
      {isClient && (
        <div className="realtime-online-widget" style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#2E8B57',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          🔴 Онлайн сейчас: {onlineCount}
        </div>
      )}
      
      <AdminDashboard
        stats={compatibleStats}
        onQuickAction={handleQuickAction}
        realtime={realtime}
        onToggleRealtime={toggleRealtime}
      />
    </>
  );
}