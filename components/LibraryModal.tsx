"use client";

import React, { useState, useEffect, useRef } from "react";
import "./LibraryModal.css";
import { useAuth } from "./useAuth";
import { useRating } from "./RatingContext";
import { usePraise } from "./PraiseContext";
import { praiseApi } from "@/lib/api/praise";

// Типы данных
interface LibraryItem {
  id: string;
  title: string;
  content: string;
  type: "text" | "photo" | "drawing" | "video" | "other";
  author: string;
  authorLogin: string;
  userId: string;
  contentId: string;
  date: string;
  likes: number;
  userLiked?: boolean;
  thumbnail?: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  // 👇 НОВОЕ: статистика похвал
  praises?: {
    total: number;
    distribution: Record<string, number>;
    topEmoji: string;
    topCount: number;
  };
}

interface Subsection {
  id: string;
  title: string;
  items: LibraryItem[];
  createdBy?: string;
  createdAt?: string;
}

interface Section {
  id: string;
  title: string;
  icon: string;
  words?: string[];
  subsections: Subsection[];
  allowedTypes: ("text" | "photo" | "drawing" | "video" | "other")[];
  fileExtensions?: string[];
  maxFileSize?: number;
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

// Конфигурация стеллажей
const SHELF_CONFIG: Record<string, Partial<Section>> = {
  recipes: {
    allowedTypes: ["text", "photo"],
    fileExtensions: [".txt", ".md", ".jpg", ".jpeg", ".png", ".gif"],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  advice: {
    allowedTypes: ["text", "photo"],
    fileExtensions: [".txt", ".md", ".jpg", ".jpeg", ".png"],
    maxFileSize: 10 * 1024 * 1024
  },
  drawings: {
    allowedTypes: ["drawing", "photo"],
    fileExtensions: [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".dwg"],
    maxFileSize: 20 * 1024 * 1024
  },
  "photos-videos": {
    allowedTypes: ["photo", "video"],
    fileExtensions: [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".avi", ".mov", ".webm"],
    maxFileSize: 100 * 1024 * 1024
  },
  misc: {
    allowedTypes: ["text", "photo", "drawing", "video", "other"],
    fileExtensions: [".txt", ".md", ".pdf", ".zip", ".rar", ".jpg", ".png"],
    maxFileSize: 50 * 1024 * 1024
  }
};

// Система баллов
const RATING_POINTS = {
  CREATE_SUBSECTION: 5,
  ADD_DOCUMENT: 10,
  ADD_PHOTO: 15,
  ADD_VIDEO: 20,
  ADD_DRAWING: 15,
  RECEIVE_LIKE: 2,
  RECEIVE_PRAISE: 5
};

// 👇 ПРАВИЛЬНЫЙ МАССИВ ПОХВАЛ
const PRAISE_EMOJIS = {
  "👍": "Молодец!",
  "👏": "Отличная работа!",
  "🔨": "Мастер золотые руки!",
  "💫": "Вдохновляет!",
  "🎨": "Креативно!",
  "🔍": "Детально проработано",
  "🤝": "Полезный совет!",
  "🙏": "Спасибо!"
};

// Вспомогательная функция для генерации ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Форматирование размера файла
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 👇 КОМПОНЕНТ: статистика похвал для карточки документа
const PraiseStatsCompact: React.FC<{ item: LibraryItem }> = ({ item }) => {
  if (!item.praises || item.praises.total === 0) return null;
  
  return (
    <div className="praise-stats-compact">
      <span className="total" title="Всего похвал">
        🔨 {item.praises.total}
      </span>
      {item.praises.topEmoji && item.praises.topCount > 0 && (
        <span className="top-emoji" title={`${PRAISE_EMOJIS[item.praises.topEmoji as keyof typeof PRAISE_EMOJIS] || 'Похвала'}`}>
          {item.praises.topEmoji} {item.praises.topCount}
        </span>
      )}
    </div>
  );
};

// 👇 КОМПОНЕНТ: детальная статистика похвал для модального окна
const PraiseStatsDetailed: React.FC<{ item: LibraryItem }> = ({ item }) => {
  // Для отладки - всегда показываем, даже если нет данных
  console.log('PraiseStatsDetailed рендерится для:', item.title);
  
  // Если нет данных, показываем заглушку
  if (!item.praises) {
    return (
      <div className="praise-stats-detailed" style={{ 
        background: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        border: '2px solid orange',
        minWidth: '250px'
      }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          ⏳ Нет данных о похвалах
        </div>
      </div>
    );
  }

  // Берем топ-4 эмоции по количеству
  const topEmotions = Object.entries(item.praises.distribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 4);
  
  const maxCount = topEmotions[0]?.[1] as number || 1;

  return (
    <div className="praise-stats-detailed" style={{
      background: '#2c1e0e',
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #8B4513',
      minWidth: '250px'
    }}>
      <div className="praise-total" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '2px solid #D2691E',
        paddingBottom: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '1.5em', color: '#FFD700' }}>🔨</span>
        <span style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#FFD700' }}>
          {item.praises.total}
        </span>
        <span style={{ color: '#F5DEB3' }}>всего похвал</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {topEmotions.map(([emoji, count]) => (
          <div key={emoji} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.3em', minWidth: '32px', color: 'white' }}>{emoji}</span>
            <span style={{ minWidth: '35px', color: '#FFF8DC', fontWeight: 'bold' }}>
              {count}
            </span>
            <div style={{
              flex: 1,
              height: '20px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${((count as number) / maxCount) * 100}%`,
                background: 'linear-gradient(90deg, #D2691E, #FF8C00, #FFD700)',
                borderRadius: '10px'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Модальное окно добавления подраздела
const AddSubsectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (subsectionTitle: string) => void;
  shelfTitle: string;
}> = ({ isOpen, onClose, onAdd, shelfTitle }) => {
  const [subsectionTitle, setSubsectionTitle] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subsectionTitle.trim()) {
      onAdd(subsectionTitle.trim());
      setSubsectionTitle("");
      onClose();
    }
  };

  return (
    <div className="add-subsection-modal-overlay" onClick={onClose}>
      <div className="add-subsection-modal-content" onClick={e => e.stopPropagation()}>
        <button className="add-subsection-close-button" onClick={onClose}>✕</button>
        <h2 className="add-subsection-title">➕ Добавить раздел</h2>
        <p className="add-subsection-subtitle">в раздел «{shelfTitle}»</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="add-subsection-input"
            placeholder="Введите название раздела"
            value={subsectionTitle}
            onChange={(e) => setSubsectionTitle(e.target.value)}
            autoFocus
            maxLength={50}
          />
          <div className="add-subsection-buttons">
            <button type="button" className="add-subsection-cancel" onClick={onClose}>Отмена</button>
            <button 
              type="submit" 
              className="add-subsection-submit" 
              disabled={!subsectionTitle.trim()}
            >
              Создать раздел
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Модальное окно добавления документа
const AddDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (docData: any) => void;
  subsection: Subsection;
  shelf: Section;
  currentUser: any;
}> = ({ isOpen, onClose, onAdd, subsection, shelf, currentUser }) => {
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = SHELF_CONFIG[shelf.id] || {};
  const allowedTypes = config.allowedTypes || ["text", "photo", "drawing", "video", "other"];
  const maxFileSize = config.maxFileSize || 10 * 1024 * 1024;
  const fileExtensions = config.fileExtensions || [];

  if (!isOpen) return null;

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Проверка размера
    if (file.size > maxFileSize) {
      alert(`Файл слишком большой. Максимальный размер: ${formatFileSize(maxFileSize)}`);
      return;
    }

    // Проверка расширения
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (fileExtensions.length > 0 && !fileExtensions.includes(fileExt)) {
      alert(`Недопустимый формат файла. Разрешенные форматы: ${fileExtensions.join(', ')}`);
      return;
    }

    setSelectedFile(file);

    // Создаем превью для изображений
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!docTitle.trim()) {
      alert('Введите название документа');
      return;
    }

    if (!docContent.trim() && !selectedFile) {
      alert('Добавьте содержание или выберите файл');
      return;
    }

    // Определяем тип документа
    let docType: LibraryItem['type'] = 'text';
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) docType = 'photo';
      else if (selectedFile.type.startsWith('video/')) docType = 'video';
      else if (selectedFile.name.match(/\.(dwg|pdf)$/i)) docType = 'drawing';
      else docType = 'other';
    }

    // 👇 ДЛЯ ТЕСТА: добавляем демо-данные похвал в каждый новый документ
    const newDoc = {
      id: generateId(),
      contentId: generateId(),
      title: docTitle.trim(),
      content: docContent.trim(),
      type: docType,
      author: currentUser?.name || currentUser?.login || 'Пользователь',
      authorLogin: currentUser?.login || 'user',
      userId: currentUser?.id || 'unknown',
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileType: selectedFile?.type,
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      // 👇 ДОБАВЛЯЕМ ТЕСТОВЫЕ ДАННЫЕ ПОХВАЛ
      praises: {
        total: 15,
        distribution: { "👍": 8, "🔨": 4, "👏": 3 },
        topEmoji: "👍",
        topCount: 8
      }
    };

    onAdd(newDoc);
    setDocTitle("");
    setDocContent("");
    setSelectedFile(null);
    setFilePreview(null);
    onClose();
  };

  return (
    <div 
      className="add-document-modal-overlay" 
      onClick={onClose}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="add-document-modal-content" onClick={e => e.stopPropagation()}>
        <button className="add-document-close-button" onClick={onClose}>✕</button>
        <h2 className="add-document-title">📄 Добавить документ</h2>
        <p className="add-document-subtitle">в раздел «{subsection.title}»</p>
        
        <form onSubmit={handleSubmit}>
          <div className="add-document-form-group">
            <label>Название:</label>
            <input
              type="text"
              className="add-document-input"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Введите название документа"
              maxLength={100}
              required
            />
          </div>

          {allowedTypes.includes('text') && (
            <div className="add-document-form-group">
              <label>Содержание:</label>
              <textarea
                className="add-document-textarea"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Введите текст документа"
                rows={5}
              />
            </div>
          )}

          <div className="add-document-form-group">
            <label>ИЛИ загрузите файл:</label>
            <div 
              className={`add-document-file-area ${isDragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                accept={fileExtensions.join(',')}
                style={{ display: 'none' }}
              />
              {selectedFile ? (
                <div className="add-document-file-info">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">({formatFileSize(selectedFile.size)})</span>
                  <button 
                    type="button"
                    className="file-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div className="file-upload-icon">📂</div>
                  <p>Нажмите для выбора файла</p>
                  <p className="file-upload-hint">или перетащите его сюда</p>
                  <p className="file-upload-extensions">
                    Поддерживаются: {fileExtensions.join(', ')}
                  </p>
                  <p className="file-upload-size">
                    Макс. размер: {formatFileSize(maxFileSize)}
                  </p>
                </>
              )}
            </div>
          </div>

          {filePreview && (
            <div className="add-document-preview">
              <img src={filePreview} alt="Preview" />
            </div>
          )}

          <div className="add-document-buttons">
            <button type="button" className="add-document-cancel" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="add-document-submit"
              disabled={!docTitle.trim() || (!docContent.trim() && !selectedFile)}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [libraryData, setLibraryData] = useState<Section[]>([]);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [showScrollHint, setShowScrollHint] = useState(false);
  
  // Состояния для модалок
  const [showAddSubsection, setShowAddSubsection] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [selectedShelfForAdd, setSelectedShelfForAdd] = useState<Section | null>(null);
  const [selectedSubsectionForAdd, setSelectedSubsectionForAdd] = useState<Subsection | null>(null);
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated } = useAuth();
  const ratingContext = useRating();
  const praiseContext = usePraise();

  // 👇 ЗАГРУЗКА ДЕМО-ДАННЫХ С ПОЛЯМИ PRAISES
  useEffect(() => {
    const mockData: Section[] = [
      {
        id: "recipes",
        title: "Рецепты",
        icon: "🍳",
        words: ["РЕЦЕПТЫ"],
        allowedTypes: ["text", "photo"],
        fileExtensions: [".txt", ".md", ".jpg", ".jpeg", ".png", ".gif"],
        maxFileSize: 10 * 1024 * 1024,
        subsections: [
          {
            id: "recipes-baking",
            title: "Выпечка",
            items: [
              {
                id: "recipe-1",
                contentId: "content-1",
                title: "Домашний хлеб на закваске",
                content: "Ингредиенты: мука 500г, вода 350мл, закваска 150г, соль 10г...",
                type: "text",
                author: "Петр Иванов",
                authorLogin: "petr_baker",
                userId: "user1",
                date: "2024-02-15",
                likes: 24,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 42,
                  distribution: { "👍": 23, "🔨": 12, "👏": 5, "💫": 2 },
                  topEmoji: "👍",
                  topCount: 23
                }
              },
              {
                id: "recipe-2",
                contentId: "content-2",
                title: "Пирожки с капустой",
                content: "Тесто: мука 600г, молоко 250мл, дрожжи 10г, сахар 2ст.л...",
                type: "text",
                author: "Анна Смирнова",
                authorLogin: "anna_cook",
                userId: "user2",
                date: "2024-02-20",
                likes: 15,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 18,
                  distribution: { "👏": 8, "👍": 6, "🔨": 4 },
                  topEmoji: "👏",
                  topCount: 8
                }
              }
            ]
          },
          {
            id: "recipes-main",
            title: "Основные блюда",
            items: [
              {
                id: "recipe-3",
                contentId: "content-3",
                title: "Борщ по-домашнему",
                content: "Свекла 2шт, капуста 300г, картофель 4шт, морковь 1шт...",
                type: "text",
                author: "Елена Кузнецова",
                authorLogin: "elena_cook",
                userId: "user3",
                date: "2024-02-18",
                likes: 31,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 31,
                  distribution: { "🔨": 15, "👍": 10, "👏": 6 },
                  topEmoji: "🔨",
                  topCount: 15
                }
              }
            ]
          }
        ]
      },
      {
        id: "advice",
        title: "Полезные советы",
        icon: "💡",
        words: ["СОВЕТЫ", "ПОЛЕЗНЫЕ"],
        allowedTypes: ["text", "photo"],
        fileExtensions: [".txt", ".md", ".jpg", ".jpeg", ".png"],
        maxFileSize: 10 * 1024 * 1024,
        subsections: [
          {
            id: "advice-home",
            title: "Домашние хитрости",
            items: [
              {
                id: "advice-1",
                contentId: "content-4",
                title: "Как удалить ржавчину с инструментов",
                content: "Смешайте уксус с солью в пропорции 1:1, нанесите на ржавчину...",
                type: "text",
                author: "Михаил Волков",
                authorLogin: "misha_master",
                userId: "user4",
                date: "2024-02-10",
                likes: 42,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 56,
                  distribution: { "🤝": 18, "👍": 14, "👏": 10, "🔨": 8, "💫": 4, "🎨": 2 },
                  topEmoji: "🤝",
                  topCount: 18
                }
              }
            ]
          },
          {
            id: "advice-garden",
            title: "Сад и огород",
            items: [
              {
                id: "advice-2",
                contentId: "content-5",
                title: "Натуральное удобрение из банановой кожуры",
                content: "Банановую кожуру залейте водой и настаивайте 3 дня...",
                type: "text",
                author: "Светлана Петрова",
                authorLogin: "sveta_garden",
                userId: "user5",
                date: "2024-02-12",
                likes: 28,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 34,
                  distribution: { "👍": 10, "👏": 8, "🔨": 6, "🤝": 5, "💫": 3, "🎨": 2 },
                  topEmoji: "👍",
                  topCount: 10
                }
              }
            ]
          }
        ]
      },
      {
        id: "drawings",
        title: "Чертежи и схемы",
        icon: "📐",
        words: ["ЧЕРТЕЖИ", "СХЕМЫ"],
        allowedTypes: ["drawing", "photo"],
        fileExtensions: [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".dwg"],
        maxFileSize: 20 * 1024 * 1024,
        subsections: [
          {
            id: "drawings-furniture",
            title: "Мебель",
            items: [
              {
                id: "drawing-1",
                contentId: "content-6",
                title: "Чертеж садовой скамейки",
                content: "Чертеж садовой скамейки из дерева. Размеры: 1200х400х450мм",
                type: "drawing",
                author: "Алексей Смирнов",
                authorLogin: "alex_wood",
                userId: "user6",
                date: "2024-02-05",
                likes: 56,
                thumbnail: "/thumbnails/bench.jpg",
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 67,
                  distribution: { "🔨": 34, "👍": 20, "👏": 10, "💫": 3 },
                  topEmoji: "🔨",
                  topCount: 34
                }
              }
            ]
          },
          {
            id: "drawings-tools",
            title: "Инструменты и приспособления",
            items: [
              {
                id: "drawing-2",
                contentId: "content-7",
                title: "Самодельный струбцина",
                content: "Чертеж быстрозажимной струбцины из металла",
                type: "drawing",
                author: "Дмитрий Ковалев",
                authorLogin: "dmitry_metal",
                userId: "user7",
                date: "2024-02-08",
                likes: 34,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 45,
                  distribution: { "🔨": 22, "👍": 15, "👏": 5, "💫": 3 },
                  topEmoji: "🔨",
                  topCount: 22
                }
              }
            ]
          }
        ]
      },
      {
        id: "photos-videos",
        title: "Фото и видео",
        icon: "📷",
        words: ["ВИДЕО", "ФОТО"],
        allowedTypes: ["photo", "video"],
        fileExtensions: [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".avi", ".mov", ".webm"],
        maxFileSize: 100 * 1024 * 1024,
        subsections: [
          {
            id: "photos",
            title: "Фотографии",
            items: [
              {
                id: "photo-1",
                contentId: "content-8",
                title: "Реконструкция старого верстака",
                content: "Фото процесса реконструкции верстака 1950-х годов",
                type: "photo",
                author: "Игорь Николаев",
                authorLogin: "igor_restore",
                userId: "user8",
                date: "2024-02-14",
                likes: 47,
                thumbnail: "/thumbnails/workbench.jpg",
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 78,
                  distribution: { "👍": 40, "👏": 20, "🔨": 15, "💫": 3 },
                  topEmoji: "👍",
                  topCount: 40
                }
              }
            ]
          },
          {
            id: "videos",
            title: "Видеоуроки",
            items: [
              {
                id: "video-1",
                contentId: "content-9",
                title: "Как правильно паять микросхемы",
                content: "Видеоурок по пайке SMD компонентов",
                type: "video",
                author: "Сергей Радиолюбитель",
                authorLogin: "sergey_electronics",
                userId: "user9",
                date: "2024-02-16",
                likes: 89,
                thumbnail: "/thumbnails/soldering.jpg",
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 92,
                  distribution: { "👏": 45, "👍": 30, "🔨": 12, "💫": 5 },
                  topEmoji: "👏",
                  topCount: 45
                }
              }
            ]
          }
        ]
      },
      {
        id: "misc",
        title: "Разное",
        icon: "📦",
        words: ["РАЗНОЕ"],
        allowedTypes: ["text", "photo", "drawing", "video", "other"],
        fileExtensions: [".txt", ".md", ".pdf", ".zip", ".rar", ".jpg", ".png"],
        maxFileSize: 50 * 1024 * 1024,
        subsections: [
          {
            id: "misc-ideas",
            title: "Идеи и вдохновение",
            items: [
              {
                id: "idea-1",
                contentId: "content-10",
                title: "Органайзер для мелочей из пластиковых бутылок",
                content: "Идея создания органайзера из подручных материалов",
                type: "other",
                author: "Ольга Творческая",
                authorLogin: "olga_creative",
                userId: "user10",
                date: "2024-02-19",
                likes: 23,
                // 👇 ДЕМО-ДАННЫЕ ПОХВАЛ
                praises: {
                  total: 28,
                  distribution: { "💡": 12, "👍": 8, "🔨": 5, "👏": 3 },
                  topEmoji: "💡",
                  topCount: 12
                }
              }
            ]
          }
        ]
      }
    ];
    
    // Загружаем сохраненные данные из localStorage
    const savedData = localStorage.getItem('library_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setLibraryData(parsed);
      } catch (e) {
        console.error('Ошибка загрузки данных библиотеки:', e);
        setLibraryData(mockData);
      }
    } else {
      setLibraryData(mockData);
    }
    
    const savedLikes = localStorage.getItem('library_liked_items');
    if (savedLikes) {
      try {
        const parsed = JSON.parse(savedLikes);
        setLikedItems(new Set(parsed));
      } catch (e) {
        console.error('Ошибка загрузки лайков:', e);
      }
    }
  }, []);

  // Сохраняем данные при изменениях
  useEffect(() => {
    if (libraryData.length > 0) {
      localStorage.setItem('library_data', JSON.stringify(libraryData));
    }
  }, [libraryData]);

  useEffect(() => {
    if (selectedSubsection && mainContainerRef.current) {
      setShowScrollHint(true);
      
      const container = mainContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      
      if (scrollWidth > clientWidth && container.scrollLeft < scrollWidth - clientWidth - 10) {
        setShowScrollHint(true);
        
        const timer = setTimeout(() => {
          setShowScrollHint(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      } else {
        setShowScrollHint(false);
      }
    } else {
      setShowScrollHint(false);
    }
  }, [selectedSubsection]);

  const handleScroll = () => {
    if (mainContainerRef.current) {
      const container = mainContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      
      if (container.scrollLeft >= scrollWidth - clientWidth - 10) {
        setShowScrollHint(false);
      }
    }
  };

  // Закрытие модалки по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Добавление нового подраздела через модальное окно
  const handleAddSubsection = (subsectionTitle: string) => {
    if (!selectedShelfForAdd || !isAuthenticated || !user) {
      alert('Необходимо авторизоваться');
      return;
    }

    const newSubsection: Subsection = {
      id: generateId(),
      title: subsectionTitle,
      items: [],
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };

    setLibraryData(prev => prev.map(shelf => 
      shelf.id === selectedShelfForAdd.id
        ? { ...shelf, subsections: [...shelf.subsections, newSubsection] }
        : shelf
    ));

    // Начисляем баллы за создание подраздела
    if (ratingContext && typeof (ratingContext as any).addRating === 'function') {
      (ratingContext as any).addRating({
        userId: user.id,
        points: RATING_POINTS.CREATE_SUBSECTION,
        reason: `created_subsection_${newSubsection.id}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Добавление документа
  const handleAddDocument = (docData: any) => {
    if (!selectedSubsectionForAdd || !isAuthenticated || !user) return;

    setLibraryData(prev => prev.map(shelf => 
      shelf.id === selectedShelfForAdd?.id
        ? {
            ...shelf,
            subsections: shelf.subsections.map(sub =>
              sub.id === selectedSubsectionForAdd.id
                ? { ...sub, items: [...sub.items, docData] }
                : sub
            )
          }
        : shelf
    ));

    // Начисляем баллы за добавление документа
    if (ratingContext && typeof (ratingContext as any).addRating === 'function') {
      let points = RATING_POINTS.ADD_DOCUMENT;
      if (docData.type === 'photo') points = RATING_POINTS.ADD_PHOTO;
      if (docData.type === 'video') points = RATING_POINTS.ADD_VIDEO;
      if (docData.type === 'drawing') points = RATING_POINTS.ADD_DRAWING;

      (ratingContext as any).addRating({
        userId: user.id,
        points,
        reason: `added_${docData.type}_${docData.id}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Открытие модалки добавления подраздела
  const openAddSubsectionModal = (shelf: Section) => {
    setSelectedShelfForAdd(shelf);
    setShowAddSubsection(true);
  };

  // Открытие модалки добавления документа
  const openAddDocumentModal = (shelf: Section, subsection: Subsection) => {
    setSelectedShelfForAdd(shelf);
    setSelectedSubsectionForAdd(subsection);
    setShowAddDocument(true);
  };

  const handleShelfClick = (shelfId: string) => {
    if (selectedShelf === shelfId) {
      setSelectedShelf(null);
      setSelectedSubsection(null);
      setSelectedItem(null);
    } else {
      setSelectedShelf(shelfId);
      setSelectedSubsection(null);
      setSelectedItem(null);
    }
  };

  const handleSubsectionClick = (subsectionId: string) => {
    setSelectedSubsection(subsectionId);
    setSelectedItem(null);
    
    setTimeout(() => {
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTo({
          left: mainContainerRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // 👇 При клике на документ просто устанавливаем выбранный элемент
  const handleItemClick = (item: LibraryItem) => {
    setSelectedItem(item);
    
    // Устанавливаем контент для системы похвалы
    praiseContext.setCurrentContent({
      id: item.contentId,
      authorId: item.userId,
      title: item.title,
      type: 'LIBRARY',
      authorName: item.author
    });
  };

  const handleCloseItem = () => {
    setSelectedItem(null);
    praiseContext.clearCurrentContent();
  };

  const handleLike = async (item: LibraryItem) => {
    if (!isAuthenticated) {
      alert('Необходимо авторизоваться, чтобы ставить лайки');
      return;
    }

    const itemId = item.id;
    const isLiked = likedItems.has(itemId);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newLikedItems = new Set(likedItems);
      
      if (isLiked) {
        newLikedItems.delete(itemId);
        
        if (ratingContext && typeof (ratingContext as any).addRating === 'function') {
          (ratingContext as any).addRating({
            userId: user?.id,
            points: -1,
            reason: `unlike_library_item_${itemId}`,
            timestamp: new Date().toISOString()
          });
        }
        
      } else {
        newLikedItems.add(itemId);
        
        // Начисляем баллы автору за лайк
        if (ratingContext && typeof (ratingContext as any).addRating === 'function') {
          (ratingContext as any).addRating({
            userId: item.userId,
            points: RATING_POINTS.RECEIVE_LIKE,
            reason: `received_like_${itemId}`,
            timestamp: new Date().toISOString()
          });
          
          // Начисляем баллы пользователю за активность
          (ratingContext as any).addRating({
            userId: user?.id,
            points: 1,
            reason: `like_activity_${itemId}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      setLikedItems(newLikedItems);
      localStorage.setItem('library_liked_items', JSON.stringify(Array.from(newLikedItems)));
      
      // Обновить данные в библиотеке
      const updatedData = libraryData.map(section => ({
        ...section,
        subsections: section.subsections.map(sub => ({
          ...sub,
          items: sub.items.map(i => 
            i.id === itemId 
              ? { ...i, likes: isLiked ? i.likes - 1 : i.likes + 1, userLiked: !isLiked }
              : i
          )
        }))
      }));
      
      setLibraryData(updatedData);
      
    } catch (error) {
      console.error('Ошибка при обработке лайка:', error);
    }
  };

  const getCurrentItems = () => {
    if (!selectedSubsection) return [];
    
    for (const section of libraryData) {
      for (const sub of section.subsections) {
        if (sub.id === selectedSubsection) {
          return sub.items;
        }
      }
    }
    return [];
  };

  const getCurrentSection = () => {
    return libraryData.find(s => s.id === selectedShelf);
  };

  const getCurrentSubsection = () => {
    if (!selectedSubsection) return null;
    for (const section of libraryData) {
      for (const sub of section.subsections) {
        if (sub.id === selectedSubsection) {
          return sub;
        }
      }
    }
    return null;
  };

  if (!isOpen) return null;

  const currentItems = getCurrentItems();
  const currentSection = getCurrentSection();
  const currentSubsection = getCurrentSubsection();

  return (
    <div className="library-modal-overlay" onClick={onClose}>
      <div className="library-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Кнопка закрытия */}
        <button className="library-close-button" onClick={onClose}>✕</button>
        
        {/* Заголовок (центрированный) */}
        <div className="library-header">
          <h2 className="library-title">Библиотека знаний</h2>
          <p className="library-subtitle">Хранилище полезных документов и материалов</p>
        </div>

        {/* Основное содержимое */}
        <div 
          className="library-main" 
          ref={mainContainerRef}
          onScroll={handleScroll}
        >
          
          {/* Стрелка-подсказка */}
          {showScrollHint && (
            <div className="scroll-hint">
              <div className="scroll-hint-arrow">→</div>
              <div className="scroll-hint-text">Сдвиньте вправо</div>
            </div>
          )}
          
          {/* Стеллажи (левая панель) */}
          <div className="library-shelves">
            {libraryData.map((shelf, index) => {
              const isLeftEdge = index === 0;
              const isRightEdge = index === libraryData.length - 1;
              const shelfClass = shelf.id === "advice" ? "advice-shelf" : "";
              
              return (
                <div 
                  key={shelf.id}
                  className={`library-shelf ${shelfClass} ${selectedShelf === shelf.id ? 'active' : ''} 
                    ${isLeftEdge ? 'left-edge' : ''} ${isRightEdge ? 'right-edge' : ''}`}
                  onClick={() => handleShelfClick(shelf.id)}
                >
                  <div className="shelf-side">
                    <div className="shelf-label">
                      <span className="shelf-icon">{shelf.icon}</span>
                      {shelf.words ? (
                        <div className="shelf-words">
                          {shelf.words.map((word, idx) => (
                            <span key={idx} className="shelf-word">
                              {word}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="shelf-word">{shelf.title}</span>
                      )}
                    </div>
                    
                    <div className="book-spines">
                      {[...Array(8 + Math.floor(Math.random() * 8))].map((_, i) => (
                        <div 
                          key={i} 
                          className="book-spine"
                          style={{
                            height: `${50 + Math.random() * 80}px`,
                            width: `${8 + Math.random() * 10}px`,
                            backgroundColor: `hsl(${Math.random() * 60 + 20}, 70%, ${30 + Math.random() * 20}%)`,
                            transform: `rotate(${Math.random() * 4 - 2}deg)`,
                            marginLeft: i > 0 ? `${Math.random() * 6 - 3}px` : '0'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {index < libraryData.length - 1 && (
                    <div className="shelf-passage">
                      <div className="passage-lamp"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Панель с подразделами */}
          {selectedShelf && currentSection && (
            <div className="library-subsections-panel">
              <h3 className="subsections-title">
                {currentSection.icon} {currentSection.title}
              </h3>
              {isAuthenticated && (
                <button 
                  className="add-subsection-button"
                  onClick={() => openAddSubsectionModal(currentSection)}
                >
                  ➕ Добавить раздел
                </button>
              )}
              <div className="subsections-list">
                {currentSection.subsections.map(sub => (
                  <button
                    key={sub.id}
                    className={`subsection-button ${selectedSubsection === sub.id ? 'active' : ''}`}
                    onClick={() => handleSubsectionClick(sub.id)}
                  >
                    <span className="subsection-icon">📁</span>
                    <span className="subsection-name">{sub.title}</span>
                    <span className="subsection-count">{sub.items.length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Панель со списком документов */}
          {selectedSubsection && (
            <div className="library-items-panel">
              <div className="items-header">
                <h3 className="items-title">Документы</h3>
                {isAuthenticated && currentSection && currentSubsection && (
                  <button 
                    className="add-document-button"
                    onClick={() => openAddDocumentModal(currentSection, currentSubsection)}
                    title="Добавить документ"
                  >
                    ➕ Добавить документ
                  </button>
                )}
              </div>
              <div className="items-list">
                {currentItems.length > 0 ? (
                  currentItems.map(item => (
                    <div 
                      key={item.id}
                      className={`item-card ${selectedItem?.id === item.id ? 'active' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="item-icon">
                        {item.type === 'text' && '📄'}
                        {item.type === 'photo' && '🖼️'}
                        {item.type === 'drawing' && '📐'}
                        {item.type === 'video' && '🎬'}
                        {item.type === 'other' && '📦'}
                      </div>
                      <div className="item-info">
                        <div className="item-title">{item.title}</div>
                        <div className="item-meta">
                          <span className="item-author">👤 {item.author}</span>
                          <span className="item-date">📅 {item.date}</span>
                          <span className="item-likes">❤️ {item.likes}</span>
                        </div>
                        <PraiseStatsCompact item={item} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-items">
                    <p>В этом разделе пока нет документов</p>
                    {isAuthenticated && currentSection && currentSubsection && (
                      <button 
                        className="add-first-document-button"
                        onClick={() => openAddDocumentModal(currentSection, currentSubsection)}
                      >
                        ➕ Добавить первый документ
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Модалка просмотра документа */}
        {selectedItem && (
          <div className="item-view-modal">
            <div className="item-view-content">
              <button className="item-view-close" onClick={handleCloseItem}>✕</button>
              
              <div className="item-view-header">
                <h2>{selectedItem.title}</h2>
                <div className="item-view-meta">
                  <span>Автор: {selectedItem.author}</span>
                  <span>Дата: {selectedItem.date}</span>
                  {selectedItem.fileName && (
                    <span>Файл: {selectedItem.fileName} ({formatFileSize(selectedItem.fileSize || 0)})</span>
                  )}
                </div>
              </div>

              <div className="item-view-body">
                {selectedItem.type === 'text' && (
                  <div className="item-text-content">{selectedItem.content}</div>
                )}
                
                {selectedItem.type === 'photo' && selectedItem.fileUrl && (
                  <div className="item-image-container">
                    <img src={selectedItem.fileUrl} alt={selectedItem.title} />
                  </div>
                )}
                
                {selectedItem.type === 'drawing' && (
                  <div className="item-drawing-container">
                    {selectedItem.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img src={selectedItem.fileUrl} alt={selectedItem.title} />
                    ) : (
                      <div className="item-file-placeholder">
                        <div className="placeholder-icon">📐</div>
                        <p>{selectedItem.content}</p>
                        <a 
                          href={selectedItem.fileUrl} 
                          download={selectedItem.fileName}
                          className="download-file-button"
                        >
                          ⬇️ Скачать файл
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedItem.type === 'video' && selectedItem.fileUrl && (
                  <div className="item-video-container">
                    <video controls>
                      <source src={selectedItem.fileUrl} type={selectedItem.fileType} />
                      Ваш браузер не поддерживает видео.
                    </video>
                  </div>
                )}
                
                {selectedItem.type === 'other' && (
                  <div className="item-file-placeholder">
                    <div className="placeholder-icon">📦</div>
                    <p>{selectedItem.content}</p>
                    {selectedItem.fileUrl && (
                      <a 
                        href={selectedItem.fileUrl} 
                        download={selectedItem.fileName}
                        className="download-file-button"
                      >
                        ⬇️ Скачать файл
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Нижняя панель */}
              <div className="item-view-footer">
                <div className="footer-left">
                  <span className="footer-login">
                    👤 {selectedItem.authorLogin}
                  </span>
                </div>

                {/* 👇 СТАТИСТИКА ПОХВАЛ - ТЕПЕРЬ ВСЕГДА ВИДНА */}
                <div className="footer-center">
                  <PraiseStatsDetailed item={selectedItem} />
                </div>

                <div className="footer-right">
                  <button 
                    className={`like-button ${likedItems.has(selectedItem.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(selectedItem)}
                    disabled={!isAuthenticated}
                  >
                    <span className="like-icon">❤️</span>
                    <span className="like-count">{selectedItem.likes}</span>
                    <span className="like-text">
                      {likedItems.has(selectedItem.id) ? 'Вы поблагодарили' : 'Поблагодарить'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модалка добавления подраздела */}
      <AddSubsectionModal
        isOpen={showAddSubsection}
        onClose={() => {
          setShowAddSubsection(false);
          setSelectedShelfForAdd(null);
        }}
        onAdd={handleAddSubsection}
        shelfTitle={selectedShelfForAdd?.title || ''}
      />

      {/* Модалка добавления документа */}
      {selectedSubsectionForAdd && selectedShelfForAdd && (
        <AddDocumentModal
          isOpen={showAddDocument}
          onClose={() => {
            setShowAddDocument(false);
            setSelectedSubsectionForAdd(null);
            setSelectedShelfForAdd(null);
          }}
          onAdd={handleAddDocument}
          subsection={selectedSubsectionForAdd}
          shelf={selectedShelfForAdd}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default LibraryModal;
