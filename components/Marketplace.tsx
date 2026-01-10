// Marketplace.tsx - с поиском и центрированным заголовком
"use client";

import { useState, useMemo, ChangeEvent } from "react";
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
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [items, setItems] = useState<MarketItem[]>([
    {
      id: 1,
      title: "Набор инструментов для начинающего мастера",
      description: "Полный набор инструментов: молоток, отвертки, пассатижи, уровень. Отличное состояние.",
      price: 2500,
      location: "Москва",
      author: "Иван Кулибин",
      rating: 4.8,
      type: "sell"
    },
    {
      id: 2,
      title: "Ищу помощника для ремонта мебели",
      description: "Нужен помощник с опытом работы с деревом. Оплата договорная.",
      price: "free",
      location: "Санкт-Петербург",
      author: "Мария Столярова",
      rating: 4.9,
      type: "buy"
    },
    {
      id: 3,
      title: "Электролобзик Bosch в отличном состоянии",
      description: "Мощный, мало использовался. Есть все насадки и инструкция.",
      price: 3500,
      location: "Новосибирск",
      author: "Алексей Мастеров",
      rating: 4.7,
      type: "sell",
      negotiable: true
    },
    {
      id: 4,
      title: "Отдам дрова для печки/камина",
      description: "Сухие березовые дрова, около 2 кубов. Самовывоз.",
      price: "free",
      location: "Казань",
      author: "Дмитрий Лесной",
      rating: 4.6,
      type: "free"
    },
    {
      id: 5,
      title: "Обмен: дрель на шуруповерт",
      description: "Дрель мощная, новая, хочу поменять на качественный шуруповерт.",
      price: "free",
      location: "Екатеринбург",
      author: "Сергей Обменов",
      rating: 4.5,
      type: "exchange"
    },
    {
      id: 6,
      title: "Столярный верстак ручной работы",
      description: "Массив дуба, регулируемая высота, ящики для инструментов.",
      price: 12000,
      location: "Краснодар",
      author: "Олег Столяр",
      rating: 5.0,
      type: "auction"
    },
    {
      id: 7,
      title: "Деревянная полка ручной работы",
      description: "Изготовлена из дуба, размеры 120x30x20 см. Идеально для книг или коллекций.",
      price: 4500,
      location: "Москва",
      author: "Столяр_Иван",
      rating: 4.8,
      type: "sell"
    },
    {
      id: 8,
      title: "Молоток столярный профессиональный",
      description: "Качественный молоток, вес 500г, деревянная рукоятка.",
      price: 1200,
      location: "Санкт-Петербург",
      author: "ИнструментыОнлайн",
      rating: 4.7,
      type: "sell"
    },
    {
      id: 9,
      title: "Услуги по ремонту мебели",
      description: "Профессиональный ремонт и реставрация мебели. Гарантия качества.",
      price: 1500,
      location: "Новосибирск",
      author: "МастерМебели",
      rating: 4.9,
      type: "sell"
    },
    {
      id: 10,
      title: "Куплю старые инструменты",
      description: "Куплю старые советские инструменты в любом состоянии.",
      price: "free",
      location: "Екатеринбург",
      author: "Коллекционер",
      rating: 4.5,
      type: "buy"
    },
  ]);

  const filters = [
    { id: "all", label: "Все объявления" },
    { id: "sell", label: "Продажа" },
    { id: "buy", label: "Покупка" },
    { id: "free", label: "Бесплатно" },
    { id: "exchange", label: "Обмен" },
    { id: "auction", label: "Аукцион" }
  ];

  // Поиск по объявлениям
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Фильтрация по категории
    if (activeFilter !== "all") {
      filtered = filtered.filter(item => item.type === activeFilter);
    }
    
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
  }, [items, activeFilter, searchQuery]);

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
      .slice(0, 5); // Ограничиваем 5 подсказками
  }, [items, searchQuery]);

  const handleCreateAd = () => {
    setIsCreatingAd(true);
  };

  const handleCancelCreateAd = () => {
    setIsCreatingAd(false);
  };

  const handleSubmitAd = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Объявление создано!");
    setIsCreatingAd(false);
  };

  const handleContact = (itemId: number) => {
    alert(`Связываемся с автором объявления #${itemId}`);
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
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="create-ad-section">
          <button 
            className="create-ad-btn" 
            onClick={handleCreateAd}
            disabled={isCreatingAd}
          >
            📝 Создать объявление
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
                  <span>Продажа</span>
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="buy" />
                  <span>Покупка</span>
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="free" />
                  <span>Бесплатно</span>
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="exchange" />
                  <span>Обмен</span>
                </label>
                <label className="type-option">
                  <input type="radio" name="type" value="auction" />
                  <span>Аукцион</span>
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Название объявления *</label>
                  <input type="text" required placeholder="Например: Набор инструментов для начинающего" />
                </div>
                <div className="form-group">
                  <label>Цена (₽)</label>
                  <input type="number" placeholder="Укажите цену" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Категория</label>
                  <select>
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
                  <input type="text" required placeholder="Ваше местоположение" />
                </div>
              </div>

              <div className="form-group">
                <label>Подробное описание *</label>
                <textarea 
                  rows={4} 
                  required 
                  placeholder="Опишите товар/услугу подробно: состояние, характеристики, дополнительные условия..."
                />
              </div>

              <div className="form-group">
                <label>Контактная информация *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Телефон, email или другой способ связи" 
                />
              </div>

              <div className="form-group">
                <label>Фотография товара (необязательно)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="file-input"
                />
              </div>

              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Цена договорная</span>
              </label>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Опубликовать объявление
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancelCreateAd}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

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
                <h3 id={`item-title-${item.id}`} className="item-title">{item.title}</h3>
                <p className="item-description">{item.description}</p>
                
                <div className="item-meta">
                  <div className="item-price">
                    {item.price === "free" ? (
                      <span className="price-free">Бесплатно</span>
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
                  <button 
                    className="contact-btn"
                    onClick={() => handleContact(item.id)}
                  >
                    Связаться
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="no-items">
            <p>Ничего не найдено</p>
            <button className="create-first-btn" onClick={handleCreateAd}>
              Создайте первое объявление!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}