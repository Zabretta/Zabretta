"use client"

import { useState, useMemo, ChangeEvent, useEffect } from "react";
import { marketApi } from "@/lib/api/market";
import { containsProfanity } from "@/utils/profanity-list";
import "./Marketplace.css";

interface MarketplaceProps {
  onClose: () => void;
  currentUser?: {
    id: string;
    login: string;
    email: string;
    role?: string;
  } | null;
}

type ItemType = "sell" | "buy" | "free" | "exchange" | "auction";
type DurationType = "2weeks" | "1month" | "2months";
type ItemCategory = "tools" | "materials" | "furniture" | "electronics" | "cooking" | 
                   "auto" | "sport" | "robot" | "handmade" | "stolar" | "hammer" | "other";

// Временные типы для модерации (позже будут вынесены в общие типы)
type ModerationFlag = "BAD_WORDS" | "SPAM_LINKS" | "ALL_CAPS" | "REPETITIVE_CHARS";
type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

interface MarketItem {
  id: string;
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
  category?: ItemCategory;
  // Новые поля для модерации (опционально, т.к. старые объявления их могут не иметь)
  moderationStatus?: ModerationStatus;
  moderationFlags?: ModerationFlag[];
}

export default function Marketplace({ onClose, currentUser }: MarketplaceProps) {
  const [activeFilter, setActiveFilter] = useState<ItemType | "all">("all");
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<DurationType>("1month");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
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

  /**
   * Проверяет текст на наличие признаков для модерации
   * @returns массив флагов (пустой если всё чисто)
   */
  const checkModerationFlags = (text: string): ModerationFlag[] => {
    const flags: ModerationFlag[] = [];
    const lowerText = text.toLowerCase();
    
    // 1. BAD_WORDS - нецензурная лексика (мат)
    const hasBadWords = containsProfanity(text);
    if (hasBadWords) {
      flags.push("BAD_WORDS");
    }
    
    // 2. SPAM_LINKS - наличие ссылок (URL)
    // Проверяем наличие http://, https://, www. или доменных зон в составе текста
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(ru|com|org|net|рф|su|xyz|top|info|site)[^\s]*)/i;
    const hasLinks = urlRegex.test(text);
    if (hasLinks) {
      flags.push("SPAM_LINKS");
    }
    
    // 3. ALL_CAPS - слишком много заглавных букв (>50%)
    // Игнорируем цифры и пробелы при подсчете
    const lettersOnly = text.replace(/[^a-zA-Zа-яА-Я]/g, '');
    if (lettersOnly.length > 0) {
      const uppercaseLetters = text.replace(/[^A-ZА-Я]/g, '').length;
      const uppercaseRatio = uppercaseLetters / lettersOnly.length;
      if (uppercaseRatio > 0.5) {
        flags.push("ALL_CAPS");
      }
    }
    
    // 4. REPETITIVE_CHARS - повторяющиеся символы (например, "ааааа", "!!!!!!")
    // Ищем любые символы, повторяющиеся 4 и более раз подряд
    const repetitiveRegex = /(.)\1{3,}/;
    const hasRepetitive = repetitiveRegex.test(text);
    if (hasRepetitive) {
      flags.push("REPETITIVE_CHARS");
    }
    
    return flags;
  };

  /**
   * Сжимает изображение перед загрузкой
   */
  const compressImage = (file: File, maxSizeMB: number = 10): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Если файл и так меньше лимита, не сжимаем
      if (file.size <= maxSizeMB * 1024 * 1024) {
        console.log(`📦 Файл ${(file.size / 1024 / 1024).toFixed(2)}MB - не требуется сжатие`);
        resolve(file);
        return;
      }

      console.log(`🔄 Сжатие файла ${(file.size / 1024 / 1024).toFixed(2)}MB...`);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Создаем canvas для сжатия
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Уменьшаем размер, если изображение слишком большое
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
            console.log(`📐 Изменение размера: ${img.width}x${img.height} → ${width}x${height}`);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Конвертируем обратно в файл с качеством 0.8
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                console.log(`✅ Сжатие завершено: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedFile);
              } else {
                reject(new Error('Не удалось сжать изображение'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        
        img.onerror = () => {
          reject(new Error('Ошибка загрузки изображения'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('📸 Выбран файл:', file.name, (file.size / 1024 / 1024).toFixed(2) + 'MB');
        
        // 🔥 УВЕЛИЧЕННЫЙ ЛИМИТ: проверяем размер до сжатия (макс 20MB чтобы не убить браузер)
        if (file.size > 20 * 1024 * 1024) {
          alert(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(2)}MB). Максимальный размер: 20MB.`);
          e.target.value = '';
          return;
        }
        
        // Проверяем тип файла
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert("Неподдерживаемый формат файла! Разрешены: JPG, PNG, WebP, GIF.");
          e.target.value = '';
          return;
        }
        
        // Сжимаем изображение если нужно (цель - не больше 10MB для сервера)
        const processedFile = await compressImage(file, 10);
        setImageFile(processedFile);
        
        // Создаем превью
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setSelectedImage(dataUrl);
          setImageUrl(dataUrl);
        };
        reader.onerror = () => {
          alert("Ошибка при загрузке изображения");
          e.target.value = '';
          setImageFile(null);
          setSelectedImage(null);
          setImageUrl(undefined);
        };
        reader.readAsDataURL(processedFile);
        
      } catch (error) {
        console.error('❌ Ошибка обработки изображения:', error);
        alert('Ошибка при обработке изображения');
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setImageUrl(undefined);
    const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // ✅ ИСПРАВЛЕННАЯ ЗАГРУЗКА ОБЪЯВЛЕНИЙ
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        const filters: { type?: ItemType } = {};
        if (activeFilter !== "all") {
          filters.type = activeFilter;
        }
        
        console.log('📡 Загрузка объявлений с фильтрами:', filters);
        const response = await marketApi.loadItems(filters) as any;
        
        // ✅ API возвращает объект с полем items
        const itemsArray = response.items || [];
        
        console.log(`✅ Загружено ${itemsArray.length} объявлений`);
        setItems(itemsArray);
        
        const itemsWithPhotos = itemsArray.filter((item: MarketItem) => item.imageUrl);
        console.log(`📸 Объявлений с фото: ${itemsWithPhotos.length}/${itemsArray.length}`);
        
      } catch (error) {
        console.error("❌ Ошибка загрузки объявлений:", error);
        setApiError("Ошибка соединения с сервером");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadItems();
  }, [activeFilter]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
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
  }, [items, searchQuery, selectedCategory]);

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
    if (!currentUser) {
      alert("Для создания объявления необходимо войти в систему");
      return;
    }
    setIsCreatingAd(true);
  };

  const handleCancelCreateAd = () => {
    setIsCreatingAd(false);
    setSelectedDuration("1month");
    handleRemoveImage();
  };

  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Для создания объявления необходимо войти в систему");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const location = formData.get("location") as string;
      const priceValue = formData.get("price") as string;
      const type = (formData.get("type") as ItemType) || "sell";
      const category = formData.get("category") as ItemCategory;
      
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
      
      const negotiable = formData.get("negotiable") === "on";
      
      let price: number | "free" = "free";
      
      if (priceValue && priceValue.trim() !== "") {
        const parsedPrice = parseInt(priceValue);
        if (!isNaN(parsedPrice)) {
          if (parsedPrice > 0) {
            price = parsedPrice;
          } else if (parsedPrice === 0 && negotiable) {
            price = 0;
          } else if (parsedPrice === 0) {
            price = "free";
          }
        }
      }
      
      if (negotiable && price === "free") {
        price = 0;
      }
      
      // 🔥 НОВОЕ: Проверяем текст на наличие флагов модерации
      // Объединяем заголовок и описание для полной проверки
      const fullText = `${title} ${description}`;
      const moderationFlags = checkModerationFlags(fullText);
      
      // Определяем статус модерации:
      // - FLAGGED если есть нарушения
      // - APPROVED если всё чисто
      const moderationStatus: ModerationStatus = moderationFlags.length > 0 ? "FLAGGED" : "APPROVED";
      
      // Логируем результат проверки для отладки
      if (moderationFlags.length > 0) {
        console.log('🚩 Объявление содержит флаги модерации:', moderationFlags);
        console.log('📊 Статус модерации:', moderationStatus);
      } else {
        console.log('✅ Объявление чистое, флагов нет');
      }
      
      // 🔥 ИСПРАВЛЕНО: category передаётся как null, если не выбрана
      const newItemData = {
        title: title.trim(),
        description: description.trim(),
        price: price,
        location: location.trim(),
        type: type,
        author: currentUser.login,
        category: category || null,
        imageUrl: imageUrl,
        negotiable: negotiable,
        duration: selectedDuration,
        // НОВЫЕ ПОЛЯ ДЛЯ МОДЕРАЦИИ
        moderationStatus: moderationStatus,
        moderationFlags: moderationFlags,
      };
      
      console.log('📝 Отправка данных для создания объявления:', {
        ...newItemData,
        imageUrl: imageUrl ? `Data URL (${Math.round(imageUrl.length / 1024)}KB)` : 'нет фото',
        price: price === "free" ? "бесплатно" : `${price} ₽`,
        negotiable: negotiable,
        category: category || 'не выбрана (null)',
        moderationStatus: moderationStatus,
        moderationFlags: moderationFlags.length > 0 ? moderationFlags : 'нет'
      });
      
      const result = await marketApi.createItem(newItemData);
      
      setSelectedImage(null);
      setImageFile(null);
      setImageUrl(undefined);
      
      const newItemWithAuthor: MarketItem = {
        ...result,
        author: currentUser.login,
        rating: 4.5
      };
      
      setItems(prev => [newItemWithAuthor, ...prev]);
      
      const expirationDate = result.expirationDate ? 
        new Date(result.expirationDate).toLocaleDateString('ru-RU') : 
        'не указана';
      
      let priceMessage = "";
      if (price === "free") {
        priceMessage = "Цена: Бесплатно";
      } else if (price === 0 && negotiable) {
        priceMessage = "Цена: Договорная";
      } else {
        priceMessage = `Цена: ${price} ₽${negotiable ? " (договорная)" : ""}`;
      }
      
      // Добавляем информацию о статусе модерации в сообщение пользователю
      let moderationMessage = "";
      if (moderationFlags.length > 0) {
        moderationMessage = `\n\n⚠️ Объявление помечено на модерацию (флаги: ${moderationFlags.join(', ')}). Оно появится в ленте, но может быть проверено модератором.`;
      }
      
      alert(`✅ Объявление "${result.title}" успешно создано!\nАвтор: ${currentUser.login}\n${priceMessage}\nБудет активно до: ${expirationDate}${moderationMessage}`);
      setIsCreatingAd(false);
      setSelectedDuration("1month");
      
    } catch (error) {
      console.error("❌ Ошибка при создании объявления:", error);
      
      // Специальная обработка ошибки 413
      if (error instanceof Error && error.message.includes('413')) {
        alert('Файл слишком большой. Максимальный размер: 10MB. Попробуйте выбрать фото меньше или сжать его.');
      } else {
        alert("Не удалось создать объявление. Попробуйте ещё раз.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ handleContact
  const handleContact = async (itemId: string) => {
    setIsLoading(true);
    
    try {
      // Находим объявление, чтобы получить его название
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error('Объявление не найдено');
      }
      
      const result = await marketApi.contactAuthor({
        itemId: itemId,
        message: `Здравствуйте! Я заинтересован в вашем объявлении "${item.title}"`,
        contactMethod: "message"
      });
      
      if (result.success) {
        alert(`✅ Сообщение автору "${item.author}" отправлено!\n\nТекст сообщения:\nЗдравствуйте! Я заинтересован в вашем объявлении "${item.title}"`);
      }
      
    } catch (error) {
      console.error("❌ Ошибка при отправке сообщения:", error);
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
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                <option value="">Все категории</option>
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
          <p className="auth-notice">
            {currentUser 
              ? `Вы вошли как: ${currentUser.login}` 
              : "Для создания объявления необходимо войти в систему"}
          </p>
        </div>

        {isCreatingAd && (
          <div className="create-ad-form-container">
            <form className="create-ad-form" onSubmit={handleSubmitAd}>
              <h3>Создание нового объявления</h3>
              <div className="form-author-info">
                <span className="author-label">Автор:</span>
                <span className="author-name">{currentUser?.login || "Неизвестный"}</span>
              </div>
              
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
                  <p className="price-hint">
                    ⓘ Оставьте поле пустым или укажите 0 для "Бесплатно". 
                    Если хотите указать "Договорная" - поставьте галочку ниже.
                  </p>
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
                  📸 Максимальный размер: <strong>10MB</strong> (после сжатия). Разрешены: JPG, PNG, WebP, GIF.
                  {imageFile && (
                    <span className="file-size-info">
                      {" "}
                      Выбран файл: {(imageFile.size / 1024 / 1024).toFixed(2)}MB
                    </span>
                  )}
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
                      ) : item.price === 0 && item.negotiable ? (
                        <span className="negotiable-price">Договорная</span>
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