"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { adminApi } from '@/lib/api/admin';
import { adminSimulationService } from '@/services/adminSimulationService';
import { AdminStats, AdminStatsHistory } from '@/types/admin';
import io, { Socket } from 'socket.io-client'; // 👈 ДОБАВЛЕНО

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
  onlineCount: number; // 👈 ДОБАВЛЕНО
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  // Используем ref для отслеживания монтирования
  const isMounted = useRef(true);
  
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
  
  // 👇 ДОБАВЛЕНО: для WebSocket
  const [onlineCount, setOnlineCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  // 👇 ДОБАВЛЕНО: подключение к WebSocket
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Admin WebSocket подключен');
    });

    newSocket.on('online-count', (count: number) => {
      console.log('👥 Admin: онлайн пользователей =', count);
      setOnlineCount(count);
      
      // Обновляем статистику с новым значением онлайн
      if (realStats && isMounted.current) {
        const updatedRealStats = {
          ...realStats,
          users: {
            ...realStats.users,
            online: count
          }
        };
        
        const combined = combineStats(updatedRealStats);
        if (combined) {
          setStats(combined);
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Admin WebSocket отключен');
    });

    newSocket.on('error', (error: Error) => {
      console.error('❌ Admin WebSocket ошибка:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Проверка доступности бэкенда
  useEffect(() => {
    isMounted.current = true;
    
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (isMounted.current) {
          setIsBackendAvailable(response.ok);
          if (!response.ok) {
            console.warn('⚠️ Бэкенд недоступен, используется только симуляция');
            setError('Бэкенд недоступен. Работа в автономном режиме.');
          }
        }
      } catch {
        if (isMounted.current) {
          setIsBackendAvailable(false);
          setError('Бэкенд недоступен. Работа в автономном режиме.');
        }
      }
    };
    
    checkHealth();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Функция загрузки реальных данных
  const loadRealData = useCallback(async () => {
    if (!isMounted.current) return null;

    if (!isBackendAvailable) {
      // Если бэкенд недоступен, используем демо-данные
      return {
        users: {
          online: onlineCount, // Используем реальное значение из WebSocket
          total: 120
        },
        content: {
          projects: 7543,
          totalComments: 15287
        }
      };
    }

    try {
      const statsResponse = await fetch('http://localhost:3001/api/stats/system');
      
      if (!statsResponse.ok) {
        throw new Error(`HTTP error! status: ${statsResponse.status}`);
      }
      
      const statsResult = await statsResponse.json();
      console.log('📊 Сырые данные с бэкенда:', statsResult);
      
      // 👇 ИСПРАВЛЕНО: используем onlineCount из WebSocket вместо данных из БД
      const adaptedStats = {
        users: {
          online: onlineCount, // Берем из WebSocket
          total: statsResult.data?.users?.total || 0
        },
        content: {
          projects: statsResult.data?.content?.projects || statsResult.data?.content?.totalPosts || 0,
          totalComments: statsResult.data?.content?.totalComments || 0
        }
      };
      
      console.log('🔄 Адаптированные данные (с WebSocket):', adaptedStats);

      return adaptedStats;
    } catch (error) {
      console.error('❌ Ошибка загрузки реальных данных:', error);
      if (isMounted.current) {
        setError('Не удалось загрузить данные с сервера');
      }
      return null;
    }
  }, [isBackendAvailable, onlineCount]); // 👈 Добавлена зависимость

  // Функция комбинирования данных
  const combineStats = useCallback((realData: any) => {
    if (!realData || !isMounted.current) return null;

    console.log('🔄 Комбинируем данные:', realData);
    
    const simState = adminSimulationService.getState();

    const onlineReal = realData.users?.online || 0;
    const totalReal = realData.users?.total || 0;

    const combined: AdminStats = {
      onlineShown: simState.isOnlineSimulationActive 
        ? onlineReal + simState.onlineFake 
        : onlineReal,
      onlineReal: onlineReal,
      onlineFake: simState.isOnlineSimulationActive ? simState.onlineFake : 0,
      isOnlineSimulationActive: simState.isOnlineSimulationActive,
      
      totalShown: simState.isTotalSimulationActive 
        ? totalReal + simState.totalFake 
        : totalReal,
      totalReal: totalReal,
      totalFake: simState.isTotalSimulationActive ? simState.totalFake : 0,
      isTotalSimulationActive: simState.isTotalSimulationActive,
      
      projectsCreated: realData.content?.projects || 0,
      adviceGiven: realData.content?.totalComments || 0,
      lastUpdate: new Date().toISOString(),
    };

    console.log('✅ Комбинированный результат:', combined);
    return combined;
  }, []);

  // Функция обновления всех данных
  const refreshData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const realData = await loadRealData();
      if (realData && isMounted.current) {
        setRealStats(realData);
        
        const combined = combineStats(realData);
        if (combined && isMounted.current) {
          setStats(combined);
        }
      }
    } catch (err: any) {
      console.error('❌ Ошибка обновления данных:', err);
      if (isMounted.current) {
        setError(err.message || 'Ошибка загрузки данных');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loadRealData, combineStats]);

  // Первоначальная загрузка
  useEffect(() => {
    refreshData();
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Подписка на изменения симуляции
  useEffect(() => {
    const handleSimulationUpdate = () => {
      if (realStats && isMounted.current) {
        const combined = combineStats(realStats);
        if (combined) {
          setStats(combined);
        }
      }
    };

    const unsubscribe = adminSimulationService.subscribe(handleSimulationUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [realStats, combineStats]);

  // Realtime обновления
  useEffect(() => {
    if (!realtime || !isBackendAvailable) return;

    const interval = setInterval(async () => {
      if (!isMounted.current) return;
      
      try {
        const response = await fetch('http://localhost:3001/api/stats/system');
        if (response.ok && isMounted.current) {
          const result = await response.json();
          const adaptedStats = {
            users: {
              online: onlineCount, // 👈 ИСПРАВЛЕНО: используем WebSocket
              total: result.data?.users?.total || 0
            },
            content: {
              projects: result.data?.content?.projects || 0,
              totalComments: result.data?.content?.totalComments || 0
            }
          };
          
          setRealStats(adaptedStats);
          
          const combined = combineStats(adaptedStats);
          if (combined) {
            setStats(combined);
          }
        }
      } catch (error) {
        console.error('Ошибка фонового обновления:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [realtime, isBackendAvailable, combineStats, onlineCount]); // 👈 Добавлена зависимость

  // Обработчик действий
  const handleAction = useCallback(async (action: string, value?: any) => {
    try {
      setError(null);
      
      switch (action) {
        case 'toggleOnlineSimulation':
          adminSimulationService.toggleOnlineSimulation();
          break;
        case 'toggleTotalSimulation':
          adminSimulationService.toggleTotalSimulation();
          break;
        case 'incrementTotalFake':
          adminSimulationService.incrementTotalFake();
          break;
        case 'decrementTotalFake':
          adminSimulationService.decrementTotalFake();
          break;
        case 'refresh':
          await refreshData();
          return;
        default:
          console.warn(`Неизвестное действие: ${action}`);
          return;
      }

      // После изменения симуляции обновляем комбинированные данные
      if (realStats) {
        // 👇 ИСПРАВЛЕНО: обновляем realStats с актуальным onlineCount
        const updatedRealStats = {
          ...realStats,
          users: {
            ...realStats.users,
            online: onlineCount
          }
        };
        
        const combined = combineStats(updatedRealStats);
        if (combined) {
          setStats(combined);
        }
      }
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      setError('Ошибка выполнения действия');
    }
  }, [realStats, combineStats, refreshData, onlineCount]); // 👈 Добавлена зависимость

  const toggleRealtime = useCallback(() => {
    setRealtime(prev => !prev);
  }, []);

  const value = {
    stats,
    history,
    loading,
    realtime,
    toggleRealtime,
    refreshData,
    handleAction,
    isBackendAvailable,
    error,
    onlineCount, // 👈 ДОБАВЛЕНО
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};