"use client"

import { useState, useEffect, useCallback } from "react";
import "./Workbench.css";
import RulesModal from "./RulesModal";
import AuthModal from "./AuthModal";
import Marketplace from "./Marketplace";
import SettingsModal from "./SettingsModal";
import { useAuth } from "./useAuth";
import { useSettings } from "./SettingsContext";
import { useRating, RatingProvider } from "./RatingContext";
import { mockAPI } from "../api/mocks";
import AdminIcon from "./AdminIcon";

// Внутренний компонент WorkbenchContent
function WorkbenchContent() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [communityStats, setCommunityStats] = useState({
    online: 150,      // Начальное значение - середина диапазона 100-200
    total: 207,       // Начальное значение - константа фиктивных
    projectsCreated: 7543,
    adviceGiven: 15287
  });
  const [isInitialized, setIsInitialized] = useState(false);
  // ДОБАВЛЕНО: состояние для подсказки поворота экрана
  const [showOrientationHint, setShowOrientationHint] = useState(false);
  
  const { user, isAuthenticated, logout, authModalOpen, setAuthModalOpen, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { userRating } = useRating();

  // Определяем мобильное устройство и ориентацию
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Показываем подсказку только на мобильных в портретной ориентации
      if (mobile && window.innerHeight > window.innerWidth) {
        setShowOrientationHint(true);
      } else {
        setShowOrientationHint(false);
      }
    };
    
    checkMobileAndOrientation();
    window.addEventListener('resize', checkMobileAndOrientation);
    window.addEventListener('orientationchange', checkMobileAndOrientation);
    
    return () => {
      window.removeEventListener('resize', checkMobileAndOrientation);
      window.removeEventListener('orientationchange', checkMobileAndOrientation);
    };
  }, []);

  // Загрузка статистики
  const loadStats = useCallback(async () => {
    try {
      // Сброс статистики, если это первый запуск с новыми настройками
      const shouldReset = localStorage.getItem('samodelkin_stats_reset') !== 'true';
      
      if (shouldReset) {
        console.log('[СТАТИСТИКА] Сброс статистики для применения новых значений...');
        await mockAPI.stats.resetStats();
        localStorage.setItem('samodelkin_stats_reset', 'true');
      }
      
      // Используем getStatsForUsers() для получения данных для пользователей
      const response = await mockAPI.stats.getStatsForUsers();
      if (response.success && response.data) {
        // ИСПРАВЛЕНО: Теперь данные приходят в новом формате, но сохраняем обратную совместимость
        const newStats = {
          online: response.data.online || 150,        // Кулибиных на сайте (сумма реальных + фиктивных)
          total: response.data.total || 207,          // Кулибиных всего (сумма реальных + 207)
          projectsCreated: response.data.projectsCreated || 7543,
          adviceGiven: response.data.adviceGiven || 15287
        };
        
        setCommunityStats(newStats);
        console.log('[СТАТИСТИКА] Статистика для пользователей загружена:', {
          online: newStats.online,
          total: newStats.total,
          onlineShown: response.data.onlineShown,
          totalShown: response.data.totalShown
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики: ', error);
    }
  }, []);

  // Инициализация статистики
  useEffect(() => {
    if (!isInitialized) {
      loadStats();
      setIsInitialized(true);
    }
  }, [loadStats, isInitialized]);

  // Автоматическое изменение количества онлайн-пользователей
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        // ИСПРАВЛЕНО: simulateOnlineChange() теперь работает корректно с проверкой isOnlineSimulationActive
        const response = await mockAPI.stats.simulateOnlineChange();
        if (response.success && response.data) {
          // ИСПРАВЛЕНО: Исправлена ошибка - правильный синтаксис с prevState
          setCommunityStats(prevState => ({
            ...prevState,
            online: response.data!.online || prevState.online
          }));
          
          // Дополнительное логирование для отладки
          console.log('[ИНТЕРВАЛ] Обновление онлайн:', {
            новое: response.data!.online,
            onlineShown: response.data!.onlineShown,
            onlineFake: response.data!.onlineFake,
            isOnlineSimulationActive: response.data!.isOnlineSimulationActive
          });
        }
      } catch (error) {
        console.error('Ошибка при имитации изменения статуса онлайн:', error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Обработчики действий
  const handleRulesClick = () => setIsRulesModalOpen(true);
  const handleCloseRulesModal = () => setIsRulesModalOpen(false);
  
  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      alert("Переход в личный кабинет");
    } else {
      setAuthModalOpen(true);
    }
  };

  // Обработчики для верхней панели
  const handleToolAction = async (toolId: string, label: string) => {
    setIsLoading(true);
    console.log(`Действие: ${label}`);
    
    try {
      switch (toolId) {
        case "hammer":
          alert(`Вы похвалили проект!`);
          break;
        case "share":
          alert("Проект успешно опубликован!");
          break;
        case "heart":
          alert("Проект добавлен в избранное!");
          break;
        case "pencil":
          const commentText = prompt("Введите ваш комментарий:");
          if (commentText) {
            alert("Комментарий успешно добавлен!");
          }
          break;
        case "settings":
          break;
      }
    } catch (error) {
      console.error("Ошибка выполнения действия:", error);
      alert("Не удалось выполнить действие. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  // Переход в админку
  const handleAdminClick = () => {
    if (isAdmin) {
      window.location.href = '/admin';
    } else {
      alert('У вас нет прав администратора');
    }
  };

  // Обработчики для боковых панелей
  const handleDrawerClick = (drawerId: string) => {
    setActiveDrawer(drawerId);
    
    const drawer = leftDrawers.find(d => d.id === drawerId) || rightDrawers.find(d => d.id === drawerId);
    if (drawer?.action) {
      drawer.action();
      return;
    }
    
    setIsLoading(true);
    console.log(`Открытие раздела: ${drawerId}`);
    
    setTimeout(() => {
      switch (drawerId) {
        case "projects":
          alert("Загрузка ленты проектов...");
          break;
        case "masters":
          alert("Поиск мастеров рядом...");
          break;
        case "myprojects":
          alert("Загрузка ваших проектов...");
          break;
        case "liked":
          alert("Загрузка понравившихся проектов...");
          break;
        default:
          console.log(`Открываем: ${drawerId}`);
      }
      setIsLoading(false);
    }, 300);
  };

  // Массивы данных для боковых панелей
  const leftDrawers = [
    { id: "projects", label: "Лента проектов", icon: "📁", color: "#8B4513" },
    { id: "masters", label: "Мастера рядом", icon: "👥", color: "#A0522D" },
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
    { id: "support", label: "Помощь", icon: "🆘", color: "#D2691E" },
    { id: "logout", label: "Выйти", icon: "🚪", color: "#CD853F", action: () => logout() },
  ];

  // Массив для верхней панели
  const tools = [
    { id: "hammer", label: "Похвалить", icon: "🔨", action: () => handleToolAction("hammer", "Похвалить") },
    { id: "share", label: "Поделиться", icon: "📤", action: () => handleToolAction("share", "Поделиться") },
    { id: "heart", label: "Избранное", icon: "❤️", action: () => handleToolAction("heart", "Избранное") },
    { id: "pencil", label: "Комментировать", icon: "✏️", action: () => handleToolAction("pencil", "Комментировать") },
    { id: "settings", label: "Настройки", icon: "⚙️", action: () => setIsSettingsOpen(true) },
  ];

  const features = [
    { id: 1, icon: "🔨", text: "Демонстрируйте<br />свои самоделки" },
    { id: 2, icon: "👨‍🍳", text: "Делитесь<br />кулинарными шедеврами" },
    { id: 3, icon: "💡", text: "Показывайте<br />творческие планы" },
    { id: 4, icon: "🤝", text: "Давайте и получайте<br />советы и помощь" },
    { id: 5, icon: "🧩", text: "Творите и придумывайте<br />вместе" },
    { id: 6, icon: "💰", text: "Продавайте свои<br />товары и идеи" },
  ];

  return (
    <div className="workshop">
      {isLoading && (
        <div className="api-loading-overlay">
          <div className="loading-spinner">🛠️</div>
          <p>Загрузка...</p>
        </div>
      )}

      {/* ДОБАВЛЕНО: Подсказка поворота экрана */}
      {showOrientationHint && (
        <div className="orientation-hint">
          <div className="phone-container">
            {/* Контур телефона */}
            <div className="phone-outline">
              {/* Контур круглой кнопки "Home" */}
              <div className="home-button"></div>
            </div>
            
            {/* Стрелка вверху-справа */}
            <div className="arrow arrow-top-right"></div>
            
            {/* Стрелка внизу-слева */}
            <div className="arrow arrow-bottom-left"></div>
            
            {/* Текстовая подсказка */}
            <div className="hint-text">
              Поверните телефон<br />для лучшего просмотра
            </div>
          </div>
        </div>
      )}

      <div className="tools-panel">
        <div className="tools-container">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool ${isMobile ? 'mobile' : ''}`}
              title={tool.label}
              onClick={tool.action}
              disabled={isLoading}
              style={{
                flex: isMobile ? '0 0 auto' : '1 1 0',
                minWidth: isMobile ? '90px' : 'auto'
              }}
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
              className={`drawer ${isMobile ? 'mobile' : ''} ${activeDrawer === drawer.id ? "open" : ""}`}
              onClick={() => handleDrawerClick(drawer.id)}
              disabled={isLoading}
              style={!isMobile ? { borderLeftColor: drawer.color } : undefined}
              title={drawer.label}
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
              {isAuthenticated && user && (
                <div className="user-header-info">
                  <p className="user-greeting">Добро пожаловать, {user.login}!</p>
                  {isAdmin && (
                    <div className="admin-badge" onClick={handleAdminClick}>
                      <span className="admin-badge-text">Администратор</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="workbench-content">
              <div className="project-description">
                <div className="description-icon">🌟</div>
                <h2>Кулибины Руси — объединяйтесь!</h2>
                <p className="description-text">
                  Русь всегда славилась изобретателями, толковыми людьми с цепким умом
                  и золотыми руками. Этот сайт для вас, Кулибины!
                </p>
                <p className="description-text">
                  Первая социальная сеть для творческих и изобретательных людей,
                  умеющих воплощать идеи в жизнь своими руками.
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Загрузка..." : 
                    isAuthenticated ? "Мой профиль" : "Присоединиться к Кулибиным"}
                  </button>
                  <p className="cta-note">
                    {isAuthenticated 
                      ? "Рады видеть вас в сообществе!" 
                      : "Общайтесь с гениями и непоседами с горящими глазами!"}
                  </p>
                </div>
              </div>

              {/* ИСПРАВЛЕНО: Блок статистики теперь получает данные из двух независимых систем */}
              <div className="community-stats">
                <div className="stat-item" title="Реальные онлайн + фиктивные онлайн (диапазон 100-200)">
                  <span className="stat-number">{communityStats.online.toLocaleString()}</span>
                  <span className="stat-label">Кулибиных на сайте</span>
                </div>
                <div className="stat-item" title="Реальные зарегистрированные + 207 фиктивных">
                  <span className="stat-number">{communityStats.total.toLocaleString()}</span>
                  <span className="stat-label">Кулибиных всего</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{communityStats.projectsCreated.toLocaleString()}</span>
                  <span className="stat-label">Самоделок создано</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{communityStats.adviceGiven.toLocaleString()}</span>
                  <span className="stat-label">Ценных советов</span>
                </div>
              </div>
            </div>

            <div className="sawdust"></div>
            <div className="chips"></div>
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
              className={`drawer ${isMobile ? 'mobile' : ''} ${activeDrawer === drawer.id ? "open" : ""}`}
              onClick={() => handleDrawerClick(drawer.id)}
              disabled={isLoading}
              style={!isMobile ? { borderRightColor: drawer.color } : undefined}
              title={drawer.label}
            >
              <span className="drawer-handle"></span>
              <span className="drawer-icon">{drawer.icon}</span>
              <span className="drawer-label">{drawer.label}</span>
              <span className="drawer-arrow">←</span>
            </button>
          ))}
          
          {/* Иконка администратора в правой панели */}
          {isAdmin && (
            <div className="admin-drawer">
              <div className="admin-drawer-content" onClick={handleAdminClick}>
                <AdminIcon isAdmin={isAdmin} />
                <span className="admin-drawer-label">Панель администратора</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Плавающая иконка администратора для быстрого доступа */}
      {isAdmin && (
        <div className="floating-admin-icon" onClick={handleAdminClick}>
          <AdminIcon isAdmin={isAdmin} />
        </div>
      )}

      <div className="sparks">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="spark"></div>
        ))}
      </div>

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

// Основной компонент Workbench с RatingProvider
export default function Workbench() {
  return (
    <RatingProvider>
      <WorkbenchContent />
    </RatingProvider>
  );
}