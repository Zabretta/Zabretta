"use client";

import { useState, useEffect, useRef } from "react";
import { rulesApi } from "@/lib/api/rules"; // ← ЗАМЕНИЛИ ИМПОРТ
import "./RulesModal.css";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RulesData {
  rules: string[];
  accepted: boolean;
  acceptedDate?: string;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [rulesData, setRulesData] = useState<RulesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Проверяем при загрузке, принимал ли пользователь правила ранее
  useEffect(() => {
    const checkAcceptance = async () => {
      if (isOpen) {
        try {
          const data = await rulesApi.checkAcceptance(); // ← ЗАМЕНИЛИ
          setHasAccepted(data.accepted);
        } catch (error) {
          console.error('Ошибка проверки принятия правил:', error);
          // Fallback на localStorage
          const accepted = localStorage.getItem('samodelkin_rules_accepted') === 'true';
          setHasAccepted(accepted);
        }
      }
    };
    
    checkAcceptance();
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

  // Загрузка правил через API
  useEffect(() => {
    const loadRules = async () => {
      if (isOpen && !rulesData) {
        setIsLoading(true);
        try {
          const data = await rulesApi.getRulesWithAcceptance(); // ← ЗАМЕНИЛИ
          
          // Преобразуем массив объектов Rule в массив строк
          const ruleStrings = data.rules.map(rule => rule.text);
          
          setRulesData({
            rules: ruleStrings,
            accepted: data.accepted,
            acceptedDate: data.acceptedDate
          });
          setHasAccepted(data.accepted);
          
        } catch (error) {
          console.error('Ошибка API при загрузке правил:', error);
          // Fallback на локальные правила
          setRulesData({
            rules: [
              "Уважаемые пользователи, приветствуем вас на нашем сайте САМОДЕЛКИН. Наш сайт создан с целью обьеденить талантливых, изобретательных, творческих людей в группу по интересам, для общения, возможностью поделиться своими идеями, поделками, изобретениями, получить или оказать помощь и поддержку в разработках, проектах или ремонте, творчестве, домашнем рукоделии, кулинарии, круг интересов не ограничен. Если вы в душе Кулибин или Левша, то это ваш сайт.",
              "На нашей площадке после регистрации вы получаете возможность в личном кабинете выкладывать фото и видео своих проектов, они автоматически будут попадать в ЛЕНТА ПРОЕКТОВ где их смогут обсуждать, комментировать, одобрять или конструктивно критиковать другие пользователи и участники.",
              "На сайте для каждого пользователя создана рейтинговая система, за помощь другим, за похвалу хороших проектов, за выложенные в БИБЛИОТЕКу документы, схемы, рецепты и т.д. будут начисляться баллы повышающие личный рейтинг который позволяет более широкие возможности на получение заказов и продаж.",
              "На сайте есть возможность разместить обьявление о продаже своих работ в разделе БАРАХОЛКА а так же размещение обьявлений по ремонту или изготовлению в разделе МАСТЕРА РЯДОМ.",
              "На сайте запрещено распостранять стороннюю рекламу и спам, аккаунт пользователя будет блокироваться.",
              "Уважаемые пользователи, просьба относиться друг к другу с уважением не оскорблять друг друга в переписке и комментариях, мат на странице сайта строго запрещен, аккаунт нарушителя будет блокироваться и удаляться. Будте добры друг к другу и уважительны, удачи вам в ваших достижениях и проектах.",
            ],
            accepted: localStorage.getItem('samodelkin_rules_accepted') === 'true',
            acceptedDate: localStorage.getItem('samodelkin_rules_accepted_date') || undefined
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadRules();
  }, [isOpen, rulesData]);

  // Функция принятия правил через API
  const handleAcceptRules = async () => {
    try {
      const data = await rulesApi.acceptRules(); // ← ЗАМЕНИЛИ
      
      setHasAccepted(true);
      
      // Обновляем локальные данные
      if (rulesData) {
        setRulesData({
          ...rulesData,
          accepted: true,
          acceptedDate: data.acceptedDate
        });
      }
      
      alert('✅ Правила приняты! Добро пожаловать в сообщество Кулибиных!');
      
      // Закрываем модалку через 1 секунду
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Ошибка API при принятии правил:', error);
      // Fallback на локальное сохранение
      localStorage.setItem('samodelkin_rules_accepted', 'true');
      localStorage.setItem('samodelkin_rules_accepted_date', new Date().toISOString());
      setHasAccepted(true);
      alert('✅ Правила приняты! (локальное сохранение)');
      
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  // Функция сброса согласия (для тестирования)
  const handleResetAcceptance = async () => {
    if (confirm('Сбросить принятие правил? Это для тестирования.')) {
      try {
        await rulesApi.resetAcceptance(); // ← ЗАМЕНИЛИ
        
        setHasAccepted(false);
        if (rulesData) {
          setRulesData({
            ...rulesData,
            accepted: false,
            acceptedDate: undefined
          });
        }
        alert('Согласие сброшено. Можете принять правила заново.');
        
      } catch (error) {
        console.error('Ошибка сброса принятия:', error);
        localStorage.removeItem('samodelkin_rules_accepted');
        localStorage.removeItem('samodelkin_rules_accepted_date');
        setHasAccepted(false);
        alert('Согласие сброшено (локально).');
      }
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
            {hasAccepted && rulesData?.acceptedDate && (
              <div className="accepted-badge">
                ✅ Вы уже приняли правила {new Date(rulesData.acceptedDate).toLocaleDateString('ru-RU')}
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
              {rulesData?.rules.map((rule, index) => (
                <div key={index} className="rule-item">
                  <span className="rule-number">{index + 1}.</span>
                  <span className="rule-text">{rule}</span>
                </div>
              ))}
              
              {/* Блок для кастомных правил */}
              <div className="custom-rules-section">
                {/* 
                  ============================================
                  ВСТАВЬТЕ ВАШ ТЕКСТ ПРАВИЛ НИЖЕ ЭТОЙ СТРОКИ
                  ============================================
                  
                  Или можете удалить этот блок и расширить список правил выше
                */}
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
