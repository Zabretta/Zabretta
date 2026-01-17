// components/SettingsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Типы для настроек
type Theme = 'dark' | 'light' | 'brown';
type FontSize = 'small' | 'medium' | 'large';

interface Settings {
  theme: Theme;
  fontSize: FontSize;
  brightness: number;
  showAnimations: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

// Значения по умолчанию
const defaultSettings: Settings = {
  theme: 'dark',
  fontSize: 'medium',
  brightness: 100,
  showAnimations: true,
};

// Создание контекста
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Хук для использования контекста
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Провайдер контекста
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Загрузка из localStorage при инициализации
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-settings');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
    }
    return defaultSettings;
  });

  // Применение настроек к документу
  const applySettings = (currentSettings: Settings) => {
    const root = document.documentElement;
    
    // 1. ТЕМА: устанавливаем data-атрибут и CSS-переменные для фона
    root.setAttribute('data-theme', currentSettings.theme);
    
    // Определяем цвета фона в зависимости от темы
    let workshopBg, workshopContainerBg, toolboxGradientStart;
    
    switch (currentSettings.theme) {
      case 'light':
        workshopBg = '#f5f5f5'; // Светло-серый
        workshopContainerBg = '#ffffff'; // Белый
        toolboxGradientStart = '#e0e0e0'; // Светлый градиент
        break;
      case 'brown':
        workshopBg = '#3a2c1a'; // Коричневый
        workshopContainerBg = '#4a3a2a'; // Темно-коричневый
        toolboxGradientStart = '#2a1f12'; // Темный коричневый градиент
        break;
      case 'dark':
      default:
        workshopBg = '#000000'; // Чёрный (оригинальный)
        workshopContainerBg = '#000000'; // Чёрный
        toolboxGradientStart = '#1a120b'; // Тёмный градиент (оригинальный)
    }
    
    // Устанавливаем CSS-переменные для фонов
    root.style.setProperty('--workshop-bg', workshopBg);
    root.style.setProperty('--workshop-container-bg', workshopContainerBg);
    root.style.setProperty('--toolbox-gradient-start', toolboxGradientStart);

    // 2. ЯРКОСТЬ: применяем фильтр
    root.style.filter = `brightness(${currentSettings.brightness}%)`;

    // 3. РАЗМЕР ШРИФТА: устанавливаем множитель
    const fontSizeMultipliers = {
      small: 0.9,
      medium: 1,
      large: 1.2,
    };
    const multiplier = fontSizeMultipliers[currentSettings.fontSize];
    root.style.setProperty('--font-size-multiplier', multiplier.toString());

    // 4. АНИМАЦИИ: добавляем или удаляем класс
    if (currentSettings.showAnimations) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }
  };

  // Обновление настроек
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Сохраняем в localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('app-settings', JSON.stringify(updated));
      }
      // Применяем новые настройки
      applySettings(updated);
      return updated;
    });
  };

  // Сброс настроек
  const resetSettings = () => {
    setSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-settings', JSON.stringify(defaultSettings));
    }
    applySettings(defaultSettings);
  };

  // Применяем настройки при монтировании и изменении
  useEffect(() => {
    applySettings(settings);
  }, []); // Пустой массив зависимостей - только при монтировании

  // Ещё один эффект для отслеживания изменений settings
  useEffect(() => {
    applySettings(settings);
  }, [settings]); // Срабатывает при каждом изменении settings

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}