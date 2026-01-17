// components/SettingsModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import './SettingsModal.css';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof typeof settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок внутри скроллящейся области */}
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">
            <span className="settings-icon">⚙️</span> Настройки
          </h2>
          <button className="settings-close-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Тема оформления */}
          <div className="settings-section">
            <h3 className="settings-section-title">Тема оформления</h3>
            <div className="theme-options">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <button
                  key={theme}
                  className={`theme-option ${localSettings.theme === theme ? 'active' : ''}`}
                  onClick={() => handleChange('theme', theme)}
                >
                  <span className="theme-icon">
                    {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🔄'}
                  </span>
                  <span className="theme-label">
                    {theme === 'light' ? 'Светлая' : 
                     theme === 'dark' ? 'Темная' : 'Авто'}
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

          {/* Кнопки действий внутри контента для мобильной прокрутки */}
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
              >
                Сохранить
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

// ДОБАВЛЕН ЭКСПОРТ ПО УМОЛЧАНИЮ
export default SettingsModal;
