// src/index.js
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import the provider:
import { NotificationProvider } from './contexts/NotificationContext';

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    {/* Wrap your app in the NotificationProvider */}
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </BrowserRouter>
);

// Performance measurement (optional)
reportWebVitals();
