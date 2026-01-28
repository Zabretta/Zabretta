"use client";

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { mockAPI } from '@/api/mocks';
import { AdminStats } from '@/types/admin';

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState(true);

  const loadDashboardData = async (isInitialLoad = true) => {
    try {
      // Показываем спиннер ТОЛЬКО при первой загрузке
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // ИСПРАВЛЕНО: Используем getStatsForAdmin() вместо getStats()
      const statsResponse = await mockAPI.stats.getStatsForAdmin();
      const detailedResponse = await mockAPI.stats.getDetailedStats();
      
      if (statsResponse.success && statsResponse.data && detailedResponse.success && detailedResponse.data) {
        const detailed = detailedResponse.data;
        
        // ИСПРАВЛЕНО: Берём realTotal и fakeTotal из ОСНОВНОГО ответа (statsResponse)
        setStats({
          shownOnline: statsResponse.data.online,
          realOnline: statsResponse.data.realOnline,
          fakeOnline: statsResponse.data.simulationOnline,
          shownTotal: statsResponse.data.total,
          realTotal: statsResponse.data.realTotal || detailed.realTotal, // Приоритет из statsResponse
          fakeTotal: statsResponse.data.fakeTotal || detailed.fakeTotal, // Приоритет из statsResponse
          projectsCreated: statsResponse.data.projectsCreated,
          adviceGiven: statsResponse.data.adviceGiven,
          isSimulationActive: statsResponse.data.isSimulationActive,
          lastUpdate: statsResponse.data.lastUpdate
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      // Выключаем спиннер ТОЛЬКО при первой загрузке
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Первая загрузка - со спиннером
    loadDashboardData(true);
    
    if (realtime) {
      // Последующие обновления - БЕЗ спиннера
      const interval = setInterval(() => loadDashboardData(false), 10000);
      return () => clearInterval(interval);
    }
  }, [realtime]);

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'resetTotal':
        await mockAPI.stats.resetTotalToZero();
        break;
      case 'toggleSimulation':
        if (stats?.isSimulationActive) {
          await mockAPI.stats.disableSimulation();
        }
        break;
      case 'refresh':
        await loadDashboardData(false); // Обновление без спиннера
        break;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">🛠️</div>
        <p>Загрузка панели управления...</p>
      </div>
    );
  }

  return (
    <AdminDashboard
      stats={stats!}
      onQuickAction={handleQuickAction}
      realtime={realtime}
      onToggleRealtime={() => setRealtime(!realtime)}
    />
  );
}