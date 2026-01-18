// components/SettingsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Типы для настроек
type Theme = 'dark' | 'light' | 'brown' | 'auto';

interface Settings {
  theme: Theme;
  fontSize: number; // ЧИСЛО (проценты: 75, 100, 150 и т.д.)
  brightness: number;
  showAnimations: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  forceThemeUpdate: () => void;
}

// Значения по умолчанию - fontSize в ПРОЦЕНТАХ (как в SettingsModal.tsx)
const defaultSettings: Settings = {
  theme: 'dark',
  fontSize: 100, // 100% = нормальный размер
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

// Функция для определения авто-темы
const getAutoTheme = (): 'dark' | 'light' => {
  const hour = new Date().getHours();
  const isNightTime = hour >= 20 || hour < 8;
  return isNightTime ? 'light' : 'dark';
};

// Провайдер контекста
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Загрузка из localStorage при инициализации
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // Конвертация старого формата fontSize
          if (parsed.fontSize) {
            // Если старое значение было строкой (small/medium/large)
            if (typeof parsed.fontSize === 'string') {
              const fontSizeMap = { 
                small: 80,    // 80%
                medium: 100,  // 100%
                large: 120    // 120%
              };
              parsed.fontSize = fontSizeMap[parsed.fontSize as keyof typeof fontSizeMap] || 100;
            }
            // Если старое значение было множителем (0.8, 1.0, 1.2)
            else if (typeof parsed.fontSize === 'number' && parsed.fontSize <= 2.0) {
              parsed.fontSize = Math.round(parsed.fontSize * 100); // Конвертируем в проценты
            }
          }
          
          return { ...defaultSettings, ...parsed };
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
    
    // 1. ТЕМА: определяем актуальную тему (с учётом 'auto')
    const effectiveTheme = currentSettings.theme === 'auto' 
      ? getAutoTheme() 
      : currentSettings.theme;
    
    // Устанавливаем data-атрибут
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-theme-mode', currentSettings.theme);
    
    // Определяем цвета фона
    let workshopBg, workshopContainerBg, toolboxGradientStart, panelBackground;
    
    switch (effectiveTheme) {
      case 'light':
        workshopBg = '#f5f5f5';
        workshopContainerBg = '#ffffff';
        toolboxGradientStart = '#e0e0e0';
        panelBackground = 'rgba(245, 245, 245, 0.95)';
        break;
      case 'brown':
        workshopBg = '#3a2c1a';
        workshopContainerBg = '#4a3a2a';
        toolboxGradientStart = '#2a1f12';
        panelBackground = 'rgba(58, 44, 26, 0.95)';
        break;
      case 'dark':
      default:
        workshopBg = '#000000';
        workshopContainerBg = '#000000';
        toolboxGradientStart = '#1a120b';
        panelBackground = 'rgba(0, 0, 0, 0.95)';
    }
    
    // Устанавливаем CSS-переменные для фонов
    root.style.setProperty('--workshop-bg', workshopBg);
    root.style.setProperty('--workshop-container-bg', workshopContainerBg);
    root.style.setProperty('--toolbox-gradient-start', toolboxGradientStart);
    root.style.setProperty('--panel-background', panelBackground);

    // 2. ЯРКОСТЬ: применяем фильтр
    root.style.filter = `brightness(${currentSettings.brightness}%)`;

    // 3. РАЗМЕР ШРИФТА: КРИТИЧНО ВАЖНЫЙ ИСПРАВЛЕННЫЙ КОД!
    // fontSize хранится в ПРОЦЕНТАХ (75, 100, 150 и т.д.)
    // Нужно преобразовать проценты в множитель (75% = 0.75, 100% = 1.0, 150% = 1.5)
    const fontSizeMultiplier = currentSettings.fontSize / 100;
    
    console.log(`🔤 Размер шрифта: ${currentSettings.fontSize}% -> множитель ${fontSizeMultiplier}`);
    
    // Устанавливаем переменную на элементе <html>
    root.style.setProperty('--font-size-multiplier', fontSizeMultiplier.toString());
    
    // Для отладки: добавляем атрибут к body
    document.body.setAttribute('data-debug-font-size', `${currentSettings.fontSize}% (x${fontSizeMultiplier})`);
     
    // 4. АНИМАЦИИ
    if (currentSettings.showAnimations) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }
  };

  // Принудительное обновление темы
  const forceThemeUpdate = () => {
    if (settings.theme === 'auto') {
      applySettings(settings);
      return true;
    }
    return false;
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

  // Применяем настройки при монтировании
  useEffect(() => {
    applySettings(settings);
  }, []);

  // Применяем настройки при их изменении
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  // Таймер для авто-темы
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const checkAutoTheme = () => {
      applySettings(settings);
    };

    checkAutoTheme();
    const intervalId = setInterval(checkAutoTheme, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [settings.theme, settings]);

  // Отслеживание изменения системной темы
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      applySettings(settings);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.theme, settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, forceThemeUpdate }}>
      {children}
    </SettingsContext.Provider>
  );
}

