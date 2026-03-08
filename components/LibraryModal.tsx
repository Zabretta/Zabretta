"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./LibraryModal.css";
import { useAuth } from "./useAuth";
import { usePraise } from "./PraiseContext";
import { libraryApi, LibrarySection as ApiLibrarySection, LibrarySubsection as ApiLibrarySubsection, LibraryItem as ApiLibraryItem } from "@/lib/api/library";
import { SECTION_UPLOAD_CONFIG, UPLOAD_LIMITS, formatFileSize as configFormatFileSize, validateFile } from "@/lib/config/uploads";

// Типы для ответов API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface ItemsResponse {
  data: ApiLibraryItem[];
  total: number;
  page: number;
  limit: number;
}

// Расширяем типы из API, добавляя нужные поля
interface ExtendedApiLibraryItem extends ApiLibraryItem {
  canEdit?: boolean;
  canDelete?: boolean;
}

interface ExtendedApiLibrarySubsection extends ApiLibrarySubsection {
  canEdit?: boolean;
  canDelete?: boolean;
}

// Типы данных (используем расширенные типы)
interface LibraryItem extends ExtendedApiLibraryItem {
  contentId: string;
}

interface Subsection extends Omit<ExtendedApiLibrarySubsection, 'items'> {
  items: LibraryItem[];
  createdBy?: string;
  createdAt?: string;
}

interface Section extends Omit<ApiLibrarySection, 'subsections'> {
  subsections: Subsection[];
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

// Типы для конфигурации загрузок
interface TextContentConfig {
  type: 'text';
  fileRequired: boolean;
  description: string;
}

interface FileContentConfig {
  type: string;
  fileRequired: boolean;
  MAX_SIZE: number;
  ALLOWED_TYPES: string[];
  ALLOWED_EXTENSIONS: string[];
  DESCRIPTION: string;
}

type ContentTypeConfig = TextContentConfig | FileContentConfig;

// Получаем конфигурацию для библиотеки из центрального конфига
const LIBRARY_CONFIG = SECTION_UPLOAD_CONFIG.LIBRARY;

// Маппинг ID стеллажей на ключи в конфиге
const SHELF_ID_TO_CONFIG_KEY: Record<string, string> = {
  recipes: 'recipes',
  advice: 'advice',
  drawings: 'drawings',
  'photos-videos': 'photos-videos',
  misc: 'misc'
};

// Система баллов
const RATING_POINTS = {
  CREATE_SUBSECTION: 5,
  ADD_DOCUMENT: 10,
  ADD_PHOTO: 15,
  ADD_VIDEO: 20,
  ADD_DRAWING: 15,
  RECEIVE_PRAISE: 5
};

// Массив похвал с маппингом типов на эмодзи
const PRAISE_EMOJIS: Record<string, string> = {
  "👍": "Молодец!",
  "👏": "Отличная работа!",
  "🔨": "Мастер золотые руки!",
  "💫": "Вдохновляет!",
  "🎨": "Креативно!",
  "🔍": "Детально проработано",
  "🤝": "Полезный совет!",
  "🙏": "Спасибо!"
};

// Маппинг типов похвал из БД в эмодзи
const PRAISE_TYPE_TO_EMOJI: Record<string, string> = {
  'GREAT': '👍',
  'EXCELLENT': '👏',
  'MASTER': '🔨',
  'INSPIRING': '💫',
  'CREATIVE': '🎨',
  'DETAILED': '🔍',
  'HELPFUL': '🤝',
  'THANKS': '🙏'
};

// Вспомогательная функция для проверки, является ли конфиг файловым
function isFileConfig(config: ContentTypeConfig): config is FileContentConfig {
  return 'MAX_SIZE' in config;
}

// 👇 КОМПОНЕНТ: статистика похвал для карточки документа
const PraiseStatsCompact: React.FC<{ item: LibraryItem }> = ({ item }) => {
  if (!item.praises || item.praises.total === 0) return null;
  
  // Получаем эмодзи для топа
  const topEmoji = item.praises.topEmoji ? PRAISE_TYPE_TO_EMOJI[item.praises.topEmoji] || '🔨' : '🔨';
  
  return (
    <div className="praise-stats-compact">
      <span className="total" title="Всего похвал">
        🔨 {item.praises.total}
      </span>
      {item.praises.topEmoji && item.praises.topCount > 0 && (
        <span className="top-emoji" title={`${PRAISE_EMOJIS[topEmoji] || 'Похвала'}`}>
          {topEmoji} {item.praises.topCount}
        </span>
      )}
    </div>
  );
};

// 👇 КОМПОНЕНТ: детальная статистика похвал для модального окна
const PraiseStatsDetailed: React.FC<{ item: LibraryItem }> = ({ item }) => {
  // Маппинг типов похвал на эмодзи
  const praiseTypeToEmoji: Record<string, string> = {
    'GREAT': '👍',
    'EXCELLENT': '👏',
    'MASTER': '🔨',
    'INSPIRING': '💫',
    'CREATIVE': '🎨',
    'DETAILED': '🔍',
    'HELPFUL': '🤝',
    'THANKS': '🙏'
  };

  if (!item.praises || !item.praises.distribution) {
    return (
      <div className="praise-stats-detailed">
        <div style={{ color: 'white', textAlign: 'center' }}>
          ⏳ Нет данных о похвалах
        </div>
      </div>
    );
  }

  // Преобразуем ключи в эмодзи для отображения
  const distributionWithEmojis = Object.entries(item.praises.distribution).map(([key, count]) => {
    const emoji = praiseTypeToEmoji[key] || '🔨'; // По умолчанию молоток
    return { emoji, count: count as number, originalKey: key };
  });

  const topEmotions = distributionWithEmojis
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  
  const maxCount = topEmotions.length > 0 ? topEmotions[0].count : 1;

  return (
    <div className="praise-stats-detailed">
      <div className="praise-total">
        <span className="total-icon">🔨</span>
        <span className="total-count">{item.praises.total}</span>
        <span className="total-label">всего похвал</span>
      </div>
      
      <div className="praise-distribution">
        {topEmotions.map(({ emoji, count, originalKey }) => (
          <div key={originalKey} className="praise-stat-item">
            <span className="stat-emoji">{emoji}</span>
            <span className="stat-count">{count}</span>
            <div className="stat-bar-container">
              <div 
                className="stat-bar" 
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== МОДАЛЬНЫЕ ОКНА ДЛЯ РЕДАКТИРОВАНИЯ И УДАЛЕНИЯ ==========

// Модальное окно редактирования подраздела
const EditSubsectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTitle: string) => void;
  currentTitle: string;
  shelfTitle: string;
}> = ({ isOpen, onClose, onSave, currentTitle, shelfTitle }) => {
  const [title, setTitle] = useState(currentTitle);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && title.trim() !== currentTitle) {
      onSave(title.trim());
      onClose();
    }
  };

  return (
    <div className="edit-subsection-modal-overlay" onClick={onClose}>
      <div className="edit-subsection-modal-content" onClick={e => e.stopPropagation()}>
        <button className="edit-subsection-close-button" onClick={onClose}>✕</button>
        <h2 className="edit-subsection-title">✏️ Редактировать раздел</h2>
        <p className="edit-subsection-subtitle">в разделе «{shelfTitle}»</p>
        
        <form onSubmit={handleSubmit}>
          <div className="edit-subsection-form-group">
            <label>Название раздела</label>
            <input
              type="text"
              className="edit-subsection-input"
              placeholder="Введите новое название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>
          
          <div className="edit-subsection-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">Изменение названия раздела может повлиять на навигацию пользователей.</span>
          </div>

          <div className="edit-subsection-buttons">
            <button type="button" className="edit-subsection-cancel" onClick={onClose}>Отмена</button>
            <button 
              type="submit" 
              className="edit-subsection-submit" 
              disabled={!title.trim() || title.trim() === currentTitle}
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Модальное окно удаления подраздела
const DeleteSubsectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subsectionTitle: string;
  itemsCount: number;
}> = ({ isOpen, onClose, onConfirm, subsectionTitle, itemsCount }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-subsection-modal-overlay" onClick={onClose}>
      <div className="delete-subsection-modal-content" onClick={e => e.stopPropagation()}>
        <button className="delete-subsection-close-button" onClick={onClose}>✕</button>
        <h2 className="delete-subsection-title">🗑️ Удалить раздел</h2>
        
        <div className="delete-subsection-info">
          <div className="info-item">
            <span className="info-label">Раздел:</span>
            <span className="info-value">{subsectionTitle}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Документов в разделе:</span>
            <span className="info-value">{itemsCount}</span>
          </div>
        </div>
        
        <p className="delete-subsection-warning">
          Это действие <strong>нельзя будет отменить</strong>. Все документы внутри раздела будут безвозвратно удалены.
        </p>

        <div className="delete-subsection-buttons">
          <button type="button" className="delete-subsection-cancel" onClick={onClose}>Отмена</button>
          <button type="button" className="delete-subsection-confirm" onClick={onConfirm}>
            Удалить раздел
          </button>
        </div>
      </div>
    </div>
  );
};

// Модальное окно редактирования документа
const EditDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: any) => void;
  document: LibraryItem;
  shelf: Section;
}> = ({ isOpen, onClose, onSave, document, shelf }) => {
  const [docTitle, setDocTitle] = useState(document.title);
  const [docContent, setDocContent] = useState(document.content);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Получаем конфигурацию для текущего стеллажа и типа документа
  const shelfConfigKey = SHELF_ID_TO_CONFIG_KEY[shelf.id] || 'misc';
  const shelfConfig = LIBRARY_CONFIG.SHELVES[shelfConfigKey as keyof typeof LIBRARY_CONFIG.SHELVES];
  
  // Определяем разрешенные типы для текущего документа
  const contentType = document.type;
  const contentTypeConfig = LIBRARY_CONFIG.CONTENT_TYPES[contentType as keyof typeof LIBRARY_CONFIG.CONTENT_TYPES] as ContentTypeConfig;

  if (!isOpen) return null;

  const handleFileSelect = (file: File | null) => {
    setFileError(null);
    
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Проверяем, разрешен ли тип файла для этого стеллажа
    if (!shelfConfig.allowedTypes.includes(contentType)) {
      setFileError(`Этот стеллаж не поддерживает файлы типа ${contentType}`);
      return;
    }

    // Валидируем файл только если это файловый тип
    if (isFileConfig(contentTypeConfig)) {
      const validation = validateFile(file, contentTypeConfig);
      if (!validation.valid) {
        setFileError(validation.error);
        return;
      }
    }

    setSelectedFile(file);

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

    if (fileError) {
      alert(fileError);
      return;
    }

    onSave({
      id: document.id,
      title: docTitle.trim(),
      content: docContent.trim(),
      type: document.type,
      ...(selectedFile && {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        fileUrl: URL.createObjectURL(selectedFile)
      })
    });
    onClose();
  };

  return (
    <div 
      className="edit-document-modal-overlay" 
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('edit-document-modal-overlay')) {
          onClose();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="edit-document-modal-content" onClick={e => e.stopPropagation()}>
        <button className="edit-document-close-button" onClick={onClose}>✕</button>
        <h2 className="edit-document-title">✏️ Редактировать документ</h2>
        <p className="edit-document-subtitle">«{document.title}»</p>
        
        <form onSubmit={handleSubmit}>
          <div className="edit-document-form-group">
            <label>Название:</label>
            <input
              type="text"
              className="edit-document-input"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Введите название документа"
              maxLength={100}
              required
            />
          </div>

          {contentType === 'text' && (
            <div className="edit-document-form-group">
              <label>Содержание:</label>
              <textarea
                className="edit-document-textarea"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Введите текст документа"
                rows={5}
              />
            </div>
          )}

          {contentType !== 'text' && isFileConfig(contentTypeConfig) && (
            <div className="edit-document-form-group">
              <label>Заменить файл (необязательно):</label>
              <div 
                className={`edit-document-file-area ${isDragging ? 'dragging' : ''} ${fileError ? 'has-error' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  accept={contentTypeConfig.ALLOWED_EXTENSIONS.join(',')}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div className="edit-document-file-info">
                    <span className="file-icon">📎</span>
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">({configFormatFileSize(selectedFile.size)})</span>
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
                    <p>Нажмите для выбора файла или перетащите</p>
                    <p className="file-upload-hint">Текущий файл: {document.fileName || 'не прикреплен'}</p>
                    <p className="file-upload-extensions">
                      Поддерживаются: {contentTypeConfig.ALLOWED_EXTENSIONS.join(', ')}
                    </p>
                    <p className="file-upload-size">
                      Макс. размер: {configFormatFileSize(contentTypeConfig.MAX_SIZE)}
                    </p>
                    <p className="file-upload-description">
                      {contentTypeConfig.DESCRIPTION}
                    </p>
                  </>
                )}
              </div>
              {fileError && (
                <div className="file-error-message">
                  ⚠️ {fileError}
                </div>
              )}
            </div>
          )}

          {filePreview && (
            <div className="edit-document-preview">
              <img src={filePreview} alt="Preview" />
            </div>
          )}

          <div className="edit-document-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">Изменения будут видны всем пользователям сразу после сохранения.</span>
          </div>

          <div className="edit-document-buttons">
            <button type="button" className="edit-document-cancel" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="edit-document-submit"
              disabled={!docTitle.trim() || (fileError !== null)}
            >
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Модальное окно удаления документа
const DeleteDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentTitle: string;
  documentType: string;
  authorName: string;
}> = ({ isOpen, onClose, onConfirm, documentTitle, documentType, authorName }) => {
  if (!isOpen) return null;

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'text': return 'Текстовый документ';
      case 'photo': return 'Фотография';
      case 'drawing': return 'Чертеж/Схема';
      case 'video': return 'Видео';
      default: return 'Документ';
    }
  };

  return (
    <div className="delete-document-modal-overlay" onClick={onClose}>
      <div className="delete-document-modal-content" onClick={e => e.stopPropagation()}>
        <button className="delete-document-close-button" onClick={onClose}>✕</button>
        <h2 className="delete-document-title">🗑️ Удалить документ</h2>
        
        <div className="delete-document-info">
          <div className="info-item">
            <span className="info-label">Название:</span>
            <span className="info-value">{documentTitle}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Тип:</span>
            <span className="info-value">{getTypeLabel(documentType)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Автор:</span>
            <span className="info-value">{authorName}</span>
          </div>
        </div>
        
        <p className="delete-document-warning">
          Это действие <strong>нельзя будет отменить</strong>. Документ будет безвозвратно удален из библиотеки.
        </p>

        <div className="delete-document-buttons">
          <button type="button" className="delete-document-cancel" onClick={onClose}>Отмена</button>
          <button type="button" className="delete-document-confirm" onClick={onConfirm}>
            Удалить документ
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== МОДАЛЬНЫЕ ОКНА ДОБАВЛЕНИЯ ==========

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
          <div className="add-subsection-form-group">
            <label>Название раздела</label>
            <input
              type="text"
              className="add-subsection-input"
              placeholder="Введите название раздела"
              value={subsectionTitle}
              onChange={(e) => setSubsectionTitle(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>
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
  const [docType, setDocType] = useState<"text" | "photo" | "drawing" | "video" | "other">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Получаем конфигурацию для текущего стеллажа
  const shelfConfigKey = SHELF_ID_TO_CONFIG_KEY[shelf.id] || 'misc';
  const shelfConfig = LIBRARY_CONFIG.SHELVES[shelfConfigKey as keyof typeof LIBRARY_CONFIG.SHELVES];
  
  // Получаем конфигурацию для выбранного типа контента
  const contentTypeConfig = LIBRARY_CONFIG.CONTENT_TYPES[docType as keyof typeof LIBRARY_CONFIG.CONTENT_TYPES] as ContentTypeConfig;

  if (!isOpen) return null;

  const handleFileSelect = (file: File | null) => {
    setFileError(null);
    
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Проверяем, разрешен ли тип файла для этого стеллажа
    if (!shelfConfig.allowedTypes.includes(docType)) {
      setFileError(`Этот стеллаж не поддерживает файлы типа ${docType}`);
      return;
    }

    // Валидируем файл только если это файловый тип
    if (isFileConfig(contentTypeConfig)) {
      const validation = validateFile(file, contentTypeConfig);
      if (!validation.valid) {
        setFileError(validation.error);
        return;
      }
    }

    setSelectedFile(file);

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

  const handleTypeChange = (type: "text" | "photo" | "drawing" | "video" | "other") => {
    setDocType(type);
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!docTitle.trim()) {
      alert('Введите название документа');
      return;
    }

    if (docType === 'text' && !docContent.trim()) {
      alert('Добавьте содержание документа');
      return;
    }

    if (docType !== 'text' && !selectedFile) {
      alert('Выберите файл для загрузки');
      return;
    }

    if (fileError) {
      alert(fileError);
      return;
    }

    const newDoc: any = {
      title: docTitle.trim(),
      content: docContent.trim(),
      type: docType,
      sectionId: shelf.id,
      subsectionId: subsection.id
    };

    if (selectedFile) {
      newDoc.fileName = selectedFile.name;
      newDoc.fileSize = selectedFile.size;
      newDoc.fileType = selectedFile.type;
      newDoc.fileUrl = URL.createObjectURL(selectedFile);
    }

    onAdd(newDoc);
    setDocTitle("");
    setDocContent("");
    setDocType("text");
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
    onClose();
  };

  return (
    <div 
      className="add-document-modal-overlay" 
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('add-document-modal-overlay')) {
          onClose();
        }
      }}
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

          <div className="add-document-form-group">
            <label>Тип документа:</label>
            <div className="document-type-selector">
              {shelfConfig.allowedTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`type-button ${docType === type ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type as any)}
                >
                  {type === 'text' && '📄 Текст'}
                  {type === 'photo' && '🖼️ Фото'}
                  {type === 'drawing' && '📐 Чертеж'}
                  {type === 'video' && '🎬 Видео'}
                  {type === 'other' && '📦 Другое'}
                </button>
              ))}
            </div>
          </div>

          {docType === 'text' && (
            <div className="add-document-form-group">
              <label>Содержание:</label>
              <textarea
                className="add-document-textarea"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Введите текст документа"
                rows={5}
                required={docType === 'text'}
              />
            </div>
          )}

          {docType !== 'text' && isFileConfig(contentTypeConfig) && (
            <div className="add-document-form-group">
              <label>Загрузите файл:</label>
              <div 
                className={`add-document-file-area ${isDragging ? 'dragging' : ''} ${fileError ? 'has-error' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  accept={contentTypeConfig.ALLOWED_EXTENSIONS.join(',')}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div className="add-document-file-info">
                    <span className="file-icon">📎</span>
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">({configFormatFileSize(selectedFile.size)})</span>
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
                      Поддерживаются: {contentTypeConfig.ALLOWED_EXTENSIONS.join(', ')}
                    </p>
                    <p className="file-upload-size">
                      Макс. размер: {configFormatFileSize(contentTypeConfig.MAX_SIZE)}
                    </p>
                    <p className="file-upload-description">
                      {contentTypeConfig.DESCRIPTION}
                    </p>
                  </>
                )}
              </div>
              {fileError && (
                <div className="file-error-message">
                  ⚠️ {fileError}
                </div>
              )}
            </div>
          )}

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
              disabled={
                !docTitle.trim() || 
                (docType === 'text' && !docContent.trim()) ||
                (docType !== 'text' && !selectedFile) ||
                fileError !== null
              }
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [libraryData, setLibraryData] = useState<Section[]>([]);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояния для модалок добавления
  const [showAddSubsection, setShowAddSubsection] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [selectedShelfForAdd, setSelectedShelfForAdd] = useState<Section | null>(null);
  const [selectedSubsectionForAdd, setSelectedSubsectionForAdd] = useState<Subsection | null>(null);
  
  // Состояния для модалок редактирования/удаления подразделов
  const [showEditSubsection, setShowEditSubsection] = useState(false);
  const [showDeleteSubsection, setShowDeleteSubsection] = useState(false);
  const [editingSubsection, setEditingSubsection] = useState<{ shelf: Section; subsection: Subsection } | null>(null);
  
  // Состояния для модалок редактирования/удаления документов
  const [showEditDocument, setShowEditDocument] = useState(false);
  const [showDeleteDocument, setShowDeleteDocument] = useState(false);
  const [editingDocument, setEditingDocument] = useState<{ shelf: Section; document: LibraryItem } | null>(null);
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated } = useAuth();
  const praiseContext = usePraise();

  // Отладка - логируем пользователя при монтировании и изменении
  useEffect(() => {
    console.log('👤 LibraryModal - Текущий пользователь:', user);
    console.log('👤 LibraryModal - Роль пользователя:', user?.role);
    console.log('👤 LibraryModal - isAuthenticated:', isAuthenticated);
  }, [user, isAuthenticated]);

  // 👇 Функция для обновления данных документа
  const refreshItemData = useCallback(async (itemId: string) => {
    if (!itemId) return;
    
    try {
      console.log(`🔄 Обновление данных документа ${itemId}`);
      const response = await libraryApi.getItem(itemId) as unknown as ApiResponse<ApiLibraryItem>;
      
      if (response.success && response.data) {
        const updatedItem = response.data;
        
        // Обновляем selectedItem если это текущий документ
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(prev => prev ? {
            ...prev,
            ...updatedItem,
            contentId: updatedItem.id,
            praises: updatedItem.praises
          } : null);
        }
        
        // Обновляем в списке
        setLibraryData(prev => prev.map(section => ({
          ...section,
          subsections: section.subsections.map(sub => ({
            ...sub,
            items: sub.items.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    ...updatedItem, 
                    contentId: updatedItem.id, 
                    praises: updatedItem.praises 
                  }
                : item
            )
          }))
        })));
        
        console.log('✅ Документ обновлен');
      }
    } catch (error) {
      console.error('❌ Ошибка при обновлении документа:', error);
    }
  }, [selectedItem]);

  // 👇 Слушаем событие обновления контента из PraiseContext
  useEffect(() => {
    const handleContentUpdated = (event: CustomEvent) => {
      const { contentId, contentType } = event.detail;
      console.log(`📢 Получено событие обновления: ${contentType} / ${contentId}`);
      
      if (contentType === 'LIBRARY' && contentId) {
        // Проверяем, относится ли это событие к текущему документу
        if (selectedItem && selectedItem.id === contentId) {
          console.log('📢 Обновляем текущий документ');
          refreshItemData(contentId);
        } else {
          console.log('📢 Обновление для другого документа, игнорируем');
        }
      }
    };

    window.addEventListener('content-updated', handleContentUpdated as EventListener);
    
    return () => {
      window.removeEventListener('content-updated', handleContentUpdated as EventListener);
    };
  }, [selectedItem, refreshItemData]);

  // Загрузка данных с сервера
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchLibraryData = async () => {
      setIsLoading(true);
      try {
        console.log('📥 Загрузка данных библиотеки...');
        
        // Получаем все разделы
        const sectionsResponse = await libraryApi.getAllSections() as unknown as ApiResponse<ApiLibrarySection[]>;
        console.log('✅ Получены разделы:', sectionsResponse);
        
        // Извлекаем data из ответа
        const sections = sectionsResponse.data || [];
        
        // Преобразуем данные в нужный формат и загружаем документы для каждого подраздела
        const formattedSections: Section[] = await Promise.all(
          sections.map(async (section: ApiLibrarySection) => {
            // Получаем подразделы для раздела
            let subsections: ApiLibrarySubsection[] = [];
            try {
              const subsectionsResponse = await libraryApi.getSubsections(section.id) as unknown as ApiResponse<ApiLibrarySubsection[]>;
              subsections = subsectionsResponse.data || [];
            } catch (error) {
              console.warn(`⚠️ Не удалось загрузить подразделы для раздела ${section.id}`, error);
            }
            
            // Для каждого подраздела получаем документы
            const formattedSubsections: Subsection[] = await Promise.all(
              subsections.map(async (sub: ApiLibrarySubsection) => {
                let items: ApiLibraryItem[] = [];
                try {
                  const itemsResponse = await libraryApi.getItems(sub.id, { page: 1, limit: 100 }) as unknown as ApiResponse<ItemsResponse>;
                  items = itemsResponse.data?.data || [];
                } catch (error) {
                  console.warn(`⚠️ Не удалось загрузить документы для подраздела ${sub.id}`, error);
                }
                
                return {
                  ...sub,
                  items: items.map((item: ApiLibraryItem) => ({
                    ...item,
                    contentId: item.id,
                    canEdit: (item as any).canEdit,
                    canDelete: (item as any).canDelete
                  })),
                  canEdit: (sub as any).canEdit,
                  canDelete: (sub as any).canDelete
                } as Subsection;
              })
            );
            
            return {
              ...section,
              subsections: formattedSubsections
            } as Section;
          })
        );
        
        setLibraryData(formattedSections);
        console.log('✅ Данные библиотеки загружены:', formattedSections);
        
      } catch (error) {
        console.error('❌ Ошибка загрузки библиотеки:', error);
        // Показываем пустой массив при ошибке
        setLibraryData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLibraryData();
  }, [isOpen]);

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

  // ========== ОБРАБОТЧИКИ ДЛЯ ПОДРАЗДЕЛОВ ==========

  const handleAddSubsection = async (subsectionTitle: string) => {
    if (!selectedShelfForAdd || !isAuthenticated || !user) {
      alert('Необходимо авторизоваться');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📝 Создание подраздела:', { title: subsectionTitle, sectionId: selectedShelfForAdd.id });
      
      const response = await libraryApi.createSubsection({
        title: subsectionTitle,
        sectionId: selectedShelfForAdd.id
      }) as unknown as ApiResponse<ApiLibrarySubsection>;
      
      const newSubsection = response.data;
      console.log('✅ Подраздел создан:', newSubsection);
      
      // Обновляем локальные данные
      setLibraryData(prev => prev.map(shelf => 
        shelf.id === selectedShelfForAdd.id
          ? { 
              ...shelf, 
              subsections: [...shelf.subsections, { 
                ...newSubsection, 
                items: [],
                canEdit: true,
                canDelete: true
              }] 
            }
          : shelf
      ));
      
    } catch (error) {
      console.error('❌ Ошибка создания подраздела:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Не удалось создать раздел'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubsection = (shelf: Section, subsection: Subsection) => {
    // Используем поле canEdit из данных, которое пришло с сервера
    if (!subsection.canEdit) {
      alert('У вас нет прав на редактирование этого раздела');
      return;
    }
    setEditingSubsection({ shelf, subsection });
    setShowEditSubsection(true);
  };

  const handleSaveSubsection = async (newTitle: string) => {
    if (!editingSubsection) return;

    try {
      setIsLoading(true);
      console.log('📝 Обновление подраздела:', editingSubsection.subsection.id, newTitle);
      
      const response = await libraryApi.updateSubsection(
        editingSubsection.subsection.id,
        { title: newTitle }
      ) as unknown as ApiResponse<ApiLibrarySubsection>;
      
      console.log('✅ Подраздел обновлен:', response.data);
      
      setLibraryData(prev => prev.map(shelf => 
        shelf.id === editingSubsection.shelf.id
          ? {
              ...shelf,
              subsections: shelf.subsections.map(sub =>
                sub.id === editingSubsection.subsection.id
                  ? { ...sub, title: newTitle }
                  : sub
              )
            }
          : shelf
      ));
      
    } catch (error) {
      console.error('❌ Ошибка обновления подраздела:', error);
      alert('Не удалось обновить раздел. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubsection = (shelf: Section, subsection: Subsection) => {
    // Используем поле canDelete из данных, которое пришло с сервера
    if (!subsection.canDelete) {
      alert('У вас нет прав на удаление этого раздела');
      return;
    }
    setEditingSubsection({ shelf, subsection });
    setShowDeleteSubsection(true);
  };

  const handleConfirmDeleteSubsection = async () => {
    if (!editingSubsection) return;

    try {
      setIsLoading(true);
      console.log('🗑️ Удаление подраздела:', editingSubsection.subsection.id);
      
      await libraryApi.deleteSubsection(editingSubsection.subsection.id);
      
      console.log('✅ Подраздел удален');
      
      setLibraryData(prev => prev.map(shelf => 
        shelf.id === editingSubsection.shelf.id
          ? {
              ...shelf,
              subsections: shelf.subsections.filter(sub => sub.id !== editingSubsection.subsection.id)
            }
          : shelf
      ));

      if (selectedSubsection === editingSubsection.subsection.id) {
        setSelectedSubsection(null);
        setSelectedItem(null);
      }
      
    } catch (error) {
      console.error('❌ Ошибка удаления подраздела:', error);
      alert('Не удалось удалить раздел. Попробуйте позже.');
    } finally {
      setShowDeleteSubsection(false);
      setEditingSubsection(null);
      setIsLoading(false);
    }
  };

  // ========== ОБРАБОТЧИКИ ДЛЯ ДОКУМЕНТОВ ==========

  const handleAddDocument = async (docData: any) => {
    if (!selectedSubsectionForAdd || !isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      console.log('📝 Создание документа:', docData);
      
      const response = await libraryApi.createItem(docData) as unknown as ApiResponse<ApiLibraryItem>;
      const newItem = response.data;
      
      console.log('✅ Документ создан:', newItem);
      
      // Обновляем локальные данные
      setLibraryData(prev => prev.map(shelf => 
        shelf.id === selectedShelfForAdd?.id
          ? {
              ...shelf,
              subsections: shelf.subsections.map(sub =>
                sub.id === selectedSubsectionForAdd.id
                  ? { 
                      ...sub, 
                      items: [...sub.items, { 
                        ...newItem, 
                        contentId: newItem.id,
                        canEdit: true,
                        canDelete: true
                      }] 
                    }
                  : sub
              )
            }
          : shelf
      ));
      
    } catch (error) {
      console.error('❌ Ошибка создания документа:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Не удалось создать документ'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDocument = (shelf: Section, document: LibraryItem) => {
    // Используем поле canEdit из данных, которое пришло с сервера
    if (!document.canEdit) {
      alert('У вас нет прав на редактирование этого документа');
      return;
    }
    setEditingDocument({ shelf, document });
    setShowEditDocument(true);
  };

  const handleSaveDocument = async (updatedDoc: any) => {
    if (!editingDocument) return;

    try {
      setIsLoading(true);
      console.log('📝 Обновление документа:', updatedDoc);
      
      const response = await libraryApi.updateItem(updatedDoc.id, {
        title: updatedDoc.title,
        content: updatedDoc.content,
        fileName: updatedDoc.fileName,
        fileSize: updatedDoc.fileSize,
        fileType: updatedDoc.fileType,
        fileUrl: updatedDoc.fileUrl
      }) as unknown as ApiResponse<ApiLibraryItem>;
      
      console.log('✅ Документ обновлен:', response.data);
      
      setLibraryData(prev => prev.map(shelf => 
        shelf.id === editingDocument.shelf.id
          ? {
              ...shelf,
              subsections: shelf.subsections.map(sub => ({
                ...sub,
                items: sub.items.map(item =>
                  item.id === updatedDoc.id 
                    ? { ...item, ...updatedDoc, contentId: item.id }
                    : item
                )
              }))
            }
          : shelf
      ));

      setSelectedItem(prev => prev ? { ...prev, ...updatedDoc } : null);
      
    } catch (error) {
      console.error('❌ Ошибка обновления документа:', error);
      alert('Не удалось обновить документ. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = (shelf: Section, document: LibraryItem) => {
    // Используем поле canDelete из данных, которое пришло с сервера
    if (!document.canDelete) {
      alert('У вас нет прав на удаление этого документа');
      return;
    }
    setEditingDocument({ shelf, document });
    setShowDeleteDocument(true);
  };

  const handleConfirmDeleteDocument = async () => {
    if (!editingDocument) return;

    try {
      setIsLoading(true);
      console.log('🗑️ Удаление документа:', editingDocument.document.id);
      
      await libraryApi.deleteItem(editingDocument.document.id);
      
      console.log('✅ Документ удален');
      
      setLibraryData(prev => prev.map(shelf => 
        shelf.id === editingDocument.shelf.id
          ? {
              ...shelf,
              subsections: shelf.subsections.map(sub => ({
                ...sub,
                items: sub.items.filter(item => item.id !== editingDocument.document.id)
              }))
            }
          : shelf
      ));

      if (selectedItem?.id === editingDocument.document.id) {
        setSelectedItem(null);
      }
      
    } catch (error) {
      console.error('❌ Ошибка удаления документа:', error);
      alert('Не удалось удалить документ. Попробуйте позже.');
    } finally {
      setShowDeleteDocument(false);
      setEditingDocument(null);
      setIsLoading(false);
    }
  };

  // ========== ОСТАЛЬНЫЕ ОБРАБОТЧИКИ ==========

  const openAddSubsectionModal = (shelf: Section) => {
    setSelectedShelfForAdd(shelf);
    setShowAddSubsection(true);
  };

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

  const handleItemClick = (item: LibraryItem) => {
    setSelectedItem(item);
    
    praiseContext.setCurrentContent({
      id: item.contentId || item.id,
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

  // Проверка на возможность добавления (только авторизация)
  const canAdd = (): boolean => {
    return isAuthenticated;
  };

  if (!isOpen) return null;

  const currentItems = getCurrentItems();
  const currentSection = getCurrentSection();
  const currentSubsection = getCurrentSubsection();

  return (
    <div 
      className="library-modal-overlay" 
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('library-modal-overlay')) {
          onClose();
        }
      }}
    >
      <div className="library-modal-content" onClick={e => e.stopPropagation()}>
        
        <button className="library-close-button" onClick={onClose}>✕</button>
        
        <div className="library-header">
          <h2 className="library-title">Библиотека знаний</h2>
          <p className="library-subtitle">Хранилище полезных документов и материалов</p>
        </div>

        <div 
          className="library-main" 
          ref={mainContainerRef}
          onScroll={handleScroll}
        >
          
          {showScrollHint && (
            <div className="scroll-hint">
              <div className="scroll-hint-arrow">→</div>
              <div className="scroll-hint-text">Сдвиньте вправо</div>
            </div>
          )}
          
          {isLoading && (
            <div className="library-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка...</p>
            </div>
          )}
          
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

          {selectedShelf && currentSection && (
            <div className="library-subsections-panel">
              <h3 className="subsections-title">
                {currentSection.icon} {currentSection.title}
              </h3>
              
              {/* Кнопка добавления раздела - только для авторизованных */}
              {canAdd() && (
                <button 
                  className="add-subsection-button"
                  onClick={() => openAddSubsectionModal(currentSection)}
                  disabled={isLoading}
                >
                  ➕ Добавить раздел
                </button>
              )}
              
              <div className="subsections-list">
                {currentSection.subsections.map(sub => (
                  <div key={sub.id} className="subsection-item">
                    <button
                      className={`subsection-button ${selectedSubsection === sub.id ? 'active' : ''}`}
                      onClick={() => handleSubsectionClick(sub.id)}
                    >
                      <span className="subsection-icon">📁</span>
                      <span className="subsection-name">{sub.title}</span>
                      <span className="subsection-count">{sub.items.length}</span>
                    </button>
                    
                    {/* Кнопки редактирования/удаления для подраздела - используем canEdit/canDelete с сервера */}
                    {(sub.canEdit || sub.canDelete) && (
                      <div className="subsection-actions">
                        {sub.canEdit && (
                          <button
                            className="subsection-edit-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSubsection(currentSection, sub);
                            }}
                            title="Редактировать раздел"
                          >
                            ✏️
                          </button>
                        )}
                        {sub.canDelete && (
                          <button
                            className="subsection-delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubsection(currentSection, sub);
                            }}
                            title="Удалить раздел"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSubsection && (
            <div className="library-items-panel">
              <div className="items-header">
                <h3 className="items-title">Документы</h3>
                
                {/* Кнопка добавления документа - только для авторизованных */}
                {canAdd() && currentSection && currentSubsection && (
                  <button 
                    className="add-document-button"
                    onClick={() => openAddDocumentModal(currentSection, currentSubsection)}
                    title="Добавить документ"
                    disabled={isLoading}
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
                        </div>
                        <PraiseStatsCompact item={item} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-items">
                    <p>В этом разделе пока нет документов</p>
                    
                    {/* Кнопка добавления первого документа - только для авторизованных */}
                    {canAdd() && currentSection && currentSubsection && (
                      <button 
                        className="add-first-document-button"
                        onClick={() => openAddDocumentModal(currentSection, currentSubsection)}
                        disabled={isLoading}
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
                    <span>Файл: {selectedItem.fileName} ({configFormatFileSize(selectedItem.fileSize || 0)})</span>
                  )}
                </div>
                
                {/* Кнопки редактирования/удаления в модалке документа - используем canEdit/canDelete с сервера */}
                {(selectedItem.canEdit || selectedItem.canDelete) && (
                  <div className="item-view-actions">
                    {selectedItem.canEdit && (
                      <button
                        className="item-view-edit-button"
                        onClick={() => {
                          if (currentSection) {
                            handleEditDocument(currentSection, selectedItem);
                          }
                        }}
                        title="Редактировать документ"
                      >
                        <span>✏️</span>
                        <span>Редактировать</span>
                      </button>
                    )}
                    {selectedItem.canDelete && (
                      <button
                        className="item-view-delete-button"
                        onClick={() => {
                          if (currentSection) {
                            handleDeleteDocument(currentSection, selectedItem);
                          }
                        }}
                        title="Удалить документ"
                      >
                        <span>🗑️</span>
                        <span>Удалить</span>
                      </button>
                    )}
                  </div>
                )}
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

              <div className="item-view-footer">
                <div className="footer-left">
                  <span className="footer-login">
                    👤 {selectedItem.authorLogin}
                  </span>
                </div>

                <div className="footer-center">
                  <PraiseStatsDetailed item={selectedItem} />
                </div>

                {/* Блок с лайком полностью удален */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модалки для подразделов */}
      <AddSubsectionModal
        isOpen={showAddSubsection}
        onClose={() => {
          setShowAddSubsection(false);
          setSelectedShelfForAdd(null);
        }}
        onAdd={handleAddSubsection}
        shelfTitle={selectedShelfForAdd?.title || ''}
      />

      <EditSubsectionModal
        isOpen={showEditSubsection}
        onClose={() => {
          setShowEditSubsection(false);
          setEditingSubsection(null);
        }}
        onSave={handleSaveSubsection}
        currentTitle={editingSubsection?.subsection.title || ''}
        shelfTitle={editingSubsection?.shelf.title || ''}
      />

      <DeleteSubsectionModal
        isOpen={showDeleteSubsection}
        onClose={() => {
          setShowDeleteSubsection(false);
          setEditingSubsection(null);
        }}
        onConfirm={handleConfirmDeleteSubsection}
        subsectionTitle={editingSubsection?.subsection.title || ''}
        itemsCount={editingSubsection?.subsection.items.length || 0}
      />

      {/* Модалки для документов */}
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

      {editingDocument && (
        <>
          <EditDocumentModal
            isOpen={showEditDocument}
            onClose={() => {
              setShowEditDocument(false);
              setEditingDocument(null);
            }}
            onSave={handleSaveDocument}
            document={editingDocument.document}
            shelf={editingDocument.shelf}
          />

          <DeleteDocumentModal
            isOpen={showDeleteDocument}
            onClose={() => {
              setShowDeleteDocument(false);
              setEditingDocument(null);
            }}
            onConfirm={handleConfirmDeleteDocument}
            documentTitle={editingDocument.document.title}
            documentType={editingDocument.document.type}
            authorName={editingDocument.document.author}
          />
        </>
      )}
    </div>
  );
};

export default LibraryModal;