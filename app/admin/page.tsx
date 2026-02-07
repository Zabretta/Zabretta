"use client";

import { useAdminData } from '@/components/admin/AdminDataContext';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  // Используем данные из общего контекста вместо локального состояния
  const { stats, loading, realtime, toggleRealtime, handleAction } = useAdminData();

  // Адаптируем handleAction для совместимости с AdminDashboard
  // AdminDashboard ожидает старые названия действий
  const handleQuickAction = async (action: string) => {
    // Маппинг старых action на новые (которые понимает handleAction)
    const actionMap: Record<string, string> = {
      'toggleSimulation': 'toggleOnlineSimulation', // старое → новое
      'refresh': 'refresh'
    };
    
    const newAction = actionMap[action] || action;
    
    // Если это resetTotal (старое действие), выполняем специальную логику
    if (action === 'resetTotal') {
      // resetTotalToZero больше нет в API, используем новую логику
      await handleAction('toggleTotalSimulation'); // Выключаем фиктивных
      return;
    }
    
    // Для остальных действий используем стандартный handleAction
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

  // Преобразуем stats из нового формата в старый для совместимости с AdminDashboard
  const compatibleStats = {
    // Система 1: "Кулибиных на сайте"
    onlineShown: stats.onlineShown,
    onlineReal: stats.onlineReal,
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
    
    // Старые поля для обратной совместимости (если AdminDashboard их требует)
    shownOnline: stats.onlineShown,
    realOnline: stats.onlineReal,
    fakeOnline: stats.onlineFake,
    shownTotal: stats.totalShown,
    realTotal: stats.totalReal,
    fakeTotal: stats.totalFake,
    isSimulationActive: stats.isOnlineSimulationActive
  };

  return (
    <AdminDashboard
      stats={compatibleStats}
      onQuickAction={handleQuickAction}
      realtime={realtime}
      onToggleRealtime={toggleRealtime}
    />
  );
}