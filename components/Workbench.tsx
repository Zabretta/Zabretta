// components/Workbench.tsx - Адаптирован для мобильных
"use client";

import { useState, useEffect } from "react";
import "./Workbench.css";
import RulesModal from "./RulesModal";
import AuthModal from "./AuthModal";
import Marketplace from "./Marketplace";
import SettingsModal from "./SettingsModal";
import { useAuth } from "./useAuth";

export default function Workbench() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { user, isAuthenticated, logout, authModalOpen, setAuthModalOpen } = useAuth();

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleRulesClick = () => setIsRulesModalOpen(true);
  const handleCloseRulesModal = () => setIsRulesModalOpen(false);
  const handleAuthButtonClick = () => {
    isAuthenticated ? alert("Переход в личный кабинет (профиль)") : setAuthModalOpen(true);
  };

  // Массивы данных
  const leftDrawers = [
    { id: "projects", label: "Лента проектов", icon: "📁", color: "#8B4513" },
    { id: "masters", label: "Мастера рядом", icon: "👥", color: "#A0522D" },
    { id: "achievements", label: "Достижения", icon: "🏆", color: "#CD853F" },
    { id: "help", label: "Ищут помощи", icon: "❓", color: "#8B7355" },
    { id: "library", label: "Библиотека", icon: "📚", color: "#A0522D" },
    { id: "market", label: "Барахолка", icon: "🛒", color: "#D2691E", action: () => setIsMarketplaceOpen(true) },
    { id: "contests", label: "Правила", icon: "🎯", color: "#CD853F", action: handleRulesClick },
  ];

  const rightDrawers = [
    { id: "profile", label: "Мой профиль", icon: "👤", color: "#8B4513" },
    { id: "myprojects", label: "Мои проекты", icon: "🛠️", color: "#A0522D" },
    { id: "liked", label: "Понравилось", icon: "❤️", color: "#D2691E" },
    { id: "myworkshop", label: "Моя мастерская", icon: "📸", color: "#CD853F" },
    { id: "meetups", label: "Встречи", icon: "📅", color: "#8B7355" },
    { id: "support", label: "Помощь", icon: "🆘", color: "#D2691E" },
    { id: "logout", label: "Выйти", icon: "🚪", color: "#CD853F", action: () => logout() },
  ];

  const tools = [
    { id: "hammer", label: "Похвалить", icon: "🔨", action: () => alert("Молодец! Отличная работа!") },
    { id: "share", label: "Поделиться", icon: "📤", action: () => alert("Открывается меню 'Поделиться'") },
    { id: "stats", label: "Статистика", icon: "📏", action: () => alert("Статистика сообщества") },
    { id: "settings", label: "Настройки", icon: "⚙️", action: () => setIsSettingsOpen(true) },
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

  const handleDrawerClick = (drawerId: string) => {
    setActiveDrawer(drawerId);
    const drawer = leftDrawers.find(d => d.id === drawerId) || rightDrawers.find(d => d.id === drawerId);
    if (drawer?.action) {
      drawer.action();
      return;
    }
    alert(`Открываем: ${drawerId}`);
  };

  return (
    <div className="workshop">
      {/* Верхняя панель с прокруткой */}
      <div className="tools-panel">
        <div className="tools-container">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool ${isMobile ? 'mobile' : ''}`}
              title={tool.label}
              onClick={tool.action}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Основной контейнер с боковыми панелями и верстаком */}
      <div className="workbench-container">
        {/* Левая панель */}
        <div className="toolbox left-toolbox">
          <div className="toolbox-label">Инструменты</div>
          {leftDrawers.map((drawer) => (
            <button
              key={drawer.id}
              className={`drawer ${isMobile ? 'mobile' : ''} ${activeDrawer === drawer.id ? "open" : ""}`}
              onClick={() => handleDrawerClick(drawer.id)}
              style={!isMobile ? { borderLeftColor: drawer.color } : undefined}
              title={drawer.label} // Всплывающая подсказка на мобильных
            >
              <span className="drawer-handle"></span>
              <span className="drawer-icon">{drawer.icon}</span>
              <span className="drawer-label">{drawer.label}</span>
              <span className="drawer-arrow">→</span>
            </button>
          ))}
        </div>

        {/* Центральный верстак */}
        <div className="workbench">
          <div className="workbench-surface">
            {/* Декоративные элементы верстака */}
            <div className="vice"></div>
            <div className="clamp"></div>
            <div className="wood-grain"></div>

            <div className="title-container">
              <h1 className="workshop-title">САМОДЕЛКИН</h1>
              <p className="workshop-subtitle">Сообщество домашних мастеров</p>
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

        {/* Правая панель */}
        <div className="toolbox right-toolbox">
          <div className="toolbox-label">Моя мастерская</div>
          {rightDrawers.map((drawer) => (
            <button
              key={drawer.id}
              className={`drawer ${isMobile ? 'mobile' : ''} ${activeDrawer === drawer.id ? "open" : ""}`}
              onClick={() => handleDrawerClick(drawer.id)}
              style={!isMobile ? { borderRightColor: drawer.color } : undefined}
              title={drawer.label}
            >
              <span className="drawer-handle"></span>
              <span className="drawer-icon">{drawer.icon}</span>
              <span className="drawer-label">{drawer.label}</span>
              <span className="drawer-arrow">←</span>
            </button>
          ))}
        </div>
      </div>

      {/* Декоративные искры */}
      <div className="sparks">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="spark"></div>
        ))}
      </div>

      {/* Модальные окна */}
      {isMarketplaceOpen && (
        <Marketplace onClose={() => setIsMarketplaceOpen(false)} />
      )}
      <RulesModal 
        isOpen={isRulesModalOpen} 
        onClose={handleCloseRulesModal} 
      />
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
