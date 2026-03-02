"use client";

import { useState, useRef, useEffect } from "react";
import "./PraiseMenu.css";
import { useAuth } from "./useAuth";
import { praiseApi } from "@/lib/api/praise";

interface PraiseMenuProps {
  projectId?: string;
  projectTitle?: string;
  authorId?: string;
}

export default function PraiseMenu({ 
  projectId, 
  projectTitle = "этот проект",
  authorId 
}: PraiseMenuProps) {
  const { user, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedPraise, setSelectedPraise] = useState<string | null>(null);
  const [praiseCount, setPraiseCount] = useState(0);
  const [hasUserPraised, setHasUserPraised] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const praiseOptions = [
    { 
      id: "GREAT", 
      emoji: "👍", 
      text: "Молодец!", 
      color: "#10B981",
      message: "Отличная работа! Продолжайте в том же духе!"
    },
    { 
      id: "EXCELLENT", 
      emoji: "👏", 
      text: "Отличная работа!", 
      color: "#3B82F6",
      message: "Профессиональный подход и качественный результат!"
    },
    { 
      id: "MASTER", 
      emoji: "🔨", 
      text: "Мастер золотые руки!", 
      color: "#F59E0B",
      message: "Виден большой опыт и мастерство в работе!"
    },
    { 
      id: "INSPIRING", 
      emoji: "💫", 
      text: "Вдохновляет!", 
      color: "#8B5CF6",
      message: "Ваша работа вдохновляет на собственные проекты!"
    },
    { 
      id: "CREATIVE", 
      emoji: "🎨", 
      text: "Креативно!", 
      color: "#EC4899",
      message: "Оригинальное решение и творческий подход!"
    },
    { 
      id: "DETAILED", 
      emoji: "🔍", 
      text: "Детально проработано", 
      color: "#6366F1",
      message: "Внимание к деталям впечатляет!"
    },
    { 
      id: "HELPFUL", 
      emoji: "🤝", 
      text: "Полезный совет!", 
      color: "#A855F7",
      message: "Спасибо за полезную информацию!"
    },
    { 
      id: "THANKS", 
      emoji: "🙏", 
      text: "Спасибо!", 
      color: "#EF4444",
      message: "Благодарю за помощь!"
    }
  ];

  // Загружаем количество похвал при монтировании
  useEffect(() => {
    if (projectId) {
      loadPraiseCount();
    }
  }, [projectId]);

  // Проверяем, хвалил ли текущий пользователь этот проект
  useEffect(() => {
    if (isAuthenticated && user && projectId) {
      checkUserPraised();
    }
  }, [isAuthenticated, user, projectId]);

  const loadPraiseCount = async () => {
    try {
      // Получаем статистику похвал для этого контента
      const response = await fetch(`/api/praise?contentId=${projectId}&limit=1`);
      const data = await response.json();
      
      if (data.success) {
        setPraiseCount(data.data?.total || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки количества похвал:', error);
    }
  };

  // 👇 ИСПРАВЛЕНО: правильная обработка ответа от hasUserPraised (объект с полем hasPraised)
  const checkUserPraised = async () => {
    if (!projectId) return;
    
    try {
      const result = await praiseApi.hasUserPraised(projectId);
      // result это объект { hasPraised: boolean }
      if (result && typeof result === 'object' && 'hasPraised' in result) {
        setHasUserPraised(result.hasPraised);
      } else {
        setHasUserPraised(false);
      }
    } catch (error) {
      console.error('Ошибка проверки похвалы:', error);
      setHasUserPraised(false);
    }
  };

  // 👇 ИСПРАВЛЕНО: правильная обработка ответа от createPraise
  const handlePraise = async (praiseId: string) => {
    if (!isAuthenticated) {
      setError('Необходимо авторизоваться');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!authorId) {
      setError('Не указан автор');
      return;
    }

    if (user?.id === authorId) {
      setError('Нельзя похвалить самого себя');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (hasUserPraised) {
      setError('Вы уже похвалили этот проект');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const praise = praiseOptions.find(p => p.id === praiseId);
    if (!praise) return;

    setIsLoading(true);
    setError(null);

    try {
      // Отправляем похвалу на сервер
      const result = await praiseApi.createPraise({
        toUserId: authorId,
        contentId: projectId,
        praiseType: praiseId as any,
        message: praise.message
      });

      // 👇 ИСПРАВЛЕНО: проверяем наличие поля praise в ответе
      if (result && result.praise) {
        setSelectedPraise(praiseId);
        setPraiseCount(prev => prev + 1);
        setHasUserPraised(true);
        setSuccessMessage(`Вы похвалили "${projectTitle}"`);
        
        // Показываем уведомление
        alert(`✅ ${praise.message}`);
        
        // Закрываем меню через 2 секунды
        setTimeout(() => {
          setShowMenu(false);
          setSelectedPraise(null);
          setSuccessMessage(null);
        }, 2000);
      } else {
        // 👇 ИСПРАВЛЕНО: получаем ошибку из ответа
        const errorMsg = (result as any)?.error || 'Ошибка при отправке похвалы';
        setError(errorMsg);
      }
    } catch (error: any) {
      setError(error.message || 'Ошибка соединения с сервером');
      console.error('Ошибка при отправке похвалы:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="praise-menu-container" ref={menuRef}>
      <button 
        className={`praise-button ${hasUserPraised ? 'praised' : ''}`}
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        aria-label="Похвалить проект"
        title="Похвалить проект"
        disabled={!authorId}
      >
        <span className="praise-button-icon">
          {hasUserPraised ? '✅' : '🔨'}
        </span>
        <span className="praise-button-label">
          {hasUserPraised ? 'Вы похвалили' : 'Похвалить'}
        </span>
        {praiseCount > 0 && (
          <span className="praise-count">{praiseCount}</span>
        )}
      </button>

      {showMenu && (
        <div className="praise-dropdown">
          <div className="praise-header">
            <h3 className="praise-title">
              {hasUserPraised ? 'Вы уже похвалили' : 'Похвалить проект'}
            </h3>
            <p className="praise-subtitle">
              {hasUserPraised 
                ? 'Спасибо за вашу поддержку!' 
                : `Выберите вариант похвалы для "${projectTitle}"`
              }
            </p>
          </div>

          {error && (
            <div className="praise-error">
              ⚠️ {error}
            </div>
          )}

          {successMessage && (
            <div className="praise-success">
              ✅ {successMessage}
            </div>
          )}

          {!hasUserPraised && !selectedPraise && (
            <div className="praise-options-grid">
              {praiseOptions.map((option) => (
                <button
                  key={option.id}
                  className={`praise-option ${isLoading ? 'loading' : ''}`}
                  onClick={() => handlePraise(option.id)}
                  title={option.message}
                  style={{ '--option-color': option.color } as React.CSSProperties}
                  disabled={isLoading || hasUserPraised}
                >
                  <div className="praise-emoji">{option.emoji}</div>
                  <span className="praise-text">{option.text}</span>
                </button>
              ))}
            </div>
          )}

          {(selectedPraise || hasUserPraised) && (
            <div className="praise-feedback">
              <div className="feedback-emoji">🎉</div>
              <p className="feedback-text">
                {hasUserPraised 
                  ? 'Вы уже поддержали этот проект!' 
                  : 'Спасибо за вашу поддержку!'
                }
              </p>
              <p className="feedback-details">
                Автор получит уведомление о вашей похвале и благодарности.
              </p>
            </div>
          )}

          <div className="praise-footer">
            <div className="praise-stats">
              <span className="stats-label">Всего похвал проекту:</span>
              <span className="stats-count">{praiseCount}</span>
            </div>
            <button 
              className="close-praise-button"
              onClick={() => setShowMenu(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}