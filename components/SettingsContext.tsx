// components/SettingsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';

// Типы настроек (синхронизированы с будущим бэкендом)
export interface AppSettings {
  // Внешний вид
  theme: 'light' | 'dark' | 'auto';
  brightness: number;      // 80-120%
  fontSize: 'small' | 'normal' | 'large' | 'xlarge';
  
  // Звуки и уведомления
  soundsEnabled: boolean;
  soundVolume: number;     // 0-100%
  notificationsEnabled: boolean;
  
  // Производительность
  animations: 'full' | 'reduced' | 'none';
  
  // Конфиденциальность
  ratingVisibility: 'full' | 'level' | 'hidden';
  
  // Язык и регион
  language: string;
  dateFormat: 'ru' | 'iso';
}

// Настройки по умолчанию
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  brightness: 100,
  fontSize: 'normal',
  soundsEnabled: true,
  soundVolume: 70,
  notificationsEnabled: true,
  animations: 'full',
  ratingVisibility: 'full',
  language: 'ru',
  dateFormat: 'ru'
};

// Контекст настроек
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Заглушки API для демо-режима
const demoApi = {
  getSettings: async (): Promise<AppSettings> => {
    const saved = localStorage.getItem('samodelkin_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },
  
  updateSettings: async (updates: Partial<AppSettings>): Promise<AppSettings> => {
    const current = await demoApi.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem('samodelkin_settings', JSON.stringify(updated));
    return updated;
  },
  
  resetSettings: async (): Promise<AppSettings> => {
    localStorage.setItem('samodelkin_settings', JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
};

// Применение настроек к DOM
function applySettingsToDOM(settings: AppSettings) {
  const root = document.documentElement;
  
  // Тема
  root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
  
  if (settings.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('theme-dark', prefersDark);
    root.classList.toggle('theme-light', !prefersDark);
  } else {
    root.classList.add(`theme-${settings.theme}`);
  }
  
  // Яркость
  root.style.setProperty('--settings-brightness', `${settings.brightness}%`);
  
  // Размер шрифта
  const fontSizeMap = {
    'small': '0.9',
    'normal': '1',
    'large': '1.1',
    'xlarge': '1.25'
  };
  root.style.setProperty('--font-size-scale', fontSizeMap[settings.fontSize]);
  
  // Анимации
  if (settings.animations === 'none') {
    root.classList.add('no-animations');
    root.classList.remove('reduced-motion');
  } else if (settings.animations === 'reduced') {
    root.classList.add('reduced-motion');
    root.classList.remove('no-animations');
  } else {
    root.classList.remove('no-animations', 'reduced-motion');
  }
  
  // Сохранение настроек в meta-тегах
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', settings.theme === 'dark' ? '#1a0f0a' : '#ffffff');
  }
  
  // Диспатч события для других компонентов
  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
}

// Провайдер настроек
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Загрузка настроек при монтировании
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // В демо-режиме используем localStorage
        // В будущем здесь будет реальный API запрос
        const data = await demoApi.getSettings();
        setSettings(data);
        applySettingsToDOM(data);
      } catch (err) {
        console.error('Ошибка загрузки настроек:', err);
        setError('Не удалось загрузить настройки');
        // Используем настройки по умолчанию
        applySettingsToDOM(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
    
    // Слушаем системные изменения темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (settings.theme === 'auto') {
        applySettingsToDOM(settings);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Обновление настроек
  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      // В демо-режиме используем localStorage
      // В будущем здесь будет реальный API запрос
      const updated = await demoApi.updateSettings(updates);
      setSettings(updated);
      applySettingsToDOM(updated);
    } catch (err) {
      console.error('Ошибка обновления настроек:', err);
      throw new Error('Не удалось сохранить настройки');
    }
  };

  // Сброс настроек
  const resetSettings = async () => {
    try {
      const reset = await demoApi.resetSettings();
      setSettings(reset);
      applySettingsToDOM(reset);
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      throw new Error('Не удалось сбросить настройки');
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      isLoading,
      error
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Хук для использования настроек
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
