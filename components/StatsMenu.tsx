
// StatsMenu.tsx
"use client";

import { useState, useEffect } from "react";
import "./StatsMenu.css";

interface StatsMenuProps {
  userId?: string | null; // ИЗМЕНЕНО: добавлен null
  isAuthenticated?: boolean;
}

export default function StatsMenu({ 
  userId = null, 
  isAuthenticated = false 
}: StatsMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"community" | "personal" | "charts">("community");
  const [lastUpdated, setLastUpdated] = useState<string>("только что");

  // Демо-данные статистики сообщества
  const communityStats = {
    online: 1892,
    totalUsers: 45327,
    newToday: 127,
    totalProjects: 7543,
    weeklyProjects: 342,
    totalTips: 15287,
    topProjects: [
      { id: 1, title: "Деревянный стол с эпоксидной смолой", likes: 1234, author: "Мастер Петрович" },
      { id: 2, title: "Автоматическая кормушка для кота", likes: 987, author: "Кулибин_Алексей" },
      { id: 3, title: "Светильник из эпоксидки и дерева", likes: 876, author: "Светлана_Умелица" },
      { id: 4, title: "Кухня своими руками за 3 недели", likes: 765, author: "Столяр_Иван" },
      { id: 5, title: "Детская кровать-машинка", likes: 654, author: "Папа_Самоделкин" }
    ],
    categories: [
      { name: "Мебель", count: 2345, color: "#8B4513" },
      { name: "Электроника", count: 1876, color: "#3B82F6" },
      { name: "Кулинария", count: 1567, color: "#10B981" },
      { name: "Сад и огород", count: 1234, color: "#059669" },
      { name: "Ремонт", count: 987, color: "#F59E0B" },
      { name: "Другое", count: 534, color: "#8B5CF6" }
    ]
  };

  // Демо-данные персональной статистики
  const personalStats = {
    createdProjects: 42,
    receivedPraises: 1287,
    rank: 89,
    totalViews: 5432,
    activeDays: 12,
    commentsLeft: 24,
    projectsRated: 87,
    achievements: [
      { id: 1, title: "Мастер золотые руки", description: "Создал 10+ проектов", icon: "🥇", unlocked: true },
      { id: 2, title: "Активный советник", description: "Оставил 50+ комментариев", icon: "🥈", unlocked: true },
      { id: 3, title: "Популярный автор", description: "Получил 1,000+ просмотров", icon: "🥉", unlocked: true },
      { id: 4, title: "Легенда сообщества", description: "В топ-100 рейтинга", icon: "🏆", unlocked: false },
      { id: 5, title: "Наставник", description: "Помог 20+ новичкам", icon: "👨‍🏫", unlocked: false }
    ]
  };

  // Имитация обновления данных
  useEffect(() => {
    if (showMenu) {
      const interval = setInterval(() => {
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString("ru-RU", { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }));
      }, 60000); // Обновляем время каждую минуту

      return () => clearInterval(interval);
    }
  }, [showMenu]);

  const handleRefresh = () => {
    setLastUpdated("только что");
    alert("Статистика обновлена!");
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="stats-menu-container">
      <button 
        className="stats-button"
        onClick={() => setShowMenu(!showMenu)}
        aria-expanded={showMenu}
        aria-label="Статистика сообщества"
        title="Статистика сообщества"
      >
        <span className="stats-button-icon">📏</span>
        <span className="stats-button-label">Статистика</span>
      </button>

      {showMenu && (
        <div className="stats-dropdown">
          {/* Шапка с заголовком и кнопкой обновления */}
          <div className="stats-header">
            <div className="stats-header-top">
              <h3 className="stats-title">
                {activeTab === "community" ? "📊 Статистика сообщества" : 
                 activeTab === "personal" ? "📈 Моя статистика" : 
                 "📉 Графики и диаграммы"}
              </h3>
              <button 
                className="refresh-button"
                onClick={handleRefresh}
                title="Обновить данные"
              >
                🔄
              </button>
            </div>
            <p className="stats-subtitle">
              Обновлено: <span className="update-time">{lastUpdated}</span>
            </p>
          </div>

          {/* Переключение вкладок */}
          <div className="stats-tabs">
            <button 
              className={`stats-tab ${activeTab === "community" ? "active" : ""}`}
              onClick={() => setActiveTab("community")}
            >
              Сообщество
            </button>
            <button 
              className={`stats-tab ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? "Войдите для просмотра личной статистики" : ""}
            >
              Моя статистика
            </button>
            <button 
              className={`stats-tab ${activeTab === "charts" ? "active" : ""}`}
              onClick={() => setActiveTab("charts")}
            >
              Графики
            </button>
          </div>

          {/* Контент вкладок */}
          <div className="stats-content">
            {activeTab === "community" && (
              <div className="community-stats">
                {/* Блок активности */}
                <div className="stats-section">
                  <h4 className="section-title">👥 Активность сообщества</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{formatNumber(communityStats.online)}</div>
                      <div className="stat-label">Кулибинов онлайн</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{formatNumber(communityStats.totalUsers)}</div>
                      <div className="stat-label">Мастеров всего</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{formatNumber(communityStats.newToday)}</div>
                      <div className="stat-label">Новых сегодня</div>
                    </div>
                  </div>
                </div>

                {/* Блок творчества */}
                <div className="stats-section">
                  <h4 className="section-title">🔨 Творчество</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{formatNumber(communityStats.totalProjects)}</div>
                      <div className="stat-label">Самоделок создано</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{formatNumber(communityStats.weeklyProjects)}</div>
                      <div className="stat-label">На этой неделе</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{formatNumber(communityStats.totalTips)}</div>
                      <div className="stat-label">Советов дано</div>
                    </div>
                  </div>
                </div>

                {/* Топ проектов */}
                <div className="stats-section">
                  <h4 className="section-title">🏆 Топ-5 проектов</h4>
                  <div className="top-projects">
                    {communityStats.topProjects.map((project, index) => (
                      <div key={project.id} className="top-project">
                        <div className="project-rank">#{index + 1}</div>
                        <div className="project-info">
                          <div className="project-title">{project.title}</div>
                          <div className="project-meta">
                            <span className="project-likes">👍 {formatNumber(project.likes)}</span>
                            <span className="project-author">👤 {project.author}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Категории */}
                <div className="stats-section">
                  <h4 className="section-title">🏷️ Популярные категории</h4>
                  <div className="categories">
                    {communityStats.categories.map(category => (
                      <div key={category.name} className="category">
                        <div className="category-header">
                          <span className="category-name">{category.name}</span>
                          <span className="category-count">{formatNumber(category.count)}</span>
                        </div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{
                              width: `${(category.count / 5000) * 100}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "personal" && (
              <div className="personal-stats">
                {isAuthenticated ? (
                  <>
                    {/* Основные показатели */}
                    <div className="stats-section">
                      <h4 className="section-title">🎯 Мои показатели</h4>
                      <div className="stats-grid">
                        <div className="stat-card personal">
                          <div className="stat-value">{personalStats.createdProjects}</div>
                          <div className="stat-label">Созданных проектов</div>
                        </div>
                        <div className="stat-card personal">
                          <div className="stat-value">{formatNumber(personalStats.receivedPraises)}</div>
                          <div className="stat-label">Полученных похвал</div>
                        </div>
                        <div className="stat-card personal">
                          <div className="stat-value">#{personalStats.rank}</div>
                          <div className="stat-label">Место в рейтинге</div>
                        </div>
                        <div className="stat-card personal">
                          <div className="stat-value">{formatNumber(personalStats.totalViews)}</div>
                          <div className="stat-label">Просмотров проектов</div>
                        </div>
                      </div>
                    </div>

                    {/* Активность */}
                    <div className="stats-section">
                      <h4 className="section-title">📅 Активность за месяц</h4>
                      <div className="activity-stats">
                        <div className="activity-days">
                          <div className="days-progress">
                            <div 
                              className="days-fill" 
                              style={{ width: `${(personalStats.activeDays / 30) * 100}%` }}
                            ></div>
                          </div>
                          <div className="days-text">
                            {personalStats.activeDays}/30 дней активен
                          </div>
                        </div>
                        <div className="activity-details">
                          <div className="activity-item">
                            <span className="activity-icon">💬</span>
                            <span className="activity-text">{personalStats.commentsLeft} комментариев</span>
                          </div>
                          <div className="activity-item">
                            <span className="activity-icon">👍</span>
                            <span className="activity-text">{personalStats.projectsRated} проектов оценено</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Достижения */}
                    <div className="stats-section">
                      <h4 className="section-title">🏅 Мои достижения</h4>
                      <div className="achievements">
                        {personalStats.achievements.map(achievement => (
                          <div 
                            key={achievement.id} 
                            className={`achievement ${achievement.unlocked ? "unlocked" : "locked"}`}
                            title={achievement.unlocked ? achievement.description : "Еще не разблокировано"}
                          >
                            <div className="achievement-icon">{achievement.icon}</div>
                            <div className="achievement-info">
                              <div className="achievement-title">{achievement.title}</div>
                              <div className="achievement-description">{achievement.description}</div>
                            </div>
                            <div className="achievement-status">
                              {achievement.unlocked ? "✅" : "🔒"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="auth-required">
                    <div className="auth-icon">🔒</div>
                    <h4 className="auth-title">Требуется авторизация</h4>
                    <p className="auth-text">Войдите в аккаунт, чтобы видеть свою статистику</p>
                    <button className="auth-button" onClick={() => alert("Открывается форма входа")}>
                      Войти в аккаунт
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "charts" && (
              <div className="charts-stats">
                <div className="stats-section">
                  <h4 className="section-title">📈 Графики сообщества</h4>
                  <div className="charts-container">
                    {/* Имитация графиков */}
                    <div className="chart-placeholder">
                      <div className="chart-title">Рост сообщества за год</div>
                      <div className="chart-bars">
                        {[65, 70, 75, 80, 85, 90, 95, 100].map((height, index) => (
                          <div 
                            key={index} 
                            className="chart-bar" 
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                      <div className="chart-labels">
                        <span>Янв</span><span>Фев</span><span>Мар</span><span>Апр</span>
                        <span>Май</span><span>Июн</span><span>Июл</span><span>Авг</span>
                      </div>
                    </div>

                    <div className="chart-placeholder pie">
                      <div className="chart-title">Распределение категорий</div>
                      <div className="pie-chart">
                        {communityStats.categories.map((category, index) => (
                          <div 
                            key={category.name}
                            className="pie-slice"
                            style={{
                              backgroundColor: category.color,
                              transform: `rotate(${index * 60}deg)`
                            }}
                          ></div>
                        ))}
                      </div>
                      <div className="chart-legend">
                        {communityStats.categories.map(category => (
                          <div key={category.name} className="legend-item">
                            <div 
                              className="legend-color" 
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="legend-text">{category.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats-section">
                  <h4 className="section-title">🗺️ География мастеров</h4>
                  <div className="map-placeholder">
                    <div className="map-title">Карта активности по регионам</div>
                    <div className="map-image">🌍</div>
                    <div className="map-legend">
                      <div className="map-legend-item">
                        <div className="map-dot high"></div>
                        <span>Высокая активность</span>
                      </div>
                      <div className="map-legend-item">
                        <div className="map-dot medium"></div>
                        <span>Средняя активность</span>
                      </div>
                      <div className="map-legend-item">
                        <div className="map-dot low"></div>
                        <span>Низкая активность</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Футер с информацией */}
          <div className="stats-footer">
            <div className="footer-info">
              <span className="info-icon">ℹ️</span>
              <span className="info-text">Данные обновляются в реальном времени</span>
            </div>
            <button 
              className="close-stats-button"
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