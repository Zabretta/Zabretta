"use client";

import { useState, useEffect } from 'react';
import './AdminUsersPage.css';
import './UserModals.css'; // Добавили стили модальных окон
import { useAdminAuth } from '@/hooks/useAdminAuth';
// Импортируем функцию API из mocks, а тип AdminUser из mocks-admin
import { mockAPI } from '@/api/mocks';
import { type AdminUser } from '@/api/mocks-admin'; // Исправленный импорт
import { formatDate, getRoleLabel } from '@/utils/admin';
import { USER_LEVELS } from '@/api/mocks-admin';

// Импортируем модальные окна
import UserProfileModal from './UserProfileModal';
import UserEditModal from './UserEditModal';
import RatingAdjustmentModal from './RatingAdjustmentModal';

export default function AdminUsersPage() {
  // Аутентификация и авторизация
  const { isAuthorized } = useAdminAuth();
  
  // Состояния для данных и UI
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для фильтров и поиска
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  // Данные для визуализации распределения по уровням
  const [distributionData, setDistributionData] = useState([
    { name: "Студент", count: 42, percentage: 35, color: "#8B4513" },
    { name: "Инженер", count: 28, percentage: 23, color: "#D2691E" },
    { name: "Архитектор", count: 22, percentage: 18, color: "#CD853F" },
    { name: "Мастер", count: 18, percentage: 15, color: "#A0522D" },
    { name: "Легенда", count: 10, percentage: 9, color: "#FFD700" }
  ]);

  // Состояния для модальных окон
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Загрузка пользователей при монтировании компонента
  useEffect(() => {
    if (isAuthorized) {
      loadUsers();
    }
  }, [isAuthorized, currentPage]);

  // Применение фильтров при изменении поиска или роли
  useEffect(() => {
    applyFilters();
  }, [users, search, filterRole]);

  // Основная функция загрузки пользователей
  const loadUsers = async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Вызов API для получения пользователей с пагинацией
      const response = await mockAPI.admin.getAdminUsers({
        page: currentPage,
        limit: usersPerPage,
        role: filterRole !== 'all' ? filterRole : undefined,
        search: search || undefined,
        sortBy: 'date_desc'
      });
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalUsers(response.data.total);
        
        // Обновляем данные распределения на основе загруженных пользователей
        updateDistributionData(response.data.users);
      } else {
        setError(response.error || 'Не удалось загрузить пользователей');
      }
    } catch (err) {
      setError('Ошибка при загрузке данных. Попробуйте обновить страницу.');
      console.error('Ошибка загрузки пользователей:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функция обновления данных распределения по уровням (ИСПРАВЛЕНА)
  const updateDistributionData = (userList: AdminUser[]) => {
    const total = userList.length;
    
    if (total === 0) {
      // Если нет пользователей, показываем пустые данные
      const emptyDistribution = USER_LEVELS.map((level, index) => ({
        name: level.name,
        count: 0,
        percentage: 0,
        color: ['#8B4513', '#D2691E', '#CD853F', '#A0522D', '#FFD700'][index] || '#8B4513'
      }));
      setDistributionData(emptyDistribution);
      return;
    }
    
    // Считаем пользователей по уровням на основе рейтинга
    const levelCounts: Record<string, number> = {};
    
    userList.forEach(user => {
      const rating = user.rating || 0;
      const level = USER_LEVELS.find(l => rating >= l.min && rating <= l.max)?.name || USER_LEVELS[0].name;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
    // Преобразуем в массив для графика
    const newDistribution = USER_LEVELS.map((level, index) => {
      const count = levelCounts[level.name] || 0;
      return {
        name: level.name,
        count,
        percentage: Math.round((count / total) * 100),
        color: ['#8B4513', '#D2691E', '#CD853F', '#A0522D', '#FFD700'][index] || '#8B4513'
      };
    });
    
    setDistributionData(newDistribution);
  };

  // Применение локальных фильтров (поиск по логину/email)
  const applyFilters = () => {
    let result = [...users];
    
    // Фильтрация по поисковому запросу
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(user => 
        user.login.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
      );
    }
    
    // Фильтрация по роли (если не "все")
    if (filterRole !== 'all') {
      result = result.filter(user => user.role === filterRole);
    }
    
    setFilteredUsers(result);
  };

  // Обработчик поиска
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Сброс на первую страницу при новом поиске
    loadUsers(); // Перезагрузка данных с сервера с учетом поиска
  };

  // Обработчики действий для открытия модальных окон
  const handleViewUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsProfileModalOpen(true);
    }
  };

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsEditModalOpen(true);
    }
  };

  const handleToggleBlock = async (user: AdminUser) => {
    const newStatus = !user.isActive;
    const action = user.isActive ? 'блокировку' : 'разблокировку';
    
    if (confirm(`Вы уверены, что хотите ${action} пользователя ${user.login}?`)) {
      try {
        const response = await mockAPI.admin.updateAdminUser(user.id, {
          isActive: newStatus
        });
        
        if (response.success) {
          alert(`Пользователь ${user.login} успешно ${user.isActive ? 'заблокирован' : 'разблокирован'}!`);
          loadUsers(); // Обновляем список
        } else {
          alert(`Ошибка при ${action} пользователя: ${response.error}`);
        }
      } catch (err) {
        alert(`Ошибка при ${action} пользователя. Попробуйте снова.`);
        console.error('Ошибка обновления пользователя:', err);
      }
    }
  };

  const handleResetPassword = async (userId: string, userLogin: string) => {
    if (confirm(`Сбросить пароль для пользователя ${userLogin}? На email будет отправлена инструкция.`)) {
      try {
        const response = await mockAPI.admin.resetUserPassword(userId);
        
        if (response.success) {
          alert(`Инструкция по сбросу пароля отправлена на email пользователя.`);
        } else {
          alert(`Ошибка: ${response.error}`);
        }
      } catch (err) {
        alert('Ошибка при сбросе пароля. Попробуйте снова.');
        console.error('Ошибка сброса пароля:', err);
      }
    }
  };

  // Обработчик ручной корректировки рейтинга
  const handleAdjustRating = (userId: string, userLogin: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsRatingModalOpen(true);
    }
  };

  // Обработчик сохранения изменений пользователя
  const handleSaveUser = async (updates: Partial<AdminUser>) => {
    if (!selectedUser) return;
    
    try {
      const response = await mockAPI.admin.updateAdminUser(selectedUser.id, updates);
      
      if (response.success) {
        alert(`Данные пользователя ${selectedUser.login} успешно обновлены!`);
        loadUsers(); // Обновляем список
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        alert(`Ошибка при обновлении: ${response.error}`);
      }
    } catch (err) {
      alert('Ошибка при обновлении пользователя');
      console.error('Ошибка сохранения:', err);
    }
  };

  // Обработчик корректировки рейтинга
  const handleRatingAdjust = async (adjustment: {
    ratingChange: number;
    activityChange: number;
    reason: string;
    adminNote?: string;
  }) => {
    if (!selectedUser) return;
    
    try {
      const response = await mockAPI.admin.adjustUserRating(selectedUser.id, adjustment);
      
      if (response.success && response.data) {
        alert(`Рейтинг пользователя ${selectedUser.login} скорректирован!\nНовый рейтинг: ${response.data.newRating}\nНовая активность: ${response.data.newActivity}`);
        loadUsers(); // Обновляем список
        setIsRatingModalOpen(false);
        setSelectedUser(null);
      } else {
        alert(`Ошибка: ${response.error}`);
      }
    } catch (err) {
      alert('Ошибка при корректировке рейтинга');
      console.error('Ошибка корректировки:', err);
    }
  };

  // Закрытие всех модальных окон
  const closeAllModals = () => {
    setIsProfileModalOpen(false);
    setIsEditModalOpen(false);
    setIsRatingModalOpen(false);
    setSelectedUser(null);
  };

  // Пагинация
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Если нет авторизации - показываем загрузку (useAdminAuth сам перенаправит)
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
        <h2>Управление пользователями</h2>
        <p className="page-subtitle">Поиск, фильтрация и управление пользователями системы</p>
      </div>

      <div className="page-content">
        {/* Блок визуализации распределения пользователей по уровням */}
        <div className="distribution-container">
          <div className="distribution-header">
            <h3>Распределение пользователей по уровням</h3>
            <span className="distribution-subtitle">На основе рейтинга</span>
          </div>
          
          <div className="distribution-chart">
            <div className="chart-bars">
              {distributionData.map((level, index) => (
                <div className="chart-bar" key={index}>
                  <div 
                    className="bar-column" 
                    style={{
                      height: `${Math.max(level.percentage, 5)}%`, // Минимум 5% для видимости
                      background: `linear-gradient(0deg, ${level.color}, ${index === distributionData.length - 1 ? '#FFA500' : '#F5DEB3'})`
                    }}
                    title={`${level.name}: ${level.count} пользователей (${level.percentage}%)`}
                  ></div>
                  <div className="bar-label">
                    <div className="level-name">{level.name}</div>
                    <div className="level-count">{level.count} пользователей</div>
                    <div className="level-percentage">{level.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Легенда распределения */}
            <div className="distribution-legend">
              {distributionData.map((level, index) => (
                <div className="legend-item" key={index}>
                  <div 
                    className="legend-color" 
                    style={{ background: level.color }}
                  ></div>
                  <div className="legend-text">
                    <span className="legend-title">{level.name}</span>
                    <span className="legend-description">
                      {level.count} пользователей ({level.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Статистика распределения */}
          <div className="distribution-stats">
            <div className="distribution-stat">
              <div className="stat-title">Всего пользователей</div>
              <div className="stat-value">{totalUsers}</div>
              <div className="stat-subtitle">в системе</div>
            </div>
            <div className="distribution-stat">
              <div className="stat-title">Самый частый уровень</div>
              <div className="stat-value">
                {distributionData.reduce((max, level) => level.count > max.count ? level : max, distributionData[0]).name}
              </div>
              <div className="stat-subtitle">
                {distributionData.reduce((max, level) => level.count > max.count ? level : max, distributionData[0]).percentage}% пользователей
              </div>
            </div>
            <div className="distribution-stat">
              <div className="stat-title">Высший уровень</div>
              <div className="stat-value">{distributionData[distributionData.length - 1]?.name || '—'}</div>
              <div className="stat-subtitle">{distributionData[distributionData.length - 1]?.count || 0} пользователей</div>
            </div>
          </div>
        </div>

        <div className="controls-panel">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input">
              <input
                type="text"
                placeholder="Поиск по логину, email или имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="search-btn">🔍</button>
            </div>
            
            <div className="filter-controls">
              <select 
                value={filterRole} 
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="role-filter"
                disabled={loading}
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователи</option>
                <option value="moderator">Модераторы</option>
                <option value="admin">Администраторы</option>
              </select>
              
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => console.log('Добавление пользователя')}
                disabled={loading}
              >
                + Добавить пользователя
              </button>
            </div>
          </form>

          {/* Статистика */}
          <div className="placeholder-stats" style={{ marginTop: '20px' }}>
            <div className="stat">Всего: {totalUsers}</div>
            <div className="stat">Активных: {users.filter(u => u.isActive).length}</div>
            <div className="stat">Заблокированных: {users.filter(u => !u.isActive).length}</div>
          </div>
        </div>

        {/* Состояние загрузки */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">🔄</div>
            <p className="loading-text">Загрузка пользователей...</p>
          </div>
        )}

        {/* Состояние ошибки */}
        {error && !loading && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p className="empty-text">{error}</p>
            <button 
              onClick={loadUsers}
              className="add-user-btn"
              style={{ marginTop: '20px' }}
            >
              Повторить попытку
            </button>
          </div>
        )}

        {/* Таблица пользователей (если есть данные и нет ошибки) */}
        {!loading && !error && filteredUsers.length > 0 && (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Логин</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Дата регистрации</th>
                    <th>Рейтинг</th>
                    <th>Активность</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.login}</strong>
                        {user.role === 'admin' && ' 👑'}
                      </td>
                      <td>{user.name || '—'}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{user.rating || 0}</span>
                          <button 
                            className="action-btn edit"
                            onClick={() => handleAdjustRating(user.id, user.login)}
                            title="Корректировать рейтинг"
                          >
                            📊
                          </button>
                        </div>
                      </td>
                      <td>{user.activityPoints || 0}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'blocked'}`}>
                          {user.isActive ? 'Активен' : 'Заблокирован'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewUser(user.id)}
                          title="Просмотр профиля"
                        >
                          👁️
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditUser(user.id)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn block"
                          onClick={() => handleToggleBlock(user)}
                          title={user.isActive ? 'Заблокировать' : 'Разблокировать'}
                        >
                          {user.isActive ? '⛔' : '✅'}
                        </button>
                        <button 
                          className="action-btn reset"
                          onClick={() => handleResetPassword(user.id, user.login)}
                          title="Сбросить пароль"
                        >
                          🔄
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                >
                  ← Назад
                </button>
                
                <div className="pagination-info">
                  Страница {currentPage} из {totalPages}
                  <small>Показано {filteredUsers.length} пользователей из {totalUsers}</small>
                </div>
                
                <button 
                  className="pagination-btn" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}

        {/* Состояние "нет данных" */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p className="empty-text">Пользователи не найдены</p>
            <p className="empty-subtext">
              Попробуйте изменить параметры поиска или фильтрации
            </p>
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <UserProfileModal
        user={selectedUser}
        isOpen={isProfileModalOpen}
        onClose={closeAllModals}
        onEdit={() => {
          setIsProfileModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onToggleBlock={() => {
          if (selectedUser) {
            handleToggleBlock(selectedUser);
            closeAllModals();
          }
        }}
        onResetPassword={() => {
          if (selectedUser) {
            handleResetPassword(selectedUser.id, selectedUser.login);
            closeAllModals();
          }
        }}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={closeAllModals}
        onSave={handleSaveUser}
      />

      <RatingAdjustmentModal
        user={selectedUser}
        isOpen={isRatingModalOpen}
        onClose={closeAllModals}
        onAdjust={handleRatingAdjust}
      />
    </div>
  );
}