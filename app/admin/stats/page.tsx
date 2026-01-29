"use client";

import { useState, useEffect } from 'react';
import { mockAPI } from '@/api/mocks';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';
import { AdminStats, AdminStatsHistory } from '@/types/admin';

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<AdminStatsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // УДАЛЕНО: формула больше не нужна
  // const [formula, setFormula] = useState('Показано = фиктивных(307 - реальные/2) + реальные');

  const loadStatsData = async () => {
    try {
      setLoading(true);
      
      // Используем getStatsForAdmin() для получения полных данных
      const statsResponse = await mockAPI.stats.getStatsForAdmin();
      
      if (statsResponse.success) {
        const statsData = statsResponse.data!;
        
        // ИСПРАВЛЕНО: Создаем объект AdminStats из новых полей
        setStats({
          // Система 1: "Кулибиных на сайте"
          onlineShown: statsData.onlineShown,
          onlineReal: statsData.realOnline || statsData.onlineReal,
          onlineFake: statsData.onlineFake,
          isOnlineSimulationActive: statsData.isOnlineSimulationActive,
          
          // Система 2: "Кулибиных всего"
          totalShown: statsData.totalShown,
          totalReal: statsData.totalReal,
          totalFake: statsData.totalFake,
          isTotalSimulationActive: statsData.isTotalSimulationActive,
          
          // Статические данные
          projectsCreated: statsData.projectsCreated,
          adviceGiven: statsData.adviceGiven,
          lastUpdate: statsData.lastUpdate,
          
          // УДАЛЕНО: устаревшие поля
          // shownOnline: statsData.online, - заменено на onlineShown
          // realOnline: statsData.realOnline, - заменено на onlineReal
          // fakeOnline: statsData.simulationOnline, - заменено на onlineFake
          // shownTotal: statsData.total, - заменено на totalShown
          // realTotal: statsData.realTotal, - заменено на totalReal
          // fakeTotal: statsData.fakeTotal, - заменено на totalFake
          // isSimulationActive: statsData.isSimulationActive, - заменено на isOnlineSimulationActive
          // areFakeTotalsHidden: areFakeTotalsHidden - заменено на isTotalSimulationActive
        });
        
        // Обновляем историю изменений для новой системы
        setHistory([
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'Корректировка фиктивных "всего"',
            changes: { totalFake: '207 → 208' },
            admin: 'admin'
          },
          {
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: 'Включение имитации онлайн',
            changes: { onlineFake: '0 → 150' },
            admin: 'admin'
          },
          {
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            action: 'Регистрация нового пользователя',
            changes: { totalReal: '45 → 46' },
            admin: 'system'
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
        // ИСПРАВЛЕНО: Новые методы для управления двумя системами
        case 'toggleOnlineSimulation':
          await mockAPI.stats.toggleOnlineSimulation();
          break;
        case 'toggleTotalSimulation':
          await mockAPI.stats.toggleTotalSimulation();
          break;
        case 'incrementTotalFake':
          await mockAPI.stats.incrementTotalFake();
          break;
        case 'decrementTotalFake':
          await mockAPI.stats.decrementTotalFake();
          break;
          
        // УДАЛЕНО: Старые методы, которые больше не используются
        // case 'resetTotal':
        //   if (stats?.areFakeTotalsHidden) {
        //     await mockAPI.stats.restoreFakeTotal?.();
        //   } else {
        //     await mockAPI.stats.resetTotalToZero();
        //   }
        //   break;
        // case 'toggleSimulation':
        //   if (stats?.isSimulationActive) {
        //     await mockAPI.stats.disableSimulation();
        //   } else {
        //     await mockAPI.stats.enableSimulation();
        //   }
        //   break;
        // case 'updateFormula':
        //   setFormula(value);
        //   break;
        // case 'addRealOnline':
        //   await mockAPI.stats.addRealOnline();
        //   break;
        // case 'removeRealOnline':
        //   await mockAPI.stats.removeRealOnline();
        //   break;
      }
      
      // Перезагружаем данные после выполнения действия
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
      // УДАЛЕНО: формула больше не передается
      // formula={formula}
      onAction={handleAction}
    />
  );
}
