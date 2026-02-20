// components/ProfileModal.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRating } from './RatingContext';
import { useAuth } from './useAuth';
import RatingBadge from './RatingBadge';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'stats' | 'notifications' | 'messages' | 'settings';

// Расширяем тип User
interface ExtendedUser {
  id: string;
  login: string;
  email: string;
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role?: string;
  createdAt?: string;
  lastLogin?: string;
}

// Тип для уведомления
interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'MESSAGE' | 'SYSTEM' | 'ACHIEVEMENT';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  
  // Состояния для аватара
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Состояния для настроек
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showCity, setShowCity] = useState(false);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  
  // Состояния для уведомлений
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  
  const { user } = useAuth();
  const { userRating } = useRating();

  // Приводим user к расширенному типу
  const extendedUser = user as ExtendedUser | null;

  // Загружаем данные при открытии
  useEffect(() => {
    if (extendedUser) {
      setEditedName(extendedUser.name || extendedUser.login || '');
      setEditedBio(extendedUser.bio || '');
      setEditedLocation(extendedUser.location || '');
      setEditedPhone(extendedUser.phone || '');
      
      // Загружаем настройки из localStorage (временное решение)
      const savedShowPhone = localStorage.getItem(`setting_showPhone_${extendedUser.id}`);
      const savedShowEmail = localStorage.getItem(`setting_showEmail_${extendedUser.id}`);
      const savedShowCity = localStorage.getItem(`setting_showCity_${extendedUser.id}`);
      
      setShowPhone(savedShowPhone ? JSON.parse(savedShowPhone) : false);
      setShowEmail(savedShowEmail ? JSON.parse(savedShowEmail) : false);
      setShowCity(savedShowCity ? JSON.parse(savedShowCity) : false);
      
      // Загружаем аватар
      const savedAvatar = localStorage.getItem(`avatar_${extendedUser.id}`);
      setAvatarPreview(savedAvatar || extendedUser.avatar || null);
    }
  }, [extendedUser, isOpen]);

  // Загружаем уведомления при открытии вкладки
  useEffect(() => {
    if (activeTab === 'notifications' && user) {
      loadNotifications(1);
    }
  }, [activeTab, notificationsFilter, user]);

  // Сброс состояния при выходе из режима редактирования
  useEffect(() => {
    if (!isEditing) {
      setAvatarFile(null);
      setAvatarPreview(extendedUser?.avatar || null);
    }
  }, [isEditing, extendedUser]);

  if (!isOpen || !extendedUser) return null;

  // Функция сжатия изображения
  const compressImage = (file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
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
                resolve(compressedFile);
              } else {
                reject(new Error('Не удалось сжать изображение'));
              }
            },
            'image/jpeg',
            0.85
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

  // Обработчик клика по кнопке загрузки фото
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Обработчик выбора файла
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (file.size > 10 * 1024 * 1024) {
          alert('Файл слишком большой. Максимальный размер: 10MB');
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          alert('Можно загружать только изображения');
          return;
        }
        
        const compressedFile = await compressImage(file, 400, 400);
        setAvatarFile(compressedFile);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarPreview(event.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
        
        console.log(`✅ Изображение сжато: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
      } catch (error) {
        console.error('Ошибка при обработке изображения:', error);
        alert('Не удалось обработать изображение');
      }
    }
  };

  const handleSaveProfile = () => {
    // Сохраняем аватар в localStorage (временное решение)
    if (avatarPreview) {
      localStorage.setItem(`avatar_${extendedUser.id}`, avatarPreview);
    }
    
    // Сохраняем настройки
    localStorage.setItem(`setting_showPhone_${extendedUser.id}`, JSON.stringify(showPhone));
    localStorage.setItem(`setting_showEmail_${extendedUser.id}`, JSON.stringify(showEmail));
    localStorage.setItem(`setting_showCity_${extendedUser.id}`, JSON.stringify(showCity));
    
    console.log('Сохраняем профиль:', { 
      editedName, 
      editedBio, 
      editedLocation,
      editedPhone,
      avatarFile: avatarFile?.name,
      settings: { showPhone, showEmail, showCity }
    });
    
    alert('Профиль сохранён!');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(extendedUser.name || extendedUser.login || '');
    setEditedBio(extendedUser.bio || '');
    setEditedLocation(extendedUser.location || '');
    setEditedPhone(extendedUser.phone || '');
    setAvatarFile(null);
    setAvatarPreview(extendedUser.avatar || null);
    setIsEditing(false);
  };

  // Загрузка уведомлений
  const loadNotifications = useCallback(async (page: number = 1) => {
    if (!user) return;
    
    setIsLoadingNotifications(true);
    try {
      // Здесь будет реальный запрос к API
      // const response = await fetch(`/api/notifications?userId=${user.id}&page=${page}&limit=20&filter=${notificationsFilter}`);
      // const data = await response.json();
      
      // Имитация загрузки
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Тестовые данные
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'LIKE',
          title: 'Новый лайк!',
          message: 'Иван оценил ваш проект "Скамейка из дерева"',
          link: '/projects/1',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: '2',
          type: 'COMMENT',
          title: 'Новый комментарий',
          message: 'Мария оставила комментарий к вашему проекту "Табурет в стиле лофт"',
          link: '/projects/2',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '3',
          type: 'MESSAGE',
          title: 'Запрос по объявлению',
          message: 'Пользователь хочет связаться по поводу "Дрель Makita"',
          link: '/market/messages/3',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '4',
          type: 'ACHIEVEMENT',
          title: 'Новый уровень!',
          message: 'Вы достигли уровня "Мастер"! Поздравляем!',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        },
        {
          id: '5',
          type: 'LIKE',
          title: 'Новый лайк!',
          message: 'Анна оценила ваш проект "Полка для инструментов"',
          link: '/projects/5',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '6',
          type: 'COMMENT',
          title: 'Новый комментарий',
          message: 'Дмитрий спрашивает: "А какие размеры?"',
          link: '/projects/2',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        },
      ];
      
      // Фильтрация
      let filtered = mockNotifications;
      if (notificationsFilter === 'unread') {
        filtered = mockNotifications.filter(n => !n.read);
      } else if (notificationsFilter === 'likes') {
        filtered = mockNotifications.filter(n => n.type === 'LIKE');
      } else if (notificationsFilter === 'comments') {
        filtered = mockNotifications.filter(n => n.type === 'COMMENT');
      } else if (notificationsFilter === 'messages') {
        filtered = mockNotifications.filter(n => n.type === 'MESSAGE');
      }
      
      setNotifications(filtered);
      setTotalPages(3);
      setTotalNotifications(25);
      setCurrentPage(page);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user, notificationsFilter]);

  // Отметить все как прочитанные
  const handleMarkAllNotificationsRead = async () => {
    try {
      // Здесь будет запрос к API
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
    }
  };

  // Клик по уведомлению
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  // Получить иконку для типа уведомления
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'LIKE': return '❤️';
      case 'COMMENT': return '💬';
      case 'MESSAGE': return '📦';
      case 'ACHIEVEMENT': return '🏆';
      case 'SYSTEM': return '⚙️';
      default: return '🔔';
    }
  };

  // Форматирование даты
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Профиль', icon: '👤' },
    { id: 'stats' as TabType, label: 'Статистика', icon: '📊' },
    { id: 'notifications' as TabType, label: 'Уведомления', icon: '🔔' },
    { id: 'messages' as TabType, label: 'Сообщения', icon: '✉️' },
    { id: 'settings' as TabType, label: 'Настройки', icon: '⚙️' }
  ];

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        {/* Шапка */}
        <div className="profile-modal-header">
          <h2>МОЙ ПРОФИЛЬ</h2>
          <button className="profile-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Верхняя панель с аватаром и основной информацией */}
        <div className="profile-header-panel">
          <div className="profile-avatar-container">
            {/* Скрытый input для загрузки файла */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            {/* Аватар */}
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt={extendedUser.login} />
              ) : (
                <span className="profile-avatar-initials">
                  {getInitials(extendedUser.name || extendedUser.login)}
                </span>
              )}
              
              {/* Кнопка загрузки фото (видна только в режиме редактирования) */}
              {isEditing && (
                <button 
                  className="avatar-upload-button"
                  onClick={handleUploadClick}
                  title="Загрузить фото"
                >
                  <span className="avatar-upload-icon">📷</span>
                </button>
              )}
            </div>
            
            {/* Подсказка под аватаром */}
            {isEditing && (
              <div className="avatar-hint">
                Нажмите на фото чтобы изменить
              </div>
            )}
          </div>

          <div className="profile-header-info">
            <h3 className="profile-user-name">{extendedUser.name || extendedUser.login}</h3>
            
            {userRating && (
              <div className="profile-rating-row">
                <RatingBadge
                  rating={userRating.totalRating}
                  activity={userRating.totalActivity}
                  level={userRating.ratingLevel}
                  icon={userRating.ratingIcon}
                  size="medium"
                  showOnlyIcon={false}
                />
              </div>
            )}
            
            <div className="profile-quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-icon">📁</span>
                <span className="quick-stat-value">{userRating?.stats.projectsCreated || 0}</span>
                <span className="quick-stat-label">проектов</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">⭐</span>
                <span className="quick-stat-value">{userRating?.stats.likesReceived || 0}</span>
                <span className="quick-stat-label">лайков</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">💬</span>
                <span className="quick-stat-value">{userRating?.stats.commentsMade || 0}</span>
                <span className="quick-stat-label">комментариев</span>
              </div>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Контент табов */}
        <div className="profile-tab-content">
          {/* Вкладка ПРОФИЛЬ */}
          {activeTab === 'profile' && (
            <div className="profile-info">
              {!isEditing ? (
                // Режим просмотра
                <>
                  <div className="profile-info-header">
                    <h3>Информация о мастере</h3>
                    <button 
                      className="profile-edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      ✏️ Редактировать
                    </button>
                  </div>
                  
                  <div className="profile-info-grid">
                    <div className="profile-info-row">
                      <span className="info-label">Имя:</span>
                      <span className="info-value">{extendedUser.name || 'Не указано'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Логин:</span>
                      <span className="info-value">{extendedUser.login}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">
                        {extendedUser.email}
                        {showEmail && <span className="info-badge">виден всем</span>}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Телефон:</span>
                      <span className="info-value">
                        {extendedUser.phone || 'Не указан'}
                        {showPhone && <span className="info-badge">виден всем</span>}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Город:</span>
                      <span className="info-value">
                        {extendedUser.location || 'Не указан'}
                        {showCity && <span className="info-badge">виден всем</span>}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">О себе:</span>
                      <span className="info-value bio-text">{extendedUser.bio || 'Пока ничего не рассказал(а)'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">На сайте с:</span>
                      <span className="info-value">{formatDate(extendedUser.createdAt)}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Последний визит:</span>
                      <span className="info-value">{formatDate(extendedUser.lastLogin)}</span>
                    </div>
                  </div>
                </>
              ) : (
                // Режим редактирования
                <>
                  <div className="profile-info-header">
                    <h3>Редактирование профиля</h3>
                  </div>
                  
                  <div className="profile-edit-form">
                    <div className="form-group">
                      <label>Имя</label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Ваше имя"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Телефон</label>
                      <input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="+7 (___) ___-__-__"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Город</label>
                      <input
                        type="text"
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        placeholder="Ваш город"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>О себе</label>
                      <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        placeholder="Расскажите о себе, своих увлечениях и проектах"
                        rows={4}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Фото профиля</label>
                      {avatarPreview ? (
                        <div className="current-avatar-preview">
                          <img src={avatarPreview} alt="Аватар" />
                          <button 
                            type="button"
                            className="remove-avatar-btn"
                            onClick={() => {
                              setAvatarFile(null);
                              setAvatarPreview(null);
                            }}
                          >
                            ✕ Удалить
                          </button>
                        </div>
                      ) : (
                        <div className="no-avatar-placeholder">
                          <p>Фото не загружено</p>
                          <button 
                            type="button"
                            className="upload-avatar-btn"
                            onClick={handleUploadClick}
                          >
                            📷 Загрузить фото
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveProfile}
                      >
                        Сохранить
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Вкладка СТАТИСТИКА */}
          {activeTab === 'stats' && userRating && (
            <div className="profile-stats">
              <h3>Статистика активности</h3>
              
              <div className="stats-overview">
                <div className="stat-card">
                  <div className="stat-card-icon">🏆</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{userRating.totalRating}</div>
                    <div className="stat-card-label">Общий рейтинг</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-card-icon">⚡</div>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{userRating.totalActivity}</div>
                    <div className="stat-card-label">Активность</div>
                  </div>
                </div>
              </div>

              <div className="stats-detailed">
                <h4>Детальная статистика</h4>
                
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-item-icon">📁</span>
                    <span className="stat-item-label">Создано проектов:</span>
                    <span className="stat-item-value">{userRating.stats.projectsCreated}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-item-icon">📦</span>
                    <span className="stat-item-label">Объявлений в маркете:</span>
                    <span className="stat-item-value">{userRating.stats.mastersAdsCreated}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-item-icon">❓</span>
                    <span className="stat-item-label">Запросов помощи:</span>
                    <span className="stat-item-value">{userRating.stats.helpRequestsCreated}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-item-icon">📚</span>
                    <span className="stat-item-label">Публикаций в библиотеке:</span>
                    <span className="stat-item-value">{userRating.stats.libraryPostsCreated}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-item-icon">❤️</span>
                    <span className="stat-item-label">Лайков дано:</span>
                    <span className="stat-item-value">{userRating.stats.likesGiven}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-item-icon">⭐</span>
                    <span className="stat-item-label">Лайков получено:</span>
                    <span className="stat-item-value">{userRating.stats.likesReceived}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-item-icon">💬</span>
                    <span className="stat-item-label">Комментариев:</span>
                    <span className="stat-item-value">{userRating.stats.commentsMade}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Вкладка УВЕДОМЛЕНИЯ */}
          {activeTab === 'notifications' && (
            <div className="profile-notifications">
              <div className="notifications-header">
                <h3>Все уведомления</h3>
                {notifications.some(n => !n.read) && (
                  <button 
                    className="mark-all-read-btn"
                    onClick={handleMarkAllNotificationsRead}
                  >
                    ✓ Прочитать все
                  </button>
                )}
              </div>
              
              {/* Фильтры уведомлений */}
              <div className="notifications-filters">
                <button 
                  className={`filter-btn ${notificationsFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setNotificationsFilter('all')}
                >
                  Все
                </button>
                <button 
                  className={`filter-btn ${notificationsFilter === 'unread' ? 'active' : ''}`}
                  onClick={() => setNotificationsFilter('unread')}
                >
                  Непрочитанные
                </button>
                <button 
                  className={`filter-btn ${notificationsFilter === 'likes' ? 'active' : ''}`}
                  onClick={() => setNotificationsFilter('likes')}
                >
                  ❤️ Лайки
                </button>
                <button 
                  className={`filter-btn ${notificationsFilter === 'comments' ? 'active' : ''}`}
                  onClick={() => setNotificationsFilter('comments')}
                >
                  💬 Комментарии
                </button>
                <button 
                  className={`filter-btn ${notificationsFilter === 'messages' ? 'active' : ''}`}
                  onClick={() => setNotificationsFilter('messages')}
                >
                  📦 Сообщения
                </button>
              </div>

              {/* Список уведомлений */}
              <div className="notifications-list">
                {isLoadingNotifications ? (
                  <div className="notifications-loading">
                    <div className="loading-spinner">🔔</div>
                    <p>Загрузка уведомлений...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notifications-empty">
                    <span className="empty-icon">🔔</span>
                    <p>Нет уведомлений</p>
                    <p className="empty-note">
                      {notificationsFilter === 'all' 
                        ? 'У вас пока нет уведомлений' 
                        : 'Нет непрочитанных уведомлений'}
                    </p>
                  </div>
                ) : (
                  <>
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-icon-wrapper">
                          <div className="notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          {!notification.read && (
                            <div className="notification-unread-dot"></div>
                          )}
                        </div>
                        
                        <div className="notification-content">
                          <h4 className="notification-title">{notification.title}</h4>
                          <p className="notification-message">{notification.message}</p>
                          <div className="notification-meta">
                            <span className="notification-time">
                              {formatNotificationDate(notification.createdAt)}
                            </span>
                            {notification.link && (
                              <span className="notification-link">Перейти →</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Пагинация */}
                    {totalPages > 1 && (
                      <div className="notifications-pagination">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => loadNotifications(currentPage - 1)}
                        >
                          ←
                        </button>
                        <span>{currentPage} из {totalPages}</span>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => loadNotifications(currentPage + 1)}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Вкладка СООБЩЕНИЯ */}
          {activeTab === 'messages' && (
            <div className="profile-messages">
              <h3>Сообщения по объявлениям</h3>
              
              <div className="messages-placeholder">
                <span className="placeholder-icon">✉️</span>
                <p>Здесь будут отображаться запросы от других пользователей по вашим объявлениям в маркете</p>
                <p className="placeholder-note">Когда кто-то захочет связаться с вами по поводу продажи или покупки, сообщение появится здесь</p>
              </div>
            </div>
          )}

          {/* Вкладка НАСТРОЙКИ */}
          {activeTab === 'settings' && (
            <div className="profile-settings">
              <h3>Настройки мастерской</h3>
              
              <div className="settings-section">
                <h4>Приватность</h4>
                
                <label className="settings-checkbox">
                  <div className="checkbox-main">
                    <input 
                      type="checkbox" 
                      checked={showPhone}
                      onChange={(e) => setShowPhone(e.target.checked)}
                    />
                    <span>Показывать телефон другим пользователям</span>
                  </div>
                  <span className="checkbox-hint">
                    📞 Будет виден в профиле и при клике «Связаться» в проектах и объявлениях
                  </span>
                </label>
                
                <label className="settings-checkbox">
                  <div className="checkbox-main">
                    <input 
                      type="checkbox" 
                      checked={showEmail}
                      onChange={(e) => setShowEmail(e.target.checked)}
                    />
                    <span>Показывать email в профиле</span>
                  </div>
                  <span className="checkbox-hint">
                    ✉️ Другие пользователи смогут написать вам на почту напрямую
                  </span>
                </label>
                
                <label className="settings-checkbox">
                  <div className="checkbox-main">
                    <input 
                      type="checkbox" 
                      checked={showCity}
                      onChange={(e) => setShowCity(e.target.checked)}
                    />
                    <span>Показывать мой город</span>
                  </div>
                  <span className="checkbox-hint">
                    📍 Отображается в профиле, проектах и помогает в поиске мастеров рядом
                  </span>
                </label>
              </div>

              <div className="settings-section">
                <h4>Уведомления</h4>
                
                <label className="settings-checkbox">
                  <div className="checkbox-main">
                    <input 
                      type="checkbox" 
                      checked={notifyMessages}
                      onChange={(e) => setNotifyMessages(e.target.checked)}
                    />
                    <span>О новых сообщениях по объявлениям</span>
                  </div>
                  <span className="checkbox-hint">
                    💬 Уведомлять, когда кто-то хочет связаться по поводу продажи
                  </span>
                </label>
                
                <label className="settings-checkbox">
                  <div className="checkbox-main">
                    <input 
                      type="checkbox" 
                      checked={notifyLikes}
                      onChange={(e) => setNotifyLikes(e.target.checked)}
                    />
                    <span>О лайках к моим проектам</span>
                  </div>
                  <span className="checkbox-hint">
                    ❤️ Узнавайте, когда ваши работы оценивают
                  </span>
                </label>
                
                <label className="settings-checkbox">
                  <div className="checkbox-main">
                    <input 
                      type="checkbox" 
                      checked={notifyComments}
                      onChange={(e) => setNotifyComments(e.target.checked)}
                    />
                    <span>О новых комментариях</span>
                  </div>
                  <span className="checkbox-hint">
                    💭 Получайте уведомления об ответах на ваши проекты
                  </span>
                </label>
              </div>

              <div className="settings-section">
                <h4>Безопасность</h4>
                <button className="change-password-btn">
                  🔐 Сменить пароль
                </button>
                <span className="button-hint">
                  После смены пароля потребуется повторный вход
                </span>
              </div>

              <div className="settings-section danger-zone">
                <h4>Опасная зона</h4>
                <button className="delete-account-btn">
                  🗑️ Удалить мастерскую
                </button>
                <p className="danger-note">
                  ⚠️ Это действие нельзя отменить. Все проекты и данные будут удалены.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
