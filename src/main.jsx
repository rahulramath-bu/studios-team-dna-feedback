import React from 'react';
import { createRoot } from 'react-dom/client';
import { TeamDnaPage } from './team-dna/TeamDnaPage.jsx';
import './styles.css';

/**
 * Standalone app entrypoint.
 *
 * What: boots the local Vite playground for Team DNA.
 * How: renders the prototype harness, which adds fixtures, debug controls, and
 * an optional monolith-shell preview around the actual feature panel.
 * Port: do not port this file. In the monolith, React Platform routing should
 * mount a thin Team DNA route/page component inside the real Team shell.
 */
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TeamDnaPage />
  </React.StrictMode>
);
