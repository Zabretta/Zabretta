
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockAPI } from '@/api/mocks';
import { AdminStats, AdminStatsHistory } from '@/types/admin';

interface AdminDataContextType {
  stats: AdminStats | null;
  history: AdminStatsHistory[];
  loading: boolean;
  realtime: boolean;
  toggleRealtime: () => void;
  refreshData: () => Promise<void>;
  handleAction: (action: string, value?: any) => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<AdminStatsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState(true);

  // Функция загрузки данных
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Загружаем статистику и историю параллельно
      const [statsResponse, historyResponse] = await Promise.all([
        mockAPI.stats.getStatsForAdmin(),
        mockAPI.stats.getHistory?.() || Promise.resolve({ success: true, data: [] }),
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        const apiData = statsResponse.data;
        
        // Форматируем данные в соответствии с AdminStats
        const formattedStats: AdminStats = {
          // Система 1: Онлайн
          onlineShown: apiData.onlineShown,
          onlineReal: apiData.onlineReal || apiData.realOnline,
          onlineFake: apiData.onlineFake,
          isOnlineSimulationActive: apiData.isOnlineSimulationActive,
          
          // Система 2: Всего
          totalShown: apiData.totalShown,
          totalReal: apiData.totalReal,
          totalFake: apiData.totalFake,
          isTotalSimulationActive: apiData.isTotalSimulationActive,
          
          // Статические данные
          projectsCreated: apiData.projectsCreated,
          adviceGiven: apiData.adviceGiven,
          lastUpdate: apiData.lastUpdate,
        };
        
        setStats(formattedStats);
      }
      
      if (historyResponse.success) {
        setHistory(historyResponse.data || []);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки данных админки:', error);
    } finally {
      setLoading(false);
    }
  };

  // Первоначальная загрузка и интервал
  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (realtime) {
      interval = setInterval(() => {
        // Тайно обновляем данные без установки loading в true
        // чтобы не вызывать визуальную перерисовку
        mockAPI.stats.getStatsForAdmin()
          .then(statsResponse => {
            if (statsResponse.success && statsResponse.data) {
              const apiData = statsResponse.data;
              const formattedStats: AdminStats = {
                onlineShown: apiData.onlineShown,
                onlineReal: apiData.onlineReal || apiData.realOnline,
                onlineFake: apiData.onlineFake,
                isOnlineSimulationActive: apiData.isOnlineSimulationActive,
                totalShown: apiData.totalShown,
                totalReal: apiData.totalReal,
                totalFake: apiData.totalFake,
                isTotalSimulationActive: apiData.isTotalSimulationActive,
                projectsCreated: apiData.projectsCreated,
                adviceGiven: apiData.adviceGiven,
                lastUpdate: apiData.lastUpdate,
              };
              
              // Мягкое обновление данных без сброса loading
              setStats(prevStats => {
                // Сохраняем состояние loading из предыдущих данных
                return formattedStats;
              });
            }
          })
          .catch(console.error);
      }, 10000); // Обновление каждые 10 секунд
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realtime]);

  // Обработчик действий
  const handleAction = async (action: string, value?: any) => {
    try {
      switch (action) {
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
        case 'refresh':
          // Просто перезагрузим данные
          break;
        default:
          console.warn(`Неизвестное действие: ${action}`);
      }
      
      // После любого действия обновляем данные
      await fetchData();
      
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
    }
  };

  const toggleRealtime = () => {
    setRealtime(prev => !prev);
  };

  return (
    <AdminDataContext.Provider
      value={{
        stats,
        history,
        loading,
        realtime,
        toggleRealtime,
        refreshData: fetchData,
        handleAction,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

// Хук для использования контекста
export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};