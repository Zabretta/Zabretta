"use client";

import { AdminUser } from '@/api/mocks-admin';
import { useState, useEffect } from 'react';
import './UserModals.css';

interface UserEditModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<AdminUser>) => Promise<void>;
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<AdminUser>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role,
        isActive: user.isActive,
        email: user.email
      });
      setError(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError('Ошибка при сохранении. Попробуйте снова.');
      console.error('Ошибка сохранения:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof AdminUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактирование пользователя</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="edit-section">
            <div className="form-group">
              <label htmlFor="login">Логин</label>
              <input
                id="login"
                type="text"
                value={user.login}
                disabled
                className="form-input disabled"
              />
              <small className="form-hint">Логин нельзя изменить</small>
            </div>

            <div className="form-group">
              <label htmlFor="name">Имя</label>
              <input
                id="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="form-input"
                placeholder="Введите имя пользователя"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="form-input"
                placeholder="email@example.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Роль</label>
                <select
                  id="role"
                  value={formData.role || 'user'}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="form-select"
                >
                  <option value="user">Пользователь</option>
                  <option value="moderator">Модератор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Статус</label>
                <select
                  id="status"
                  value={formData.isActive ? 'active' : 'blocked'}
                  onChange={(e) => handleChange('isActive', e.target.value === 'active')}
                  className="form-select"
                >
                  <option value="active">Активен</option>
                  <option value="blocked">Заблокирован</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Рейтинг пользователя</label>
              <div className="rating-display">
                <div className="rating-value-display">
                  <span className="rating-number">{user.rating || 0}</span>
                  <span className="rating-label-small">баллов</span>
                </div>
                <div className="rating-hint">
                  Для изменения рейтинга используйте отдельную форму корректировки
                </div>
              </div>
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
                {saving ? 'Сохранение...' : '💾 Сохранить изменения'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}