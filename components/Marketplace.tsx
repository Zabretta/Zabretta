// components/Marketplace.tsx
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

type ModerationFlag = "BAD_WORDS" | "SPAM_LINKS" | "ALL_CAPS" | "REPETITIVE_CHARS";
type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number | "free";
  location: string;
  author: string;
  authorId?: string;
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
  moderationStatus?: ModerationStatus;
  moderationFlags?: ModerationFlag[];
}

export default function Marketplace({ onClose, currentUser }: MarketplaceProps) {
  // ===== ОТЛАДКА =====
  console.log('🔥🔥🔥 Marketplace ЗАГРУЖЕН 🔥🔥🔥');
  console.log('🔥 currentUser:', currentUser);
  console.log('🔥 Роль пользователя:', currentUser?.role);
  console.log('🔥 ID пользователя:', currentUser?.id);
  console.log('🔥 Логин пользователя:', currentUser?.login);
  // ===================

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

  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  const checkModerationFlags = (text: string): ModerationFlag[] => {
    const flags: ModerationFlag[] = [];
    const lowerText = text.toLowerCase();
    
    const hasBadWords = containsProfanity(text);
    if (hasBadWords) {
      flags.push("BAD_WORDS");
    }
    
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(ru|com|org|net|рф|su|xyz|top|info|site)[^\s]*)/i;
    const hasLinks = urlRegex.test(text);
    if (hasLinks) {
      flags.push("SPAM_LINKS");
    }
    
    const lettersOnly = text.replace(/[^a-zA-Zа-яА-Я]/g, '');
    if (lettersOnly.length > 0) {
      const uppercaseLetters = text.replace(/[^A-ZА-Я]/g, '').length;
      const uppercaseRatio = uppercaseLetters / lettersOnly.length;
      if (uppercaseRatio > 0.5) {
        flags.push("ALL_CAPS");
      }
    }
    
    const repetitiveRegex = /(.)\1{3,}/;
    const hasRepetitive = repetitiveRegex.test(text);
    if (hasRepetitive) {
      flags.push("REPETITIVE_CHARS");
    }
    
    return flags;
  };

  const compressImage = (file: File, maxSizeMB: number = 10): Promise<File> => {
    return new Promise((resolve, reject) => {
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
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
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
        
        if (file.size > 20 * 1024 * 1024) {
          alert(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(2)}MB). Максимальный размер: 20MB.`);
          e.target.value = '';
          return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert("Неподдерживаемый формат файла! Разрешены: JPG, PNG, WebP, GIF.");
          e.target.value = '';
          return;
        }
        
        const processedFile = await compressImage(file, 10);
        setImageFile(processedFile);
        
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
        
        const itemsArray = response.items || [];
        
        console.log(`✅ Загружено ${itemsArray.length} объявлений`);
        
        // ОТЛАДКА: выводим каждое объявление
        itemsArray.forEach((item: MarketItem, index: number) => {
          console.log(`📦 Товар #${index + 1}:`, {
            id: item.id,
            title: item.title,
            author: item.author,
            authorId: item.authorId,
            views: item.views
          });
        });
        
        setItems(itemsArray);
        
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

  const handleEditStart = (item: MarketItem) => {
    console.log('✏️ Попытка редактирования:', item.title);
    console.log('👤 Текущий пользователь:', currentUser);
    console.log('📦 Автор объявления ID:', item.authorId);
    
    // Админ или модератор могут редактировать любые объявления
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR') {
      console.log('✅ Админ/модератор - разрешаем редактирование');
    } else if (!currentUser || currentUser.id !== item.authorId) {
      console.log('❌ Обычный пользователь - нет прав');
      alert("Вы можете редактировать только свои объявления");
      return;
    }
    
    setEditingItem(item);
    setIsEditMode(true);
    setIsCreatingAd(false);
    
    setSelectedDuration(item.duration || "1month");
    setSelectedCategory(item.category || "");
    setImageUrl(item.imageUrl);
    setSelectedImage(item.imageUrl || null);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setIsEditMode(false);
    handleRemoveImage();
    setSelectedDuration("1month");
    setSelectedCategory("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !editingItem) return;
    
    setIsLoading(true);
    
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const location = formData.get("location") as string;
      const priceValue = formData.get("price") as string;
      const type = (formData.get("type") as ItemType) || editingItem.type;
      const category = formData.get("category") as ItemCategory;
      const negotiable = formData.get("negotiable") === "on";
      
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
      
      const fullText = `${title} ${description}`;
      const moderationFlags = checkModerationFlags(fullText);
      const moderationStatus: ModerationStatus = moderationFlags.length > 0 ? "FLAGGED" : "APPROVED";
      
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        price: price,
        location: location.trim(),
        type: type,
        category: category || null,
        imageUrl: imageUrl,
        negotiable: negotiable,
        duration: selectedDuration,
        moderationStatus: moderationStatus,
        moderationFlags: moderationFlags,
      };
      
      console.log('📝 Обновление объявления:', editingItem.id, updateData);
      
      const result = await marketApi.updateItem(editingItem.id, updateData);
      
      setItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...result, author: currentUser.login }
          : item
      ));
      
      alert('✅ Объявление успешно обновлено!');
      handleEditCancel();
      
    } catch (error) {
      console.error("❌ Ошибка при обновлении объявления:", error);
      alert("Не удалось обновить объявление. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = (itemId: string) => {
    if (!currentUser) return;
    setItemToDelete(itemId);
  };

  const handleDeleteCancel = () => {
    setItemToDelete(null);
  };

  const handleDelete = async () => {
    if (!currentUser || !itemToDelete) return;
    
    setIsLoading(true);
    
    try {
      await marketApi.deleteItem(itemToDelete);
      
      setItems(prev => prev.filter(item => item.id !== itemToDelete));
      
      alert('✅ Объявление успешно удалено');
      setItemToDelete(null);
      
    } catch (error) {
      console.error("❌ Ошибка при удалении объявления:", error);
      alert("Не удалось удалить объявление. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAd = () => {
    if (!currentUser) {
      alert("Для создания объявления необходимо войти в систему");
      return;
    }
    setIsCreatingAd(true);
    setIsEditMode(false);
    setEditingItem(null);
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
      
      const fullText = `${title} ${description}`;
      const moderationFlags = checkModerationFlags(fullText);
      const moderationStatus: ModerationStatus = moderationFlags.length > 0 ? "FLAGGED" : "APPROVED";
      
      const newItemData = {
        title: title.trim(),
        description: description.trim(),
        price: price,
        location: location.trim(),
        type: type,
        author: currentUser.login,
        authorId: currentUser.id,
        category: category || null,
        imageUrl: imageUrl,
        negotiable: negotiable,
        duration: selectedDuration,
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
        authorId: currentUser.id,
        rating: 4.5
      };
      
      setItems(prev => [newItemWithAuthor, ...prev]);
      
      let priceMessage = "";
      if (price === "free") {
        priceMessage = "Цена: Бесплатно";
      } else if (price === 0 && negotiable) {
        priceMessage = "Цена: Договорная";
      } else {
        priceMessage = `Цена: ${price} ₽${negotiable ? " (договорная)" : ""}`;
      }
      
      let moderationMessage = "";
      if (moderationFlags.length > 0) {
        moderationMessage = `\n\n⚠️ Объявление помечено на модерацию (флаги: ${moderationFlags.join(', ')}).`;
      }
      
      alert(`✅ Объявление "${result.title}" успешно создано!\nАвтор: ${currentUser.login}\n${priceMessage}${moderationMessage}`);
      setIsCreatingAd(false);
      setSelectedDuration("1month");
      
    } catch (error) {
      console.error("❌ Ошибка при создании объявления:", error);
      
      if (error instanceof Error && error.message.includes('413')) {
        alert('Файл слишком большой. Максимальный размер: 10MB.');
      } else {
        alert("Не удалось создать объявление. Попробуйте ещё раз.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = async (itemId: string) => {
    setIsLoading(true);
    
    try {
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
        alert(`✅ Сообщение автору "${item.author}" отправлено!`);
      }
      
    } catch (error) {
      console.error("❌ Ошибка при отправке сообщения:", error);
      alert("Не удалось отправить сообщение. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 ИСПРАВЛЕНО: С ПОДРОБНЫМИ ЛОГАМИ
  const handleItemClick = async (item: MarketItem) => {
    console.log('🖱️ ===== КЛИК ПО ТОВАРУ =====');
    console.log('🆔 ID товара:', item.id);
    console.log('📌 Название:', item.title);
    console.log('👤 Текущий пользователь:', currentUser);
    console.log('✍️ Автор объявления ID:', item.authorId);
    console.log('📊 Текущие просмотры до клика:', item.views);
    console.log('🔍 Является ли пользователь автором:', currentUser?.id === item.authorId);
    
    if ((window.event as any)?.target?.closest('.edit-btn, .delete-btn, .contact-btn')) {
      console.log('🚫 Клик по кнопке, игнорируем');
      return;
    }
    
    setSelectedItem(item);
    setIsDetailModalOpen(true);
    
    try {
      console.log('📤 Отправка запроса на увеличение просмотров...');
      console.log('📤 URL:', `/api/market/items/${item.id}/views`);
      console.log('📤 Токен:', localStorage.getItem('samodelkin_auth_token')?.substring(0, 20) + '...');
      
      const result = await marketApi.incrementViews(item.id);
      
      console.log('📥 Ответ от сервера (полный):', result);
      console.log('📥 success:', result.success);
      console.log('📥 incremented:', result.incremented);
      console.log('📥 views:', result.views);
      
      if (result.incremented && result.views !== undefined) {
        console.log(`✅ ПРОСМОТР ЗАСЧИТАН! Было: ${item.views}, Стало: ${result.views}`);
        
        // Обновляем в списке
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { ...i, views: result.views }
            : i
        ));
        
        // Обновляем в открытом модальном окне
        setSelectedItem(prev => prev ? { ...prev, views: result.views } : null);
      } else {
        console.log(`ℹ️ Просмотр НЕ засчитан. Причина: ${!currentUser ? 'не авторизован' : 'автор или уже смотрел'}`);
        console.log(`📊 Текущее значение просмотров: ${result.views}`);
      }
    } catch (error) {
      console.error('❌ ОШИБКА при увеличении счетчика просмотров:', error);
      if (error instanceof Error) {
        console.error('❌ Сообщение ошибки:', error.message);
        console.error('❌ Stack:', error.stack);
      }
    }
    
    console.log('🖱️ ===== КОНЕЦ ОБРАБОТКИ КЛИКА =====\n');
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
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

  const renderDeleteConfirmModal = () => {
    if (!itemToDelete) return null;
    
    const item = items.find(i => i.id === itemToDelete);
    
    return (
      <div className="delete-confirm-modal">
        <div className="delete-confirm-content">
          <h3>Подтверждение удаления</h3>
          <p>Вы уверены, что хотите удалить объявление "{item?.title}"?</p>
          <p className="delete-warning">Это действие нельзя отменить!</p>
          <div className="delete-confirm-actions">
            <button 
              className="confirm-delete-btn"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Удаление..." : "Да, удалить"}
            </button>
            <button 
              className="cancel-delete-btn"
              onClick={handleDeleteCancel}
              disabled={isLoading}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditForm = () => {
    if (!isEditMode || !editingItem) return null;
    
    return (
      <div className="edit-form-container">
        <form className="edit-form" onSubmit={handleEditSubmit}>
          <h3>Редактирование объявления</h3>
          <div className="form-author-info">
            <span className="author-label">Автор:</span>
            <span className="author-name">{currentUser?.login}</span>
          </div>
          
          <div className="type-selector">
            <label className="type-option">
              <input type="radio" name="type" value="sell" defaultChecked={editingItem.type === "sell"} />
              <span>Продажа</span>
            </label>
            <label className="type-option">
              <input type="radio" name="type" value="buy" defaultChecked={editingItem.type === "buy"} />
              <span>Покупка</span>
            </label>
            <label className="type-option">
              <input type="radio" name="type" value="free" defaultChecked={editingItem.type === "free"} />
              <span>Бесплатно</span>
            </label>
            <label className="type-option">
              <input type="radio" name="type" value="exchange" defaultChecked={editingItem.type === "exchange"} />
              <span>Обмен</span>
            </label>
            <label className="type-option">
              <input type="radio" name="type" value="auction" defaultChecked={editingItem.type === "auction"} />
              <span>Аукцион</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Название объявления *</label>
              <input 
                type="text" 
                name="title"
                required 
                minLength={5}
                defaultValue={editingItem.title}
                placeholder="Название товара или услуги" 
              />
            </div>
            <div className="form-group">
              <label>Цена (₽)</label>
              <input 
                type="number" 
                name="price"
                defaultValue={editingItem.price === "free" ? "" : editingItem.price}
                placeholder="Укажите цену" 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Категория</label>
              <select name="category" defaultValue={editingItem.category || ""}>
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
                defaultValue={editingItem.location}
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
              minLength={20}
              defaultValue={editingItem.description}
              placeholder="Опишите товар/услугу подробно..."
            />
          </div>

          <div className="duration-section">
            <div className="duration-header">
              <h4>Срок публикации объявления</h4>
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
                        id={`edit-duration-${option.id}`}
                        name="duration"
                        value={option.id}
                        checked={selectedDuration === option.id}
                        onChange={() => setSelectedDuration(option.id)}
                      />
                      <span className="radio-custom"></span>
                    </div>
                    <label 
                      htmlFor={`edit-duration-${option.id}`}
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
            <label>Фотография товара</label>
            <input 
              type="file" 
              name="image"
              accept="image/*"
              className="file-input"
              onChange={handleImageSelect}
            />
            
            {selectedImage && (
              <div className="image-preview">
                <img 
                  src={selectedImage} 
                  alt="Превью" 
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
            <input 
              type="checkbox" 
              name="negotiable" 
              defaultChecked={editingItem.negotiable}
            />
            <span>Цена договорная</span>
          </label>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleEditCancel}
              disabled={isLoading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!isDetailModalOpen || !selectedItem) return null;
    
    return (
      <div className="detail-modal" onClick={handleCloseDetailModal}>
        <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="detail-modal-close" onClick={handleCloseDetailModal}>✕</button>
          
          <div className="detail-modal-header">
            <h2>{selectedItem.title}</h2>
            <div className="detail-modal-type">
              <span className="badge-icon">{getTypeIcon(selectedItem.type)}</span>
              <span className="badge-text">{getTypeLabel(selectedItem.type)}</span>
            </div>
          </div>
          
          <div className="detail-modal-image">
            {selectedItem.imageUrl ? (
              <img src={selectedItem.imageUrl} alt={selectedItem.title} />
            ) : (
              <div className="image-placeholder">
                <span className="placeholder-icon">🛠️</span>
                <span className="placeholder-text">Нет фотографии</span>
              </div>
            )}
          </div>
          
          <div className="detail-modal-info">
            <div className="detail-modal-price">
              {selectedItem.price === "free" ? (
                <span className="free-price">Бесплатно</span>
              ) : selectedItem.price === 0 && selectedItem.negotiable ? (
                <span className="negotiable-price">Договорная</span>
              ) : (
                <>
                  <span className="price-amount">{typeof selectedItem.price === 'number' ? selectedItem.price.toLocaleString() : selectedItem.price} ₽</span>
                  {selectedItem.negotiable && <span className="negotiable-badge">Договорная</span>}
                </>
              )}
            </div>
            
            <div className="detail-modal-location">
              <span>📍 {selectedItem.location}</span>
            </div>
            
            {selectedItem.expirationDate && (
              <div className="detail-modal-expiration">
                <span>⏰ Активно до: {formatExpirationDate(selectedItem.expirationDate)}</span>
              </div>
            )}
          </div>
          
          <div className="detail-modal-description">
            <h3>Описание</h3>
            <p>{selectedItem.description}</p>
          </div>
          
          <div className="detail-modal-author">
            <div className="author-info">
              <span className="author-name">{selectedItem.author}</span>
              <span className="author-rating">★ {selectedItem.rating?.toFixed(1) || "4.5"}</span>
              {currentUser && currentUser.id === selectedItem.authorId && selectedItem.views !== undefined && (
                <span className="item-views-badge" style={{marginLeft: '10px'}}>
                  👁️ {selectedItem.views}
                </span>
              )}
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              {currentUser && (
                (currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR' || currentUser.id === selectedItem.authorId) ? (
                  <>
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseDetailModal();
                        handleEditStart(selectedItem);
                      }}
                      style={{width: '40px', height: '40px'}}
                      aria-label="Редактировать объявление"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseDetailModal();
                        handleDeleteConfirm(selectedItem.id);
                      }}
                      style={{width: '40px', height: '40px'}}
                      aria-label="Удалить объявление"
                    >
                      🗑️
                    </button>
                  </>
                ) : null
              )}
              <button 
                className="contact-btn"
                onClick={() => {
                  handleCloseDetailModal();
                  handleContact(selectedItem.id);
                }}
              >
                Связаться с автором
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            disabled={isCreatingAd || isLoading || isEditMode}
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

        {renderEditForm()}
        {renderDeleteConfirmModal()}
        {renderDetailModal()}

        {isLoading && !isCreatingAd && !isEditMode ? (
          <div className="loading-items">
            <div className="loading-spinner">🛠️</div>
            <p>Загрузка объявлений...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="items-grid">
            {filteredItems.map(item => {
              // ОТЛАДКА для каждой карточки
              console.log('📦 Рендер карточки:', item.title);
              console.log('   authorId:', item.authorId);
              console.log('   currentUser?.id:', currentUser?.id);
              console.log('   currentUser?.role:', currentUser?.role);
              console.log('   isAuthor:', currentUser?.id === item.authorId);
              console.log('   isAdmin:', currentUser?.role === 'ADMIN');
              console.log('   isModerator:', currentUser?.role === 'MODERATOR');
              
              return (
                <div 
                  key={item.id} 
                  className="market-item"
                  onClick={() => handleItemClick(item)}
                >
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
                    <div className="item-title-row">
                      <h3 className="item-title">{item.title}</h3>
                      {/* Счетчик просмотров для автора */}
                      {currentUser && currentUser.id === item.authorId && item.views !== undefined && (
                        <div className="item-views-badge" title="Просмотры">
                          <span className="views-icon">👁️</span>
                          <span className="views-count">{item.views}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="item-description">{item.description}</p>
                    
                    <div className="item-meta">
                      <div className="item-price">
                        {item.price === "free" ? (
                          <span className="free-price">Бесплатно</span>
                        ) : item.price === 0 && item.negotiable ? (
                          <span className="negotiable-price">Договорная</span>
                        ) : (
                          <>
                            <span className="price-amount">{typeof item.price === 'number' ? item.price.toLocaleString() : item.price} ₽</span>
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
                      </div>
                      
                      <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        {/* Кнопки редактирования/удаления для админа/модератора/автора */}
                        {currentUser && (
                          (currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR' || currentUser.id === item.authorId) ? (
                            <>
                              <button 
                                className="edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStart(item);
                                }}
                                disabled={isLoading}
                                aria-label="Редактировать объявление"
                              >
                                ✏️
                              </button>
                              <button 
                                className="delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfirm(item.id);
                                }}
                                disabled={isLoading}
                                aria-label="Удалить объявление"
                              >
                                🗑️
                              </button>
                            </>
                          ) : null
                        )}
                        
                        {/* Кнопка "Связаться" для ВСЕХ всегда */}
                        <button 
                          className="contact-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContact(item.id);
                          }}
                          disabled={isLoading}
                        >
                          Связаться
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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