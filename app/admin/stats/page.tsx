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
      
      // ИСПРАВЛЕНО: Используем getStatsForAdmin() вместо getStats()
      const statsResponse = await mockAPI.stats.getStatsForAdmin();
      const detailedResponse = await mockAPI.stats.getDetailedStats();
      
      if (statsResponse.success && detailedResponse.success) {
        const statsData = statsResponse.data!;
        const detailed = detailedResponse.data!;
        
        // ВЫЧИСЛЯЕМ ФЛАГ: фиктивные скрыты, если fakeTotal === 0
        const areFakeTotalsHidden = statsData.fakeTotal === 0;
        
        // ИСПРАВЛЕНО: Добавляем свойство areFakeTotalsHidden в объект stats
        setStats({
          shownOnline: statsData.online,
          realOnline: statsData.realOnline,
          fakeOnline: statsData.simulationOnline,
          shownTotal: statsData.total,
          realTotal: statsData.realTotal || detailed.realTotal, // Приоритет из statsResponse
          fakeTotal: statsData.fakeTotal || detailed.fakeTotal, // Приоритет из statsResponse
          projectsCreated: statsData.projectsCreated,
          adviceGiven: statsData.adviceGiven,
          isSimulationActive: statsData.isSimulationActive,
          lastUpdate: statsData.lastUpdate,
          areFakeTotalsHidden: areFakeTotalsHidden // ← ДОБАВЛЕНО ФЛАГ
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
          // ИСПРАВЛЕНО: Переключение по флагу с проверкой существования метода
          if (stats?.areFakeTotalsHidden) {
            // Используем опциональную цепочку вызовов, если метод не существует
            await mockAPI.stats.restoreFakeTotal?.();
          } else {
            await mockAPI.stats.resetTotalToZero();
          }
          break;
        case 'toggleSimulation':
          // ИСПРАВЛЕНО: Используем правильный метод в зависимости от текущего состояния
          if (stats?.isSimulationActive) {
            await mockAPI.stats.disableSimulation();
          } else {
            await mockAPI.stats.enableSimulation();
          }
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
