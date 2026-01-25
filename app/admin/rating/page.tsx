"use client";

import { useState, useEffect } from 'react';
import './AdminRatingPage.css';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { mockAPI } from '@/api/mocks';
import type { UserRating, RatingAdjustment } from '@/api/mocks';
import { formatDate } from '@/utils/admin';

// Типы для данных (совместимы с api/mocks.ts)
interface LevelData {
  userLevels: Array<{ min: number; max: number; name: string; icon: string }>;
  activityLevels: Array<{ min: number; max: number; name: string }>;
  formulas: Array<{
    section: string;
    action: string;
    ratingPoints: number;
    activityPoints: number;
    description: string;
  }>;
}

// Используем импортированный тип UserRating из api/mocks.ts
type ApiUserRating = UserRating;

interface RatingsData {
  ratings: ApiUserRating[];
  total: number;
  averageRating: number;
  averageActivity: number;
  distributionByLevel: Record<string, number>;
}

interface AdjustmentsData {
  adjustments: RatingAdjustment[];
  total: number;
}

// 🔥 РЕЗЕРВНЫЕ ДАННЫЕ для работы без API
const EMPTY_LEVELS_DATA: LevelData = {
  userLevels: [
    { min: 0, max: 50, name: 'Студент', icon: '📘' },
    { min: 51, max: 200, name: 'Инженер', icon: '🔧' },
    { min: 201, max: 500, name: 'Архитектор', icon: '🏗️' },
    { min: 501, max: 1000, name: 'Мастер', icon: '👨‍🔬' },
    { min: 1001, max: Infinity, name: 'Легенда', icon: '🏆' }
  ],
  activityLevels: [
    { min: 0, max: 100, name: 'Новичок' },
    { min: 101, max: 500, name: 'Активный' },
    { min: 501, max: 2000, name: 'Энтузиаст' },
    { min: 2001, max: Infinity, name: 'Лидер' }
  ],
  formulas: [
    { section: 'Проекты', action: 'Создание проекта', ratingPoints: 5, activityPoints: 10, description: 'За публикацию нового проекта' },
    { section: 'Проекты', action: 'Лайк проекту', ratingPoints: 0, activityPoints: 2, description: 'За оценку проекта другого пользователя' },
    { section: 'Проекты', action: 'Лайк получен за проект', ratingPoints: 2, activityPoints: 0, description: 'За получение лайка на свой проект' },
    { section: 'Мастера', action: 'Создание профиля мастера', ratingPoints: 5, activityPoints: 10, description: 'За добавление мастера в базу' },
    { section: 'Мастера', action: 'Лайк мастеру', ratingPoints: 0, activityPoints: 2, description: 'За оценку профиля мастера' },
    { section: 'Помощь', action: 'Создание вопроса', ratingPoints: 2, activityPoints: 5, description: 'За задавание вопроса в разделе помощи' },
    { section: 'Помощь', action: 'Ответ на вопрос', ratingPoints: 5, activityPoints: 10, description: 'За полезный ответ на вопрос' },
    { section: 'Помощь', action: 'Лучший ответ', ratingPoints: 10, activityPoints: 15, description: 'За ответ, отмеченный как лучший' },
    { section: 'Библиотека', action: 'Добавление материала', ratingPoints: 5, activityPoints: 10, description: 'За публикацию обучающего материала' },
    { section: 'Библиотека', action: 'Лайк материалу', ratingPoints: 0, activityPoints: 2, description: 'За оценку обучающего материала' },
    { section: 'Общее', action: 'Ежедневный вход', ratingPoints: 0, activityPoints: 2, description: 'За посещение сайта каждый день' },
    { section: 'Общее', action: 'Заполнение профиля', ratingPoints: 3, activityPoints: 5, description: 'За полную информацию в профиле' }
  ]
};

const EMPTY_RATINGS_DATA: RatingsData = {
  ratings: [],
  total: 0,
  averageRating: 0,
  averageActivity: 0,
  distributionByLevel: {}
};

const EMPTY_ADJUSTMENTS_DATA: AdjustmentsData = {
  adjustments: [],
  total: 0
};

// 🔥 ТЕСТОВЫЙ ПОЛЬЗОВАТЕЛЬ для демонстрации (соответствует реальному типу из api/mocks.ts)
const TEST_USER_RATING: ApiUserRating = {
  userId: 'demo_user_1',
  totalRating: 250,
  totalActivity: 480,
  ratingLevel: 'Архитектор',
  ratingIcon: '🏗️',
  activityLevel: 'Энтузиаст',
  stats: {
    projectsCreated: 5,
    mastersAdsCreated: 2,
    helpRequestsCreated: 3,
    libraryPostsCreated: 2,
    likesGiven: 12,
    likesReceived: 8,
    commentsMade: 7
  }
};

export default function AdminRatingPage() {
  // Аутентификация
  const { isAuthorized } = useAdminAuth();
  
  // Состояние активной вкладки
  const [activeTab, setActiveTab] = useState<'levels' | 'formulas' | 'adjustments' | 'stats'>('levels');
  
  // Состояния для данных
  const [levelsData, setLevelsData] = useState<LevelData | null>(null);
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [adjustmentsData, setAdjustmentsData] = useState<AdjustmentsData | null>(null);
  
  // Состояния для UI
  const [loading, setLoading] = useState<Record<string, boolean>>({
    levels: false,
    formulas: false,
    adjustments: false,
    stats: false
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({
    levels: null,
    formulas: null,
    adjustments: null,
    stats: null
  });
  
  // Состояния для формы корректировки
  const [adjustmentForm, setAdjustmentForm] = useState({
    userId: '',
    ratingChange: 0,
    activityChange: 0,
    reason: '',
    adminNote: ''
  });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState<{success: boolean; message: string} | null>(null);
  
  // Состояния для поиска в корректировках
  const [searchUserId, setSearchUserId] = useState('');
  
  // Флаг для демо-режима (без реальных пользователей)
  const [demoMode, setDemoMode] = useState(true);
  
  // Табы
  const tabs = [
    { id: 'levels', label: 'Уровни', icon: '📊' },
    { id: 'formulas', label: 'Формулы', icon: '🧮' },
    { id: 'adjustments', label: 'Корректировки', icon: '⚖️' },
    { id: 'stats', label: 'Статистика', icon: '📈' },
  ];

  // 🔥 ИНИЦИАЛИЗАЦИЯ ДАННЫХ при авторизации
  useEffect(() => {
    if (isAuthorized) {
      initializeData();
    }
  }, [isAuthorized]);

  // 🔥 ИНИЦИАЛИЗАЦИЯ ВСЕХ ДАННЫХ
  const initializeData = async () => {
    try {
      // Пытаемся загрузить реальные данные
      await loadAllData();
      setDemoMode(false);
    } catch (error) {
      // Если реальные данные недоступны, используем резервные
      console.log('Используем демо-данные');
      setDemoMode(true);
      setLevelsData(EMPTY_LEVELS_DATA);
      
      // Добавляем тестового пользователя для демонстрации
      const demoRatingsData: RatingsData = {
        ratings: [TEST_USER_RATING],
        total: 1,
        averageRating: TEST_USER_RATING.totalRating,
        averageActivity: TEST_USER_RATING.totalActivity,
        distributionByLevel: {
          'Архитектор': 1
        }
      };
      setRatingsData(demoRatingsData);
      
      setAdjustmentsData(EMPTY_ADJUSTMENTS_DATA);
      
      // Сбрасываем состояния загрузки
      Object.keys(loading).forEach(key => {
        setLoading(prev => ({ ...prev, [key]: false }));
      });
    }
  };

  // 🔥 ЗАГРУЗКА ВСЕХ РЕАЛЬНЫХ ДАННЫХ
  const loadAllData = async () => {
    try {
      // Загружаем уровни и формулы
      const levelsResponse = await mockAPI.admin.getRatingLevels();
      if (levelsResponse.success && levelsResponse.data) {
        setLevelsData(levelsResponse.data);
      } else {
        throw new Error('Не удалось загрузить уровни');
      }
      
      // Загружаем рейтинги
      const ratingsResponse = await mockAPI.admin.getAllUserRatings({
        sortBy: 'rating_desc',
        limit: 100
      });
      if (ratingsResponse.success && ratingsResponse.data) {
        const apiData = ratingsResponse.data;
        // Преобразуем данные из API к нашему типу
        const ratingsData: RatingsData = {
          ratings: apiData.ratings,
          total: apiData.total,
          averageRating: apiData.averageRating,
          averageActivity: apiData.averageActivity,
          distributionByLevel: apiData.distributionByLevel
        };
        setRatingsData(ratingsData);
      } else {
        throw new Error('Не удалось загрузить рейтинги');
      }
      
      // Загружаем корректировки
      const adjustmentsResponse = await mockAPI.admin.getRatingAdjustments({});
      if (adjustmentsResponse.success && adjustmentsResponse.data) {
        setAdjustmentsData(adjustmentsResponse.data);
      } else {
        throw new Error('Не удалось загрузить корректировки');
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      throw error;
    }
  };

  // 🔥 ОБНОВЛЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ ВКЛАДКИ
  const loadTabData = async (tab: string) => {
    if (loading[tab]) return;
    
    setLoading(prev => ({ ...prev, [tab]: true }));
    setErrors(prev => ({ ...prev, [tab]: null }));
    
    try {
      // Если в демо-режиме, просто показываем данные
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Имитация загрузки
        setLoading(prev => ({ ...prev, [tab]: false }));
        return;
      }
      
      // Загружаем реальные данные
      switch (tab) {
        case 'levels':
          await loadLevelsData();
          break;
        case 'formulas':
          if (!levelsData) await loadLevelsData();
          break;
        case 'adjustments':
          await loadAdjustmentsData();
          break;
        case 'stats':
          await loadRatingsData();
          break;
      }
    } catch (error) {
      console.warn(`Ошибка загрузки вкладки ${tab}:`, error);
      // Не показываем ошибку пользователю в демо-режиме
      if (!demoMode) {
        setErrors(prev => ({ ...prev, [tab]: 'Ошибка загрузки данных' }));
      }
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  // 🔥 ОБНОВЛЕННЫЕ ФУНКЦИИ ЗАГРУЗКИ
  const loadLevelsData = async () => {
    const response = await mockAPI.admin.getRatingLevels();
    if (response.success && response.data) {
      setLevelsData(response.data);
    } else {
      // Если API вернуло ошибку, но мы не в демо-режиме
      if (!demoMode) {
        throw new Error(response.error || 'Не удалось загрузить данные об уровнях');
      }
    }
  };

  const loadRatingsData = async () => {
    const response = await mockAPI.admin.getAllUserRatings({
      sortBy: 'rating_desc',
      limit: 100
    });
    if (response.success && response.data) {
      const apiData = response.data;
      // Преобразуем данные из API к нашему типу
      const ratingsData: RatingsData = {
        ratings: apiData.ratings,
        total: apiData.total,
        averageRating: apiData.averageRating,
        averageActivity: apiData.averageActivity,
        distributionByLevel: apiData.distributionByLevel
      };
      setRatingsData(ratingsData);
    } else {
      if (!demoMode) {
        throw new Error(response.error || 'Не удалось загрузить рейтинги');
      }
    }
  };

  const loadAdjustmentsData = async (userId?: string) => {
    const response = await mockAPI.admin.getRatingAdjustments({
      userId: userId || undefined
    });
    if (response.success && response.data) {
      setAdjustmentsData(response.data);
    } else {
      if (!demoMode) {
        throw new Error(response.error || 'Не удалось загрузить историю корректировок');
      }
    }
  };

  // 🔥 ОБРАБОТКА КОРРЕКТИРОВКИ (РАБОТАЕТ В ДЕМО-РЕЖИМЕ)
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustmentForm.userId.trim() || (!adjustmentForm.ratingChange && !adjustmentForm.activityChange)) {
      setAdjustmentResult({
        success: false,
        message: 'Заполните ID пользователя и хотя бы одно изменение'
      });
      return;
    }
    
    setIsAdjusting(true);
    setAdjustmentResult(null);
    
    try {
      // В демо-режиме имитируем успешную корректировку
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Создаем демо-корректировку
        const demoAdjustment: RatingAdjustment = {
          userId: adjustmentForm.userId,
          ratingChange: adjustmentForm.ratingChange,
          activityChange: adjustmentForm.activityChange,
          reason: adjustmentForm.reason,
          timestamp: new Date().toISOString(),
          adminId: 'demo_admin'
        };
        
        // Обновляем историю корректировок
        const updatedAdjustments = adjustmentsData 
          ? [...adjustmentsData.adjustments, demoAdjustment]
          : [demoAdjustment];
        
        setAdjustmentsData({
          adjustments: updatedAdjustments,
          total: updatedAdjustments.length
        });
        
        setAdjustmentResult({
          success: true,
          message: `Рейтинг успешно изменен в демо-режиме! (${adjustmentForm.ratingChange > 0 ? '+' : ''}${adjustmentForm.ratingChange} рейтинг, ${adjustmentForm.activityChange > 0 ? '+' : ''}${adjustmentForm.activityChange} активность)`
        });
      } else {
        // Реальный вызов API
        const response = await mockAPI.admin.adjustUserRating(
          adjustmentForm.userId,
          {
            ratingChange: adjustmentForm.ratingChange,
            activityChange: adjustmentForm.activityChange,
            reason: adjustmentForm.reason,
            adminNote: adjustmentForm.adminNote
          }
        );
        
        if (response.success && response.data) {
          setAdjustmentResult({
            success: true,
            message: `Рейтинг успешно изменен! Новые значения: рейтинг ${response.data.newRating}, активность ${response.data.newActivity}`
          });
          
          // Обновляем данные
          await loadAdjustmentsData();
          await loadRatingsData();
        } else {
          setAdjustmentResult({
            success: false,
            message: response.error || 'Ошибка при изменении рейтинга'
          });
        }
      }
      
      // Сброс формы
      setAdjustmentForm({
        userId: '',
        ratingChange: 0,
        activityChange: 0,
        reason: '',
        adminNote: ''
      });
      
    } catch (error) {
      setAdjustmentResult({
        success: false,
        message: 'Ошибка сети. Попробуйте снова.'
      });
      console.error('Ошибка корректировки рейтинга:', error);
    } finally {
      setIsAdjusting(false);
    }
  };

  // 🔥 ПОИСК КОРРЕКТИРОВОК
  const handleSearchAdjustments = () => {
    if (searchUserId.trim()) {
      if (demoMode) {
        // В демо-режиме фильтруем локально
        const filtered = adjustmentsData?.adjustments.filter(adj => 
          adj.userId.includes(searchUserId)
        ) || [];
        setAdjustmentsData({
          adjustments: filtered,
          total: filtered.length
        });
      } else {
        loadAdjustmentsData(searchUserId);
      }
    } else {
      if (demoMode) {
        // Возвращаем все демо-данные
        setAdjustmentsData(EMPTY_ADJUSTMENTS_DATA);
      } else {
        loadAdjustmentsData();
      }
    }
  };

  // 🔥 ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЕЙ НА УРОВНЕ
  const getUsersInLevel = (levelName: string): number => {
    if (!ratingsData) return 0;
    return ratingsData.distributionByLevel[levelName] || 0;
  };

  // 🔥 ПОЛУЧЕНИЕ ПРОЦЕНТА ПОЛЬЗОВАТЕЛЕЙ НА УРОВНЕ
  const getLevelPercentage = (levelName: string): string => {
    if (!ratingsData || ratingsData.total === 0) return '0%';
    const count = getUsersInLevel(levelName);
    return ((count / ratingsData.total) * 100).toFixed(1) + '%';
  };

  // 🔥 ПЕРЕЗАГРУЗКА ДАННЫХ
  const handleRefreshData = async () => {
    try {
      await loadAllData();
      setDemoMode(false);
    } catch (error) {
      console.log('Остаемся в демо-режиме');
    }
  };

  // Если нет авторизации
  if (!isAuthorized) {
    return (
      <div className="admin-page">
        <div className="loading-state">
          <div className="loading-spinner">🔐</div>
          <p className="loading-text">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Управление рейтинговой системой</h2>
        <p className="page-subtitle">Настройка уровней, формул и корректировка рейтинга</p>
        
        {demoMode && (
          <div className="demo-banner">
            <span className="demo-icon">🎮</span>
            <span className="demo-text">Демо-режим. Используются тестовые данные.</span>
            <button 
              onClick={handleRefreshData}
              className="demo-refresh-btn"
            >
              🔄 Проверить реальные данные
            </button>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Контейнер вкладок */}
        <div className="tabs-container">
          <div className="tabs-header">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={loading[tab.id]}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {loading[tab.id] && <span className="tab-loading">🔄</span>}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* ВКЛАДКА: УРОВНИ */}
            {activeTab === 'levels' && (
              <div className="tab-panel">
                {errors.levels && !demoMode ? (
                  <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p className="error-text">{errors.levels}</p>
                    <button 
                      onClick={() => loadTabData('levels')}
                      className="retry-btn"
                    >
                      Повторить попытку
                    </button>
                  </div>
                ) : loading.levels ? (
                  <div className="loading-state">
                    <div className="loading-spinner">📊</div>
                    <p className="loading-text">Загрузка уровней...</p>
                  </div>
                ) : levelsData ? (
                  <>
                    <div className="section-header">
                      <h3>Уровни пользователей</h3>
                      <p className="section-subtitle">
                        Всего пользователей: {ratingsData?.total || 0}
                        {demoMode && <span className="demo-hint"> (демо-данные)</span>}
                      </p>
                    </div>
                    
                    <div className="levels-grid">
                      {levelsData.userLevels.map((level, index) => (
                        <div key={index} className="level-card">
                          <div className="level-header">
                            <span className="level-icon">{level.icon}</span>
                            <div>
                              <h4 className="level-title">{level.name}</h4>
                              <span className="level-range">
                                {level.min} — {level.max === Infinity ? '∞' : level.max} очков
                              </span>
                            </div>
                          </div>
                          
                          <div className="level-description">
                            <p>Диапазон рейтинга для получения этого уровня</p>
                          </div>
                          
                          <div className="level-stats">
                            <div className="stat-item">
                              <span className="stat-value">{getUsersInLevel(level.name)}</span>
                              <span className="stat-label">Пользователей</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-value">{getLevelPercentage(level.name)}</span>
                              <span className="stat-label">От общего числа</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="section-header" style={{ marginTop: '40px' }}>
                      <h3>Уровни активности</h3>
                    </div>
                    
                    <div className="info-grid">
                      {levelsData.activityLevels.map((level, index) => (
                        <div key={index} className="info-item">
                          <span className="info-label">{level.name}</span>
                          <span className="info-value">
                            {level.min} — {level.max === Infinity ? '∞' : level.max} очков активности
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ВКЛАДКА: ФОРМУЛЫ */}
            {activeTab === 'formulas' && (
              <div className="tab-panel">
                {errors.formulas && !demoMode ? (
                  <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p className="error-text">{errors.formulas}</p>
                    <button 
                      onClick={() => loadTabData('formulas')}
                      className="retry-btn"
                    >
                      Повторить попытку
                    </button>
                  </div>
                ) : loading.formulas ? (
                  <div className="loading-state">
                    <div className="loading-spinner">🧮</div>
                    <p className="loading-text">Загрузка формул...</p>
                  </div>
                ) : levelsData ? (
                  <>
                    <div className="section-header">
                      <h3>Формулы начисления баллов</h3>
                      <p className="section-subtitle">
                        Система начисления рейтинга и активности за действия пользователей
                        {demoMode && <span className="demo-hint"> (демо-данные)</span>}
                      </p>
                    </div>
                    
                    <div className="formula-settings">
                      <div className="rating-table-container">
                        <table className="rating-table">
                          <thead>
                            <tr>
                              <th>Раздел</th>
                              <th>Действие</th>
                              <th>Рейтинг</th>
                              <th>Активность</th>
                              <th>Описание</th>
                            </tr>
                          </thead>
                          <tbody>
                            {levelsData.formulas.map((formula, index) => (
                              <tr key={index}>
                                <td>
                                  <span className="formula-section">{formula.section}</span>
                                </td>
                                <td>
                                  <span className="formula-action">{formula.action}</span>
                                </td>
                                <td>
                                  <span className={`change-badge ${formula.ratingPoints > 0 ? 'positive' : 'neutral'}`}>
                                    {formula.ratingPoints > 0 ? '+' : ''}{formula.ratingPoints}
                                  </span>
                                </td>
                                <td>
                                  <span className={`change-badge ${formula.activityPoints > 0 ? 'positive' : 'neutral'}`}>
                                    {formula.activityPoints > 0 ? '+' : ''}{formula.activityPoints}
                                  </span>
                                </td>
                                <td>
                                  <span className="formula-description">{formula.description}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="formula-summary">
                        <h4>📝 Примечания к системе</h4>
                        <ul>
                          <li>Рейтинг влияет на уровень пользователя и его положение в общем рейтинге</li>
                          <li>Активность показывает вовлеченность пользователя в жизнь сообщества</li>
                          <li>Лайки, полученные за контент, повышают рейтинг автора</li>
                          <li>Ежедневный вход поощряется дополнительной активностью</li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ВКЛАДКА: КОРРЕКТИРОВКИ */}
            {activeTab === 'adjustments' && (
              <div className="tab-panel">
                {errors.adjustments && !demoMode ? (
                  <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p className="error-text">{errors.adjustments}</p>
                    <button 
                      onClick={() => loadTabData('adjustments')}
                      className="retry-btn"
                    >
                      Повторить попытку
                    </button>
                  </div>
                ) : loading.adjustments ? (
                  <div className="loading-state">
                    <div className="loading-spinner">⚖️</div>
                    <p className="loading-text">Загрузка данных...</p>
                  </div>
                ) : (
                  <>
                    {/* Форма корректировки */}
                    <div className="adjustment-form">
                      <div className="section-header">
                        <h3>Ручная корректировка рейтинга</h3>
                        <p className="section-subtitle">
                          Изменение рейтинга и активности пользователя
                          {demoMode && <span className="demo-hint"> (работает в демо-режиме)</span>}
                        </p>
                      </div>
                      
                      <form onSubmit={handleAdjustmentSubmit}>
                        <div className="settings-grid">
                          <div className="setting-item">
                            <label className="setting-label">ID пользователя *</label>
                            <input
                              type="text"
                              className="setting-input"
                              value={adjustmentForm.userId}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, userId: e.target.value }))}
                              placeholder="demo_user_1 или реальный ID"
                              required
                            />
                            <span className="setting-hint">Для демо используйте "demo_user_1"</span>
                          </div>
                          
                          <div className="setting-item">
                            <label className="setting-label">Изменение рейтинга</label>
                            <input
                              type="number"
                              className="setting-input"
                              value={adjustmentForm.ratingChange}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, ratingChange: parseInt(e.target.value) || 0 }))}
                              placeholder="+50 или -20"
                            />
                            <span className="setting-hint">Положительное или отрицательное число</span>
                          </div>
                          
                          <div className="setting-item">
                            <label className="setting-label">Изменение активности</label>
                            <input
                              type="number"
                              className="setting-input"
                              value={adjustmentForm.activityChange}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, activityChange: parseInt(e.target.value) || 0 }))}
                              placeholder="+10 или -5"
                            />
                            <span className="setting-hint">Положительное или отрицательное число</span>
                          </div>
                          
                          <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
                            <label className="setting-label">Причина корректировки *</label>
                            <input
                              type="text"
                              className="setting-input"
                              value={adjustmentForm.reason}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                              placeholder="Награда за активность, коррекция ошибки и т.д."
                              required
                            />
                            <span className="setting-hint">Обязательное поле, будет записано в историю</span>
                          </div>
                          
                          <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
                            <label className="setting-label">Примечание администратора</label>
                            <textarea
                              className="setting-input"
                              value={adjustmentForm.adminNote}
                              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, adminNote: e.target.value }))}
                              placeholder="Дополнительные детали для внутреннего использования"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        {adjustmentResult && (
                          <div className={`result-message ${adjustmentResult.success ? 'success' : 'error'}`}>
                            {adjustmentResult.success ? '✅' : '❌'} {adjustmentResult.message}
                          </div>
                        )}
                        
                        <div className="form-actions">
                          <button
                            type="submit"
                            className="primary-btn"
                            disabled={isAdjusting}
                          >
                            {isAdjusting ? 'Корректировка...' : 'Применить корректировку'}
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => setAdjustmentForm({
                              userId: '', ratingChange: 0, activityChange: 0, reason: '', adminNote: ''
                            })}
                          >
                            Очистить форму
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    {/* История корректировок */}
                    <div className="adjustment-history">
                      <div className="section-header">
                        <div className="section-header-row">
                          <div>
                            <h3>История корректировок</h3>
                            <p className="section-subtitle">
                              Всего записей: {adjustmentsData?.total || 0}
                              {demoMode && <span className="demo-hint"> (демо)</span>}
                            </p>
                          </div>
                          
                          <div className="search-controls">
                            <input
                              type="text"
                              className="setting-input"
                              value={searchUserId}
                              onChange={(e) => setSearchUserId(e.target.value)}
                              placeholder="Поиск по ID пользователя"
                            />
                            <button
                              onClick={handleSearchAdjustments}
                              className="secondary-btn"
                            >
                              🔍 Поиск
                            </button>
                            <button
                              onClick={() => {
                                setSearchUserId('');
                                if (demoMode) {
                                  setAdjustmentsData(EMPTY_ADJUSTMENTS_DATA);
                                } else {
                                  loadAdjustmentsData();
                                }
                              }}
                              className="secondary-btn"
                            >
                              Сброс
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {adjustmentsData && adjustmentsData.adjustments.length > 0 ? (
                        <div className="rating-table-container">
                          <table className="rating-table">
                            <thead>
                              <tr>
                                <th>ID пользователя</th>
                                <th>Изменение рейтинга</th>
                                <th>Изменение активности</th>
                                <th>Причина</th>
                                <th>Дата</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adjustmentsData.adjustments.map((adj, index) => (
                                <tr key={index}>
                                  <td>
                                    <span className="user-id">{adj.userId}</span>
                                  </td>
                                  <td>
                                    <span className={`change-badge ${adj.ratingChange > 0 ? 'positive' : adj.ratingChange < 0 ? 'negative' : 'neutral'}`}>
                                      {adj.ratingChange > 0 ? '+' : ''}{adj.ratingChange}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`change-badge ${adj.activityChange > 0 ? 'positive' : adj.activityChange < 0 ? 'negative' : 'neutral'}`}>
                                      {adj.activityChange > 0 ? '+' : ''}{adj.activityChange}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="adjustment-reason">{adj.reason}</span>
                                  </td>
                                  <td>
                                    <span className="adjustment-date">{formatDate(adj.timestamp)}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">📭</div>
                          <p className="empty-text">История корректировок пуста</p>
                          <p className="empty-subtext">
                            {searchUserId 
                              ? `Нет записей для пользователя ${searchUserId}`
                              : demoMode 
                                ? 'Попробуйте сделать корректировку через форму выше'
                                : 'Корректировки рейтинга еще не производились'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ВКЛАДКА: СТАТИСТИКА */}
            {activeTab === 'stats' && (
              <div className="tab-panel">
                {errors.stats && !demoMode ? (
                  <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p className="error-text">{errors.stats}</p>
                    <button 
                      onClick={() => loadTabData('stats')}
                      className="retry-btn"
                    >
                      Повторить попытку
                    </button>
                  </div>
                ) : loading.stats ? (
                  <div className="loading-state">
                    <div className="loading-spinner">📈</div>
                    <p className="loading-text">Загрузка статистики...</p>
                  </div>
                ) : ratingsData ? (
                  <>
                    <div className="section-header">
                      <h3>Общая статистика рейтинговой системы</h3>
                      <p className="section-subtitle">
                        Анализ активности и рейтинга пользователей
                        {demoMode && <span className="demo-hint"> (демо-данные)</span>}
                      </p>
                    </div>
                    
                    {/* Карточки статистики */}
                    <div className="stats-cards">
                      <div className="stat-card rating">
                        <div className="stat-card-icon">🏆</div>
                        <div className="stat-card-value">{ratingsData.averageRating}</div>
                        <div className="stat-card-label">Средний рейтинг</div>
                      </div>
                      
                      <div className="stat-card activity">
                        <div className="stat-card-icon">⚡</div>
                        <div className="stat-card-value">{ratingsData.averageActivity}</div>
                        <div className="stat-card-label">Средняя активность</div>
                      </div>
                      
                      <div className="stat-card users">
                        <div className="stat-card-icon">👥</div>
                        <div className="stat-card-value">{ratingsData.total}</div>
                        <div className="stat-card-label">Всего пользователей</div>
                      </div>
                    </div>
                    
                    {/* Распределение по уровням */}
                    <div className="stats-grid">
                      <div className="distribution-chart">
                        <h4>📊 Распределение пользователей по уровням</h4>
                        <div className="distribution-bars">
                          {levelsData?.userLevels.map((level, index) => {
                            const userCount = ratingsData.distributionByLevel[level.name] || 0;
                            const percentage = ratingsData.total > 0 ? (userCount / ratingsData.total) * 100 : 0;
                            
                            return (
                              <div key={index} className="distribution-item">
                                <div className="distribution-label">
                                  <span className="level-icon-small">{level.icon}</span>
                                  <span>{level.name}</span>
                                </div>
                                <div className="distribution-bar-container">
                                  <div 
                                    className="distribution-bar" 
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {userCount > 0 && (
                                      <span className="distribution-count">{userCount}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="distribution-percentage">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Топ пользователей */}
                    <div className="top-users">
                      <div className="section-header">
                        <h3>Топ пользователей по рейтингу</h3>
                        <p className="section-subtitle">
                          Показано {Math.min(10, ratingsData.ratings.length)} из {ratingsData.total} пользователей
                        </p>
                      </div>
                      
                      {ratingsData.ratings.length > 0 ? (
                        <>
                          <div className="rating-table-container">
                            <table className="rating-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>ID пользователя</th>
                                  <th>Рейтинг</th>
                                  <th>Активность</th>
                                  <th>Уровень рейтинга</th>
                                  <th>Уровень активности</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ratingsData.ratings.slice(0, 10).map((rating, index) => (
                                  <tr key={index}>
                                    <td>
                                      <span className={`rank-number ${index < 3 ? `top-${index + 1}` : ''}`}>
                                        {index + 1}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="user-id">{rating.userId}</span>
                                    </td>
                                    <td>
                                      <span className="rating-value">{rating.totalRating}</span>
                                    </td>
                                    <td>
                                      <span className="activity-value">{rating.totalActivity}</span>
                                    </td>
                                    <td>
                                      <span className="level-badge">
                                        <span className="level-icon-small">{rating.ratingIcon}</span>
                                        {rating.ratingLevel}
                                      </span>
                                    </td>
                                    <td>
                                      <span className="activity-badge">{rating.activityLevel}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {ratingsData.ratings.length > 10 && (
                            <div className="show-more-container">
                              <button 
                                className="secondary-btn"
                                onClick={() => {/* В будущем можно добавить загрузку большего количества */}}
                              >
                                Показать еще 20 пользователей
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">👤</div>
                          <p className="empty-text">Нет данных о пользователях</p>
                          <p className="empty-subtext">
                            {demoMode 
                              ? 'В демо-режиме показан только тестовый пользователь'
                              : 'Зарегистрируйте пользователей для отображения статистики'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Системная информация */}
        <div className="system-info">
          <h4>📋 Краткий обзор системы рейтинга</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Типы действий:</span>
              <span className="info-value">Проекты, Мастера, Помощь, Библиотека</span>
            </div>
            <div className="info-item">
              <span className="info-label">Баллы за создание:</span>
              <span className="info-value">+5 рейтинг, +10 активность</span>
            </div>
            <div className="info-item">
              <span className="info-label">Баллы за лайк:</span>
              <span className="info-value">+2 активность</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ежедневный вход:</span>
              <span className="info-value">+2 активность</span>
            </div>
          </div>
          
          {demoMode && (
            <div className="demo-tip">
              <span className="tip-icon">💡</span>
              <span className="tip-text">
                Система работает в демо-режиме. Когда появятся реальные пользователи, 
                данные автоматически обновятся. Форма корректировки уже полностью функциональна.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}