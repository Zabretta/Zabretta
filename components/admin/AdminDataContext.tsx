"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { adminApi } from '@/lib/api/admin';
import { adminSimulationService } from '@/services/adminSimulationService';
import { AdminStats, AdminStatsHistory } from '@/types/admin';

interface AdminDataContextType {
  stats: AdminStats | null;
  history: AdminStatsHistory[];
  loading: boolean;
  realtime: boolean;
  toggleRealtime: () => void;
  refreshData: () => Promise<void>;
  handleAction: (action: string, value?: any) => Promise<void>;
  isBackendAvailable: boolean;
  error: string | null;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  // Реальные данные с бэкенда
  const [realStats, setRealStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Комбинированные данные для UI
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [history, setHistory] = useState<AdminStatsHistory[]>([]);
  
  // Состояния UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  // Проверка доступности бэкенда через health endpoint
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        setIsBackendAvailable(response.ok);
        if (!response.ok) {
          console.warn('⚠️ Бэкенд недоступен, используется только симуляция');
          setError('Бэкенд недоступен. Работа в автономном режиме.');
        }
      } catch {
        setIsBackendAvailable(false);
        setError('Бэкенд недоступен. Работа в автономном режиме.');
      }
    };
    
    checkHealth();
  }, []);

  // Загрузка реальных данных с бэкенда
  const loadRealData = useCallback(async () => {
    if (!isBackendAvailable) {
      // Если бэкенд недоступен, используем демо-данные
      return getDemoData();
    }

    try {
      const [statsData, logsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAuditLogs({ limit: 50 }).catch(() => ({ data: { logs: [] } }))
      ]);

      setRealStats(statsData);
      setAuditLogs(logsData?.data?.logs || []);
      
      // Преобразуем логи аудита в формат истории
      const formattedHistory: AdminStatsHistory[] = (logsData?.data?.logs || []).map((log: any) => ({
        timestamp: log.timestamp,
        action: log.action,
        changes: typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {}),
        admin: log.userName || 'Система',
      }));
      
      setHistory(formattedHistory);
      
      return { stats: statsData, logs: logsData?.data?.logs || [] };
    } catch (error) {
      console.error('Ошибка загрузки реальных данных:', error);
      setError('Не удалось загрузить данные с сервера');
      return getDemoData();
    }
  }, [isBackendAvailable]);

  // Демо-данные для работы без бэкенда
  const getDemoData = useCallback(() => {
    const demoStats = {
      onlineUsers: 85,
      projectsCreated: 450,
      adviceGiven: 320,
      users: {
        total: 1 // Добавляем хотя бы одного пользователя для демо
      },
      content: {
        projects: 450,
        totalComments: 320
      }
    };
    setRealStats(demoStats);
    return { stats: demoStats, logs: [] };
  }, []);

  // Комбинирование реальных данных с симуляцией (ИСПРАВЛЕНО)
  const combineStats = useCallback((realData: any) => {
    if (!realData) return null;

    // Получаем данные симуляции
    const simulationData = adminSimulationService.getCombinedStats({
      onlineReal: realData.users?.online || 0,
      totalReal: realData.users?.total || 0,
    });

    // Формируем полный объект статистики
    const combined: AdminStats = {
      // Система 1: Онлайн (реальные + симуляция)
      onlineShown: simulationData.onlineShown,
      onlineReal: simulationData.onlineReal,
      onlineFake: simulationData.onlineFake,
      isOnlineSimulationActive: simulationData.isOnlineSimulationActive,
      
      // Система 2: Всего (реальные + симуляция)
      totalShown: simulationData.totalShown,
      totalReal: simulationData.totalReal,
      totalFake: simulationData.totalFake,
      isTotalSimulationActive: simulationData.isTotalSimulationActive,
      
      // Статические данные
      projectsCreated: realData.content?.projects || realData.projectsCreated || 0,
      adviceGiven: realData.content?.totalComments || realData.adviceGiven || 0,
      lastUpdate: new Date().toISOString(),
    };

    setStats(combined);
    
    // Добавляем историю симуляции в общую историю
    const simulationHistory = adminSimulationService.getState().history;
    if (simulationHistory.length > 0) {
      setHistory(prev => {
        const combinedHistory = [
          ...simulationHistory.map(item => ({
            timestamp: item.timestamp,
            action: item.action,
            changes: item.changes,
            admin: item.admin,
          })),
          ...prev
        ];
        // Убираем дубликаты и сортируем по времени
        return Array.from(
          new Map(combinedHistory.map(item => [item.timestamp, item])).values()
        ).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 50);
      });
    }

    return combined;
  }, []);

  // Основная функция обновления всех данных
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const realData = await loadRealData();
      combineStats(realData.stats);
    } catch (err: any) {
      console.error('Ошибка обновления данных:', err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [loadRealData, combineStats]);

  // Первоначальная загрузка
  useEffect(() => {
    refreshData();
    
    return () => {
      adminSimulationService.destroy();
    };
  }, [refreshData]);

  // Realtime обновления
  useEffect(() => {
    let statsInterval: NodeJS.Timeout;
    let simulationInterval: NodeJS.Timeout;

    if (realtime) {
      // Обновление реальных данных каждые 30 секунд
      statsInterval = setInterval(() => {
        if (isBackendAvailable) {
          adminApi.getStats()
            .then(realData => {
              setRealStats(realData);
              if (stats) {
                combineStats(realData);
              }
            })
            .catch(console.error);
        }
      }, 30000);

      // Обновление симуляции онлайн каждые 5 секунд (если активна)
      simulationInterval = setInterval(() => {
        if (adminSimulationService.getState().isOnlineSimulationActive) {
          // Генерируем новое значение
          adminSimulationService.toggleOnlineSimulation();
          adminSimulationService.toggleOnlineSimulation();
          if (realStats) {
            combineStats(realStats);
          }
        }
      }, 5000);
    }

    return () => {
      if (statsInterval) clearInterval(statsInterval);
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [realtime, isBackendAvailable, realStats, stats, combineStats]);

  // Обработчик действий
  const handleAction = useCallback(async (action: string, value?: any) => {
    try {
      setError(null);
      
      switch (action) {
        // Симуляция онлайн
        case 'toggleOnlineSimulation':
          adminSimulationService.toggleOnlineSimulation();
          break;
          
        // Симуляция "всего"
        case 'toggleTotalSimulation':
          adminSimulationService.toggleTotalSimulation();
          break;
          
        // Управление фиктивными пользователями
        case 'incrementTotalFake':
          adminSimulationService.incrementTotalFake();
          break;
          
        case 'decrementTotalFake':
          adminSimulationService.decrementTotalFake();
          break;
          
        case 'setTotalFake':
          if (typeof value === 'number') {
            adminSimulationService.setTotalFake(value);
          }
          break;
          
        // Очистка истории
        case 'clearHistory':
          adminSimulationService.clearHistory();
          setHistory([]);
          break;
          
        // Сброс симуляции
        case 'resetSimulation':
          adminSimulationService.reset();
          break;
          
        // Ручное обновление
        case 'refresh':
          await refreshData();
          return;
          
        default:
          console.warn(`Неизвестное действие: ${action}`);
          return;
      }

      // После изменения симуляции обновляем комбинированные данные
      if (realStats) {
        combineStats(realStats);
      }
      
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      setError('Ошибка выполнения действия');
    }
  }, [realStats, combineStats, refreshData]);

  const toggleRealtime = useCallback(() => {
    setRealtime(prev => !prev);
  }, []);

  const contextValue: AdminDataContextType = {
    stats,
    history,
    loading,
    realtime,
    toggleRealtime,
    refreshData,
    handleAction,
    isBackendAvailable,
    error,
  };

  return (
    <AdminDataContext.Provider value={contextValue}>
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