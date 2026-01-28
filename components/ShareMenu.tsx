// ShareMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import "./ShareMenu.css";

interface ShareMenuProps {
  onClose?: () => void;
}

export default function ShareMenu({ onClose }: ShareMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareOptions = [
    { 
      id: "vk", 
      label: "ВКонтакте", 
      icon: "VK", 
      color: "#4C75A3",
      url: "https://vk.com/share.php?url=",
      description: "Поделиться на стене или в сообществе"
    },
    { 
      id: "telegram", 
      label: "Telegram", 
      icon: "TG", 
      color: "#2AABEE",
      url: "https://t.me/share/url?url=",
      description: "Отправить ссылку в чат/канал"
    },
    { 
      id: "ok", 
      label: "Одноклассники", 
      icon: "OK", 
      color: "#F7931E",
      url: "https://connect.ok.ru/offer?url=",
      description: "Поделиться с друзьями"
    },
    { 
      id: "whatsapp", 
      label: "WhatsApp", 
      icon: "WA", 
      color: "#25D366",
      url: "https://wa.me/?text=",
      description: "Отправить в чат"
    },
    { 
      id: "copy", 
      label: "Копировать ссылку", 
      icon: "📎", 
      color: "#6B7280",
      description: "Скопировать в буфер обмена"
    },
    { 
      id: "internal", 
      label: "Внутри сайта", 
      icon: "🔗", 
      color: "#8B4513",
      description: "Поделиться проектом в Самоделкине"
    },
    { 
      id: "download", 
      label: "Скачать изображение", 
      icon: "📥", 
      color: "#059669",
      description: "Сохранить проект как картинку"
    },
    { 
      id: "friends", 
      label: "С друзьями", 
      icon: "👥", 
      color: "#3B82F6",
      description: "Поделиться с контактами на сайте"
    },
    { 
      id: "qr", 
      label: "QR-код", 
      icon: "📱", 
      color: "#7C3AED",
      description: "Показать QR-код для мобильных"
    },
    { 
      id: "embed", 
      label: "Встроить на сайт", 
      icon: "</>", 
      color: "#DC2626",
      description: "Получить код для встраивания"
    }
  ];

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async (optionId: string) => {
    const option = shareOptions.find(opt => opt.id === optionId);
    if (!option) return;

    switch (optionId) {
      case "copy":
        try {
          await navigator.clipboard.writeText(currentUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          // Fallback для старых браузеров
          const textArea = document.createElement('textarea');
          textArea.value = currentUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        break;

      case "download":
        // Здесь будет логика генерации и скачивания изображения
        alert("Функция скачивания изображения в разработке");
        break;

      case "internal":
        alert("Открывается список контактов Самоделкина...");
        break;

      case "friends":
        alert("Открывается список друзей...");
        break;

      case "qr":
        alert("Показываем QR-код...");
        break;

      case "embed":
        alert("Показываем код для встраивания...");
        break;

      default:
        // Открываем соцсети в новом окне
        if (option.url) {
          const shareUrl = option.url + encodeURIComponent(currentUrl);
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
        break;
    }
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        onClose?.();
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, onClose]);

  return (
    <div className="share-menu-container" ref={menuRef}>
      <button 
        className="share-button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        aria-label="Поделиться проектом"
      >
        <span className="share-button-icon">🪚</span>
        <span className="share-button-label">Поделиться</span>
      </button>

      {showMenu && (
        <div className="share-dropdown">
          <div className="share-header">
            <h3 className="share-title">Поделиться проектом</h3>
            <p className="share-subtitle">Расскажите о вашей самоделке!</p>
          </div>

          <div className="share-options-grid">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                className="share-option"
                onClick={() => handleShare(option.id)}
                title={option.description}
                style={{ '--option-color': option.color } as React.CSSProperties}
              >
                <div className="option-icon-container">
                  <span className="option-icon">{option.icon}</span>
                </div>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>

          {copied && (
            <div className="copy-notification">
              ✓ Ссылка скопирована в буфер обмена
            </div>
          )}

          <div className="share-footer">
            <div className="url-preview">
              <span className="url-label">Ссылка на проект:</span>
              <code className="url-text">{currentUrl}</code>
            </div>
            <button 
              className="close-button"
              onClick={() => {
                setShowMenu(false);
                onClose?.();
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
