"use client";

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useRating } from './RatingContext';
import { useAuth } from './useAuth';
import { userApi } from '@/lib/api/user';
import { notificationsApi } from '@/lib/api/notifications';
import { marketApi } from '@/lib/api/market';
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

// Тип для сообщения из маркета
interface MarketMessage {
  id: string;
  itemId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  read: boolean;
  contactMethod: string;
  createdAt: string;
  fromUser?: {
    id: string;
    login: string;
    phone?: string;
    email?: string;
  };
  toUser?: {
    id: string;
    login: string;
    phone?: string;
    email?: string;
  };
  item?: {
    id: string;
    title: string;
  };
}

// Тип для переписки
interface MessageThread {
  thread: MarketMessage[];
  otherUser: {
    id: string;
    login: string;
    phone: string | null;
    email: string | null;
  };
  item: {
    id: string;
    title: string;
  };
}

// Тип для ответа от API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// Тип для статистики из API
interface DashboardStatsData {
  user: {
    id: string;
    login: string;
    name: string | null;
    avatar: string | null;
    rating: number;
    activityPoints: number;
    registeredAt: string;
    lastLogin: string | null;
  };
  stats: {
    projectsCreated: number;
    mastersAdsCreated: number;
    helpRequestsCreated: number;
    libraryPostsCreated: number;
    likesGiven: number;
    likesReceived: number;
    commentsMade: number;
    commentsReceived: number;
    totalViews: number;
  };
  totalContent: number;
}

// Тип для профиля пользователя из API
interface UserProfile {
  id: string;
  login: string;
  name: string | null;
  avatar: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  rating: number;
  activityPoints: number;
  createdAt: string;
  lastLogin: string | null;
  content: any[];
}

// Тип для настроек уведомлений
interface NotificationSettings {
  id?: string;
  userId?: string;
  emailEnabled: boolean;
  emailLikes: boolean;
  emailComments: boolean;
  emailMessages: boolean;
  pushEnabled: boolean;
  pushLikes: boolean;
  pushComments: boolean;
  pushMessages: boolean;
  siteLikes: boolean;
  siteComments: boolean;
  siteMessages: boolean;
  quietHours: boolean;
  quietStart: number | null;
  quietEnd: number | null;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
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
  
  // Настройки уведомлений
  const [notifyMessages, setNotifyMessages] = useState(false);
  const [notifyLikes, setNotifyLikes] = useState(false);
  const [notifyComments, setNotifyComments] = useState(false);
  
  // Флаги инициализации и изменений
  const [settingsInitialized, setSettingsInitialized] = useState(false);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  
  // Состояния для уведомлений
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Состояния для сообщений из маркета
  const [messages, setMessages] = useState<MarketMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Состояния для диалога
  const [selectedMessage, setSelectedMessage] = useState<MarketMessage | null>(null);
  const [messageThread, setMessageThread] = useState<MessageThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  
  // Состояния для статистики
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  const { user } = useAuth();
  const { userRating } = useRating();

  // Принудительное обновление
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Приводим user к расширенному типу
  const extendedUser = user as ExtendedUser | null;

  // Функция сохранения настроек уведомлений
  const saveNotificationSettingsWithValue = useCallback(async (settingsToSend: {
    siteMessages: boolean;
    siteLikes: boolean;
    siteComments: boolean;
  }) => {
    if (!user) return;
    
    setIsSavingSettings(true);
    
    try {
      await notificationsApi.updateMySettings(settingsToSend);
      
      // Дублируем в localStorage
      localStorage.setItem(`notifyMessages_${user.id}`, JSON.stringify(settingsToSend.siteMessages));
      localStorage.setItem(`notifyLikes_${user.id}`, JSON.stringify(settingsToSend.siteLikes));
      localStorage.setItem(`notifyComments_${user.id}`, JSON.stringify(settingsToSend.siteComments));
      
      setSettingsChanged(false);
      forceUpdate();
      
    } catch (error) {
      console.error('Ошибка сохранения настроек уведомлений:', error);
    } finally {
      setIsSavingSettings(false);
    }
  }, [user]);

  // Универсальный обработчик для всех чекбоксов уведомлений
  const handleNotificationChange = async (
    field: 'siteMessages' | 'siteLikes' | 'siteComments',
    newValue: boolean
  ) => {
    // Обновляем соответствующее состояние
    if (field === 'siteMessages') {
      setNotifyMessages(newValue);
    } else if (field === 'siteLikes') {
      setNotifyLikes(newValue);
    } else {
      setNotifyComments(newValue);
    }
    
    setSettingsChanged(true);
    
    // Формируем объект для отправки
    const settingsToSend = {
      siteMessages: field === 'siteMessages' ? newValue : notifyMessages,
      siteLikes: field === 'siteLikes' ? newValue : notifyLikes,
      siteComments: field === 'siteComments' ? newValue : notifyComments
    };
    
    await saveNotificationSettingsWithValue(settingsToSend);
  };

  // Обработчики изменений чекбоксов приватности
  const handleShowPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPhone(e.target.checked);
    setSettingsChanged(true);
    forceUpdate();
  };

  const handleShowEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowEmail(e.target.checked);
    setSettingsChanged(true);
    forceUpdate();
  };

  const handleShowCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowCity(e.target.checked);
    setSettingsChanged(true);
    forceUpdate();
  };

  // Функция сохранения всех настроек при выходе
  const saveAllSettingsOnExit = useCallback(async () => {
    if (!user || !settingsChanged) return;
    
    // Сохраняем настройки приватности в localStorage
    localStorage.setItem(`setting_showPhone_${user.id}`, JSON.stringify(showPhone));
    localStorage.setItem(`setting_showEmail_${user.id}`, JSON.stringify(showEmail));
    localStorage.setItem(`setting_showCity_${user.id}`, JSON.stringify(showCity));
    
    // Сохраняем настройки уведомлений
    await saveNotificationSettingsWithValue({
      siteMessages: notifyMessages,
      siteLikes: notifyLikes,
      siteComments: notifyComments
    });
  }, [user, settingsChanged, showPhone, showEmail, showCity, notifyMessages, notifyLikes, notifyComments, saveNotificationSettingsWithValue]);

  // Загрузка настроек уведомлений из API
  const loadNotificationSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const settings = await notificationsApi.getMySettings() as NotificationSettings;
      
      if (settings) {
        setNotifyMessages(settings.siteMessages ?? false);
        setNotifyLikes(settings.siteLikes ?? false);
        setNotifyComments(settings.siteComments ?? false);
        
        // Синхронизируем с localStorage
        localStorage.setItem(`notifyMessages_${user.id}`, JSON.stringify(settings.siteMessages ?? false));
        localStorage.setItem(`notifyLikes_${user.id}`, JSON.stringify(settings.siteLikes ?? false));
        localStorage.setItem(`notifyComments_${user.id}`, JSON.stringify(settings.siteComments ?? false));
        
        setSettingsInitialized(true);
        setSettingsChanged(false);
        forceUpdate();
      }
      
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      loadSettingsFromLocalStorage();
    }
  }, [user]);

  // Загрузка из localStorage как запасной вариант
  const loadSettingsFromLocalStorage = useCallback(() => {
    if (!user) return;
    
    const savedMessages = localStorage.getItem(`notifyMessages_${user.id}`);
    const savedLikes = localStorage.getItem(`notifyLikes_${user.id}`);
    const savedComments = localStorage.getItem(`notifyComments_${user.id}`);
    
    setNotifyMessages(savedMessages ? JSON.parse(savedMessages) : false);
    setNotifyLikes(savedLikes ? JSON.parse(savedLikes) : false);
    setNotifyComments(savedComments ? JSON.parse(savedComments) : false);
    
    setSettingsInitialized(true);
    setSettingsChanged(false);
    forceUpdate();
  }, [user]);

  // Сохранение при закрытии модалки
  useEffect(() => {
    if (!isOpen && settingsChanged) {
      saveAllSettingsOnExit();
    }
  }, [isOpen, settingsChanged, saveAllSettingsOnExit]);

  // Сохранение при смене пользователя
  useEffect(() => {
    if (settingsChanged) {
      saveAllSettingsOnExit();
    }
  }, [user, settingsChanged, saveAllSettingsOnExit]);

  // Загрузка настроек при открытии вкладки
  useEffect(() => {
    if (isOpen && user && activeTab === 'settings' && !settingsInitialized) {
      loadNotificationSettings();
    }
  }, [isOpen, user, activeTab, settingsInitialized, loadNotificationSettings]);

  // Сброс флагов при смене пользователя
  useEffect(() => {
    setSettingsInitialized(false);
    setProfileDataLoaded(false);
    setSettingsChanged(false);
  }, [user]);

  // Сброс флагов при закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setSettingsInitialized(false);
      setProfileDataLoaded(false);
    }
  }, [isOpen]);

  // Загрузка статистики
  const loadDashboardStats = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingStats(true);
    try {
      // @ts-ignore
      const response = await userApi.getDashboardStats();
      // @ts-ignore
      const statsData = response?.data || response;
      
      if (statsData) {
        setDashboardStats(statsData);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  // Загрузка профиля из API
  const loadUserProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      // @ts-ignore
      const response = await userApi.getCurrentUser();
      // @ts-ignore
      const userData = response?.data || response;
      
      if (userData) {
        // Обновляем все поля для отображения
        setEditedName(userData?.name || userData?.login || '');
        setEditedBio(userData?.bio || '');
        setEditedLocation(userData?.location || '');
        setEditedPhone(userData?.phone || '');
        
        if (userData?.avatar) {
          setAvatarPreview(userData.avatar);
          localStorage.setItem(`avatar_${user.id}`, userData.avatar);
          setAvatarVersion(prev => prev + 1);
        }
        
        // Обновляем пользователя в контексте через localStorage
        const currentUser = JSON.parse(localStorage.getItem('samodelkin_user') || '{}');
        const updatedUser = {
          ...currentUser,
          ...userData,
          createdAt: userData.createdAt || currentUser.createdAt,
          lastLogin: userData.lastLogin || currentUser.lastLogin
        };
        localStorage.setItem('samodelkin_user', JSON.stringify(updatedUser));
        
        setProfileDataLoaded(true);
        forceUpdate();
      }
      
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  }, [user]);

  // Загрузка данных при открытии
  useEffect(() => {
    if (isOpen && user) {
      setTimeout(() => {
        loadUserProfile();
        loadDashboardStats();
      }, 100);
    }
  }, [isOpen, user]);

  // Загрузка локальных данных при открытии
  useEffect(() => {
    if (extendedUser && isOpen && !profileDataLoaded) {
      setEditedName(extendedUser.name || extendedUser.login || '');
      setEditedBio(extendedUser.bio || '');
      setEditedLocation(extendedUser.location || '');
      setEditedPhone(extendedUser.phone || '');
      
      // Загружаем настройки приватности из localStorage
      const savedShowPhone = localStorage.getItem(`setting_showPhone_${extendedUser.id}`);
      const savedShowEmail = localStorage.getItem(`setting_showEmail_${extendedUser.id}`);
      const savedShowCity = localStorage.getItem(`setting_showCity_${extendedUser.id}`);
      
      setShowPhone(savedShowPhone ? JSON.parse(savedShowPhone) : false);
      setShowEmail(savedShowEmail ? JSON.parse(savedShowEmail) : false);
      setShowCity(savedShowCity ? JSON.parse(savedShowCity) : false);
      
      // Загружаем аватар из localStorage
      const savedAvatar = localStorage.getItem(`avatar_${extendedUser.id}`);
      setAvatarPreview(savedAvatar || extendedUser.avatar || null);
      
      forceUpdate();
    }
  }, [extendedUser, isOpen, profileDataLoaded]);

  // Загрузка уведомлений при открытии вкладки
  useEffect(() => {
    if (activeTab === 'notifications' && user) {
      loadNotifications(1);
    }
  }, [activeTab, notificationsFilter, user]);

  // Загрузка сообщений при открытии вкладки
  useEffect(() => {
    if (activeTab === 'messages' && user) {
      loadMarketMessages();
    }
  }, [activeTab, user]);

  // Загрузка статистики при открытии вкладки
  useEffect(() => {
    if (activeTab === 'stats' && user) {
      loadDashboardStats();
    }
  }, [activeTab, user]);

  // Сброс состояния при выходе из режима редактирования
  useEffect(() => {
    if (!isEditing && extendedUser) {
      setAvatarFile(null);
      const savedAvatar = localStorage.getItem(`avatar_${extendedUser.id}`);
      setAvatarPreview(savedAvatar || extendedUser.avatar || null);
      setAvatarVersion(prev => prev + 1);
      forceUpdate();
    }
  }, [isEditing, extendedUser]);

  // Загрузка переписки при выборе сообщения
  useEffect(() => {
    if (selectedMessage) {
      loadMessageThread(selectedMessage.id);
    }
  }, [selectedMessage]);

  // Загрузка сообщений через API
  const loadMarketMessages = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingMessages(true);
    try {
      const messages = await marketApi.getMessages();
      setMessages(messages);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Загрузка переписки через API
  const loadMessageThread = async (messageId: string) => {
    setIsLoadingThread(true);
    try {
      const thread = await marketApi.getMessageThread(messageId);
      setMessageThread(thread);
    } catch (error) {
      console.error('Ошибка загрузки переписки:', error);
    } finally {
      setIsLoadingThread(false);
    }
  };

  // Отправка ответа через API
  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    setIsSendingReply(true);
    try {
      await marketApi.sendReply(selectedMessage.id, { message: replyText });
      
      // Обновляем список сообщений
      await loadMarketMessages();
      
      // Обновляем переписку
      await loadMessageThread(selectedMessage.id);
      
      setReplyText('');
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      alert('Не удалось отправить ответ');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Обработчик клика на сообщение
  const handleMessageClick = async (message: MarketMessage) => {
    // Отмечаем как прочитанное, если это входящее непрочитанное
    if (!message.read && message.toUserId === user?.id) {
      try {
        await marketApi.markAsRead(message.id);
        setMessages(prev =>
          prev.map(m => m.id === message.id ? { ...m, read: true } : m)
        );
      } catch (err) {
        console.error('Ошибка при отметке сообщения:', err);
      }
    }
    
    // Открываем модалку диалога
    setSelectedMessage(message);
  };

  // Удаление сообщения
  const handleDeleteMessage = async (e: React.MouseEvent, messageId: string) => {
    e.stopPropagation();
    
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) {
      return;
    }
    
    try {
      // TODO: Добавить метод deleteMessage в marketApi
      // Пока заглушка
      console.log('Удаление сообщения:', messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      alert('Сообщение удалено');
    } catch (error) {
      console.error('Ошибка при удалении сообщения:', error);
      alert('Не удалось удалить сообщение');
    }
  };

  const loadNotifications = useCallback(async (page: number = 1) => {
    if (!user) return;
    
    setIsLoadingNotifications(true);
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      
      let url = `http://localhost:3001/api/notifications?page=${page}&limit=10`;
      
      if (notificationsFilter !== 'all' && notificationsFilter !== 'unread') {
        const typeMap: Record<string, string> = {
          'likes': 'LIKE',
          'comments': 'COMMENT',
          'messages': 'MESSAGE',
          'system': 'SYSTEM'
        };
        
        const dbType = typeMap[notificationsFilter];
        if (dbType) {
          url += `&type=${dbType}`;
        }
      }
      
      if (notificationsFilter === 'unread') {
        url += `&read=false`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const { notifications: newNotifications, totalPages } = result.data;
        setNotifications(newNotifications || []);
        setTotalPages(totalPages || 1);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user, notificationsFilter]);

  const handleMarkAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('samodelkin_auth_token');
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        const token = localStorage.getItem('samodelkin_auth_token');
        await fetch(`http://localhost:3001/api/notifications/${notification.id}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error('Ошибка при отметке уведомления:', error);
      }
    }
    
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

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

  const formatMessageDate = (dateString: string) => {
    return formatNotificationDate(dateString);
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
          setAvatarVersion(prev => prev + 1);
          forceUpdate();
        };
        reader.readAsDataURL(compressedFile);
        
      } catch (error) {
        console.error('Ошибка при обработке изображения:', error);
        alert('Не удалось обработать изображение');
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!extendedUser) return;
    
    setIsLoading(true);
    
    try {
      // Подготавливаем данные для обновления
      const updateData: any = {};
      
      if (editedName !== extendedUser.name) {
        updateData.name = editedName;
      }
      
      if (editedBio !== extendedUser.bio) {
        updateData.bio = editedBio;
      }
      
      if (editedLocation !== extendedUser.location) {
        updateData.location = editedLocation;
      }
      
      if (editedPhone !== extendedUser.phone) {
        updateData.phone = editedPhone;
      }
      
      if (avatarPreview && avatarPreview !== extendedUser.avatar) {
        updateData.avatar = avatarPreview;
      }
      
      // Отправляем данные на сервер
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await userApi.updateProfile(updateData);
        
        // Обновляем данные в localStorage
        if (updateData.avatar) {
          localStorage.setItem(`avatar_${extendedUser.id}`, updateData.avatar);
        }
        
        // Принудительно перезагружаем профиль
        setProfileDataLoaded(false);
        await loadUserProfile();
        
        // Обновляем данные в localStorage для остальных полей
        if (updateData.name) {
          localStorage.setItem(`user_name_${extendedUser.id}`, updateData.name);
        }
        if (updateData.bio) {
          localStorage.setItem(`user_bio_${extendedUser.id}`, updateData.bio);
        }
        if (updateData.location) {
          localStorage.setItem(`user_location_${extendedUser.id}`, updateData.location);
        }
        if (updateData.phone) {
          localStorage.setItem(`user_phone_${extendedUser.id}`, updateData.phone);
        }
      } else {
        // Если данных для обновления нет, просто выходим из режима редактирования
        setIsEditing(false);
        alert('Профиль успешно сохранён!');
        return;
      }
      
      // Сохраняем настройки приватности
      localStorage.setItem(`setting_showPhone_${extendedUser.id}`, JSON.stringify(showPhone));
      localStorage.setItem(`setting_showEmail_${extendedUser.id}`, JSON.stringify(showEmail));
      localStorage.setItem(`setting_showCity_${extendedUser.id}`, JSON.stringify(showCity));
      
      // Сохраняем настройки уведомлений
      await saveNotificationSettingsWithValue({
        siteMessages: notifyMessages,
        siteLikes: notifyLikes,
        siteComments: notifyComments
      });
      
      alert('Профиль успешно сохранён!');
      setIsEditing(false);
      setSettingsChanged(false);
      forceUpdate();
      
    } catch (error) {
      console.error('❌ Ошибка сохранения профиля:', error);
      alert('Не удалось сохранить профиль. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!extendedUser) return;
    
    setEditedName(extendedUser.name || extendedUser.login || '');
    setEditedBio(extendedUser.bio || '');
    setEditedLocation(extendedUser.location || '');
    setEditedPhone(extendedUser.phone || '');
    setAvatarFile(null);
    setAvatarPreview(extendedUser.avatar || null);
    setAvatarVersion(prev => prev + 1);
    setIsEditing(false);
    forceUpdate();
  };

  if (!isOpen || !extendedUser) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>МОЙ ПРОФИЛЬ</h2>
          <button className="profile-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-header-panel">
          <div className="profile-avatar-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <div className="profile-avatar">
              {avatarPreview ? (
                <img 
                  key={avatarVersion}
                  src={avatarPreview} 
                  alt={extendedUser.login} 
                />
              ) : (
                <span className="profile-avatar-initials">
                  {getInitials(extendedUser.name || extendedUser.login)}
                </span>
              )}
              
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
            
            {isEditing && (
              <div className="avatar-hint">
                Нажмите на фото чтобы изменить
              </div>
            )}
          </div>

          <div className="profile-header-info">
            <h3 className="profile-user-name">{extendedUser.name || extendedUser.login}</h3>
            
            {userRating ? (
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
            ) : (
              <div className="profile-rating-row">
                <span style={{ color: '#999', fontSize: '14px' }}>
                  Рейтинг загружается...
                </span>
              </div>
            )}
            
            {/* Три верхних окошка статистики */}
            <div className="profile-quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-icon">📁</span>
                <span className="quick-stat-value">{dashboardStats?.stats?.projectsCreated || 0}</span>
                <span className="quick-stat-label">проектов</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">⭐</span>
                <span className="quick-stat-value">{dashboardStats?.stats?.likesReceived || 0}</span>
                <span className="quick-stat-label">лайков</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-icon">💬</span>
                <span className="quick-stat-value">{dashboardStats?.stats?.commentsMade || 0}</span>
                <span className="quick-stat-label">комментариев</span>
              </div>
            </div>
          </div>
        </div>

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

        <div className="profile-tab-content">
          {activeTab === 'profile' && (
            <div className="profile-info">
              {!isEditing ? (
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
                      <span className="info-value">{editedName || 'Не указано'}</span>
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
                        {editedPhone || 'Не указан'}
                        {showPhone && <span className="info-badge">виден всем</span>}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Город:</span>
                      <span className="info-value">
                        {editedLocation || 'Не указан'}
                        {showCity && <span className="info-badge">виден всем</span>}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">О себе:</span>
                      <span className="info-value bio-text">{editedBio || 'Пока ничего не рассказал(а)'}</span>
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
                              forceUpdate();
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
                        disabled={isLoading}
                      >
                        {isLoading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="profile-stats">
              <h3>Статистика активности</h3>
              
              {isLoadingStats ? (
                <div className="stats-loading">
                  <div className="loading-spinner">📊</div>
                  <p>Загрузка статистики...</p>
                </div>
              ) : dashboardStats ? (
                <>
                  <div className="stats-overview">
                    <div className="stat-card">
                      <div className="stat-card-icon">🏆</div>
                      <div className="stat-card-content">
                        <div className="stat-card-value">{dashboardStats.user?.rating ?? 0}</div>
                        <div className="stat-card-label">Общий рейтинг</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-card-icon">⚡</div>
                      <div className="stat-card-content">
                        <div className="stat-card-value">{dashboardStats.user?.activityPoints ?? 0}</div>
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
                        <span className="stat-item-value">{dashboardStats.stats?.projectsCreated ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">📦</span>
                        <span className="stat-item-label">Объявлений в маркете:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.mastersAdsCreated ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">❓</span>
                        <span className="stat-item-label">Запросов помощи:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.helpRequestsCreated ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">📚</span>
                        <span className="stat-item-label">Публикаций в библиотеке:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.libraryPostsCreated ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">❤️</span>
                        <span className="stat-item-label">Лайков дано:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.likesGiven ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">⭐</span>
                        <span className="stat-item-label">Лайков получено:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.likesReceived ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">💬</span>
                        <span className="stat-item-label">Комментариев:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.commentsMade ?? 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-item-icon">👁️</span>
                        <span className="stat-item-label">Просмотров проектов:</span>
                        <span className="stat-item-value">{dashboardStats.stats?.totalViews ?? 0}</span>
                      </div>
                    </div>
                    
                    <div className="stats-total">
                      <span className="total-label">Всего публикаций:</span>
                      <span className="total-value">{dashboardStats.totalContent ?? 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="stats-error">
                  <p>Не удалось загрузить статистику</p>
                </div>
              )}
            </div>
          )}

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
                <button 
                  className={`filter-btn ${notificationsFilter === 'system' ? 'active' : ''}`}
                  onClick={() => setNotificationsFilter('system')}
                >
                  ⚙️ Системные
                </button>
              </div>

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
                        : notificationsFilter === 'unread'
                        ? 'Нет непрочитанных уведомлений'
                        : notificationsFilter === 'likes'
                        ? 'Нет уведомлений о лайках'
                        : notificationsFilter === 'comments'
                        ? 'Нет уведомлений о комментариях'
                        : notificationsFilter === 'messages'
                        ? 'Нет сообщений из маркета'
                        : 'Нет системных уведомлений'}
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

          {activeTab === 'messages' && (
            <div className="profile-messages">
              <div className="messages-header">
                <h3>Сообщения по объявлениям</h3>
                {messages.length > 0 && (
                  <span className="messages-count">Всего: {messages.length}</span>
                )}
              </div>

              {isLoadingMessages ? (
                <div className="messages-loading">
                  <div className="loading-spinner">✉️</div>
                  <p>Загрузка сообщений...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="messages-empty">
                  <span className="empty-icon">📭</span>
                  <p>У вас пока нет сообщений</p>
                  <p className="empty-note">
                    Когда кто-то захочет связаться с вами по поводу продажи или покупки, 
                    сообщение появится здесь
                  </p>
                </div>
              ) : (
                <>
                  <div className="messages-hint">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">Кликните на сообщение чтобы открыть диалог и ответить</span>
                  </div>
                  
                  <div className="messages-list">
                    {messages.map((message) => {
                      const isIncoming = message.toUserId === user?.id;
                      const sender = isIncoming ? message.fromUser?.login : message.toUser?.login;
                      
                      return (
                        <div
                          key={message.id}
                          className={`message-item ${!message.read && isIncoming ? 'unread' : 'read'} clickable`}
                          onClick={() => handleMessageClick(message)}
                        >
                          <div className="message-icon">
                            {isIncoming ? '📥' : '📤'}
                          </div>
                          
                          <div className="message-content">
                            <div className="message-header">
                              <span className="message-sender">
                                {sender || 'Пользователь'}
                                {!isIncoming && <span className="message-direction"> (Вы)</span>}
                              </span>
                              <span className="message-time">
                                {formatMessageDate(message.createdAt)}
                              </span>
                            </div>
                            
                            <div className="message-preview">
                              {message.message.length > 100 
                                ? `${message.message.substring(0, 100)}...` 
                                : message.message}
                            </div>
                            
                            {message.item && (
                              <div className="message-item-info">
                                По объявлению: <strong>"{message.item.title}"</strong>
                              </div>
                            )}
                          </div>

                          {!message.read && isIncoming && (
                            <div className="message-unread-dot" title="Непрочитано"></div>
                          )}
                          
                          {/* Корзина для удаления */}
                          <button
                            className="message-delete-btn"
                            onClick={(e) => handleDeleteMessage(e, message.id)}
                            title="Удалить сообщение"
                          >
                            🗑️
                          </button>
                          
                          <div className="message-click-hint" title="Кликните чтобы ответить">
                            💬
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

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
                      onChange={handleShowPhoneChange}
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
                      onChange={handleShowEmailChange}
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
                      onChange={handleShowCityChange}
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
                      onChange={(e) => handleNotificationChange('siteMessages', e.target.checked)}
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
                      onChange={(e) => handleNotificationChange('siteLikes', e.target.checked)}
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
                      onChange={(e) => handleNotificationChange('siteComments', e.target.checked)}
                    />
                    <span>О новых комментариях</span>
                  </div>
                  <span className="checkbox-hint">
                    💭 Получайте уведомления об ответах на ваши проекты
                  </span>
                </label>
                
                {isSavingSettings && (
                  <div className="settings-saving">
                    <span className="saving-spinner">⏳</span> Сохранение...
                  </div>
                )}
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

      {/* Модальное окно диалога */}
      {selectedMessage && (
        <div className="dialog-modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="dialog-modal" onClick={e => e.stopPropagation()}>
            <div className="dialog-modal-header">
              <h3>Диалог по объявлению</h3>
              <button className="close-btn" onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            
            {isLoadingThread ? (
              <div className="dialog-loading">
                <div className="loading-spinner">💬</div>
                <p>Загрузка переписки...</p>
              </div>
            ) : messageThread ? (
              <>
                <div className="dialog-item-info">
                  <strong>Объявление:</strong> {messageThread.item.title}
                </div>
                
                <div className="dialog-messages">
                  {messageThread.thread.map((msg, index) => {
                    const isMyMessage = msg.fromUserId === user?.id;
                    
                    return (
                      <div 
                        key={index}
                        className={`dialog-message ${isMyMessage ? 'sent' : 'received'}`}
                      >
                        <div className="message-sender">
                          {isMyMessage ? 'Вы' : messageThread.otherUser.login}
                        </div>
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">
                          {formatMessageDate(msg.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="dialog-contact-info">
                  <h4>Контакты собеседника:</h4>
                  {messageThread.otherUser.phone ? (
                    <p>📞 Телефон: {messageThread.otherUser.phone}</p>
                  ) : (
                    <p>📞 Телефон не указан</p>
                  )}
                  {messageThread.otherUser.email ? (
                    <p>✉️ Email: {messageThread.otherUser.email}</p>
                  ) : (
                    <p>✉️ Email не указан</p>
                  )}
                  <p className="contact-note">
                    ⚠️ Контакты видны только если пользователь разрешил их показывать в настройках
                  </p>
                </div>
                
                <div className="dialog-reply">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ваш ответ..."
                    rows={3}
                  />
                  <button 
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyText.trim()}
                  >
                    {isSendingReply ? 'Отправка...' : 'Отправить ответ'}
                  </button>
                </div>
              </>
            ) : (
              <div className="dialog-error">
                <p>Не удалось загрузить переписку</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModal;