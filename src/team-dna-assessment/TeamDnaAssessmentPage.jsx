import React from 'react';
import './teamDnaAssessment.css';

const SIGNAL_GROUPS = [
  {
    label: 'Surface 1',
    items: ['future assessment', 'clean start', 'kept separate'],
  },
  {
    label: 'Build later',
    items: ['no nested app', 'no stale prototype', 'ready when needed'],
  },
  {
    label: 'Surface 2',
    items: ['Team Page', 'unchanged', 'results target'],
  },
];

export function TeamDnaAssessmentPage({ onNavigate }) {
  return (
    <main className="team-dna-assessment-page" aria-label="Team DNA assessment">
      <nav className="team-dna-assessment-nav" aria-label="Prototype surfaces">
        <button type="button" onClick={() => onNavigate('/')}>
          Hub
        </button>
        <button type="button" onClick={() => onNavigate('/team-dna')}>
          Team DNA
        </button>
      </nav>

      <section className="team-dna-assessment-hero">
        <p>Surface 1</p>
        <h1>Assessment path parked</h1>
        <div className="team-dna-assessment-note">
          This route stays available from the hub, but the old nested prototype
          app has been removed until we actually need this surface.
        </div>
      </section>

      <section className="team-dna-assessment-map" aria-label="Assessment signal map">
        {SIGNAL_GROUPS.map((group) => (
          <article key={group.label}>
            <h2>{group.label}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
