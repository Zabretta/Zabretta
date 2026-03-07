/**
* ===================================================
* КОНФИГУРАЦИЯ ЗАГРУЗОК ДЛЯ ВСЕГО ПРОЕКТА
* ===================================================
* 
* 📍 РАСПОЛОЖЕНИЕ В ПРОЕКТЕ:
* samodelkin-app/
* ├── lib/
* │ ├── config/
* │ │ └── uploads.ts <-- ЭТОТ ФАЙЛ
* │ ├── api/
* │ └── ...
* ├── components/
* └── ...
* 
* 🔧 КАК ИСПОЛЬЗОВАТЬ В КОМПОНЕНТАХ:
* import { UPLOAD_LIMITS, SECTION_UPLOAD_CONFIG, formatFileSize, validateFile } from '@/lib/config/uploads';
* 
* // Пример:
* const maxVideoSize = UPLOAD_LIMITS.VIDEO.MAX_SIZE;
* const allowedTypes = SECTION_UPLOAD_CONFIG.LIBRARY.CONTENT_TYPES.video.ALLOWED_TYPES;
* 
* 🔄 ЕСЛИ НУЖНО ИЗМЕНИТЬ ОГРАНИЧЕНИЯ:
* Измените цифры в этом файле — и все компоненты автоматически 
* будут использовать новые значения. НИКАКИХ МИГРАЦИЙ БД НЕ ТРЕБУЕТСЯ!
* ===================================================
*/

// ===================================================
// 1. БАЗОВЫЕ ЛИМИТЫ ДЛЯ РАЗНЫХ ТИПОВ ФАЙЛОВ
// ===================================================
export const UPLOAD_LIMITS = {
  /**
  * ИЗОБРАЖЕНИЯ (фото, скриншоты, превью)
  * - Обычные фото с камеры: 5-10 МБ
  * - Скриншоты: 1-3 МБ
  * - Превью для видео: до 1 МБ
  */
  IMAGE: {
    MAX_SIZE: 20 * 1024 * 1024, // 20 МБ
    ALLOWED_TYPES: [
      'image/jpeg', // .jpg, .jpeg
      'image/png', // .png
      'image/gif', // .gif
      'image/webp', // .webp
      'image/svg+xml' // .svg
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    DESCRIPTION: 'Изображения (до 20 МБ)'
  },

  /**
  * ВИДЕО (уроки, мастер-классы, демонстрации)
  * - 1 ГБ = ~10 минут видео в разрешении 1080p
  * - 1 ГБ = ~30 минут видео в разрешении 720p
  * - 1 ГБ = ~60 минут видео в разрешении 480p
  */
  VIDEO: {  // 👈 ИСПРАВЛЕНО: было "ВИДЕО"
    MAX_SIZE: 1024 * 1024 * 1024, // 1 ГБ
    ALLOWED_TYPES: [
      'video/mp4', // .mp4 - самый распространенный
      'video/quicktime', // .mov - для Apple
      'video/x-msvideo', // .avi
      'video/webm', // .webm - для веба
      'video/ogg' // .ogv
    ],
    ALLOWED_EXTENSIONS: ['.mp4', '.mov', '.avi', '.webm', '.ogv'],
    DESCRIPTION: 'Видео (до 1 ГБ)'
  },

  /**
  * ДОКУМЕНТЫ (PDF, архивы, текстовые файлы)
  * - PDF с чертежами: 10-30 МБ
  * - ZIP с материалами: 50-100 МБ
  * - Текстовые документы: 1-5 МБ
  */
  DOCUMENT: {
    MAX_SIZE: 100 * 1024 * 1024, // 100 МБ
    ALLOWED_TYPES: [
      'application/pdf', // .pdf
      'application/zip', // .zip
      'application/x-rar-compressed', // .rar
      'text/plain', // .txt
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.zip', '.rar', '.txt', '.doc', '.docx'],
    DESCRIPTION: 'Документы (до 100 МБ)'
  },

  /**
  * ЧЕРТЕЖИ И СХЕМЫ (специфические форматы)
  * - CAD файлы: 20-50 МБ
  * - DXF/DWG: 10-30 МБ
  */
  DRAWING: {
    MAX_SIZE: 50 * 1024 * 1024, // 50 МБ
    ALLOWED_TYPES: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/acad', // .dwg
      'image/vnd.dxf' // .dxf
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.dwg', '.dxf'],
    DESCRIPTION: 'Чертежи и схемы (до 50 МБ)'
  },

  /**
  * ФОТО ВЫСОКОГО РАЗРЕШЕНИЯ
  * - Для фотографий товаров в маркетплейсе
  * - Для портфолио мастеров
  */
  HIGH_RES_PHOTO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50 МБ
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/webp'
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.tiff', '.webp'],
    DESCRIPTION: 'Фото высокого разрешения (до 50 МБ)'
  },

  /**
  * 3D-МОДЕЛИ (для сложных проектов)
  * - файлы STL, OBJ: 50–200 МБ
  */
  THREE_D_MODEL: {
    MAX_SIZE: 200 * 1024 * 1024, // 200 МБ
    ALLOWED_TYPES: [
      'application/sla', // .stl
      'text/plain', // .obj
      'model/obj'
    ],
    ALLOWED_EXTENSIONS: ['.stl', '.obj', '.3mf'],
    DESCRIPTION: '3D модели (до 200 МБ)'
  },

  /**
  * АУДИО (подкасты, лекции)
  */
  AUDIO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100 МБ
    ALLOWED_TYPES: [
      'audio/mpeg', // .mp3
      'audio/wav', // .wav
      'audio/ogg', // .ogg
      'audio/aac' // .aac
    ],
    ALLOWED_EXTENSIONS: ['.mp3', '.wav', '.ogg', '.aac'],
    DESCRIPTION: 'Аудио (до 100 МБ)'
  }
};

// ===================================================
// 2. КОНФИГУРАЦИЯ ДЛЯ РАЗНЫХ РАЗДЕЛОВ САЙТА
// ===================================================
export const SECTION_UPLOAD_CONFIG = {
  /**
  * БИБЛИОТЕКА ЗНАНИЙ
  * Компонент: LibraryModal.tsx
  * Путь: components/LibraryModal.tsx
  */
  LIBRARY: {
    // Типы контента в библиотеке
    CONTENT_TYPES: {
      text: { type: 'text', fileRequired: false, description: 'Текстовый документ' },
      photo: { ...UPLOAD_LIMITS.IMAGE, type: 'photo', fileRequired: true },
      drawing: { ...UPLOAD_LIMITS.DRAWING, type: 'drawing', fileRequired: true }, // 👈 ИСПРАВЛЕНО
      video: { ...UPLOAD_LIMITS.VIDEO, type: 'video', fileRequired: true }, // 👈 ИСПРАВЛЕНО
      other: { ...UPLOAD_LIMITS.DOCUMENT, type: 'other', fileRequired: true } // 👈 ИСПРАВЛЕНО
    },

    // Конфигурация конкретных стеллажей
    SHELVES: {
      recipes: {
        title: 'Рецепты',
        allowedTypes: ['text', 'photo'],
        description: 'Кулинарные рецепты и фото блюд'
      },
      advice: {
        title: 'Полезные советы',
        allowedTypes: ['text', 'photo'],
        description: 'Советы по дому и хозяйству'
      },
      drawings: {
        title: 'Чертежи и схемы',
        allowedTypes: ['drawing', 'photo'],
        description: 'Технические чертежи, схемы, проекты'
      },
      'photos-videos': {
        title: 'Фото и видео',
        allowedTypes: ['photo', 'video'],
        description: 'Фотографии и видеоуроки'
      },
      misc: {
        title: 'Разное',
        allowedTypes: ['text', 'photo', 'drawing', 'video', 'other'],
        description: 'Прочие материалы'
      }
    }
  },

  /**
  * МАРКЕТПЛЕЙС (БАРАХОЛКА)
  * Компонент: Marketplace.tsx (будет создан)
  * Путь: components/Marketplace.tsx
  */
  MARKETPLACE: {
    // Фото товара (обязательно)
    PRODUCT_PHOTO: {
      ...UPLOAD_LIMITS.HIGH_RES_PHOTO,
      required: true,
      multiple: true, // можно несколько фото
      maxCount: 10, // максимум 10 фото
      description: 'Фото товара (до 10 шт., до 50 МБ каждое)'
    },

    // Видео товара (опционально)
    PRODUCT_VIDEO: {
      ...UPLOAD_LIMITS.VIDEO,
      required: false,
      multiple: false, // одно видео
      description: 'Видеообзор товара (до 1 ГБ)'
    },

    // Документы к товару (инструкции, гарантии)
    PRODUCT_DOCUMENTS: {
      ...UPLOAD_LIMITS.DOCUMENT,
      required: false,
      multiple: true,
      maxCount: 5,
      description: 'Документы (инструкции, гарантии)'
    }
  },

  /**
  * ПРОЕКТЫ ПОЛЬЗОВАТЕЛЕЙ
  * Компонент: Projects.tsx (будет создан)
  * Путь: components/Projects.tsx
  */
  PROJECTS: {  // 👈 ИСПРАВЛЕНО
    PROJECT_IMAGE: {  // 👈 ИСПРАВЛЕНО
      ...UPLOAD_LIMITS.HIGH_RES_PHOTO,
      required: true,
      multiple: true,
      maxCount: 20,
      description: 'Фото проекта'
    },
    PROJECT_VIDEO: {  // 👈 ИСПРАВЛЕНО
      ...UPLOAD_LIMITS.VIDEO,
      required: false,
      description: 'Видео проекта'
    },
    PROJECT_FILES: {
      ...UPLOAD_LIMITS.DOCUMENT,
      required: false,
      multiple: true,
      description: 'Файлы проекта'
    }
  },

  /**
  * МАСТЕРА РЯДОМ
  * Компонент: Masters.tsx (будет создан)
  * Путь: components/Masters.tsx
  */
  MASTERS: {
    PORTFOLIO_IMAGE: {
      ...UPLOAD_LIMITS.HIGH_RES_PHOTO,
      required: false,
      multiple: true,
      maxCount: 30,
      description: 'Фото работ'
    },
    PORTFOLIO_VIDEO: {
      ...UPLOAD_LIMITS.VIDEO,
      required: false,
      multiple: true,
      maxCount: 5,
      description: 'Видео работ'
    }
  },

  /**
  * ПОМОЩЬ (вопросы и ответы)
  * Компонент: Help.tsx (будет создан)
  * Путь: components/Help.tsx
  */
  HELP: {  // 👈 ИСПРАВЛЕНО
    ATTACHMENTS: {  // 👈 ИСПРАВЛЕНО
      ...UPLOAD_LIMITS.DOCUMENT,
      required: false,
      multiple: true,
      maxCount: 3,
      description: 'Прикрепленные файлы'
    }
  }
};

// ===================================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С КОНФИГОМ
// ===================================================

/**
* Получить лимиты для конкретного раздела и типа
* @param section — раздел ('LIBRARY', 'MARKETPLACE' и т. д.)
* @param contentType — тип контента ('photo', 'video' и т. д.)
*/
export function getUploadLimits(section: keyof typeof SECTION_UPLOAD_CONFIG, contentType: string) {
  const sectionConfig = SECTION_UPLOAD_CONFIG[section];
    
  // Для библиотеки ищем в CONTENT_TYPES
  if (section === 'LIBRARY' && 'CONTENT_TYPES' in sectionConfig) {
    return (sectionConfig as any).CONTENT_TYPES[contentType];
  }
    
  // Для остальных разделов ищем прямо в конфиге
  return (sectionConfig as any)[`PRODUCT_${contentType.toUpperCase()}`] 
    || (sectionConfig as any)[`${contentType.toUpperCase()}`];
}

/**
* Форматировать размер файла для отображения
*/
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
* Проверить, соответствует ли файл требованиям по типу и размеру
*/
export function validateFile(file: File, limits: typeof UPLOAD_LIMITS.IMAGE | typeof UPLOAD_LIMITS.VIDEO | typeof UPLOAD_LIMITS.DOCUMENT) {  // 👈 ИСПРАВЛЕНО
  if (file.size > limits.MAX_SIZE) {
    return {
      valid: false,
      error: `Файл слишком большой. Максимальный размер: ${formatFileSize(limits.MAX_SIZE)}`
    };
  }
    
  if (limits.ALLOWED_TYPES.length > 0 && !limits.ALLOWED_TYPES.includes(file.type)) {  // 👈 ИСПРАВЛЕНО
    return {
      valid: false,
      error: `Недопустимый тип файла. Разрешенные типы: ${limits.ALLOWED_EXTENSIONS.join(', ')}`
    };
  }
    
  return { valid: true, error: null };
}
