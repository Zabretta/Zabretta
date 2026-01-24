"use client";

import { useState } from 'react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', search, 'Role:', filterRole);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Управление пользователями</h2>
        <p className="page-subtitle">Поиск, фильтрация и управление пользователями системы</p>
      </div>

      <div className="page-content">
        <div className="controls-panel">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input">
              <input
                type="text"
                placeholder="Поиск по логину или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="search-btn">🔍</button>
            </div>
            
            <div className="filter-controls">
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="role-filter"
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователи</option>
                <option value="moderator">Модераторы</option>
                <option value="admin">Администраторы</option>
              </select>
              
              <button 
                type="button" 
                className="add-user-btn"
                onClick={() => console.log('Add user')}
              >
                + Добавить пользователя
              </button>
            </div>
          </form>

          <div className="placeholder">
            <div className="placeholder-icon">👥</div>
            <h3>Таблица пользователей</h3>
            <p>Мокап-данные будут загружены на следующем этапе</p>
            <div className="placeholder-features">
              <p>📋 Колонки: ID, Логин, Email, Дата регистрации, Роль, Рейтинг, Статус</p>
              <p>🔍 Фильтры: по роли, рейтингу, дате регистрации</p>
              <p>⚡ Действия: просмотр, блокировка, сброс пароля</p>
              <p>📱 Адаптивный дизайн</p>
            </div>
            <div className="placeholder-stats">
              <div className="stat">Всего: 0</div>
              <div className="stat">Активных: 0</div>
              <div className="stat">Заблокированных: 0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}