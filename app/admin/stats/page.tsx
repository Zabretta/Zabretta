"use client";

import { useState, useEffect } from 'react';
import { mockAPI } from '@/api/mocks';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';
import { AdminStats, AdminStatsHistory } from '@/types/admin';

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<AdminStatsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formula, setFormula] = useState('Показано = фиктивных(307 - реальные/2) + реальные');

  const loadStatsData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await mockAPI.stats.getStats();
      const detailedResponse = await mockAPI.stats.getDetailedStats();
      
      if (statsResponse.success && detailedResponse.success) {
        const statsData = statsResponse.data!;
        const detailed = detailedResponse.data!;
        
        setStats({
          shownOnline: statsData.online,
          realOnline: statsData.realOnline,
          fakeOnline: statsData.simulationOnline,
          shownTotal: statsData.total,
          realTotal: detailed.realTotal,
          fakeTotal: detailed.fakeTotal,
          projectsCreated: statsData.projectsCreated,
          adviceGiven: statsData.adviceGiven,
          isSimulationActive: statsData.isSimulationActive,
          lastUpdate: statsData.lastUpdate
        });
        
        // Мокап истории изменений
        setHistory([
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'Сброс счетчиков',
            changes: { total: '100 → 50' },
            admin: 'admin'
          },
          {
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: 'Корректировка онлайн',
            changes: { online: '245 → 250' },
            admin: 'admin'
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsData();
  }, []);

  const handleAction = async (action: string, value?: any) => {
    try {
      switch (action) {
        case 'resetTotal':
          await mockAPI.stats.resetTotalToZero();
          break;
        case 'toggleSimulation':
          await mockAPI.stats.disableSimulation();
          break;
        case 'updateFormula':
          // В будущем: сохранение новой формулы
          setFormula(value);
          break;
        case 'addRealOnline':
          await mockAPI.stats.addRealOnline();
          break;
        case 'removeRealOnline':
          await mockAPI.stats.removeRealOnline();
          break;
      }
      
      await loadStatsData();
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">📊</div>
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  return (
    <AdminStatsPanel
      stats={stats}
      history={history}
      formula={formula}
      onAction={handleAction}
    />
  );
}
