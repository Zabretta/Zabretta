"use client";

import React, { useState } from "react";
import "./PraiseModal.css";

interface PraiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPraise: (praiseId: string) => void;
  projectTitle?: string;
  authorName?: string;
}

export default function PraiseModal({ 
  isOpen, 
  onClose, 
  onPraise,
  projectTitle = "этот проект",
  authorName = "автор"
}: PraiseModalProps) {
  const [selectedPraise, setSelectedPraise] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePraiseClick = (praiseId: string) => {
    setSelectedPraise(praiseId);
    setIsSubmitting(true);
    
    // Имитация отправки на сервер
    setTimeout(() => {
      onPraise(praiseId);
      setIsSubmitting(false);
      setSelectedPraise(null);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="praise-modal-overlay" onClick={onClose}>
      <div className="praise-modal" onClick={(e) => e.stopPropagation()}>
        <div className="praise-modal-header">
          <h2 className="praise-modal-title">🔨 Похвалить</h2>
          <button className="praise-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="praise-modal-subtitle">
          Выберите вариант похвалы для <strong>{projectTitle}</strong>
          <br />
          <span className="praise-modal-author">автор: {authorName}</span>
        </div>

        <div className="praise-modal-grid">
          {praiseOptions.map((option) => (
            <button
              key={option.id}
              className={`praise-modal-option ${selectedPraise === option.id ? 'selected' : ''} ${isSubmitting ? 'submitting' : ''}`}
              onClick={() => handlePraiseClick(option.id)}
              disabled={isSubmitting}
              style={{ '--option-color': option.color } as React.CSSProperties}
            >
              <div className="praise-option-emoji">{option.emoji}</div>
              <div className="praise-option-text">{option.text}</div>
            </button>
          ))}
        </div>

        {selectedPraise && (
          <div className="praise-modal-feedback">
            <div className="feedback-spinner">🔄</div>
            <div className="feedback-text">Отправляем вашу благодарность...</div>
          </div>
        )}

        <div className="praise-modal-footer">
          <button className="praise-modal-cancel" onClick={onClose}>
            Отмена
          </button>
          <div className="praise-modal-hint">
            Выберите один из вариантов похвалы
          </div>
        </div>
      </div>
    </div>
  );
}
