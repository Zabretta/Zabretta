"use client"

import { useState, useMemo, ChangeEvent, useEffect } from "react";
import { mockAPI } from "../api/mocks";
import "./Marketplace.css";

interface MarketplaceProps {
  onClose: () => void;
}

type ItemType = "sell" | "buy" | "free" | "exchange" | "auction";

interface MarketItem {
  id: number;
  title: string;
  description: string;
  price: number | "free";
  location: string;
  author: string;
  rating: number;
  type: ItemType;
  imageUrl?: string;
  negotiable?: boolean;
}

export default function Marketplace({ onClose }: MarketplaceProps) {
  const [activeFilter, setActiveFilter] = useState<ItemType | "all">("all");
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<MarketItem[]>([]);

  const filters = [
    { id: "all" as ItemType | "all", label: "Все объявления" },
    { id: "sell" as ItemType | "all", label: "Продажа" },
    { id: "buy" as ItemType | "all", label: "Покупка" },
    { id: "free" as ItemType | "all", label: "Бесплатно" },
    { id: "exchange" as ItemType | "all", label: "Обмен" },
    { id: "auction" as ItemType | "all", label: "Аукцион" }
  ];

  // Загрузка данных с помощью API
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Создаем объект фильтра на основе activeFilter
        const filters = {
          type: activeFilter === "all" ? undefined : activeFilter
        };
        
        const result = await mockAPI.marketplace.loadItems(filters);
        
        if (result.success && result.data) {
          setItems(result.data);
        } else {
          setApiError(result.error || "Не удалось загрузить объявления");
        }
      } catch (error) {
        console.error("Ошибка загрузки объявлений:", error);
        setApiError("Ошибка соединения с сервером");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadItems();
  }, [activeFilter]);

  // Поиск по объявлениям
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Поиск по тексту
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [items, searchQuery]);

  // Подсказки для поиска
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const uniqueTitles = new Set<string>();
    
    return items
      .filter(item => item.title.toLowerCase().includes(query))
      .map(item => item.title)
      .filter(title => {
        if (uniqueTitles.has(title)) return false;
        uniqueTitles.add(title);
        return true;
      })
      .slice(0, 5);
  }, [items, searchQuery]);

  const handleCreateAd = () => {
    setIsCreatingAd(true);
  };

  const handleCancelCreateAd = () => {
    setIsCreatingAd(false);
  };

  // Используем API из mocks.ts
  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const priceValue = formData.get("price") as string;
      
      const newItemData = {
        title: formData.get("title") as string || "Новое объявление",
        description: formData.get("description") as string || "Описание",
        price: priceValue && !isNaN(parseInt(priceValue)) ? parseInt(priceValue) : "free" as number | "free",
        location: formData.get("location") as string || "Не указано",
        author: "Текущий пользователь",
        type: (formData.get("type") as ItemType) || "sell",
        negotiable: formData.get("negotiable") === "on",
      };
      
      const result = await mockAPI.marketplace.createItem(newItemData);
      
      if (result.success && result.data) {
        setItems(prev => [result.data!, ...prev]);
        alert(`Объявление "${result.data.title}" успешно создано!`);
        setIsCreatingAd(false);
      } else {
        alert(result.error || "Не удалось создать объявление");
      }
    } catch (error) {
      console.error("Ошибка при создании объявления:", error);
      alert("Не удалось создать объявление. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  // Используем API из mocks.ts
  const handleContact = async (itemId: number) => {
    setIsLoading(true);
    
    try {
      const result = await mockAPI.marketplace.contactAuthor({
        itemId: itemId,
        message: "Здравствуйте! Я заинтересован в вашем объявлении",
        contactMethod: "message" // или 'email', 'phone' в зависимости от выбора пользователя
        // contactInfo: "опциональная контактная информация"
      });
      
      if (result.success) {
        const item = items.find(i => i.id === itemId);
        alert(`Сообщение автору "${item?.author}" отправлено!`);
      } else {
        alert(result.error || "Не удалось отправить сообщение");
      }
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      alert("Не удалось отправить сообщение. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const getTypeLabel = (type: ItemType) => {
    const labels = {
      "sell": "Продам",
      "buy": "Куплю",
      "free": "Даром",
      "exchange": "Обмен",
      "auction": "Аукцион"
    };
    return labels[type];
  };

  const getTypeIcon = (type: ItemType) => {
    const icons = {
      "sell": "💰",
      "buy": "🛒",
      "free": "🎁",
      "exchange": "🔄",
      "auction": "🔨"
    };
    return icons[type];
  };

  return (
    <div className="marketplace-overlay">
      <div className="marketplace-container">
        <div className="marketplace-header">
          <div className="marketplace-header-top">
            <h1 className="marketplace-title">БАРАХОЛКА</h1>
            
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Поиск по объявлениям..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
                <div className="search-icon">🔍</div>
                {searchQuery && (
                  <button 
                    className="clear-search-btn"
                    onClick={handleClearSearch}
                    aria-label="Очистить поиск"
                  >
                    ✕
                  </button>
                )}
                
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions">
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <span className="suggestion-icon">🔍</span>
                        <span className="suggestion-text">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button className="close-marketplace" onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>
          
          <p className="marketplace-subtitle">
            Продавайте, покупайте, обменивайтесь инструментами, материалами и готовыми изделиями
          </p>
          
          <div className="marketplace-filters">
            {filters.map(filter => (
              <button
                key={filter.id}
                className={`filter-btn ${activeFilter === filter.id ? "active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
                disabled={isLoading}
              >
                {filter.label}
                {isLoading && activeFilter === filter.id && "..."}
              </button>
            ))}
          </div>
          
          {apiError && (
            <div className="api-error-message">
              ⚠️ {apiError}
            </div>
          )}
        </div>

        <div className="create-ad-section">
          <button 
            className="create-ad-btn" 
            onClick={handleCreateAd}
            disabled={isCreatingAd || isLoading}
          >
            📝 Создать объявление
            {isLoading && " (загрузка...)"}
          </button>
          <p className="auth-notice">Для создания объявления необходимо войти в систему</p>
        </div>

        {isCreatingAd && (
          <div className="create-ad-form-container">
            <form className="create-ad-form" onSubmit={handleSubmitAd}>
              <h3>Создание нового объявления</h3>
              
              <div className="type-selector">
                <label className="type-option">
                  <input type="radio" name="type" value="sell" defaultChecked />
                  Продажа
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="buy" />
                  Покупка
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="free" />
                  Бесплатно
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="exchange" />
                  Обмен
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="auction" />
                  Аукцион
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Название объявления *</label>
                  <input 
                    type="text" 
                    name="title"
                    required 
                    placeholder="Например: Набор инструментов для начинающего" 
                  />
                </div>
                <div className="form-group">
                  <label>Цена (₽)</label>
                  <input 
                    type="number" 
                    name="price"
                    placeholder="Укажите цену" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Категория</label>
                  <select name="category">
                    <option value="">Выберите категорию</option>
                    <option value="tools">Инструменты</option>
                    <option value="materials">Материалы</option>
                    <option value="furniture">Мебель</option>
                    <option value="electronics">Электроника</option>
                    <option value="cooking">Кулинария</option>
                    <option value="auto">Авто</option>
                    <option value="sport">Спорт</option>
                    <option value="robot">Робототехника</option>
                    <option value="handmade">Рукоделие</option>
                    <option value="stolar">Столярка</option>
                    <option value="hammer">Кузнечное дело</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Город/Населенный пункт *</label>
                  <input 
                    type="text" 
                    name="location"
                    required 
                    placeholder="Ваше местоположение" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Подробное описание *</label>
                <textarea 
                  name="description"
                  rows={4} 
                  required 
                  placeholder="Опишите товар/услугу подробно: состояние, характеристики, дополнительные условия..."
                />
              </div>

              <div className="form-group">
                <label>Контактная информация *</label>
                <input 
                  type="text" 
                  name="contact"
                  required 
                  placeholder="Телефон, электронная почта или другой способ связи" 
                />
              </div>

              <div className="form-group">
                <label>Фотография товара (необязательно)</label>
                <input 
                  type="file" 
                  name="image"
                  accept="image/*"
                  className="file-input"
                />
              </div>

              <label className="checkbox-label">
                <input type="checkbox" name="negotiable" />
                <span>Цена договорная</span>
              </label>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Публикация..." : "Опубликовать объявление"}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleCancelCreateAd}
                  disabled={isLoading}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="loading-items">
            <div className="loading-spinner">🛠️</div>
            <p>Загрузка объявлений...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="market-item">
                <div className="item-type-badge">
                  <span className="badge-icon">{getTypeIcon(item.type)}</span>
                  <span className="badge-text">{getTypeLabel(item.type)}</span>
                </div>
                <div className="item-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} />
                  ) : (
                    <div className="image-placeholder">
                      <span className="placeholder-icon">🛠️</span>
                    </div>
                  )}
                </div>
                <div className="item-content">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-description">{item.description}</p>
                  
                  <div className="item-meta">
                    <div className="item-price">
                      {item.price === "free" ? (
                        <span className="free-price">Бесплатно</span>
                      ) : (
                        <>
                          <span className="price-amount">{item.price.toLocaleString()} ₽</span>
                          {item.negotiable && <span className="negotiable-badge">Договорная</span>}
                        </>
                      )}
                    </div>
                    <div className="item-location">📍 {item.location}</div>
                  </div>
                  
                  <div className="item-footer">
                    <div className="item-author">
                      <span className="author-name">{item.author}</span>
                      <span className="author-rating">★ {item.rating}</span>
                    </div>
                    <button className="contact-btn" onClick={() => handleContact(item.id)}
                      disabled={isLoading}
                    >
                      Связаться
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-items">
            <p>Ничего не найдено</p>
            <button 
              className="create-first-btn" 
              onClick={handleCreateAd}
              disabled={isLoading}
            >
              Создайте первое объявление!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
