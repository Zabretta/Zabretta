"use client";

import { useState } from 'react';
import './AuthModal.css';

type AuthMode = 'register' | 'login' | 'forgot-password';

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

  // Заглушки API согласно ТЗ-1
  const mockRegister = async (userData: any) => {
    console.log('Заглушка: Регистрация', userData);
    localStorage.setItem('samodelkin_demo_user', JSON.stringify({
      ...userData,
      id: 'demo_' + Date.now(),
      status: 'pending'
    }));
    return { 
      success: true, 
      message: 'Регистрация успешна (демо-режим). Письмо с подтверждением отправлено на ваш email.' 
    };
  };

  const mockLogin = async (login: string, password: string) => {
    console.log('Заглушка: Вход', { login, password });
    return { 
      success: true, 
      token: 'jwt_token_demo_' + Date.now(),
      user: {
        id: 'demo_user_123',
        login: login,
        email: 'demo@example.com'
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (mode === 'register') {
        // Валидация паролей
        if (formData.password !== formData.passwordConfirm) {
          throw new Error('Пароли не совпадают');
        }
        
        if (!formData.agreement) {
          throw new Error('Необходимо принять правила сайта');
        }

        // Валидация логина (3-20 символов)
        if (formData.login.length < 3 || formData.login.length > 20) {
          throw new Error('Логин должен содержать от 3 до 20 символов');
        }

        // Валидация пароля (минимум 8 символов, цифра+буква)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
          throw new Error('Пароль: минимум 8 символов, цифра+буква');
        }

        const result = await mockRegister(formData);
        if (result.success) {
          setMessage({ text: result.message, type: 'success' });
          // В демо-режиме автоматически "логинимся" после регистрации
          localStorage.setItem('samodelkin_auth_token', 'demo_token');
          localStorage.setItem('samodelkin_user', JSON.stringify({
            login: formData.login,
            email: formData.email
          }));
          setTimeout(() => {
            onClose();
            window.location.reload(); // Обновляем страницу для обновления состояния
          }, 2000);
        }
      } else if (mode === 'login') {
        const result = await mockLogin(formData.login, formData.password);
        if (result.success) {
          setMessage({ text: 'Вход выполнен успешно!', type: 'success' });
          localStorage.setItem('samodelkin_auth_token', result.token);
          localStorage.setItem('samodelkin_user', JSON.stringify(result.user));
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Произошла ошибка', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
    setMessage(null);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    // Заглушка для восстановления пароля
    setTimeout(() => {
      setMessage({ 
        text: 'Инструкции по восстановлению пароля отправлены на ваш email (демо-режим)', 
        type: 'success' 
      });
      setIsLoading(false);
      setMode('login');
    }, 1000);
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

        {mode === 'forgot-password' ? (
          <form onSubmit={handleForgotPasswordSubmit}>
            <h3>Восстановление пароля</h3>
            <p>Введите ваш email, и мы отправим инструкции</p>
            
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <div className="auth-form-actions">
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Отправка...' : 'Отправить инструкции'}
              </button>
              <button 
                type="button" 
                className="secondary-btn"
                onClick={() => setMode('login')}
              >
                Назад к входу
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            )}
            
            <input
              type="text"
              placeholder="Логин"
              value={formData.login}
              onChange={(e) => setFormData({...formData, login: e.target.value})}
              required
            />
            
            <input
              type="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            
            {mode === 'register' && (
              <>
                <input
                  type="password"
                  placeholder="Повторите пароль"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                  required
                />
                <label className="agreement-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.agreement}
                    onChange={(e) => setFormData({...formData, agreement: e.target.checked})}
                    required
                  />
                  <span>Принимаю правила сайта</span>
                </label>
              </>
            )}

            {mode === 'login' && (
              <button 
                type="button" 
                className="forgot-password-btn"
                onClick={handleForgotPassword}
              >
                Забыли пароль?
              </button>
            )}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Отправка...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}