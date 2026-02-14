// Файл 1 из 3: app/admin/users/RatingAdjustmentModal.tsx

"use client";

import { useState, useEffect } from 'react';
import './UserModals.css';

// Временный тип, позже перенесем в types/admin.ts
interface AdminUser {
  id: string;
  login: string;
  email: string;
  name?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  rating: number;
  activityPoints: number;
  totalPosts: number;
  violations: number;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

interface RatingAdjustmentModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (adjustment: {
    ratingChange: number;
    activityChange: number;
    reason: string;
    adminNote?: string;
  }) => Promise<void>;
}

export default function RatingAdjustmentModal({
  user,
  isOpen,
  onClose,
  onAdjust
}: RatingAdjustmentModalProps) {
  const [formData, setFormData] = useState({
    ratingChange: 0,
    activityChange: 0,
    reason: '',
    adminNote: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        ratingChange: 0,
        activityChange: 0,
        reason: '',
        adminNote: ''
      });
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      setError('Укажите причину корректировки');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onAdjust(formData);
      onClose();
    } catch (err) {
      setError('Ошибка при корректировке. Попробуйте снова.');
      console.error('Ошибка корректировки:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickChange = (type: 'rating' | 'activity', amount: number) => {
    if (type === 'rating') {
      setFormData(prev => ({ 
        ...prev, 
        ratingChange: prev.ratingChange + amount 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        activityChange: prev.activityChange + amount 
      }));
    }
  };

  const getNewRating = () => (user.rating || 0) + formData.ratingChange;
  const getNewActivity = () => (user.activityPoints || 0) + formData.activityChange;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Корректировка рейтинга</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="user-summary">
            <div className="user-avatar-small">
              {user.role === 'admin' ? '👑' : '👤'}
            </div>
            <div className="user-info">
              <div className="user-name">{user.login}</div>
              <div className="user-details">
                Текущий рейтинг: <strong>{user.rating || 0}</strong> • 
                Активность: <strong>{user.activityPoints || 0}</strong>
              </div>
            </div>
          </div>

          <div className="adjustment-section">
            {/* Корректировка рейтинга */}
            <div className="adjustment-group">
              <label className="adjustment-label">
                Изменение рейтинга
                <span className="change-indicator">
                  {formData.ratingChange > 0 ? '↑+' : formData.ratingChange < 0 ? '↓' : ''}
                  {formData.ratingChange}
                </span>
              </label>
              
              <div className="adjustment-controls">
                <div className="quick-buttons">
                  <button
                    type="button"
                    className="quick-btn negative"
                    onClick={() => handleQuickChange('rating', -10)}
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    className="quick-btn negative"
                    onClick={() => handleQuickChange('rating', -5)}
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickChange('rating', 0)}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    className="quick-btn positive"
                    onClick={() => handleQuickChange('rating', 5)}
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    className="quick-btn positive"
                    onClick={() => handleQuickChange('rating', 10)}
                  >
                    +10
                  </button>
                </div>

                <div className="manual-input">
                  <input
                    type="number"
                    value={formData.ratingChange}
                    onChange={(e) => handleChange('ratingChange', parseInt(e.target.value) || 0)}
                    className="adjustment-input"
                    min="-999"
                    max="999"
                  />
                  <span className="input-label">баллов</span>
                </div>
              </div>

              <div className="result-preview">
                <span>Было: {user.rating || 0} → Станет: </span>
                <strong className={getNewRating() >= (user.rating || 0) ? 'positive' : 'negative'}>
                  {getNewRating()}
                </strong>
              </div>
            </div>

            {/* Корректировка активности */}
            <div className="adjustment-group">
              <label className="adjustment-label">
                Изменение активности
                <span className="change-indicator">
                  {formData.activityChange > 0 ? '↑+' : formData.activityChange < 0 ? '↓' : ''}
                  {formData.activityChange}
                </span>
              </label>
              
              <div className="adjustment-controls">
                <div className="quick-buttons">
                  <button
                    type="button"
                    className="quick-btn negative"
                    onClick={() => handleQuickChange('activity', -10)}
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickChange('activity', 0)}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    className="quick-btn positive"
                    onClick={() => handleQuickChange('activity', 10)}
                  >
                    +10
                  </button>
                </div>

                <div className="manual-input">
                  <input
                    type="number"
                    value={formData.activityChange}
                    onChange={(e) => handleChange('activityChange', parseInt(e.target.value) || 0)}
                    className="adjustment-input"
                    min="-999"
                    max="999"
                  />
                  <span className="input-label">очков</span>
                </div>
              </div>

              <div className="result-preview">
                <span>Было: {user.activityPoints || 0} → Станет: </span>
                <strong className={getNewActivity() >= (user.activityPoints || 0) ? 'positive' : 'negative'}>
                  {getNewActivity()}
                </strong>
              </div>
            </div>

            {/* Причина корректировки */}
            <div className="adjustment-group">
              <label className="adjustment-label">Причина корректировки *</label>
              <select
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className="reason-select"
                required
              >
                <option value="">Выберите причину...</option>
                <option value="Награда за активность">Награда за активность</option>
                <option value="Корректировка ошибки системы">Корректировка ошибки системы</option>
                <option value="Поощрение за помощь">Поощрение за помощь</option>
                <option value="Нарушение правил">Нарушение правил</option>
                <option value="Служебная корректировка">Служебная корректировка</option>
                <option value="other">Другая причина</option>
              </select>

              {formData.reason === 'other' && (
                <input
                  type="text"
                  value={formData.adminNote}
                  onChange={(e) => handleChange('adminNote', e.target.value)}
                  className="custom-reason-input"
                  placeholder="Укажите причину..."
                  required
                />
              )}

              <textarea
                value={formData.adminNote && formData.reason !== 'other' ? formData.adminNote : ''}
                onChange={(e) => handleChange('adminNote', e.target.value)}
                className="reason-textarea"
                placeholder="Дополнительные комментарии (необязательно)..."
                rows={3}
              />
            </div>
          </div>

          {error && (
            <div className="form-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="modal-footer">
            <div className="footer-actions">
              <button
                type="button"
                className="action-btn tertiary"
                onClick={onClose}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="action-btn primary"
                disabled={saving}
              >
                {saving ? 'Применение...' : '📊 Применить корректировку'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
