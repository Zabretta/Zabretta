"use client";

import { useState } from 'react';
import { useAuth } from './useAuth';
import './AuthModal.css';

type AuthMode = 'register' | 'login' | 'forgotPassword';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login, register } = useAuth();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('[AUTH] Форма уже отправляется, пропускаем...');
      return;
    }
    
    setIsLoading(true);
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.passwordConfirm) {
          throw new Error('Пароли не совпадают');
        }

        if (!formData.agreement) {
          throw new Error('Необходимо принять правила сайта');
        }

        const success = await register({
          login: formData.login,
          email: formData.email,
          password: formData.password,
          agreement: formData.agreement
        });

        if (success) {
          setMessage({ text: 'Регистрация прошла успешно!', type: 'success' });
          
          // ✅ ИСПРАВЛЕНО: УБРАН window.location.reload()
          setTimeout(() => {
            onClose();
            // Не перезагружаем страницу!
          }, 1500);
        }

      } else if (mode === 'login') {
        const success = await login(formData.login, formData.password);

        if (success) {
          setMessage({ text: 'Вход выполнен успешно!', type: 'success' });
          
          // ✅ ИСПРАВЛЕНО: УБРАН window.location.reload()
          setTimeout(() => {
            onClose();
            // Не перезагружаем страницу!
          }, 1000);
        }
      }
    } catch (error: any) {
      setMessage({ 
        text: error.message || 'Произошла ошибка', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  const handleForgotPassword = () => {
    setMode('forgotPassword');
    setMessage(null);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('[AUTH] Форма уже отправляется, пропускаем...');
      return;
    }
    
    setIsLoading(true);
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      setMessage({ 
        text: 'Функция восстановления пароля будет доступна позже', 
        type: 'error' 
      });
      
      setTimeout(() => {
        setMode('login');
        setIsLoading(false);
      }, 2000);
      
    } catch (error: any) {
      setMessage({ 
        text: error.message || 'Произошла ошибка', 
        type: 'error' 
      });
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
            disabled={isLoading}
          >
            Регистрация
          </button>
          <button 
            className={mode === 'login' ? 'active' : ''} 
            onClick={() => { setMode('login'); setMessage(null); }}
            disabled={isLoading}
          >
            Вход
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