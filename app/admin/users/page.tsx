"use client";

import { useState, useEffect } from 'react';
import './AdminUsersPage.css';
import './UserModals.css';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api/admin';
import { formatDate, getRoleLabel } from '@/utils/admin';
import { USER_LEVELS } from '@/api/mocks-admin';

// Импортируем модальные окна
import UserProfileModal from './UserProfileModal';
import UserEditModal from './UserEditModal';
import RatingAdjustmentModal from './RatingAdjustmentModal';

// Тип пользователя (временный, позже перенесем в types/admin.ts)
interface AdminUser {
  id: string;
  login: string;
  email: string;
  name?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  rating: number;
  activityPoints: number;
  totalPosts: number;
  violations: number;
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

export default function AdminUsersPage() {
  // Аутентификация
  const { isAuthorized } = useAdminAuth();
  
  // Состояния для данных
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  
  // Фильтры и пагинация
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  // Распределение по уровням
  const [distributionData, setDistributionData] = useState([
    { name: "Студент", count: 0, percentage: 0, color: "#8B4513" },
    { name: "Инженер", count: 0, percentage: 0, color: "#D2691E" },
    { name: "Архитектор", count: 0, percentage: 0, color: "#CD853F" },
    { name: "Мастер", count: 0, percentage: 0, color: "#A0522D" },
    { name: "Легенда", count: 0, percentage: 0, color: "#FFD700" }
  ]);

  // Модальные окна
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Проверка доступности бэкенда
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        setIsBackendAvailable(response.ok);
      } catch {
        setIsBackendAvailable(false);
        setError('Бэкенд недоступен. Используются демо-данные.');
      }
    };
    checkBackend();
  }, []);

  // Загрузка пользователей
  const loadUsers = async () => {
    if (!isAuthorized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (!isBackendAvailable) {
        // Демо-данные для работы без бэкенда
        const demoUsers = getDemoUsers();
        setUsers(demoUsers);
        setTotalUsers(demoUsers.length);
        updateDistributionData(demoUsers);
        setFilteredUsers(demoUsers);
        return;
      }

      // Реальный запрос к бэкенду
      const response = await adminApi.getUsers({
        page: currentPage,
        limit: usersPerPage,
        role: filterRole !== 'all' ? filterRole : undefined,
        search: search || undefined,
        sortBy: 'createdAt_desc'
      });
      
      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
      updateDistributionData(response.users || []);
      
    } catch (err: any) {
      console.error('Ошибка загрузки пользователей:', err);
      setError(err.message || 'Ошибка при загрузке данных');
      
      // При ошибке показываем демо-данные
      const demoUsers = getDemoUsers();
      setUsers(demoUsers);
      setTotalUsers(demoUsers.length);
      updateDistributionData(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  // Демо-данные для разработки
  const getDemoUsers = (): AdminUser[] => {
    return [
      {
        id: '1',
        login: 'admin',
        email: 'admin@example.com',
        name: 'Администратор',
        role: 'admin',
        isActive: true,
        rating: 1250,
        activityPoints: 3500,
        totalPosts: 45,
        violations: 0,
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        lastLogin: new Date().toISOString(),
      },
      {
        id: '2',
        login: 'moderator1',
        email: 'moderator@example.com',
        name: 'Модератор',
        role: 'moderator',
        isActive: true,
        rating: 850,
        activityPoints: 2100,
        totalPosts: 28,
        violations: 1,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        login: 'user1',
        email: 'user1@example.com',
        name: 'Иван Петров',
        role: 'user',
        isActive: true,
        rating: 450,
        activityPoints: 890,
        totalPosts: 12,
        violations: 0,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: '4',
        login: 'user2',
        email: 'user2@example.com',
        name: 'Мария Иванова',
        role: 'user',
        isActive: false,
        rating: 120,
        activityPoints: 340,
        totalPosts: 5,
        violations: 3,
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];
  };

  // Фильтрация пользователей
  useEffect(() => {
    let result = [...users];
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(user => 
        user.login.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
      );
    }
    
    if (filterRole !== 'all') {
      result = result.filter(user => user.role === filterRole);
    }
    
    setFilteredUsers(result);
  }, [users, search, filterRole]);

  // Обновление распределения по уровням
  const updateDistributionData = (userList: AdminUser[]) => {
    const total = userList.length;
    
    if (total === 0) {
      const emptyDistribution = USER_LEVELS.map((level, index) => ({
        name: level.name,
        count: 0,
        percentage: 0,
        color: ['#8B4513', '#D2691E', '#CD853F', '#A0522D', '#FFD700'][index] || '#8B4513'
      }));
      setDistributionData(emptyDistribution);
      return;
    }
    
    const levelCounts: Record<string, number> = {};
    
    userList.forEach(user => {
      const rating = user.rating || 0;
      const level = USER_LEVELS.find(l => rating >= l.min && rating <= l.max)?.name || USER_LEVELS[0].name;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    
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

  // Загрузка при монтировании
  useEffect(() => {
    if (isAuthorized) {
      loadUsers();
    }
  }, [isAuthorized, currentPage]);

  // Обработчики
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

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
    const action = user.isActive ? 'блокировку' : 'разблокировку';
    
    if (confirm(`Вы уверены, что хотите ${action} пользователя ${user.login}?`)) {
      try {
        if (!isBackendAvailable) {
          // Демо-режим
          alert(`Демо: пользователь ${user.login} ${user.isActive ? 'заблокирован' : 'разблокирован'}`);
          setUsers(prev => prev.map(u => 
            u.id === user.id ? { ...u, isActive: !u.isActive } : u
          ));
          return;
        }

        await adminApi.toggleUserBlock(user.id);
        alert(`Пользователь ${user.login} успешно ${user.isActive ? 'заблокирован' : 'разблокирован'}!`);
        loadUsers();
      } catch (err: any) {
        alert(`Ошибка: ${err.message}`);
      }
    }
  };

  const handleResetPassword = async (userId: string, userLogin: string) => {
    if (confirm(`Сбросить пароль для пользователя ${userLogin}?`)) {
      try {
        if (!isBackendAvailable) {
          alert(`Демо: запрос на сброс пароля для ${userLogin} отправлен`);
          return;
        }

        await adminApi.resetPassword(userId);
        alert(`Инструкция по сбросу пароля отправлена на email пользователя.`);
      } catch (err: any) {
        alert(`Ошибка: ${err.message}`);
      }
    }
  };

  const handleAdjustRating = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsRatingModalOpen(true);
    }
  };

  const handleSaveUser = async (updates: Partial<AdminUser>) => {
    if (!selectedUser) return;
    
    try {
      if (!isBackendAvailable) {
        // Демо-режим
        alert(`Демо: данные пользователя ${selectedUser.login} обновлены`);
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, ...updates } : u
        ));
        setIsEditModalOpen(false);
        setSelectedUser(null);
        return;
      }

      await adminApi.updateUser(selectedUser.id, updates);
      alert(`Данные пользователя ${selectedUser.login} обновлены!`);
      loadUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const handleRatingAdjust = async (adjustment: {
    ratingChange: number;
    activityChange: number;
    reason: string;
    adminNote?: string;
  }) => {
    if (!selectedUser) return;
    
    try {
      if (!isBackendAvailable) {
        // Демо-режим
        const newRating = (selectedUser.rating || 0) + adjustment.ratingChange;
        const newActivity = (selectedUser.activityPoints || 0) + adjustment.activityChange;
        alert(`Демо: рейтинг ${selectedUser.login} скорректирован!\nНовый рейтинг: ${newRating}\nНовая активность: ${newActivity}`);
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, rating: newRating, activityPoints: newActivity } 
            : u
        ));
        setIsRatingModalOpen(false);
        setSelectedUser(null);
        return;
      }

      await adminApi.adjustRating({
        userId: selectedUser.id,
        ...adjustment
      });
      
      alert(`Рейтинг пользователя ${selectedUser.login} скорректирован!`);
      loadUsers();
      setIsRatingModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  const closeAllModals = () => {
    setIsProfileModalOpen(false);
    setIsEditModalOpen(false);
    setIsRatingModalOpen(false);
    setSelectedUser(null);
  };

  // Пагинация
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

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
        <div className="page-header-info">
          <p className="page-subtitle">
            {isBackendAvailable 
              ? 'Реальные данные из базы' 
              : '⚠️ Демо-режим: бэкенд недоступен'}
          </p>
          <span className="users-count">Всего: {totalUsers}</span>
        </div>
      </div>

      <div className="page-content">
        {/* Распределение по уровням */}
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
                      height: `${Math.max(level.percentage, 5)}%`,
                      background: `linear-gradient(0deg, ${level.color}, ${index === distributionData.length - 1 ? '#FFA500' : '#F5DEB3'})`
                    }}
                    title={`${level.name}: ${level.count} (${level.percentage}%)`}
                  />
                  <div className="bar-label">
                    <div className="level-name">{level.name}</div>
                    <div className="level-count">{level.count}</div>
                    <div className="level-percentage">{level.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="controls-panel">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input">
              <input
                type="text"
                placeholder="Поиск по логину, email или имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? '⏳' : '🔍'}
              </button>
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
                className="refresh-btn"
                onClick={loadUsers}
                disabled={loading}
              >
                {loading ? '🔄' : '🔄 Обновить'}
              </button>
            </div>
          </form>
        </div>

        {/* Состояния загрузки и ошибок */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">🔄</div>
            <p>Загрузка пользователей...</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={loadUsers} className="retry-btn">
              Повторить
            </button>
          </div>
        )}

        {/* Таблица пользователей */}
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
                        <div className="rating-cell">
                          <span>{user.rating || 0}</span>
                          <button 
                            className="action-btn small"
                            onClick={() => handleAdjustRating(user.id)}
                            title="Корректировать рейтинг"
                          >
                            📊
                          </button>
                        </div>
                      </td>
                      <td>{user.activityPoints || 0}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'blocked'}`}>
                          {user.isActive ? '✅ Активен' : '⛔ Заблокирован'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewUser(user.id)}
                          title="Просмотр"
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

        {/* Нет данных */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>Пользователи не найдены</p>
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
