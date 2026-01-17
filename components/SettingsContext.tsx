// components/SettingsContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Типы только для трех настроек
type ThemeType = 'light' | 'dark' | 'auto';
type SettingsType = {
  theme: ThemeType;
  brightness: number;
  fontSize: number; // в процентах для гибкости
};

// Значения по умолчанию
const defaultSettings: SettingsType = {
  theme: 'auto',
  brightness: 100,
  fontSize: 100, // 100% от базового
};

interface SettingsContextType {
  settings: SettingsType;
  updateSettings: (newSettings: Partial<SettingsType>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samodelkin-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<SettingsType>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('samodelkin-settings', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('samodelkin-settings');
    }
  };

  // Применяем настройки к корню документа через CSS переменные
  useEffect(() => {
    const root = document.documentElement;

    // 1. Применяем тему
    const applyTheme = () => {
      if (settings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', settings.theme);
      }
    };
    applyTheme();

    // 2. Применяем яркость (фильтр на весь документ)
    root.style.filter = `brightness(${settings.brightness}%)`;

    // 3. Применяем размер шрифта через CSS переменную
    root.style.setProperty('--font-size-multiplier', `${settings.fontSize / 100}`);

    // Слушатель для авто-темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (settings.theme === 'auto') applyTheme();
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};