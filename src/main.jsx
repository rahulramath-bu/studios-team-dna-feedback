import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './styles.css';

/**
 * Standalone app entrypoint.
 *
 * What: boots the local Vite playground for the Team DNA prototype hub.
 * How: renders a tiny route chooser plus isolated Surface 1 and Surface 2
 * prototype routes.
 * Port: do not port this file. In the monolith, React Platform routing should
 * mount each surface inside its actual product destination.
 */
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
