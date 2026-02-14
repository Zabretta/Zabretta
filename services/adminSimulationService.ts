// services/adminSimulationService.ts
// Управление фиктивными пользователями для имитации активности

const SIMULATION_CONFIG = {
  ONLINE: {
    MIN: 100,
    MAX: 200,
    MIN_CHANGE: 1,
    MAX_CHANGE: 3,
    MIN_INTERVAL: 7000,
    MAX_INTERVAL: 15000,
  },
  TOTAL: {
    DEFAULT_FAKE: 207,
    MIN_FAKE: 0,
    MAX_FAKE: 1000,
  },
  STORAGE_KEYS: {
    ONLINE_SIMULATION_ACTIVE: 'admin_simulation_online_active',
    ONLINE_FAKE_VALUE: 'admin_simulation_online_fake',
    TOTAL_SIMULATION_ACTIVE: 'admin_simulation_total_active',
    TOTAL_FAKE_COUNT: 'admin_simulation_total_fake',
    HISTORY: 'admin_simulation_history',
  },
} as const;

export interface SimulationState {
  onlineFake: number;
  isOnlineSimulationActive: boolean;
  totalFake: number;
  isTotalSimulationActive: boolean;
  history: SimulationHistoryItem[];
}

export interface SimulationHistoryItem {
  timestamp: string;
  action: string;
  changes: Record<string, any>;
  admin: string;
}

type UpdateCallback = () => void;

class AdminSimulationService {
  private state: SimulationState;
  private onlineTimeout: NodeJS.Timeout | null = null;
  private readonly historyLimit = 50;
  private readonly adminName = 'Администратор';
  private updateCallbacks: UpdateCallback[] = [];

  constructor() {
    this.state = this.loadState();
    if (this.state.isOnlineSimulationActive) {
      this.startOnlineSimulation();
    }
  }

  subscribe(callback: UpdateCallback) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyUpdate() {
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Ошибка в колбэке обновления:', error);
      }
    });
  }

  private loadState(): SimulationState {
    if (typeof window === 'undefined') return this.getDefaultState();

    try {
      const savedOnlineFake = localStorage.getItem(SIMULATION_CONFIG.STORAGE_KEYS.ONLINE_FAKE_VALUE);
      return {
        onlineFake: savedOnlineFake ? parseInt(savedOnlineFake) : this.getRandomOnline(),
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
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.ONLINE_FAKE_VALUE, this.state.onlineFake.toString());
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.TOTAL_SIMULATION_ACTIVE, this.state.isTotalSimulationActive.toString());
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.TOTAL_FAKE_COUNT, this.state.totalFake.toString());
      localStorage.setItem(SIMULATION_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.state.history));
    } catch (error) {
      console.error('Ошибка сохранения состояния симуляции:', error);
    }
  }

  private getDefaultState(): SimulationState {
    return {
      onlineFake: this.getRandomOnline(),
      isOnlineSimulationActive: false,
      totalFake: SIMULATION_CONFIG.TOTAL.DEFAULT_FAKE,
      isTotalSimulationActive: false,
      history: [],
    };
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomOnline(): number {
    return this.getRandomInt(SIMULATION_CONFIG.ONLINE.MIN, SIMULATION_CONFIG.ONLINE.MAX);
  }

  private getRandomChange(): number {
    return this.getRandomInt(SIMULATION_CONFIG.ONLINE.MIN_CHANGE, SIMULATION_CONFIG.ONLINE.MAX_CHANGE);
  }

  private getRandomInterval(): number {
    return this.getRandomInt(SIMULATION_CONFIG.ONLINE.MIN_INTERVAL, SIMULATION_CONFIG.ONLINE.MAX_INTERVAL);
  }

  private getNextOnlineValue(currentValue: number): number {
    const change = this.getRandomChange();
    const increase = Math.random() >= 0.5;
    
    let newValue = increase ? currentValue + change : currentValue - change;
    
    // Проверяем границы
    if (newValue < SIMULATION_CONFIG.ONLINE.MIN) {
      newValue = SIMULATION_CONFIG.ONLINE.MIN + (SIMULATION_CONFIG.ONLINE.MIN - newValue);
    } else if (newValue > SIMULATION_CONFIG.ONLINE.MAX) {
      newValue = SIMULATION_CONFIG.ONLINE.MAX - (newValue - SIMULATION_CONFIG.ONLINE.MAX);
    }
    
    return Math.max(SIMULATION_CONFIG.ONLINE.MIN, Math.min(SIMULATION_CONFIG.ONLINE.MAX, newValue));
  }

  startOnlineSimulation() {
    if (this.onlineTimeout) return;

    this.state.isOnlineSimulationActive = true;
    this.addHistory('Симуляция онлайн запущена', { 
      system: 'online', 
      status: 'started',
      startValue: this.state.onlineFake 
    });
    
    this.saveState();
    this.notifyUpdate();
    this.scheduleNextUpdate();
  }

  private scheduleNextUpdate() {
    if (!this.state.isOnlineSimulationActive) return;

    const interval = this.getRandomInterval();

    console.log(`[Simulation] Следующее обновление через ${interval / 1000} сек, текущее значение: ${this.state.onlineFake}`);

    this.onlineTimeout = setTimeout(() => {
      const oldValue = this.state.onlineFake;
      const newValue = this.getNextOnlineValue(oldValue);
      
      this.state.onlineFake = newValue;
      
      this.addHistory('Изменение онлайн симуляции', { 
        old: oldValue, 
        new: newValue,
        change: newValue - oldValue 
      });
      
      this.saveState();
      console.log(`[Simulation] Значение изменено: ${oldValue} → ${newValue}`);
      this.notifyUpdate();
      
      this.scheduleNextUpdate();
    }, interval);
  }

  stopOnlineSimulation() {
    if (this.onlineTimeout) {
      clearTimeout(this.onlineTimeout);
      this.onlineTimeout = null;
    }
    
    this.state.isOnlineSimulationActive = false;
    this.addHistory('Симуляция онлайн остановлена', { 
      system: 'online', 
      status: 'stopped',
      finalValue: this.state.onlineFake 
    });
    this.saveState();
    this.notifyUpdate();
  }

  toggleOnlineSimulation() {
    if (this.state.isOnlineSimulationActive) {
      this.stopOnlineSimulation();
    } else {
      this.startOnlineSimulation();
    }
    return this.state.isOnlineSimulationActive;
  }

  incrementTotalFake() {
    if (this.state.totalFake < SIMULATION_CONFIG.TOTAL.MAX_FAKE) {
      const oldValue = this.state.totalFake;
      this.state.totalFake += 1;
      this.addHistory('Увеличение фиктивных "всего"', { old: oldValue, new: this.state.totalFake, change: '+1' });
      this.saveState();
      this.notifyUpdate();
    }
    return this.state.totalFake;
  }

  decrementTotalFake() {
    if (this.state.totalFake > SIMULATION_CONFIG.TOTAL.MIN_FAKE) {
      const oldValue = this.state.totalFake;
      this.state.totalFake -= 1;
      this.addHistory('Уменьшение фиктивных "всего"', { old: oldValue, new: this.state.totalFake, change: '-1' });
      this.saveState();
      this.notifyUpdate();
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
      this.saveState();
      this.notifyUpdate();
    }
    return this.state.totalFake;
  }

  toggleTotalSimulation() {
    this.state.isTotalSimulationActive = !this.state.isTotalSimulationActive;
    this.addHistory(
      this.state.isTotalSimulationActive ? 'Показ фиктивных "всего" включен' : 'Показ фиктивных "всего" выключен',
      { system: 'total', active: this.state.isTotalSimulationActive }
    );
    this.saveState();
    this.notifyUpdate();
    return this.state.isTotalSimulationActive;
  }

  private addHistory(action: string, changes: Record<string, any>) {
    const historyItem: SimulationHistoryItem = {
      timestamp: new Date().toISOString(),
      action,
      changes,
      admin: this.adminName,
    };

    this.state.history.unshift(historyItem);
    
    if (this.state.history.length > this.historyLimit) {
      this.state.history = this.state.history.slice(0, this.historyLimit);
    }
  }

  clearHistory() {
    this.state.history = [];
    this.saveState();
    this.notifyUpdate();
  }

  getState(): SimulationState {
    return { ...this.state };
  }

  getCombinedStats(realStats: {
    onlineReal?: number;
    totalReal?: number;
  }) {
    const onlineReal = realStats.onlineReal || 0;
    const totalReal = realStats.totalReal || 0;

    return {
      onlineShown: this.state.isOnlineSimulationActive 
        ? onlineReal + this.state.onlineFake 
        : onlineReal,
      onlineReal,
      onlineFake: this.state.isOnlineSimulationActive ? this.state.onlineFake : 0,
      isOnlineSimulationActive: this.state.isOnlineSimulationActive,
      
      totalShown: this.state.isTotalSimulationActive
        ? totalReal + this.state.totalFake 
        : totalReal,
      totalReal,
      totalFake: this.state.isTotalSimulationActive ? this.state.totalFake : 0,
      isTotalSimulationActive: this.state.isTotalSimulationActive,
      
      history: [...this.state.history],
    };
  }

  reset() {
    if (this.onlineTimeout) {
      clearTimeout(this.onlineTimeout);
      this.onlineTimeout = null;
    }
    
    this.state = this.getDefaultState();
    this.saveState();
    
    this.addHistory('Сброс симуляции', { system: 'all', action: 'reset' });
    this.notifyUpdate();
    return this.state;
  }

  destroy() {
    if (this.onlineTimeout) {
      clearTimeout(this.onlineTimeout);
    }
  }
}

export const adminSimulationService = new AdminSimulationService();
