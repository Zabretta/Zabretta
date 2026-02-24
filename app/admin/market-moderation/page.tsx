"use client";

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api/admin';
import './MarketModerationPage.css';

// Типы для объявлений на модерации
interface MarketItemModeration {
  id: string;
  title: string;
  description: string;
  price: number | 'free';
  location: string;
  author: string;
  authorId: string;
  authorEmail?: string;
  type: string;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  moderationFlags: string[];
  views?: number;
  contacts?: number;
}

export default function MarketModerationPage() {
  const { isAuthorized } = useAdminAuth();
  
  // Состояния
  const [items, setItems] = useState<MarketItemModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketItemModeration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'FLAGGED' | 'PENDING'>('FLAGGED');
  const [search, setSearch] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  // Проверка доступности бэкенда
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const available = response.ok;
        setIsBackendAvailable(available);
        
        if (!available) {
          setDemoMode(true);
          loadDemoItems();
        }
      } catch {
        setIsBackendAvailable(false);
        setDemoMode(true);
        loadDemoItems();
      }
    };

    if (isAuthorized) {
      checkBackend();
    }
  }, [isAuthorized]);

  // Загрузка демо-данных
  const loadDemoItems = () => {
    const demoItems: MarketItemModeration[] = [
      {
        id: 'demo_1',
        title: 'ПРОДАМ ТЕЛЕФОН СРОЧНО',
        description: 'Продается хороший телефон, почти новый. ТОРГ!!!',
        price: 15000,
        location: 'Москва',
        author: 'user123',
        authorId: 'user123',
        authorEmail: 'user123@example.com',
        type: 'sell',
        category: 'electronics',
        createdAt: new Date().toISOString(),
        moderationStatus: 'FLAGGED',
        moderationFlags: ['ALL_CAPS', 'SPAM_LINKS']
      },
      {
        id: 'demo_2',
        title: 'Крутой набор инструментов',
        description: 'Продам набор инструментов http://spam-link.ru/ref12345',
        price: 5000,
        location: 'СПб',
        author: 'master_tools',
        authorId: 'master_tools',
        authorEmail: 'tools@example.com',
        type: 'sell',
        category: 'tools',
        createdAt: new Date().toISOString(),
        moderationStatus: 'FLAGGED',
        moderationFlags: ['SPAM_LINKS']
      },
      {
        id: 'demo_3',
        title: 'херня какая то бля',
        description: 'пиздец полный не покупайте',
        price: 'free',
        location: 'Екатеринбург',
        author: 'bad_user',
        authorId: 'bad_user',
        authorEmail: 'bad@example.com',
        type: 'free',
        category: 'other',
        createdAt: new Date().toISOString(),
        moderationStatus: 'FLAGGED',
        moderationFlags: ['BAD_WORDS']
      },
      {
        id: 'demo_4',
        title: 'Дрель электрическая',
        description: 'Дрель в отличном состоянии, мало пользовался. Цена договорная.',
        price: 3000,
        location: 'Казань',
        author: 'tool_master',
        authorId: 'tool_master',
        authorEmail: 'master@example.com',
        type: 'sell',
        category: 'tools',
        createdAt: new Date().toISOString(),
        moderationStatus: 'PENDING',
        moderationFlags: []
      }
    ];
    setItems(demoItems);
    setLoading(false);
  };

  // Загрузка реальных данных
  const loadItems = async () => {
    if (!isAuthorized || demoMode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем объявления с флагом FLAGGED
      const response = await adminApi.getMarketItemsForModeration({
        status: filter === 'all' ? undefined : filter,
        search: search || undefined
      });
      
      setItems(response.items || []);
    } catch (err: any) {
      console.error('Ошибка загрузки объявлений:', err);
      setError(err.message || 'Ошибка при загрузке данных');
      
      // При ошибке показываем демо-данные
      setDemoMode(true);
      loadDemoItems();
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании и изменении фильтра
  useEffect(() => {
    if (isAuthorized) {
      if (demoMode) {
        loadDemoItems();
      } else {
        loadItems();
      }
    }
  }, [isAuthorized, filter, demoMode]);

  // Поиск с debounce
  useEffect(() => {
    if (!isAuthorized || demoMode) return;
    
    const timeout = setTimeout(() => {
      loadItems();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [search]);

  // Фильтрация демо-данных
  const getFilteredDemoItems = () => {
    let filtered = [...items];
    
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.moderationStatus === filter);
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.author.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const displayItems = demoMode ? getFilteredDemoItems() : items;

  // Обработчики действий модерации
  const handleApprove = async (item: MarketItemModeration) => {
    if (!confirm(`Одобрить объявление "${item.title}"? Оно будет видно в общей ленте.`)) return;
    
    setActionLoading(true);
    try {
      if (demoMode) {
        // Демо-режим
        await new Promise(resolve => setTimeout(resolve, 500));
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { ...i, moderationStatus: 'APPROVED', moderationFlags: [] } 
            : i
        ));
        alert(`✅ Объявление "${item.title}" одобрено (демо)!`);
      } else {
        // Реальный API
        await adminApi.moderateMarketItem(item.id, {
          status: 'APPROVED',
          moderatorNote: 'Одобрено модератором'
        });
        alert(`✅ Объявление "${item.title}" одобрено!`);
        loadItems();
      }
      if (selectedItem?.id === item.id) setIsModalOpen(false);
    } catch (err: any) {
      alert(`❌ Ошибка: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (item: MarketItemModeration, reason?: string) => {
    const message = reason 
      ? `Отклонить объявление "${item.title}"?\nПричина: ${reason}`
      : `Отклонить объявление "${item.title}"? Оно будет скрыто из общей ленты.`;
    
    if (!confirm(message)) return;
    
    setActionLoading(true);
    try {
      if (demoMode) {
        // Демо-режим
        await new Promise(resolve => setTimeout(resolve, 500));
        setItems(prev => prev.filter(i => i.id !== item.id));
        alert(`✅ Объявление "${item.title}" отклонено и удалено (демо)!`);
      } else {
        // Реальный API
        await adminApi.moderateMarketItem(item.id, {
          status: 'REJECTED',
          moderatorNote: reason || 'Отклонено модератором'
        });
        alert(`✅ Объявление "${item.title}" отклонено!`);
        loadItems();
      }
      if (selectedItem?.id === item.id) setIsModalOpen(false);
    } catch (err: any) {
      alert(`❌ Ошибка: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAndApprove = async (item: MarketItemModeration, newTitle: string, newDescription: string) => {
    if (!confirm(`Сохранить изменения и одобрить объявление "${item.title}"?`)) return;
    
    setActionLoading(true);
    try {
      if (demoMode) {
        // Демо-режим
        await new Promise(resolve => setTimeout(resolve, 500));
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                title: newTitle, 
                description: newDescription, 
                moderationStatus: 'APPROVED', 
                moderationFlags: [] 
              } 
            : i
        ));
        alert(`✅ Объявление "${item.title}" отредактировано и одобрено (демо)!`);
      } else {
        // Реальный API - сначала обновляем, потом одобряем
        await adminApi.updateMarketItem(item.id, {
          title: newTitle,
          description: newDescription
        });
        await adminApi.moderateMarketItem(item.id, {
          status: 'APPROVED',
          moderatorNote: 'Отредактировано и одобрено модератором'
        });
        alert(`✅ Объявление "${item.title}" отредактировано и одобрено!`);
        loadItems();
      }
      if (selectedItem?.id === item.id) setIsModalOpen(false);
    } catch (err: any) {
      alert(`❌ Ошибка: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Получение текста флага
  const getFlagLabel = (flag: string): string => {
    const flags: Record<string, string> = {
      'BAD_WORDS': '🚫 Нецензурная лексика',
      'SPAM_LINKS': '🔗 Ссылки (спам)',
      'ALL_CAPS': '🔠 Много заглавных букв',
      'REPETITIVE_CHARS': '🔄 Повторяющиеся символы'
    };
    return flags[flag] || flag;
  };

  // Получение цвета флага
  const getFlagColor = (flag: string): string => {
    const colors: Record<string, string> = {
      'BAD_WORDS': '#e74c3c',
      'SPAM_LINKS': '#f39c12',
      'ALL_CAPS': '#3498db',
      'REPETITIVE_CHARS': '#9b59b6'
    };
    return colors[flag] || '#95a5a6';
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
        <h2>Модерация объявлений</h2>
        <div className="page-header-info">
          <p className="page-subtitle">
            {demoMode 
              ? '🎮 Демо-режим. Используются тестовые данные.'
              : isBackendAvailable 
                ? '📊 Реальные данные из базы'
                : '⚠️ Бэкенд недоступен, работа в демо-режиме'}
          </p>
          <div className="header-controls">
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="FLAGGED">🔴 Требуют внимания (с флагами)</option>
              <option value="PENDING">⏳ Ожидают проверки</option>
              <option value="all">📋 Все объявления</option>
            </select>
            
            <input
              type="text"
              className="search-input"
              placeholder="Поиск по заголовку, описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            {demoMode && (
              <button 
                className="refresh-btn"
                onClick={() => {
                  setDemoMode(false);
                  loadItems();
                }}
              >
                🔄 Проверить реальные данные
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">🔄</div>
            <p>Загрузка объявлений...</p>
          </div>
        ) : error && !demoMode ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={loadItems} className="retry-btn">
              Повторить
            </button>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Объявлений на модерацию нет</h3>
            <p className="empty-text">
              {filter === 'FLAGGED' 
                ? 'Все объявления с флагами обработаны. Отличная работа!' 
                : filter === 'PENDING'
                  ? 'Нет объявлений, ожидающих проверки'
                  : 'В базе данных нет объявлений'}
            </p>
          </div>
        ) : (
          <div className="items-grid">
            {displayItems.map(item => (
              <div key={item.id} className="moderation-item">
                <div className="item-header">
                  <h3 className="item-title">{item.title}</h3>
                  <div className="item-flags">
                    {item.moderationFlags.map(flag => (
                      <span 
                        key={flag} 
                        className="flag-badge"
                        style={{ backgroundColor: getFlagColor(flag) }}
                        title={getFlagLabel(flag)}
                      >
                        {getFlagLabel(flag)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="item-preview">
                  <p className="item-description">{item.description}</p>
                  
                  <div className="item-meta">
                    <div className="meta-row">
                      <span className="meta-label">Автор:</span>
                      <span className="meta-value">{item.author}</span>
                      {item.authorEmail && (
                        <span className="meta-value small">({item.authorEmail})</span>
                      )}
                    </div>
                    
                    <div className="meta-row">
                      <span className="meta-label">Цена:</span>
                      <span className="meta-value price">
                        {item.price === 'free' ? 'Бесплатно' : `${item.price} ₽`}
                      </span>
                    </div>
                    
                    <div className="meta-row">
                      <span className="meta-label">Тип:</span>
                      <span className="meta-value">{item.type}</span>
                      {item.category && (
                        <span className="meta-value category">• {item.category}</span>
                      )}
                    </div>
                    
                    <div className="meta-row">
                      <span className="meta-label">Местоположение:</span>
                      <span className="meta-value">{item.location}</span>
                    </div>
                    
                    <div className="meta-row">
                      <span className="meta-label">Создано:</span>
                      <span className="meta-value">
                        {new Date(item.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    
                    {item.views !== undefined && (
                      <div className="meta-row">
                        <span className="meta-label">Просмотры:</span>
                        <span className="meta-value">{item.views}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="item-actions">
                  <button
                    className="action-btn view"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsModalOpen(true);
                    }}
                  >
                    👁️ Просмотр
                  </button>
                  <button
                    className="action-btn approve"
                    onClick={() => handleApprove(item)}
                    disabled={actionLoading}
                  >
                    ✅ Одобрить
                  </button>
                  <button
                    className="action-btn reject"
                    onClick={() => handleReject(item)}
                    disabled={actionLoading}
                  >
                    ❌ Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно детального просмотра */}
      {isModalOpen && selectedItem && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Детальный просмотр объявления</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="modal-section">
                <h3>Информация об объявлении</h3>
                
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedItem.id}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Заголовок:</span>
                    <span className="detail-value">{selectedItem.title}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Описание:</span>
                    <span className="detail-value">{selectedItem.description}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Цена:</span>
                    <span className="detail-value price">
                      {selectedItem.price === 'free' ? 'Бесплатно' : `${selectedItem.price} ₽`}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Тип / Категория:</span>
                    <span className="detail-value">
                      {selectedItem.type} {selectedItem.category && `/ ${selectedItem.category}`}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Местоположение:</span>
                    <span className="detail-value">{selectedItem.location}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Дата создания:</span>
                    <span className="detail-value">
                      {new Date(selectedItem.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Информация об авторе</h3>
                
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Автор:</span>
                    <span className="detail-value">{selectedItem.author}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">ID автора:</span>
                    <span className="detail-value">{selectedItem.authorId}</span>
                  </div>
                  
                  {selectedItem.authorEmail && (
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedItem.authorEmail}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Флаги модерации</h3>
                
                {selectedItem.moderationFlags.length > 0 ? (
                  <div className="flags-list">
                    {selectedItem.moderationFlags.map(flag => (
                      <div key={flag} className="flag-item" style={{ borderLeftColor: getFlagColor(flag) }}>
                        <span className="flag-icon">
                          {flag === 'BAD_WORDS' && '🚫'}
                          {flag === 'SPAM_LINKS' && '🔗'}
                          {flag === 'ALL_CAPS' && '🔠'}
                          {flag === 'REPETITIVE_CHARS' && '🔄'}
                        </span>
                        <span className="flag-text">{getFlagLabel(flag)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-flags">Флагов нет</p>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="footer-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Закрыть
                </button>
                <button
                  className="action-btn approve"
                  onClick={() => handleApprove(selectedItem)}
                  disabled={actionLoading}
                >
                  ✅ Одобрить
                </button>
                <button
                  className="action-btn reject"
                  onClick={() => handleReject(selectedItem)}
                  disabled={actionLoading}
                >
                  ❌ Отклонить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}