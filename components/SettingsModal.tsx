// components/SettingsModal.tsx
"use client";

import { useState, useEffect } from "react";
import "./SettingsModal.css";
import { useSettings } from "./SettingsContext";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Инициализация локальных настроек при загрузке
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Проверка изменений
  useEffect(() => {
    if (settings && localSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(localSettings);
      setHasUnsavedChanges(changed);
    }
  }, [localSettings, settings]);

  const handleSettingChange = (key: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    try {
      await updateSettings(localSettings);
      onClose();
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error);
      alert("Не удалось сохранить настройки");
    }
  };

  const handleReset = async () => {
    if (confirm("Сбросить все настройки к значениям по умолчанию?")) {
      try {
        await resetSettings();
      } catch (error) {
        console.error("Ошибка сброса настроек:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="settings-modal-overlay">
        <div className="settings-modal-container">
          <div className="settings-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка настроек...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-container">
        <div className="settings-modal-header">
          <h1 className="settings-modal-title">НАСТРОЙКИ САЙТА</h1>
          <button 
            className="close-settings" 
            onClick={onClose}
            aria-label="Закрыть настройки"
          >
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Секция: Внешний вид */}
          <div className="settings-section">
            <h3 className="settings-section-title">🎨 Внешний вид</h3>
            
            <div className="settings-group">
              <label className="settings-label">Тема оформления</label>
              <div className="settings-options">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    className={`settings-option ${localSettings.theme === theme ? 'active' : ''}`}
                    onClick={() => handleSettingChange('theme', theme)}
                  >
                    <span className="option-icon">
                      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🔄'}
                    </span>
                    <span className="option-label">
                      {theme === 'light' ? 'Светлая' : theme === 'dark' ? 'Тёмная' : 'Авто'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-group">
              <label className="settings-label">
                Яркость интерфейса: <span className="value-display">{localSettings.brightness}%</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="80"
                  max="120"
                  value={localSettings.brightness}
                  onChange={(e) => handleSettingChange('brightness', parseInt(e.target.value))}
                  className="brightness-slider"
                />
                <div className="slider-labels">
                  <span>80%</span>
                  <span>100%</span>
                  <span>120%</span>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <label className="settings-label">Размер шрифта</label>
              <select
                value={localSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                className="settings-select"
              >
                <option value="small">Мелкий (90%)</option>
                <option value="normal">Стандартный (100%)</option>
                <option value="large">Крупный (110%)</option>
                <option value="xlarge">Очень крупный (125%)</option>
              </select>
            </div>
          </div>

          {/* Секция: Звуки и уведомления */}
          <div className="settings-section">
            <h3 className="settings-section-title">🔔 Звуки и уведомления</h3>
            
            <div className="settings-group toggle-group">
              <label className="toggle-label">
                <span className="toggle-text">Звуковые уведомления</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={localSettings.soundsEnabled}
                    onChange={(e) => handleSettingChange('soundsEnabled', e.target.checked)}
                    id="sounds-toggle"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="settings-group">
              <label className="settings-label">
                Громкость звуков: <span className="value-display">{localSettings.soundVolume}%</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.soundVolume}
                  onChange={(e) => handleSettingChange('soundVolume', parseInt(e.target.value))}
                  className="volume-slider"
                  disabled={!localSettings.soundsEnabled}
                />
              </div>
            </div>

            <div className="settings-group toggle-group">
              <label className="toggle-label">
                <span className="toggle-text">Всплывающие уведомления</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={localSettings.notificationsEnabled}
                    onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                    id="notifications-toggle"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>

          {/* Секция: Производительность */}
          <div className="settings-section">
            <h3 className="settings-section-title">⚡ Производительность</h3>
            
            <div className="settings-group">
              <label className="settings-label">Уровень анимаций</label>
              <select
                value={localSettings.animations}
                onChange={(e) => handleSettingChange('animations', e.target.value)}
                className="settings-select"
              >
                <option value="full">Полные анимации</option>
                <option value="reduced">Упрощённые анимации</option>
                <option value="none">Без анимаций</option>
              </select>
              <p className="settings-hint">Рекомендуется "Без анимаций" для слабых устройств</p>
            </div>
          </div>

          {/* Секция: Конфиденциальность */}
          <div className="settings-section">
            <h3 className="settings-section-title">👁️ Конфиденциальность</h3>
            
            <div className="settings-group">
              <label className="settings-label">Видимость рейтинга для других</label>
              <select
                value={localSettings.ratingVisibility}
                onChange={(e) => handleSettingChange('ratingVisibility', e.target.value)}
                className="settings-select"
              >
                <option value="full">Показывать полный рейтинг</option>
                <option value="level">Показывать только уровень</option>
                <option value="hidden">Скрыть рейтинг</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-modal-footer">
          {hasUnsavedChanges && (
            <div className="unsaved-changes-notice">
              ⚠️ Есть несохранённые изменения
            </div>
          )}
          
          <div className="settings-actions">
            <button 
              className="settings-action-btn reset-btn"
              onClick={handleReset}
              type="button"
            >
              Сбросить к стандартным
            </button>
            
            <div className="primary-actions">
              <button 
                className="settings-action-btn cancel-btn"
                onClick={onClose}
                type="button"
              >
                Отмена
              </button>
              
              <button 
                className={`settings-action-btn save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
                onClick={handleSave}
                type="button"
                disabled={!hasUnsavedChanges}
              >
                {hasUnsavedChanges ? 'Сохранить изменения' : 'Закрыть'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
