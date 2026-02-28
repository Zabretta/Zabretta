"use client";

import React, { useState, useEffect, useRef } from "react";
import "./LibraryModal.css";
import { useAuth } from "./useAuth";
import { useRating } from "./RatingContext";

// Типы данных
interface LibraryItem {
  id: string;
  title: string;
  content: string;
  type: "text" | "photo" | "drawing" | "video" | "other";
  author: string;
  authorLogin: string;
  date: string;
  likes: number;
  userLiked?: boolean;
  thumbnail?: string;
  url?: string;
}

interface Subsection {
  id: string;
  title: string;
  items: LibraryItem[];
}

interface Section {
  id: string;
  title: string;
  icon: string;
  words?: string[]; // Для разделения на два слова на стеллаже
  subsections: Subsection[];
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

// Вспомогательная функция для преобразования Set в массив
const setToArray = <T,>(set: Set<T>): T[] => {
  const array: T[] = [];
  set.forEach(item => array.push(item));
  return array;
};

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [libraryData, setLibraryData] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [showScrollHint, setShowScrollHint] = useState(false);
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated } = useAuth();
  const ratingContext = useRating();

  // Заглушка данных - исправленный порядок слов
  useEffect(() => {
    const mockData: Section[] = [
      {
        id: "recipes",
        title: "Рецепты",
        icon: "🍳",
        words: ["РЕЦЕПТЫ"],
        subsections: [
          {
            id: "recipes-baking",
            title: "Выпечка",
            items: [
              {
                id: "recipe-1",
                title: "Домашний хлеб на закваске",
                content: "Ингредиенты: мука 500г, вода 350мл, закваска 150г, соль 10г...",
                type: "text",
                author: "Петр Иванов",
                authorLogin: "petr_baker",
                date: "2024-02-15",
                likes: 24
              },
              {
                id: "recipe-2",
                title: "Пирожки с капустой",
                content: "Тесто: мука 600г, молоко 250мл, дрожжи 10г, сахар 2ст.л...",
                type: "text",
                author: "Анна Смирнова",
                authorLogin: "anna_cook",
                date: "2024-02-20",
                likes: 15
              }
            ]
          },
          {
            id: "recipes-main",
            title: "Основные блюда",
            items: [
              {
                id: "recipe-3",
                title: "Борщ по-домашнему",
                content: "Свекла 2шт, капуста 300г, картофель 4шт, морковь 1шт...",
                type: "text",
                author: "Елена Кузнецова",
                authorLogin: "elena_cook",
                date: "2024-02-18",
                likes: 31
              }
            ]
          }
        ]
      },
      {
        id: "advice",
        title: "Полезные советы",
        icon: "💡",
        words: ["ПОЛЕЗНЫЕ", "СОВЕТЫ"], // ПОЛЕЗНЫЕ слева, СОВЕТЫ справа
        subsections: [
          {
            id: "advice-home",
            title: "Домашние хитрости",
            items: [
              {
                id: "advice-1",
                title: "Как удалить ржавчину с инструментов",
                content: "Смешайте уксус с солью в пропорции 1:1, нанесите на ржавчину...",
                type: "text",
                author: "Михаил Волков",
                authorLogin: "misha_master",
                date: "2024-02-10",
                likes: 42
              }
            ]
          },
          {
            id: "advice-garden",
            title: "Сад и огород",
            items: [
              {
                id: "advice-2",
                title: "Натуральное удобрение из банановой кожуры",
                content: "Банановую кожуру залейте водой и настаивайте 3 дня...",
                type: "text",
                author: "Светлана Петрова",
                authorLogin: "sveta_garden",
                date: "2024-02-12",
                likes: 28
              }
            ]
          }
        ]
      },
      {
        id: "drawings",
        title: "Чертежи и схемы",
        icon: "📐",
        words: ["ЧЕРТЕЖИ", "СХЕМЫ"], // ЧЕРТЕЖИ слева, СХЕМЫ справа
        subsections: [
          {
            id: "drawings-furniture",
            title: "Мебель",
            items: [
              {
                id: "drawing-1",
                title: "Чертеж садовой скамейки",
                content: "Чертеж садовой скамейки из дерева. Размеры: 1200х400х450мм",
                type: "drawing",
                author: "Алексей Смирнов",
                authorLogin: "alex_wood",
                date: "2024-02-05",
                likes: 56,
                thumbnail: "/thumbnails/bench.jpg"
              }
            ]
          },
          {
            id: "drawings-tools",
            title: "Инструменты и приспособления",
            items: [
              {
                id: "drawing-2",
                title: "Самодельный струбцина",
                content: "Чертеж быстрозажимной струбцины из металла",
                type: "drawing",
                author: "Дмитрий Ковалев",
                authorLogin: "dmitry_metal",
                date: "2024-02-08",
                likes: 34
              }
            ]
          }
        ]
      },
      {
        id: "photos-videos",
        title: "Фото и видео",
        icon: "📷",
        words: ["ФОТО", "ВИДЕО"], // ФОТО слева, ВИДЕО справа
        subsections: [
          {
            id: "photos",
            title: "Фотографии",
            items: [
              {
                id: "photo-1",
                title: "Реконструкция старого верстака",
                content: "Фото процесса реконструкции верстака 1950-х годов",
                type: "photo",
                author: "Игорь Николаев",
                authorLogin: "igor_restore",
                date: "2024-02-14",
                likes: 47,
                thumbnail: "/thumbnails/workbench.jpg"
              }
            ]
          },
          {
            id: "videos",
            title: "Видеоуроки",
            items: [
              {
                id: "video-1",
                title: "Как правильно паять микросхемы",
                content: "Видеоурок по пайке SMD компонентов",
                type: "video",
                author: "Сергей Радиолюбитель",
                authorLogin: "sergey_electronics",
                date: "2024-02-16",
                likes: 89,
                thumbnail: "/thumbnails/soldering.jpg"
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
        subsections: [
          {
            id: "misc-ideas",
            title: "Идеи и вдохновение",
            items: [
              {
                id: "idea-1",
                title: "Органайзер для мелочей из пластиковых бутылок",
                content: "Идея создания органайзера из подручных материалов",
                type: "other",
                author: "Ольга Творческая",
                authorLogin: "olga_creative",
                date: "2024-02-19",
                likes: 23
              }
            ]
          }
        ]
      }
    ];
    
    setLibraryData(mockData);
    
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
  };

  const handleCloseItem = () => {
    setSelectedItem(null);
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
            userId: currentUser?.id || user?.id,
            points: -1,
            reason: `unlike_library_item_${itemId}`,
            timestamp: new Date().toISOString()
          });
        }
        
      } else {
        newLikedItems.add(itemId);
        
        if (ratingContext && typeof (ratingContext as any).addRating === 'function') {
          (ratingContext as any).addRating({
            userId: item.authorLogin,
            points: 5,
            reason: `library_item_liked_${itemId}`,
            timestamp: new Date().toISOString()
          });
          
          (ratingContext as any).addRating({
            userId: currentUser?.id || user?.id,
            points: 1,
            reason: `like_activity_${itemId}`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      setLikedItems(newLikedItems);
      localStorage.setItem('library_liked_items', JSON.stringify(setToArray(newLikedItems)));
      
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

  if (!isOpen) return null;

  const currentItems = getCurrentItems();
  const currentSection = getCurrentSection();

  return (
    <div className="library-modal-overlay" onClick={onClose}>
      <div className="library-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Кнопка закрытия */}
        <button className="library-close-button" onClick={onClose}>✕</button>
        
        {/* Заголовок */}
        <div className="library-header">
          <h2 className="library-title">Библиотека знаний</h2>
          <p className="library-subtitle">Хранилище полезных документов и материалов</p>
        </div>

        {/* Основное содержимое с ref и обработчиком скролла */}
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
              
              // Определяем специальный класс для стеллажа "Полезные советы"
              const shelfClass = shelf.id === "advice" ? "advice-shelf" : "";
              
              return (
                <div 
                  key={shelf.id}
                  className={`library-shelf ${shelfClass} ${selectedShelf === shelf.id ? 'active' : ''} 
                    ${isLeftEdge ? 'left-edge' : ''} ${isRightEdge ? 'right-edge' : ''}`}
                  onClick={() => handleShelfClick(shelf.id)}
                >
                  {/* Боковина стеллажа с надписью */}
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
                        <span className="shelf-word">
                          {shelf.title}
                        </span>
                      )}
                    </div>
                    
                    {/* Корешки книг */}
                    <div className="book-spines">
                      {[...Array(5 + Math.floor(Math.random() * 5))].map((_, i) => (
                        <div 
                          key={i} 
                          className="book-spine"
                          style={{
                            height: `${40 + Math.random() * 40}px`,
                            width: `${12 + Math.random() * 8}px`,
                            backgroundColor: `hsl(${Math.random() * 60 + 20}, 70%, ${30 + Math.random() * 20}%)`,
                            transform: `rotate(${Math.random() * 6 - 3}deg) translateY(${Math.random() * 10 - 5}px)`,
                            marginLeft: i > 0 ? `${Math.random() * 8 - 4}px` : '0'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Проход между стеллажами (кроме крайних) */}
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
                {currentSection.icon} {currentSection.title} — разделы
              </h3>
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
              <h3 className="items-title">Документы</h3>
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
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-items">В этом разделе пока нет документов</div>
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
                </div>
              </div>

              <div className="item-view-body">
                {selectedItem.type === 'text' && (
                  <div className="item-text-content">{selectedItem.content}</div>
                )}
                
                {(selectedItem.type === 'photo' || selectedItem.type === 'drawing') && (
                  <div className="item-image-placeholder">
                    <div className="placeholder-icon">🖼️</div>
                    <p>{selectedItem.content}</p>
                    {selectedItem.thumbnail && (
                      <p className="image-note">[Здесь будет изображение: {selectedItem.thumbnail}]</p>
                    )}
                  </div>
                )}
                
                {selectedItem.type === 'video' && (
                  <div className="item-video-placeholder">
                    <div className="placeholder-icon">🎬</div>
                    <p>{selectedItem.content}</p>
                  </div>
                )}
              </div>

              {/* Нижняя панель с логином и лайком */}
              <div className="item-view-footer">
                <div className="footer-left">
                  <span className="footer-login">
                    👤 {selectedItem.authorLogin}
                  </span>
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
    </div>
  );
};

export default LibraryModal;