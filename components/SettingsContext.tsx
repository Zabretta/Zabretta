// components/SettingsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Типы для настроек - ДОБАВЛЕН 'auto'
type Theme = 'dark' | 'light' | 'brown' | 'auto';
type FontSize = 'small' | 'medium' | 'large';

interface Settings {
  theme: Theme;
  fontSize: FontSize;
  brightness: number;
  showAnimations: boolean;
}

// ДОБАВЛЕН forceThemeUpdate в интерфейс
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  forceThemeUpdate: () => void; // НОВАЯ ФУНКЦИЯ
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

// Функция для определения авто-темы (ИНВЕРСИЯ)
const getAutoTheme = (): 'dark' | 'light' => {
  // ИНВЕРСИЯ: ночью (20:00 - 8:00) = СВЕТЛАЯ тема, днём = ТЁМНАЯ
  const hour = new Date().getHours();
  const isNightTime = hour >= 20 || hour < 8;
  
  console.log(`🕐 getAutoTheme: час=${hour}, ночное время=${isNightTime}, тема=${isNightTime ? 'light' : 'dark'}`);
  
  return isNightTime ? 'light' : 'dark'; // ИНВЕРСИЯ!
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
    
    // 1. ТЕМА: определяем актуальную тему (с учётом 'auto')
    const effectiveTheme = currentSettings.theme === 'auto' 
      ? getAutoTheme() 
      : currentSettings.theme;
    
    console.log(`🎨 applySettings: выбранная тема=${currentSettings.theme}, актуальная тема=${effectiveTheme}`);
    
    // Устанавливаем data-атрибут (фактическая тема + режим выбора)
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-theme-mode', currentSettings.theme);
    
    // Определяем цвета фона в зависимости от актуальной темы
    let workshopBg, workshopContainerBg, toolboxGradientStart, panelBackground;
    
    switch (effectiveTheme) {
      case 'light':
        workshopBg = '#f5f5f5'; // Светло-серый
        workshopContainerBg = '#ffffff'; // Белый
        toolboxGradientStart = '#e0e0e0'; // Светлый градиент
        panelBackground = 'rgba(245, 245, 245, 0.95)'; // Светлый полупрозрачный
        break;
      case 'brown':
        workshopBg = '#3a2c1a'; // Коричневый
        workshopContainerBg = '#4a3a2a'; // Темно-коричневый
        toolboxGradientStart = '#2a1f12'; // Темный коричневый градиент
        panelBackground = 'rgba(58, 44, 26, 0.95)'; // Коричневый полупрозрачный
        break;
      case 'dark':
      default:
        // ВАЖНО: явно задаем переменные для темной темы
        workshopBg = '#000000'; // Чёрный
        workshopContainerBg = '#000000'; // Чёрный
        toolboxGradientStart = '#1a120b'; // Тёмный градиент
        panelBackground = 'rgba(0, 0, 0, 0.95)'; // Чёрный полупрозрачный
    }
    
    console.log(`🎨 Устанавливаем переменные: --workshop-bg=${workshopBg}`);
    
    // Устанавливаем CSS-переменные для фонов (для всех тем)
    root.style.setProperty('--workshop-bg', workshopBg);
    root.style.setProperty('--workshop-container-bg', workshopContainerBg);
    root.style.setProperty('--toolbox-gradient-start', toolboxGradientStart);
    root.style.setProperty('--panel-background', panelBackground);

    // 2. ЯРКОСТЬ: применяем фильтр
    root.style.filter = `brightness(${currentSettings.brightness}%)`;

    // 3. РАЗМЕР ШРИФТА: устанавливаем множитель
    const multiplier = typeof currentSettings.fontSize === 'number' 
      ? currentSettings.fontSize / 100 
      : { small: 0.9, medium: 1, large: 1.2 }[currentSettings.fontSize] || 1;

    root.style.setProperty('--font-size-multiplier', multiplier.toString());
     
    // 4. АНИМАЦИИ: добавляем или удаляем класс
    if (currentSettings.showAnimations) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }
  };

  // НОВАЯ ФУНКЦИЯ: принудительное обновление темы
  const forceThemeUpdate = () => {
    console.log('🔄 forceThemeUpdate вызван');
    if (settings.theme === 'auto') {
      applySettings(settings); // Принудительно переприменяем настройки
      return true;
    }
    console.log('⚠️  forceThemeUpdate: тема не в режиме "auto", пропускаем');
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
  }, []); // Пустой массив зависимостей - только при монтировании

  // Применяем настройки при их изменении
  useEffect(() => {
    applySettings(settings);
  }, [settings]); // Срабатывает при каждом изменении settings

  // Таймер для авто-темы (проверяем каждую минуту для тестирования)
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const checkAutoTheme = () => {
      console.log('⏰ Таймер авто-темы: проверяем...');
      applySettings(settings);
    };

    // Проверяем сразу
    checkAutoTheme();

    // Устанавливаем интервал проверки (каждую минуту для тестирования)
    const intervalId = setInterval(checkAutoTheme, 60 * 1000); // 1 минута

    return () => clearInterval(intervalId);
  }, [settings.theme, settings]);

  // Отслеживание изменения системной темы (опционально)
  useEffect(() => {
    if (settings.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      console.log('🖥️  Системная тема изменилась');
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