// components/SettingsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { settingsApi } from '@/lib/api/settings'; // ← ЗАМЕНИЛ ИМПОРТ
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // При загрузке компонента загружаем настройки с сервера
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await settingsApi.getSettings(); // ← ЗАМЕНИЛ
        setLocalSettings(data);
        updateSettings(data);
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSyncStatus('loading');
    
    const settingsToSave = {
      theme: localSettings.theme as 'light' | 'dark' | 'auto' | 'brown',
      brightness: localSettings.brightness,
      fontSize: localSettings.fontSize,
      showAnimations: localSettings.showAnimations
    };
    
    try {
      const data = await settingsApi.saveSettings(settingsToSave); // ← ЗАМЕНИЛ
      updateSettings(data);
      setSyncStatus('success');
      setLastSynced(new Date().toISOString());
      setTimeout(() => setSyncStatus('idle'), 2000);
      onClose();
    } catch (error) {
      setSyncStatus('error');
      alert('Ошибка сохранения настроек. Проверьте соединение.');
    }
  };

  const handleReset = async () => {
    const defaultSettings = { 
      theme: 'auto' as const, 
      brightness: 100, 
      fontSize: 100,
      showAnimations: true
    };
    
    setSyncStatus('loading');
    try {
      const data = await settingsApi.saveSettings(defaultSettings); // ← ЗАМЕНИЛ
      resetSettings();
      setSyncStatus('success');
      setLastSynced(new Date().toISOString());
      setTimeout(() => setSyncStatus('idle'), 2000);
      setShowResetConfirm(false);
      onClose();
    } catch (error) {
      setSyncStatus('error');
    }
  };

  const handleSync = async () => {
    setSyncStatus('loading');
    try {
      const clientSettings = {
        theme: localSettings.theme as 'light' | 'dark' | 'auto' | 'brown',
        brightness: localSettings.brightness,
        fontSize: localSettings.fontSize,
        showAnimations: localSettings.showAnimations
      };
      const result = await settingsApi.syncSettings(clientSettings); // ← ЗАМЕНИЛ
      
      setLocalSettings(result.merged);
      updateSettings(result.merged);
      setSyncStatus('success');
      setLastSynced(new Date().toISOString());
      
      if (result.conflicts) {
        console.warn('Обнаружены конфликты:', result.conflicts);
      }
    } catch (error) {
      setSyncStatus('error');
    }
  };

  // Форматирование времени последней синхронизации
  const formatLastSynced = () => {
    if (!lastSynced) return 'Никогда';
    const date = new Date(lastSynced);
    return `${date.toLocaleTimeString()}`;
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок внутри скроллящейся области */}
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">
            <span className="settings-icon">⚙️</span> Настройки
            {loading && <span className="loading-indicator"> (загрузка...)</span>}
          </h2>
          <button className="settings-close-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Статус синхронизации */}
          <div className="sync-status-bar">
            <div className="sync-info">
              <span className="sync-label">Синхронизация:</span>
              <span className={`sync-status ${syncStatus}`}>
                {syncStatus === 'idle' && 'Готово'}
                {syncStatus === 'loading' && 'Синхронизация...'}
                {syncStatus === 'success' && 'Успешно'}
                {syncStatus === 'error' && 'Ошибка'}
              </span>
              {lastSynced && (
                <span className="last-synced">Обновлено: {formatLastSynced()}</span>
              )}
            </div>
          </div>

          {/* Тема оформления */}
          <div className="settings-section">
            <h3 className="settings-section-title">Тема оформления</h3>
            <div className="theme-options">
              {(['light', 'dark', 'auto', 'brown'] as const).map((theme) => (
                <button
                  key={theme}
                  className={`theme-option ${localSettings.theme === theme ? 'active' : ''}`}
                  onClick={() => handleChange('theme', theme)}
                >
                  <span className="theme-icon">
                    {theme === 'light' ? '☀️' : 
                     theme === 'dark' ? '🌙' : 
                     theme === 'auto' ? '🔄' : '🟤'}
                  </span>
                  <span className="theme-label">
                    {theme === 'light' ? 'Светлая' : 
                     theme === 'dark' ? 'Темная' : 
                     theme === 'auto' ? 'Авто' : 'Коричневая'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Яркость интерфейса */}
          <div className="settings-section">
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-label-icon">💡</span>
                Яркость интерфейса
              </label>
              <div className="settings-value">{localSettings.brightness}%</div>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={localSettings.brightness}
              onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
              className="settings-slider"
            />
            <div className="slider-labels">
              <span>Темнее</span>
              <span>Ярче</span>
            </div>
          </div>

          {/* Размер шрифта */}
          <div className="settings-section">
            <div className="settings-row">
              <label className="settings-label">
                <span className="settings-label-icon">🔤</span>
                Размер текста
              </label>
              <div className="settings-value">{localSettings.fontSize}%</div>
            </div>
            <input
              type="range"
              min="75"
              max="150"
              step="5"
              value={localSettings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
              className="settings-slider"
            />
            <div className="slider-labels">
              <span>Меньше</span>
              <span>Больше</span>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="settings-actions">
            <button
              className="settings-btn settings-btn-secondary"
              onClick={() => setShowResetConfirm(true)}
            >
              Сбросить настройки
            </button>
            <div className="settings-main-buttons">
              <button
                className="settings-btn settings-btn-cancel"
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                className="settings-btn settings-btn-primary"
                onClick={handleSave}
                disabled={syncStatus === 'loading'}
              >
                {syncStatus === 'loading' ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>

        {/* Подтверждение сброса */}
        {showResetConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <h3 className="confirm-title">Сбросить настройки?</h3>
              <p className="confirm-text">
                Все настройки будут восстановлены к значениям по умолчанию.
                Это действие нельзя отменить.
              </p>
              <div className="confirm-buttons">
                <button
                  className="settings-btn settings-btn-secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Отмена
                </button>
                <button
                  className="settings-btn settings-btn-danger"
                  onClick={handleReset}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
