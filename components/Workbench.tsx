"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./Workbench.css";
import RulesModal from "./RulesModal";
import AuthModal from "./AuthModal";
import Marketplace from "./Marketplace";
import SettingsModal from "./SettingsModal";
import { useAuth } from "./useAuth";
import { useSettings } from "./SettingsContext";
import { useRating, RatingProvider } from "./RatingContext";
import { adminSimulationService } from "@/services/adminSimulationService";
import AdminIcon from "./AdminIcon";

function WorkbenchContent() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Реальные данные с бэкенда
  const [realStats, setRealStats] = useState({
    online: 0,
    total: 0,
    projectsCreated: 0,
    adviceGiven: 0
  });
  
  // Данные для отображения (реальные + симуляция)
  const [displayStats, setDisplayStats] = useState({
    online: 150,
    total: 207,
    projectsCreated: 0,
    adviceGiven: 0
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOrientationHint, setShowOrientationHint] = useState(false);
  
  const { user, isAuthenticated, logout, authModalOpen, setAuthModalOpen, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { userRating } = useRating();

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
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

  // Загрузка реальных данных с бэкенда
  const loadRealStats = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Workbench] Загрузка реальных данных с бэкенда...');
      
      const response = await fetch('http://localhost:3001/api/stats/system');
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики');
      }
      
      const result = await response.json();
      const data = result.data;
      
      console.log('[Workbench] Данные с бэкенда:', data);
      
      // Получаем реальные значения
      const newRealStats = {
        online: data.users?.online || 0,
        total: data.users?.total || 0,
        projectsCreated: data.content?.projects || data.content?.totalPosts || 0,
        adviceGiven: data.content?.totalComments || 0
      };
      
      setRealStats(newRealStats);
      
      // Обновляем отображаемые данные с учётом симуляции
      updateDisplayStats(newRealStats);
      
      console.log('[Workbench] Реальные данные установлены:', newRealStats);
    } catch (error) {
      console.error('[Workbench] Ошибка загрузки:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Обновление отображаемых данных (реальные + симуляция)
  const updateDisplayStats = useCallback((real: typeof realStats) => {
    const simState = adminSimulationService.getState();
    
    const newDisplayStats = {
      online: simState.isOnlineSimulationActive 
        ? real.online + simState.onlineFake 
        : real.online,
      total: simState.isTotalSimulationActive 
        ? real.total + simState.totalFake 
        : real.total,
      projectsCreated: real.projectsCreated,
      adviceGiven: real.adviceGiven
    };
    
    setDisplayStats(newDisplayStats);
    console.log('[Workbench] Отображаемые данные обновлены:', newDisplayStats);
  }, []);

  // Подписка на изменения симуляции
  useEffect(() => {
    console.log('[Workbench] Подписка на обновления симуляции');
    
    const unsubscribe = adminSimulationService.subscribe(() => {
      console.log('[Workbench] Получено обновление симуляции');
      updateDisplayStats(realStats);
    });
    
    return unsubscribe;
  }, [realStats, updateDisplayStats]);

  // Загрузка данных при старте
  useEffect(() => {
    loadRealStats();
  }, [loadRealStats]);

  // Периодическое обновление (раз в 30 секунд) - БЕЗ ВИЗУАЛЬНОЙ ЗАГРУЗКИ!
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(async () => {
      console.log('[Workbench] Фоновое обновление данных...');
      
      try {
        const response = await fetch('http://localhost:3001/api/stats/system');
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки статистики');
        }
        
        const result = await response.json();
        const data = result.data;
        
        const newRealStats = {
          online: data.users?.online || 0,
          total: data.users?.total || 0,
          projectsCreated: data.content?.projects || data.content?.totalPosts || 0,
          adviceGiven: data.content?.totalComments || 0
        };
        
        setRealStats(newRealStats);
        
        const simState = adminSimulationService.getState();
        
        setDisplayStats({
          online: simState.isOnlineSimulationActive 
            ? newRealStats.online + simState.onlineFake 
            : newRealStats.online,
          total: simState.isTotalSimulationActive 
            ? newRealStats.total + simState.totalFake 
            : newRealStats.total,
          projectsCreated: newRealStats.projectsCreated,
          adviceGiven: newRealStats.adviceGiven
        });
        
        console.log('[Workbench] Фоновое обновление завершено');
      } catch (error) {
        console.error('[Workbench] Ошибка фонового обновления:', error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isInitialized]);

  const handleRulesClick = () => setIsRulesModalOpen(true);
  const handleCloseRulesModal = () => setIsRulesModalOpen(false);
  
  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      alert("Переход в личный кабинет");
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      window.location.href = '/admin';
    } else {
      alert('У вас нет прав администратора');
    }
  };

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

  const tools = [
    { id: "hammer", label: "Похвалить", icon: "🔨" },
    { id: "share", label: "Поделиться", icon: "📤" },
    { id: "heart", label: "Избранное", icon: "❤️" },
    { id: "pencil", label: "Комментировать", icon: "✏️" },
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

      {showOrientationHint && (
        <div className="orientation-hint">
          <div className="phone-container">
            <div className="phone-outline">
              <div className="home-button"></div>
            </div>
            <div className="arrow arrow-top-right"></div>
            <div className="arrow arrow-bottom-left"></div>
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
              style={!isMobile ? { borderLeftColor: drawer.color } as React.CSSProperties : undefined}
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

              <div className="community-stats">
                <div className="stat-item" title="Реальные онлайн + фиктивные онлайн (диапазон 100-200)">
                  <span className="stat-number">{displayStats.online.toLocaleString()}</span>
                  <span className="stat-label">Кулибиных на сайте</span>
                </div>
                <div className="stat-item" title="Реальные зарегистрированные + фиктивные">
                  <span className="stat-number">{displayStats.total.toLocaleString()}</span>
                  <span className="stat-label">Кулибиных всего</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{displayStats.projectsCreated.toLocaleString()}</span>
                  <span className="stat-label">Самоделок создано</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{displayStats.adviceGiven.toLocaleString()}</span>
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
              style={!isMobile ? { borderRightColor: drawer.color } as React.CSSProperties : undefined}
              title={drawer.label}
            >
              <span className="drawer-handle"></span>
              <span className="drawer-icon">{drawer.icon}</span>
              <span className="drawer-label">{drawer.label}</span>
              <span className="drawer-arrow">←</span>
            </button>
          ))}
          
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
        <Marketplace 
          onClose={() => setIsMarketplaceOpen(false)}
          currentUser={user}
        />
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

export default function Workbench() {
  return (
    <RatingProvider>
      <WorkbenchContent />
    </RatingProvider>
  );
}
