// components/AuthModal.tsx
"use client";

import { useState } from 'react';
import { mockAPI } from '../api/mocks';
import './AuthModal.css';

type AuthMode = 'register' | 'login' | 'forgotPassword';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [formData, setFormData] = useState({
    email: '',
    login: '',
    password: '',
    passwordConfirm: '',
    agreement: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Защита от повторной отправки формы
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Защита от повторной отправки
    if (isSubmitting) {
      console.log('[AUTH] Форма уже отправляется, пропускаем...');
      return;
    }
    
    setIsLoading(true);
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (mode === 'register') {
        // Валидация паролей
        if (formData.password !== formData.passwordConfirm) {
          throw new Error('Пароли не совпадают');
        }

        // Используем API из mocks.ts
        const result = await mockAPI.auth.register({
          login: formData.login,
          email: formData.email,
          password: formData.password,
          agreement: formData.agreement
        });

        if (result.success && result.data) {
          setMessage({ text: 'Регистрация прошла успешно!', type: 'success' });
          
          // ⚠️ ВНИМАНИЕ: УДАЛЕН ВЫЗОВ incrementOnRegistration()
          // Функция mockAPI.auth.register() УЖЕ увеличивает счетчик totalReal внутри себя
          // Дополнительный вызов привел бы к двойному увеличению
          
          // Сохраняем пользователя
          localStorage.setItem('samodelkin_auth_token', 'demo_token_' + Date.now());
          localStorage.setItem('samodelkin_user', JSON.stringify(result.data));
          
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2000);
        } else {
          throw new Error(result.error || 'Ошибка регистрации');
        }

      } else if (mode === 'login') {
        // Используем API из mocks.ts
        const result = await mockAPI.auth.login({
          login: formData.login,
          password: formData.password
        });

        if (result.success && result.data) {
          setMessage({ text: 'Вход выполнен успешно!', type: 'success' });
          
          localStorage.setItem('samodelkin_auth_token', result.data.token);
          localStorage.setItem('samodelkin_user', JSON.stringify(result.data.user));
          
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1000);
        } else {
          throw new Error(result.error || 'Ошибка входа');
        }
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Произошла ошибка', type: 'error' });
    } finally {
      setIsLoading(false);
      // Сбрасываем флаг отправки с задержкой, чтобы предотвратить мгновенный повторный вызов
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  const handleForgotPassword = () => {
    setMode('forgotPassword');
    setMessage(null);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Защита от повторной отправки
    if (isSubmitting) {
      console.log('[AUTH] Форма уже отправляется, пропускаем...');
      return;
    }
    
    setIsLoading(true);
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // Используем API из mocks.ts
      const result = await mockAPI.auth.forgotPassword(formData.email);
      
      if (result.success) {
        setMessage({ 
          text: 'Инструкции по восстановлению пароля отправлены на вашу электронную почту', 
          type: 'success' 
        });
        setTimeout(() => {
          setMode('login');
          setIsLoading(false);
        }, 2000);
      } else {
        throw new Error(result.error || 'Ошибка отправки');
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Произошла ошибка', type: 'error' });
      setIsLoading(false);
    } finally {
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-modal" onClick={onClose}>✕</button>
        
        <div className="auth-modal-tabs">
          <button 
            className={mode === 'register' ? 'active' : ''} 
            onClick={() => { setMode('register'); setMessage(null); }}
          >
            Регистрация
          </button>
          <button 
            className={mode === 'login' ? 'active' : ''} 
            onClick={() => { setMode('login'); setMessage(null); }}
          >
            Уже есть аккаунт
          </button>
        </div>

        {message && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {mode === 'forgotPassword' ? (
          <form onSubmit={handleForgotPasswordSubmit}>
            <h3>Восстановление пароля</h3>
            <p>Введите свой адрес электронной почты, и мы отправим вам инструкции</p>
            
            <div className="password-input-container">
              <input
                type="email"
                placeholder="Электронная почта"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="auth-form-actions">
              <button type="submit" disabled={isLoading || isSubmitting}>
                {isLoading ? 'Отправка...' : 'Отправить инструкции'}
              </button>
              <button 
                type="button" 
                className="secondary-btn"
                onClick={() => setMode('login')}
                disabled={isLoading}
              >
                Назад к входу
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="input-container">
                <input
                  type="email"
                  placeholder="Электронная почта"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="input-container">
              <input
                type="text"
                placeholder="Логин"
                value={formData.login}
                onChange={(e) => setFormData({...formData, login: e.target.value})}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={isLoading}
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            
            {mode === 'register' && (
              <>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <label className="agreement-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.agreement}
                    onChange={(e) => setFormData({...formData, agreement: e.target.checked})}
                    required
                    disabled={isLoading}
                  />
                  <span>Я принимаю правила сайта</span>
                </label>
              </>
            )}

            {mode === 'login' && (
              <button 
                type="button" 
                className="forgot-password-btn"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Забыли пароль?
              </button>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn" 
              disabled={isLoading || isSubmitting}
            >
              {isLoading ? 'Отправка...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
