// components/AdminIcon.tsx
"use client"

import React from 'react';
import './AdminIcon.css';

interface AdminIconProps {
  isAdmin: boolean;
  onClick?: () => void;
}

export default function AdminIcon({ isAdmin, onClick }: AdminIconProps) {
  if (!isAdmin) return null;

  return (
    <div className="admin-icon-container" onClick={onClick}>
      <div className="admin-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19.6216 20C19.1325 18.8724 18.3334 17.9182 17.3305 17.2608C16.3275 16.6034 15.1668 16.2727 13.987 16.3099C12.8072 16.3471 11.668 16.7502 10.7094 17.4657C9.75084 18.1812 9.01822 19.1765 8.60596 20.326C8.1937 21.4754 8.12057 22.7251 8.39571 23.9147C8.67085 25.1043 9.28175 26.1767 10.1475 26.9932C11.0132 27.8098 12.0922 28.3333 13.2408 28.4963C14.3894 28.6593 15.5531 28.4546 16.5771 27.9096" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="19" cy="5" r="3" fill="#FF6B6B" stroke="white" strokeWidth="1"/>
          <path d="M21 3L17 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M17 3L21 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="admin-tooltip">
        Панель администратора
      </div>
    </div>
  );
}
