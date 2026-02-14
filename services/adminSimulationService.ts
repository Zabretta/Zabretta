// Файл 2 из 2: /services/adminSimulationService.ts
// Расположение: корень проекта /services/adminSimulationService.ts
// Назначение: Управление фиктивными пользователями для имитации активности

// Конфигурация симуляции
const SIMULATION_CONFIG = {
  // Система 1: Онлайн пользователи
  ONLINE: {
    MIN: 100,
    MAX: 200,
    UPDATE_INTERVAL: 5000, // 5 секунд
  },
  // Система 2: Всего пользователей
  TOTAL: {
    DEFAULT_FAKE: 207,
    MIN_FAKE: 0,
    MAX_FAKE: 1000,
  },
  // Ключи для localStorage
  STORAGE_KEYS: {
    ONLINE_SIMULATION_ACTIVE: 'admin_simulation_online_active',
    TOTAL_SIMULATION_ACTIVE: 'admin_simulation_total_active',
    TOTAL_FAKE_COUNT: 'admin_simulation_total_fake',
    HISTORY: 'admin_simulation_history',
  },
} as const;

// Типы для симуляции
export interface SimulationState {
  // Система 1: Онлайн
  onlineFake: number;
  isOnlineSimulationActive: boolean;
  
  // Система 2: Всего
  totalFake: number;
  isTotalSimulationActive: boolean;
  
  // История изменений
  history: SimulationHistoryItem[];
}

export interface SimulationHistoryItem {
  timestamp: string;
  action: string;
  changes: Record<string, any>;
  admin: string;
}

// Класс для управления симуляцией
class AdminSimulationService {
  private state: SimulationState;
  private onlineInterval: NodeJS.Timeout | null = null;
  private readonly historyLimit = 50;
  private readonly adminName = 'Администратор';

  constructor() {
    // Загружаем состояние из localStorage или устанавливаем значения по умолчанию
    this.state = this.loadState();
    
    // Автозапуск симуляции онлайн, если она была активна
    if (this.state.isOnlineSimulationActive) {
      this.startOnlineSimulation();
    }
  }

  // === СОХРАНЕНИЕ И ЗАГРУЗКА СОСТОЯНИЯ ===
  private loadState(): SimulationState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    try {
      return {
        onlineFake: this.generateRandomOnline(),
        isOnlineSimulationActive: localStorage.getItem(SIMULATION_CONFIG.STORAGE_KEYS.ONLINE_SIMULATION_ACTIVE) === 'true',
        totalFake: parseInt(localStorage.getItem(SIMULATION_CONFIG.STORAGE_KEYS.TOTAL_FAKE_COUNT) || SIMULATION_CONFIG.TOTAL.DEFAULT_FAKE.toString()),
        isTotalSimulationActive: localStorage.getItem(SIMULATION_CONFIG.STORAGE_KEYS.TOTAL_SIMULATION_ACTIVE) === 'true',
        history: JSON.parse(localStorage.getItem(SIMULATION_CONFIG.STORAGE_KEYS.HISTORY) || '[]'),
      };
    } catch (error) {
      console.error('Ошибка загрузки состояния симуляции:', error);
      return this.getDefaultState();
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.ONLINE_SIMULATION_ACTIVE, this.state.isOnlineSimulationActive.toString());
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.TOTAL_SIMULATION_ACTIVE, this.state.isTotalSimulationActive.toString());
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.TOTAL_FAKE_COUNT, this.state.totalFake.toString());
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.state.history));
    } catch (error) {
      console.error('Ошибка сохранения состояния симуляции:', error);
    }
  }

  private getDefaultState(): SimulationState {
    return {
      onlineFake: this.generateRandomOnline(),
      isOnlineSimulationActive: false,
      totalFake: SIMULATION_CONFIG.TOTAL.DEFAULT_FAKE,
      isTotalSimulationActive: false,
      history: [],
    };
  }

  // === ГЕНЕРАЦИЯ ДАННЫХ ===
  private generateRandomOnline(): number {
    return Math.floor(Math.random() * (SIMULATION_CONFIG.ONLINE.MAX - SIMULATION_CONFIG.ONLINE.MIN + 1)) + SIMULATION_CONFIG.ONLINE.MIN;
  }

  // === УПРАВЛЕНИЕ СИМУЛЯЦИЕЙ ОНЛАЙН ===
  startOnlineSimulation() {
    if (this.onlineInterval) return;

    this.state.isOnlineSimulationActive = true;
    this.addHistory('Симуляция онлайн запущена', { system: 'online', status: 'started' });
    
    // Генерация нового значения каждые 5 секунд
    this.onlineInterval = setInterval(() => {
      this.state.onlineFake = this.generateRandomOnline();
      this.saveState();
    }, SIMULATION_CONFIG.ONLINE.UPDATE_INTERVAL);

    this.saveState();
  }

  stopOnlineSimulation() {
    if (this.onlineInterval) {
      clearInterval(this.onlineInterval);
      this.onlineInterval = null;
    }
    
    this.state.isOnlineSimulationActive = false;
    this.addHistory('Симуляция онлайн остановлена', { system: 'online', status: 'stopped' });
    this.saveState();
  }

  toggleOnlineSimulation() {
    if (this.state.isOnlineSimulationActive) {
      this.stopOnlineSimulation();
    } else {
      this.startOnlineSimulation();
    }
    return this.state.isOnlineSimulationActive;
  }

  // === УПРАВЛЕНИЕ ФИКТИВНЫМИ "ВСЕГО" ===
  incrementTotalFake() {
    if (this.state.totalFake < SIMULATION_CONFIG.TOTAL.MAX_FAKE) {
      const oldValue = this.state.totalFake;
      this.state.totalFake += 1;
      this.addHistory('Увеличение фиктивных "всего"', { old: oldValue, new: this.state.totalFake, change: '+1' });
      this.saveState();
    }
    return this.state.totalFake;
  }

  decrementTotalFake() {
    if (this.state.totalFake > SIMULATION_CONFIG.TOTAL.MIN_FAKE) {
      const oldValue = this.state.totalFake;
      this.state.totalFake -= 1;
      this.addHistory('Уменьшение фиктивных "всего"', { old: oldValue, new: this.state.totalFake, change: '-1' });
      this.saveState();
    }
    return this.state.totalFake;
  }

  setTotalFake(value: number) {
    const clampedValue = Math.max(
      SIMULATION_CONFIG.TOTAL.MIN_FAKE,
      Math.min(SIMULATION_CONFIG.TOTAL.MAX_FAKE, value)
    );
    
    const oldValue = this.state.totalFake;
    this.state.totalFake = clampedValue;
    
    if (oldValue !== clampedValue) {
      this.addHistory('Установка фиктивных "всего"', { old: oldValue, new: clampedValue });
    }
    
    this.saveState();
    return this.state.totalFake;
  }

  toggleTotalSimulation() {
    this.state.isTotalSimulationActive = !this.state.isTotalSimulationActive;
    this.addHistory(
      this.state.isTotalSimulationActive ? 'Показ фиктивных "всего" включен' : 'Показ фиктивных "всего" выключен',
      { system: 'total', active: this.state.isTotalSimulationActive }
    );
    this.saveState();
    return this.state.isTotalSimulationActive;
  }

  // === ИСТОРИЯ ИЗМЕНЕНИЙ ===
  private addHistory(action: string, changes: Record<string, any>) {
    const historyItem: SimulationHistoryItem = {
      timestamp: new Date().toISOString(),
      action,
      changes,
      admin: this.adminName,
    };

    this.state.history.unshift(historyItem);
    
    // Ограничиваем количество записей в истории
    if (this.state.history.length > this.historyLimit) {
      this.state.history = this.state.history.slice(0, this.historyLimit);
    }
  }

  clearHistory() {
    this.state.history = [];
    this.saveState();
  }

  // === ПОЛУЧЕНИЕ ДАННЫХ ===
  getState(): SimulationState {
    return { ...this.state };
  }

  getCombinedStats(realStats: {
    onlineReal?: number;
    totalReal?: number;
    [key: string]: any;
  }) {
    const onlineReal = realStats.onlineReal || 0;
    const totalReal = realStats.totalReal || 0;

    return {
      // Система 1: Онлайн
      onlineShown: this.state.isOnlineSimulationActive 
        ? onlineReal + this.state.onlineFake 
        : onlineReal,
      onlineReal,
      onlineFake: this.state.isOnlineSimulationActive ? this.state.onlineFake : 0,
      isOnlineSimulationActive: this.state.isOnlineSimulationActive,
      
      // Система 2: Всего
      totalShown: this.state.isTotalSimulationActive 
        ? totalReal + this.state.totalFake 
        : totalReal,
      totalReal,
      totalFake: this.state.isTotalSimulationActive ? this.state.totalFake : 0,
      isTotalSimulationActive: this.state.isTotalSimulationActive,
      
      // История
      history: [...this.state.history],
    };
  }

  // === ОЧИСТКА И СБРОС ===
  reset() {
    if (this.onlineInterval) {
      clearInterval(this.onlineInterval);
      this.onlineInterval = null;
    }
    
    this.state = this.getDefaultState();
    this.saveState();
    
    this.addHistory('Сброс симуляции', { system: 'all', action: 'reset' });
    return this.state;
  }

  // === ДЕСТРУКТОР ===
  destroy() {
    if (this.onlineInterval) {
      clearInterval(this.onlineInterval);
    }
  }
}

// Создаём синглтон экземпляр
export const adminSimulationService = new AdminSimulationService();

// Для React компонентов можно использовать хук
export const useSimulation = () => {
  // В реальном приложении здесь был бы useState и useEffect
  // для реактивного обновления компонентов
  return {
    getState: () => adminSimulationService.getState(),
    getCombinedStats: (realStats: any) => adminSimulationService.getCombinedStats(realStats),
    toggleOnlineSimulation: () => adminSimulationService.toggleOnlineSimulation(),
    toggleTotalSimulation: () => adminSimulationService.toggleTotalSimulation(),
    incrementTotalFake: () => adminSimulationService.incrementTotalFake(),
    decrementTotalFake: () => adminSimulationService.decrementTotalFake(),
    reset: () => adminSimulationService.reset(),
  };
};
