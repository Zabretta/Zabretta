// PraiseMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import "./PraiseMenu.css";

interface PraiseMenuProps {
  projectId?: string;
  projectTitle?: string;
  authorId?: string;
}

export default function PraiseMenu({ 
  projectId = "current-project", 
  projectTitle = "этот проект",
  authorId = "author-1" 
}: PraiseMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedPraise, setSelectedPraise] = useState<string | null>(null);
  const [praiseCount, setPraiseCount] = useState(42); // Примерное количество похвал
  const menuRef = useRef<HTMLDivElement>(null);

  const praiseOptions = [
    { 
      id: "great", 
      emoji: "👍", 
      text: "Молодец!", 
      color: "#10B981",
      message: "Отличная работа! Продолжайте в том же духе!"
    },
    { 
      id: "excellent", 
      emoji: "👏", 
      text: "Отличная работа!", 
      color: "#3B82F6",
      message: "Профессиональный подход и качественный результат!"
    },
    { 
      id: "master", 
      emoji: "🔨", 
      text: "Мастер золотые руки!", 
      color: "#F59E0B",
      message: "Виден большой опыт и мастерство в работе!"
    },
    { 
      id: "inspiring", 
      emoji: "💫", 
      text: "Вдохновляет!", 
      color: "#8B5CF6",
      message: "Ваша работа вдохновляет на собственные проекты!"
    },
    { 
      id: "creative", 
      emoji: "🎨", 
      text: "Креативно!", 
      color: "#EC4899",
      message: "Оригинальное решение и творческий подход!"
    },
    { 
      id: "detailed", 
      emoji: "🔍", 
      text: "Детально проработано", 
      color: "#6366F1",
      message: "Внимание к деталям впечатляет!"
    }
  ];

  const handlePraise = (praiseId: string) => {
    const praise = praiseOptions.find(p => p.id === praiseId);
    if (!praise) return;

    setSelectedPraise(praiseId);
    setPraiseCount(prev => prev + 1);
    
    // Здесь будет отправка на сервер
    console.log(`Похвалили проект ${projectId} автора ${authorId}: ${praise.text}`);
    
    // Показываем уведомление
    alert(`Вы похвалили "${projectTitle}": ${praise.message}`);
    
    // Закрываем меню через 1.5 секунды
    setTimeout(() => {
      setShowMenu(false);
      setSelectedPraise(null);
    }, 1500);
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
        className="praise-button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        aria-label="Похвалить проект"
        title="Похвалить проект"
      >
        <span className="praise-button-icon">🔨</span>
        <span className="praise-button-label">Похвалить</span>
        {praiseCount > 0 && (
          <span className="praise-count">{praiseCount}</span>
        )}
      </button>

      {showMenu && (
        <div className="praise-dropdown">
          <div className="praise-header">
            <h3 className="praise-title">Похвалить проект</h3>
            <p className="praise-subtitle">Выберите вариант похвалы для "{projectTitle}"</p>
          </div>

          <div className="praise-options-grid">
            {praiseOptions.map((option) => (
              <button
                key={option.id}
                className={`praise-option ${selectedPraise === option.id ? 'selected' : ''}`}
                onClick={() => handlePraise(option.id)}
                title={option.message}
                style={{ '--option-color': option.color } as React.CSSProperties}
                disabled={!!selectedPraise}
              >
                <div className="praise-emoji">{option.emoji}</div>
                <span className="praise-text">{option.text}</span>
              </button>
            ))}
          </div>

          {selectedPraise && (
            <div className="praise-feedback">
              <div className="feedback-emoji">🎉</div>
              <p className="feedback-text">Спасибо за вашу поддержку!</p>
              <p className="feedback-details">
                Автор получил уведомление о вашей похвале.
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