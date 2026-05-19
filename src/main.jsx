import React from 'react';
import { createRoot } from 'react-dom/client';
import { TeamDnaPage } from './team-dna/TeamDnaPage.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TeamDnaPage />
  </React.StrictMode>
);
