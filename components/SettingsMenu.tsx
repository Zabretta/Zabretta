import React, { useState, useRef, useEffect } from 'react';
import './SettingsMenu.css';

const SettingsMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleThemeChange = (theme: string) => {
    alert(`Тема изменена на: ${theme}`);
    setIsMenuOpen(false);
  };

  const handleExportData = () => {
    const fakeData = {
      userId: 'user123',
      stats: { completed: 42, praised: 10 },
      preferences: { theme: 'wood' }
    };
    const dataStr = JSON.stringify(fakeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'workbench_data_backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Данные экспортированы в файл workbench_data_backup.json');
    setIsMenuOpen(false);
  };

  const handleResetProgress = () => {
    if (window.confirm('Вы уверены? Весь прогресс будет сброшен. Это действие нельзя отменить.')) {
      alert('Прогресс сброшен!');
      setIsMenuOpen(false);
    }
  };

  const handleAbout = () => {
    alert('Workbench v1.0.0\nИнструмент для вашей продуктивности\n© 2023');
    setIsMenuOpen(false);
  };

  return (
    <div className="settings-wrapper" ref={menuRef}>
      <button 
        className={`settings-button ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Настройки"
        aria-expanded={isMenuOpen}
      >
        <span className="settings-icon">⚙️</span>
        <span className="settings-text">Настройки</span>
      </button>

      {isMenuOpen && (
        <div className="settings-dropdown">
          <div className="dropdown-header">
            <span>⚙️</span>
            <h3>Настройки</h3>
          </div>
          
          <div className="dropdown-section">
            <p className="section-title">Внешний вид</p>
            <button 
              className="menu-item"
              onClick={() => handleThemeChange('Деревянная')}
            >
              <span>🪵</span> Деревянная тема
            </button>
            <button 
              className="menu-item"
              onClick={() => handleThemeChange('Светлая')}
            >
              <span>☀️</span> Светлая тема
            </button>
            <button 
              className="menu-item"
              onClick={() => handleThemeChange('Тёмная')}
            >
              <span>🌙</span> Тёмная тема
            </button>
          </div>

          <div className="dropdown-section">
            <p className="section-title">Данные</p>
            <button 
              className="menu-item"
              onClick={handleExportData}
            >
              <span>💾</span> Экспорт данных
            </button>
            <button 
              className="menu-item danger"
              onClick={handleResetProgress}
            >
              <span>🔄</span> Сбросить прогресс
            </button>
          </div>

          <div className="dropdown-section">
            <button 
              className="menu-item about"
              onClick={handleAbout}
            >
              <span>ℹ️</span> О проекте
            </button>
          </div>

          <div className="dropdown-footer">
            <small>Workbench v1.0</small>
          </div>
        </div>
      )}
    </div>
  );
};
