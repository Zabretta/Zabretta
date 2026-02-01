"use client"

import { useState, useMemo, ChangeEvent, useEffect } from "react";
import { mockAPI } from "../api/mocks";
import "./Marketplace.css";

interface MarketplaceProps {
  onClose: () => void;
}

type ItemType = "sell" | "buy" | "free" | "exchange" | "auction";
type DurationType = "2weeks" | "1month" | "2months";

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
  expirationDate?: string;
  duration?: DurationType;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  contacts?: number;
}

export default function Marketplace({ onClose }: MarketplaceProps) {
  const [activeFilter, setActiveFilter] = useState<ItemType | "all">("all");
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<DurationType>("1month");
  
  // Состояния для фотографий
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const filters = [
    { id: "all" as ItemType | "all", label: "Все объявления" },
    { id: "sell" as ItemType | "all", label: "Продажа" },
    { id: "buy" as ItemType | "all", label: "Покупка" },
    { id: "free" as ItemType | "all", label: "Бесплатно" },
    { id: "exchange" as ItemType | "all", label: "Обмен" },
    { id: "auction" as ItemType | "all", label: "Аукцион" }
  ];

  const durationOptions = [
    { id: "2weeks" as DurationType, label: "2 недели", description: "Короткий срок" },
    { id: "1month" as DurationType, label: "1 месяц", description: "Стандартный срок" },
    { id: "2months" as DurationType, label: "2 месяца", description: "Длительный срок" }
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой! Максимальный размер: 5MB.");
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert("Неподдерживаемый формат файла! Разрешены: JPG, PNG, WebP, GIF.");
        e.target.value = '';
        return;
      }
      
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedImage(dataUrl);
        setImageUrl(dataUrl); // Сохраняем Data URL для отправки в API
      };
      reader.onerror = () => {
        alert("Ошибка при загрузке изображения");
        e.target.value = '';
        setImageFile(null);
        setSelectedImage(null);
        setImageUrl(undefined);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setImageUrl(undefined);
    const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Создаем объект фильтра для API
        const filters: { type?: ItemType } = {};
        if (activeFilter !== "all") {
          filters.type = activeFilter;
        }
        
        console.log('📡 Загрузка объявлений с фильтрами:', filters);
        const result = await mockAPI.marketplace.loadItems(filters);
        
        if (result.success && result.data) {
          console.log(`✅ Загружено ${result.data.length} объявлений`);
          setItems(result.data);
          
          // Логируем информацию о фото
          const itemsWithPhotos = result.data.filter(item => item.imageUrl);
          console.log(`📸 Объявлений с фото: ${itemsWithPhotos.length}/${result.data.length}`);
        } else {
          setApiError(result.error || "Не удалось загрузить объявления");
          console.error('❌ Ошибка загрузки:', result.error);
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

  const filteredItems = useMemo(() => {
    let filtered = items;
    
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
    setSelectedDuration("1month");
    handleRemoveImage();
  };

  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const location = formData.get("location") as string;
      const priceValue = formData.get("price") as string;
      const type = (formData.get("type") as ItemType) || "sell";
      
      // Валидация обязательных полей (соответствует mocks-market.ts)
      if (!title || title.trim().length < 5) {
        alert('Название должно содержать минимум 5 символов');
        setIsLoading(false);
        return;
      }
      
      if (!description || description.trim().length < 20) {
        alert('Описание должно содержать минимум 20 символов');
        setIsLoading(false);
        return;
      }
      
      if (!location) {
        alert('Укажите местоположение');
        setIsLoading(false);
        return;
      }
      
      // Правильное преобразование цены: число или "free"
      let price: number | "free" = "free";
      if (priceValue && priceValue.trim() !== "") {
        const parsedPrice = parseInt(priceValue);
        if (!isNaN(parsedPrice) && parsedPrice > 0) {
          price = parsedPrice;
        }
      }
      
      const negotiable = formData.get("negotiable") === "on";
      
      // Подготавливаем данные для API (соответствует CreateItemData из mocks-market.ts)
      const newItemData = {
        title: title.trim(),
        description: description.trim(),
        price: price, // Теперь правильный тип: number | "free"
        location: location.trim(),
        type: type,
        imageUrl: imageUrl, // Data URL или undefined
        negotiable: negotiable,
        duration: selectedDuration,
      };
      
      console.log('📝 Отправка данных для создания объявления:', {
        ...newItemData,
        imageUrl: imageUrl ? `Data URL (${imageUrl.length} chars)` : 'нет фото',
        price: price === "free" ? "бесплатно" : `${price} ₽`
      });
      
      const result = await mockAPI.marketplace.createItem(newItemData);
      
      if (result.success && result.data) {
        // Сбрасываем состояние
        setSelectedImage(null);
        setImageFile(null);
        setImageUrl(undefined);
        
        // Добавляем новое объявление в список
        setItems(prev => [result.data!, ...prev]);
        
        // Показываем успешное сообщение с датой истечения
        const expirationDate = result.data.expirationDate ? 
          new Date(result.data.expirationDate).toLocaleDateString('ru-RU') : 
          'не указана';
        
        alert(`✅ Объявление "${result.data.title}" успешно создано!\nБудет активно до: ${expirationDate}`);
        setIsCreatingAd(false);
        setSelectedDuration("1month");
      } else {
        alert(result.error || "Не удалось создать объявление");
        console.error('❌ Ошибка создания объявления:', result.error);
      }
    } catch (error) {
      console.error("Ошибка при создании объявления:", error);
      alert("Не удалось создать объявление. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async (itemId: number) => {
    setIsLoading(true);
    
    try {
      const result = await mockAPI.marketplace.contactAuthor({
        itemId: itemId,
        message: "Здравствуйте! Я заинтересован в вашем объявлении",
        contactMethod: "message"
      });
      
      if (result.success) {
        const item = items.find(i => i.id === itemId);
        alert(`✅ Сообщение автору "${item?.author}" отправлено!`);
      } else {
        alert(result.error || "Не удалось отправить сообщение");
        console.error('❌ Ошибка отправки сообщения:', result.error);
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

  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  // Функция для расчета даты истечения для превью в форме
  const calculatePreviewExpirationDate = (duration: DurationType): string => {
    const now = new Date();
    const expirationDate = new Date(now);
    
    switch (duration) {
      case "2weeks":
        expirationDate.setDate(now.getDate() + 14);
        break;
      case "1month":
        expirationDate.setMonth(now.getMonth() + 1);
        break;
      case "2months":
        expirationDate.setMonth(now.getMonth() + 2);
        break;
    }
    
    return expirationDate.toISOString();
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
                  <label>Название объявления * (мин. 5 символов)</label>
                  <input 
                    type="text" 
                    name="title"
                    required 
                    minLength={5}
                    placeholder="Например: Набор инструментов для начинающего" 
                  />
                </div>
                <div className="form-group">
                  <label>Цена (₽)</label>
                  <input 
                    type="number" 
                    name="price"
                    placeholder="Укажите цену или оставьте пустым для 'Бесплатно'" 
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
                <label>Подробное описание * (мин. 20 символов)</label>
                <textarea 
                  name="description"
                  rows={4} 
                  required 
                  minLength={20}
                  placeholder="Опишите товар/услугу подробно: состояние, характеристики, дополнительные условия..."
                />
              </div>

              <div className="duration-section">
                <div className="duration-header">
                  <h4>Срок публикации объявления</h4>
                  <div className="duration-notice">
                    <span className="notice-icon">ℹ️</span>
                    <span className="notice-text">После окончания срока ваше объявление автоматически удалится и вы сможете подать новое</span>
                  </div>
                </div>
                
                <div className="duration-options">
                  {durationOptions.map(option => (
                    <div 
                      key={option.id}
                      className={`duration-option ${selectedDuration === option.id ? "active" : ""}`}
                      onClick={() => setSelectedDuration(option.id)}
                    >
                      <div className="duration-option-header">
                        <div className="duration-radio">
                          <input
                            type="radio"
                            id={`duration-${option.id}`}
                            name="duration"
                            value={option.id}
                            checked={selectedDuration === option.id}
                            onChange={() => setSelectedDuration(option.id)}
                          />
                          <span className="radio-custom"></span>
                        </div>
                        <label 
                          htmlFor={`duration-${option.id}`}
                          className="duration-label"
                        >
                          {option.label}
                        </label>
                      </div>
                      <div className="duration-description">{option.description}</div>
                      <div className="duration-date">
                        Активно до: {formatExpirationDate(calculatePreviewExpirationDate(option.id))}
                      </div>
                    </div>
                  ))}
                </div>
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
                  onChange={handleImageSelect}
                />
                <p className="file-input-info">
                  Максимальный размер: 5MB. Разрешены: JPG, PNG, WebP, GIF
                </p>
                
                {selectedImage && (
                  <div className="image-preview">
                    <img 
                      src={selectedImage} 
                      alt="Превью фотографии" 
                      className="preview-image"
                    />
                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="remove-image-btn"
                    >
                      ✕ Удалить фото
                    </button>
                  </div>
                )}
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
                {item.expirationDate && (
                  <div className="item-expiration">
                    <span className="expiration-icon">⏰</span>
                    <span className="expiration-text">
                      до {formatExpirationDate(item.expirationDate)}
                    </span>
                  </div>
                )}
                
                <div className="item-image-container">
                  <div className="item-image">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        onError={(e) => {
                          console.log('❌ Ошибка загрузки изображения для объявления:', item.id, item.title);
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="image-placeholder">
                                <span class="placeholder-icon">🛠️</span>
                                <span class="placeholder-text">Фото не загрузилось</span>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => {
                          console.log('✅ Фото загружено для объявления:', item.id, item.title);
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span className="placeholder-icon">🛠️</span>
                        <span className="placeholder-text">Нет фотографии</span>
                      </div>
                    )}
                  </div>
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
                      <div>
                        <span className="author-name">{item.author}</span>
                        <span className="author-rating">★ {item.rating?.toFixed(1) || "4.5"}</span>
                      </div>
                      {item.createdAt && (
                        <div className="item-date">
                          {formatDate(item.createdAt)}
                        </div>
                      )}
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