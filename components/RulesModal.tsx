
"use client";

import { useState, useEffect, useRef } from "react";
import "./RulesModal.css";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [apiData, setApiData] = useState<{ rules: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Проверяем при загрузке, принимал ли пользователь правила ранее
  useEffect(() => {
    if (isOpen) {
      const accepted = localStorage.getItem('samodelkin_rules_accepted');
      setHasAccepted(!!accepted);
    }
  }, [isOpen]);

  // Закрытие по правой кнопке мыши
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (isOpen && modalRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [isOpen, onClose]);

  // Заглушка для API (будет заменена на реальную интеграцию)
  useEffect(() => {
    if (isOpen && !apiData) {
      setIsLoading(true);
      
      // Имитация API-запроса
      const fakeApiCall = () => {
        return new Promise<{ rules: string[] }>((resolve) => {
          setTimeout(() => {
            resolve({
              rules: [
                "Правило 1: Уважайте других участников",
                "Правило 2: Делитесь только своими работами",
                "Правило 3: Соблюдайте технику безопасности",
                "Правило 4: Помогайте новичкам",
                "Правило 5: Не спамьте и не рекламируйте",
                "Правило 6: Будьте конструктивны в обсуждениях",
              ],
            });
          }, 500);
        });
      };

      fakeApiCall()
        .then((data) => setApiData(data))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, apiData]);

  // Функция принятия правил
  const handleAcceptRules = () => {
    // Сохраняем в localStorage
    localStorage.setItem('samodelkin_rules_accepted', 'true');
    localStorage.setItem('samodelkin_rules_accepted_date', new Date().toISOString());
    
    // Обновляем состояние
    setHasAccepted(true);
    
    // Показываем уведомление
    alert('✅ Правила приняты! Добро пожаловать в сообщество Кулибиных!');
    
    // Закрываем модалку через 1 секунду
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Функция сброса согласия (для тестирования)
  const handleResetAcceptance = () => {
    if (confirm('Сбросить принятие правил? Это для тестирования.')) {
      localStorage.removeItem('samodelkin_rules_accepted');
      localStorage.removeItem('samodelkin_rules_accepted_date');
      setHasAccepted(false);
      alert('Согласие сброшено. Можете принять правила заново.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay">
      <div className="rules-modal-container" ref={modalRef}>
        {/* Верхняя панель с кнопками */}
        <div className="rules-modal-header">
          <div>
            <h1 className="rules-modal-title">НАШИ ПРАВИЛА</h1>
            {hasAccepted && (
              <div className="accepted-badge">
                ✅ Вы уже приняли правила {localStorage.getItem('samodelkin_rules_accepted_date') 
                  ? new Date(localStorage.getItem('samodelkin_rules_accepted_date')!).toLocaleDateString('ru-RU')
                  : ''}
              </div>
            )}
          </div>
          
          <div className="rules-modal-close-controls">
            <button 
              className="modal-close-btn"
              onClick={onClose}
              title="Закрыть (или правая кнопка мыши)"
            >
              ✕ Закрыть
            </button>
          </div>
        </div>

        {/* Основное содержимое */}
        <div className="rules-modal-content">
          {isLoading ? (
            <div className="rules-loading">
              <div className="loading-spinner"></div>
              <p>Загружаем правила...</p>
            </div>
          ) : (
            <div className="rules-content">
              {/* ЗАГЛУШКА ДЛЯ API */}
              <div className="api-data-placeholder">
                {apiData?.rules.map((rule, index) => (
                  <div key={index} className="rule-item">
                    <span className="rule-number">{index + 1}.</span>
                    <span className="rule-text">{rule}</span>
                  </div>
                ))}
              </div>
              
              {/* КОММЕНТАРИЙ: ВСТАВЬТЕ СВОЙ ТЕКСТ ПРАВИЛ ЗДЕСЬ ↓ */}
              <div className="custom-rules-section">
                {/* 
                  ============================================
                  ВСТАВЬТЕ ВАШ ТЕКСТ ПРАВИЛ НИЖЕ ЭТОЙ СТРОКИ
                  ============================================
                  
                  Пример:
                  <h2>1. Основные принципы сообщества</h2>
                  <p>Текст ваших правил...</p>
                  
                  Или можете удалить этот блок и написать свои правила выше,
                  заменив содержимое `api-data-placeholder`
                */}
                
                {/* Начало вашего текста */}
                
                {/* Конец вашего текста */}
              </div>
            </div>
          )}
        </div>

        {/* Нижняя панель */}
        <div className="rules-modal-footer">
          <div className="rules-modification-info">
            <p className="rules-modification-note">
              Правила могут обновляться. Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
            
            {/* Для разработки: кнопка сброса */}
            <button 
              className="reset-acceptance-btn"
              onClick={handleResetAcceptance}
              title="Только для разработки"
            >
              🧪 Сбросить согласие
            </button>
          </div>
          
          <div className="rules-actions">
            <button 
              className={`rules-action-btn accept-btn ${hasAccepted ? 'accepted' : ''}`}
              onClick={handleAcceptRules}
              disabled={hasAccepted}
            >
              {hasAccepted ? '✓ Правила уже приняты' : 'Принимаю правила'}
            </button>
            
            <button className="rules-action-btn print-btn" onClick={() => window.print()}>
              📄 Распечатать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}