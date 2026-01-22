"use client";

import React from 'react';
import Workbench from './components/Workbench';
import { AuthProvider } from './components/useAuth';
import { SettingsProvider } from './components/SettingsContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
        <SettingsProvider>
          <div className="app">
            <Workbench />
          </div>
        </SettingsProvider>
    </AuthProvider>
  );
}

export default App;