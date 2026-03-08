"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./Workbench.css";
import RulesModal from "./RulesModal";
import AuthModal from "./AuthModal";
import Marketplace from "./Marketplace";
import SettingsModal from "./SettingsModal";
import ProfileModal from "./ProfileModal";
import NotificationsModal from "./NotificationsModal";
import LibraryModal from "./LibraryModal";
import PraiseModal from "./PraiseModal";
import { useAuth } from "./useAuth";
import { useSettings } from "./SettingsContext";
import { useRating, RatingProvider } from "./RatingContext";
import { usePraise, PraiseProvider } from "./PraiseContext";
import { praiseApi } from "@/lib/api/praise";
import { adminSimulationService } from "@/services/adminSimulationService";
import AdminIcon from "./AdminIcon";

// Типы для ответа от API похвал
interface PraiseResponse {
  success?: boolean;
  data?: {
    praise?: any;
    id?: string;
  };
  praise?: any;
  error?: string;
  message?: string;
  id?: string;
}

function WorkbenchContent() {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPraiseModalOpen, setIsPraiseModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isClient, setIsClient] = useState(false);
  
  const { user, isAuthenticated, logout, authModalOpen, setAuthModalOpen, isAdmin, onlineCount } = useAuth();
  const { currentContent, clearCurrentContent, refreshContent } = usePraise();
  
  const [realStats, setRealStats] = useState({
    online: 0,
    total: 0,
    projectsCreated: 0,
    adviceGiven: 0
  });
  
  const [displayStats, setDisplayStats] = useState({
    online: 150,
    total: 207,
    projectsCreated: 0,
    adviceGiven: 0
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOrientationHint, setShowOrientationHint] = useState(false);
  
  const userRole = user?.role?.toLowerCase();
  const canAccessAdmin = isAdmin || userRole === 'moderator';
  
  const { settings } = useSettings();
  const { userRating } = useRating();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Функция обновления отображаемой статистики
  const updateDisplayStats = useCallback((real: typeof realStats, currentOnline: number) => {
    const simState = adminSimulationService.getState();
    
    console.log('🔄 updateDisplayStats called with:', { 
      realAdviceGiven: real.adviceGiven,
      currentOnline,
      onlineFake: simState.onlineFake,
      totalFake: simState.totalFake
    });
    
    const newOnline = simState.isOnlineSimulationActive 
      ? currentOnline + simState.onlineFake 
      : currentOnline;
    
    const newTotal = simState.isTotalSimulationActive 
      ? real.total + simState.totalFake 
      : real.total;
    
    setDisplayStats({
      online: newOnline,
      total: newTotal,
      projectsCreated: real.projectsCreated,
      adviceGiven: real.adviceGiven
    });
    
    console.log('✅ setDisplayStats with adviceGiven:', real.adviceGiven);
    console.log('📊 Новые displayStats:', {
      online: newOnline,
      total: newTotal,
      projectsCreated: real.projectsCreated,
      adviceGiven: real.adviceGiven
    });
    
    console.log(`[Workbench] Обновлен онлайн: ${currentOnline} реальных + ${simState.onlineFake} фиктивных = ${newOnline}`);
  }, []);

  // Эффект для обновления при изменении данных
  useEffect(() => {
    if (realStats && isClient) {
      console.log('📊 realStats изменились:', realStats);
      updateDisplayStats(realStats, onlineCount);
    }
  }, [onlineCount, realStats, isClient, updateDisplayStats]);

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
      
      console.log('📦 RAW DATA с бэкенда:', data);
      console.log('📦 adviceGiven из бэкенда:', data.content?.adviceGiven);
      console.log('📦 libraryPosts из бэкенда:', data.content?.libraryPosts);
      console.log('📦 projects из бэкенда:', data.content?.projects);
      console.log('📦 totalComments из бэкенда:', data.content?.totalComments);
      
      const newRealStats = {
        online: data.users?.online || 0,
        total: data.users?.total || 0,
        projectsCreated: data.content?.projects || data.content?.totalPosts || 0,
        adviceGiven: data.content?.adviceGiven || 0
      };
      
      console.log('🔄 newRealStats после обработки:', newRealStats);
      
      setRealStats(newRealStats);
      updateDisplayStats(newRealStats, onlineCount);
      
    } catch (error) {
      console.error('[Workbench] Ошибка загрузки:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [onlineCount, updateDisplayStats]);

  // Подписка на изменения симуляции
  useEffect(() => {
    console.log('[Workbench] Подписка на обновления симуляции');
    
    const unsubscribe = adminSimulationService.subscribe(() => {
      console.log('[Workbench] Получено обновление симуляции');
      if (realStats) {
        console.log('📊 Обновление симуляции, текущие realStats:', realStats);
        updateDisplayStats(realStats, onlineCount);
      }
    });
    
    return unsubscribe;
  }, [realStats, onlineCount, updateDisplayStats]);

  // Загрузка данных при старте
  useEffect(() => {
    loadRealStats();
  }, [loadRealStats]);

  // Периодическое обновление (раз в 30 секунд)
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
        
        console.log('📦 Фоновые данные с бэкенда:', {
          adviceGiven: data.content?.adviceGiven,
          libraryPosts: data.content?.libraryPosts,
          projects: data.content?.projects
        });
        
        const newRealStats = {
          online: data.users?.online || 0,
          total: data.users?.total || 0,
          projectsCreated: data.content?.projects || data.content?.totalPosts || 0,
          adviceGiven: data.content?.adviceGiven || 0
        };
        
        console.log('🔄 Фоновые newRealStats:', newRealStats);
        
        setRealStats(newRealStats);
        updateDisplayStats(newRealStats, onlineCount);
        
      } catch (error) {
        console.error('[Workbench] Ошибка фонового обновления:', error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isInitialized, onlineCount, updateDisplayStats]);

  // Загрузка уведомлений
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const result = await response.json();
      setUnreadNotificationsCount(result.data?.count || 0);
      console.log(`🔔 Непрочитанных уведомлений: ${result.data?.count || 0}`);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      setUnreadNotificationsCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const handleRulesClick = () => setIsRulesModalOpen(true);
  const handleCloseRulesModal = () => setIsRulesModalOpen(false);
  
  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      setIsProfileOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleAdminClick = () => {
    if (canAccessAdmin) {
      window.location.href = '/admin';
    } else {
      alert('У вас нет прав доступа в панель управления');
    }
  };

  const handleLibraryClick = () => {
    setIsLibraryOpen(true);
    console.log('Открытие библиотеки');
  };

  // Функция для открытия модалки похвалы с проверкой
  const handleOpenPraise = () => {
    console.log('🔍 handleOpenPraise called');
    console.log('📦 currentContent:', currentContent);
    console.log('👤 isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      alert('Необходимо авторизоваться');
      return;
    }

    if (!currentContent) {
      alert('Сначала откройте проект, мастерскую или материал для похвалы');
      console.log('❌ currentContent is null');
      return;
    }

    console.log('✅ currentContent type:', currentContent.type);
    
    if (currentContent.type !== 'PROJECT' && 
        currentContent.type !== 'MASTER' && 
        currentContent.type !== 'HELP' && 
        currentContent.type !== 'LIBRARY') {
      alert('Этот тип контента нельзя похвалить');
      return;
    }

    setIsPraiseModalOpen(true);
  };

  // 👇 ИСПРАВЛЕНО: обработчик похвалы с правильной обработкой ошибок
  const handlePraise = async (praiseId: string) => {
    if (!isAuthenticated) {
      alert('Необходимо авторизоваться');
      setIsPraiseModalOpen(false);
      return;
    }

    if (!currentContent) {
      alert('Сначала откройте проект, мастерскую или материал для похвалы');
      setIsPraiseModalOpen(false);
      return;
    }

    // Проверка типа контента
    if (currentContent.type !== 'PROJECT' && 
        currentContent.type !== 'MASTER' && 
        currentContent.type !== 'HELP' && 
        currentContent.type !== 'LIBRARY') {
      alert('Этот тип контента нельзя похвалить');
      setIsPraiseModalOpen(false);
      return;
    }

    // Нельзя похвалить самого себя
    if (currentContent.authorId === user?.id) {
      alert('Нельзя похвалить самого себя');
      setIsPraiseModalOpen(false);
      return;
    }

    try {
      console.log(`[Workbench] Отправка похвалы:`, {
        praiseId,
        toUserId: currentContent.authorId,
        contentId: currentContent.id,
        type: currentContent.type
      });

      // Формируем данные в зависимости от типа контента
      const praiseData: any = {
        toUserId: currentContent.authorId,
        praiseType: praiseId
      };

      // Для библиотеки используем libraryItemId, для остальных - contentId
      if (currentContent.type === 'LIBRARY') {
        praiseData.libraryItemId = currentContent.id;
      } else {
        praiseData.contentId = currentContent.id;
      }

      const result = await praiseApi.createPraise(praiseData) as PraiseResponse;
      
      console.log('📦 Полный ответ от сервера:', JSON.stringify(result, null, 2));

      // 👇 УНИВЕРСАЛЬНАЯ ПРОВЕРКА УСПЕХА
      const isSuccess = 
        result?.success === true ||           // { success: true, data: ... }
        result?.data !== undefined ||         // { data: ... }
        result?.praise !== undefined ||       // { praise: ... }
        (result as any)?.id !== undefined;    // просто объект похвалы

      if (isSuccess) {
        console.log('✅ Похвала успешно отправлена');
        alert(`✅ Вы похвалили "${currentContent.title}"! Автор получит +2 рейтинга и +3 активности`);
        
        // Обновляем контент, чтобы показать актуальную статистику похвал
        if (refreshContent) {
          console.log('🔄 Обновление контента после похвалы');
          await refreshContent(currentContent.id, currentContent.type);
        }
        
        // Закрываем модалку похвалы
        setIsPraiseModalOpen(false);
      } else {
        // 👇 ОПРЕДЕЛЯЕМ ТИП ОШИБКИ
        let errorMsg = 'Не удалось отправить похвалу';
        const serverError = (result as any)?.error || (result as any)?.message;
        
        if (serverError) {
          if (serverError.includes('уже похвалили')) {
            errorMsg = serverError; // "Вы уже похвалили этот контент" или "Вы уже похвалили этот документ"
          } else if (serverError.includes('самого себя')) {
            errorMsg = serverError; // "Нельзя похвалить самого себя"
          } else if (serverError.includes('не найден')) {
            errorMsg = serverError; // "Пользователь не найден", "Контент не найден" и т.д.
          } else {
            errorMsg = serverError;
          }
        }
        
        console.error('❌ Ошибка ответа:', result);
        alert(`⛔ ${errorMsg}`);
        setIsPraiseModalOpen(false);
      }
    } catch (error) {
      console.error('[Workbench] Ошибка при отправке похвалы:', error);
      alert('⛔ Произошла ошибка при отправке похвалы');
      setIsPraiseModalOpen(false);
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
        case "profile":
          if (isAuthenticated) {
            setIsProfileOpen(true);
          } else {
            setAuthModalOpen(true);
          }
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
    { id: "library", label: "Библиотека", icon: "📚", color: "#A0522D", action: handleLibraryClick },
    { id: "market", label: "Барахолка", icon: "🛒", color: "#D2691E", action: () => setIsMarketplaceOpen(true) },
    { id: "contests", label: "Правила", icon: "🎯", color: "#CD853F", action: handleRulesClick },
  ];

  const rightDrawers = [
    { id: "profile", label: "Мой профиль", icon: "👤", color: "#8B4513" },
    { id: "myprojects", label: "Мои проекты", icon: "🛠️", color: "#A0522D" },
    { id: "liked", label: "Понравилось", icon: "❤️", color: "#D2691E" },
    { id: "myworkshop", label: "Моя мастерская", icon: "🔨", color: "#CD853F" },
    { id: "support", label: "Помощь", icon: "🆘", color: "#D2691E" },
    { id: "logout", label: "Выйти", icon: "🚪", color: "#CD853F", action: () => logout() },
  ];

  const tools = [
    { id: "hammer", label: "Похвалить", icon: "🔨", action: handleOpenPraise },
    { id: "share", label: "Поделиться", icon: "📤" },
    { id: "heart", label: "Избранное", icon: "❤️" },
    { id: "pencil", label: "Комментировать", icon: "✏️" },
    { id: "notifications", label: "Уведомления", icon: "🔔", action: () => setIsNotificationsOpen(true) },
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
              className={`tool ${isMobile ? 'mobile' : ''} ${tool.id === 'notifications' && unreadNotificationsCount > 0 ? 'has-notifications' : ''}`}
              title={tool.label}
              onClick={tool.action}
              disabled={isLoading}
              style={{
                flex: isMobile ? '0 0 auto' : '1 1 0',
                minWidth: isMobile ? '90px' : 'auto',
                position: 'relative'
              }}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
              {tool.id === 'notifications' && unreadNotificationsCount > 0 && (
                <span className="notification-badge">{unreadNotificationsCount}</span>
              )}
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
                  {canAccessAdmin && (
                    <div className="admin-badge" onClick={handleAdminClick}>
                      <span className="admin-badge-text">
                        {isAdmin ? 'Администратор' : 'Модератор'}
                      </span>
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
                <div className="stat-item" title="Реальные онлайн + фиктивные онлайн">
                  <span className="stat-number">
                    {isClient ? displayStats.online.toLocaleString() : '...'}
                  </span>
                  <span className="stat-label">Кулибиных на сайте</span>
                </div>
                <div className="stat-item" title="Реальные зарегистрированные + фиктивные">
                  <span className="stat-number">
                    {isClient ? displayStats.total.toLocaleString() : '...'}
                  </span>
                  <span className="stat-label">Кулибиных всего</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {isClient ? displayStats.projectsCreated.toLocaleString() : '...'}
                  </span>
                  <span className="stat-label">Самоделок создано</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {isClient ? displayStats.adviceGiven.toLocaleString() : '...'}
                  </span>
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
          
          {canAccessAdmin && (
            <div className="admin-drawer">
              <div className="admin-drawer-content">
                <AdminIcon 
                  isAdmin={isAdmin} 
                  isModerator={userRole === 'moderator'} 
                  onClick={handleAdminClick}
                />
                <span className="admin-drawer-label">
                  {isAdmin ? 'Панель администратора' : 'Панель модератора'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {canAccessAdmin && (
        <div className="floating-admin-icon">
          <AdminIcon 
            isAdmin={isAdmin} 
            isModerator={userRole === 'moderator'} 
            onClick={handleAdminClick}
          />
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
      
      {isProfileOpen && (
        <ProfileModal 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal 
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      {isLibraryOpen && (
        <LibraryModal 
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          currentUser={user}
        />
      )}

      <PraiseModal 
        isOpen={isPraiseModalOpen}
        onClose={() => setIsPraiseModalOpen(false)}
        onPraise={handlePraise}
        projectTitle={currentContent?.title || "текущий проект"}
        authorName={currentContent?.authorName || currentContent?.authorId || "пользователь"}
      />
    </div>
  );
}

export default function Workbench() {
  return (
    <RatingProvider>
      <PraiseProvider>
        <WorkbenchContent />
      </PraiseProvider>
    </RatingProvider>
  );
}