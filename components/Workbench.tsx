// Workbench.tsx - С системой аутентификации, 6 окошками и модалкой Правил
"use client";

import { useState, useEffect } from "react";
import "./Workbench.css";
import RulesModal from "./RulesModal";
import AuthModal from "./AuthModal"; // Импорт модального окна аутентификации
import { useAuth } from "./useAuth"; // Импорт хука для работы с аутентификацией

export default function Workbench() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  
  // Используем глобальное состояние аутентификации
  const { user, isAuthenticated, logout, authModalOpen, setAuthModalOpen } = useAuth();

  const handleRulesClick = () => {
    setIsRulesModalOpen(true);
  };

  const handleCloseRulesModal = () => {
    setIsRulesModalOpen(false);
  };

  // Обработчик для открытия модального окна регистрации/входа
  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // Если пользователь авторизован, кнопка ведет в профиль.
      // Здесь можно добавить навигацию, например: router.push('/profile');
      alert("Переход в личный кабинет (профиль)");
    } else {
      // Если гость — открываем окно регистрации/входа
      setAuthModalOpen(true);
    }
  };

  const leftDrawers = [
    { id: "projects", label: "Лента проектов", icon: "📁", color: "#8B4513" },
    { id: "masters", label: "Мастера рядом", icon: "👥", color: "#A0522D" },
    { id: "messages", label: "Мои беседы", icon: "💬", color: "#D2691E" },
    { id: "achievements", label: "Достижения", icon: "🏆", color: "#CD853F" },
    { id: "help", label: "Ищут помощи", icon: "❓", color: "#8B7355" },
    { id: "library", label: "Библиотека", icon: "📚", color: "#A0522D" },
    { id: "market", label: "Барахолка", icon: "🛒", color: "#D2691E" },
    { 
      id: "contests", 
      label: "Правила", 
      icon: "🎯", 
      color: "#CD853F",
      action: handleRulesClick
    },
  ];

  const rightDrawers = [
    { id: "profile", label: "Мой профиль", icon: "👤", color: "#8B4513" },
    { id: "myprojects", label: "Мои проекты", icon: "🛠️", color: "#A0522D" },
    { id: "liked", label: "Понравилось", icon: "❤️", color: "#D2691E" },
    { id: "myworkshop", label: "Моя мастерская", icon: "📸", color: "#CD853F" },
    { id: "meetups", label: "Встречи", icon: "📅", color: "#8B7355" },
    { id: "settings", label: "Настройки", icon: "⚙️", color: "#A0522D" },
    { id: "support", label: "Помощь", icon: "🆘", color: "#D2691E" },
    { 
      id: "logout", 
      label: "Выйти", 
      icon: "🚪", 
      color: "#CD853F",
      action: () => logout() // Специальное действие для выхода
    },
  ];

  const tools = [
    { id: "hammer", label: "Похвалить", icon: "🔨", action: () => alert("Молодец! Отличная работа!") },
    { id: "share", label: "Поделиться", icon: "📤", action: () => alert("Открывается меню 'Поделиться'") },
    { id: "stats", label: "Статистика", icon: "📏", action: () => alert("Статистика сообщества") },
    { id: "settings", label: "Настройки", icon: "⚙️", action: () => alert("Настройки сайта") },
    { id: "pencil", label: "Комментировать", icon: "✏️", action: () => alert("Добавить комментарий") },
    { id: "paint", label: "Оформить", icon: "🎨", action: () => alert("Настроить внешний вид") },
    { id: "light", label: "Идеи", icon: "💡", action: () => alert("Генератор идей") },
    { id: "heart", label: "Избранное", icon: "❤️", action: () => alert("Добавить в избранное") },
  ];

  const features = [
    { id: 1, icon: "🔨", text: "Демонстрируйте<br />свои самоделки" },
    { id: 2, icon: "👨‍🍳", text: "Делитесь<br />кулинарными шедеврами" },
    { id: 3, icon: "💡", text: "Показывайте<br />творческие планы" },
    { id: 4, icon: "🤝", text: "Давайте и получайте<br />советы и помощь" },
    { id: 5, icon: "🧩", text: "Творите и придумывайте<br />вместе" },
    { id: 6, icon: "💰", text: "Продавайте свои<br />товары и идеи" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('Workbench.css')) {
          const url = new URL(href, window.location.origin);
          url.searchParams.set('t', Date.now().toString());
          link.setAttribute('href', url.toString());
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDrawerClick = (drawerId: string) => {
    setActiveDrawer(drawerId);
    
    if (drawerId === "contests") {
      handleRulesClick();
      return;
    }
    
    // Обработка специальных действий для правой тумбы
    const drawer = rightDrawers.find(d => d.id === drawerId);
    if (drawer && drawer.action) {
      drawer.action(); // Например, вызов logout для "Выйти"
      return;
    }
    
    alert(`Открываем: ${drawerId}`);
  };

  return (
    <div className="workshop">
      <div className="tools-panel">
        <div className="tools-container">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className="tool"
              title={tool.label}
              onClick={tool.action}
              style={{ width: '160px' }}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="workbench-container">
        <div className="toolbox left-toolbox">
          <div className="toolbox-label">Инструменты</div>
          {leftDrawers.map((drawer) => (
            <button
              key={drawer.id}
              className={`drawer ${activeDrawer === drawer.id ? "open" : ""}`}
              onClick={() => handleDrawerClick(drawer.id)}
              style={{ borderLeftColor: drawer.color }}
            >
              <span className="drawer-handle"></span>
              <span className="drawer-icon">{drawer.icon}</span>
              <span className="drawer-label">{drawer.label}</span>
              <span className="drawer-arrow">→</span>
            </button>
          ))}
        </div>

        <div className="workbench">
          <div className="workbench-surface">
            <div className="vice"></div>
            <div className="clamp"></div>
            <div className="wood-grain"></div>

            <div className="title-container">
              <h1 className="workshop-title">САМОДЕЛКИН</h1>
              <p className="workshop-subtitle">Сообщество домашних мастеров</p>
              {/* Отображение логина авторизованного пользователя */}
              {isAuthenticated && user && (
                <p className="user-greeting">Добро пожаловать, {user.login}!</p>
              )}
            </div>

            <div className="workbench-content">
              <div className="project-description">
                <div className="description-icon">🌟</div>
                <h2>Кулибины Руси — объединяемся!</h2>
                <p className="description-text">
                  Всегда Русь славилась изобретателями, толковыми людьми с цепким умом
                  и золотыми руками. Этот сайт для вас, Кулибины!
                </p>
                <p className="description-text">
                  Первая социальная сеть для творческих и изобретательных людей,
                  умеющих идею воплотить в жизнь своими руками.
                </p>

                <div className="features">
                  {features.map((feature) => (
                    <div key={feature.id} className="feature">
                      <span className="feature-icon">{feature.icon}</span>
                      <span
                        className="feature-text"
                        dangerouslySetInnerHTML={{ __html: feature.text }}
                      />
                    </div>
                  ))}
                </div>

                <div className="cta">
                  {/* Динамическая кнопка регистрации/профиля */}
                  <button 
                    className="cta-button" 
                    onClick={handleAuthButtonClick}
                  >
                    {isAuthenticated ? "Мой профиль" : "Присоединиться к Кулибиным"}
                  </button>
                  <p className="cta-note">
                    {isAuthenticated 
                      ? "Рады видеть вас в сообществе!" 
                      : "Общайтесь с гениями и непоседами с горящими глазами!"}
                  </p>
                </div>
              </div>

              <div className="community-stats">
                <div className="stat-item">
                  <span className="stat-number">1,892</span>
                  <span className="stat-label">Кулибиных онлайн</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">7,543</span>
                  <span className="stat-label">Самоделок создано</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">15,287</span>
                  <span className="stat-label">Ценных советов</span>
                </div>
              </div>
            </div>

            <div className="sawdust"></div>
            <div className="wood-chips"></div>
            <div className="screw"></div>
            <div className="nail"></div>
            <div className="tape-measure"></div>
          </div>
        </div>

        <div className="toolbox right-toolbox">
          <div className="toolbox-label">Моя мастерская</div>
          {rightDrawers.map((drawer) => (
            <button
              key={drawer.id}
              className={`drawer ${activeDrawer === drawer.id ? "open" : ""}`}
              onClick={() => handleDrawerClick(drawer.id)}
              style={{ borderRightColor: drawer.color }}
            >
              <span className="drawer-handle"></span>
              <span className="drawer-icon">{drawer.icon}</span>
              <span className="drawer-label">{drawer.label}</span>
              <span className="drawer-arrow">←</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sparks">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="spark"></div>
        ))}
      </div>

      <RulesModal 
        isOpen={isRulesModalOpen} 
        onClose={handleCloseRulesModal} 
      />
      
      {/* Модальное окно регистрации и входа */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </div>
  );
}