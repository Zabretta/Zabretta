"use client";

import React from 'react';
import Workbench from './components/Workbench';
import { AuthProvider } from './components/useAuth';
import { SettingsProvider } from './components/SettingsContext';
import { RatingProvider } from './components/RatingContext';    // 👈 ДОБАВЛЕНО
import { PraiseProvider } from './components/PraiseContext';    // 👈 ДОБАВЛЕНО
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RatingProvider>          {/* 👈 ДОБАВЛЕНО - должен быть внутри Auth и Settings, но выше Workbench */}
          <PraiseProvider>         {/* 👈 ДОБАВЛЕНО - должен быть внутри RatingProvider */}
            <div className="app">
              <Workbench />
            </div>
          </PraiseProvider>
        </RatingProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;