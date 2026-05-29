import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Team Pulse + Team Coaching launcher (slide-over).
 *
 * UX intent: this panel is a *teaser*. Depth lives on the real
 * `/team-pulse/*` and `/workshops-for-teams/*` pages in the monolith.
 * Mirror the DNA experience's visual hierarchy — italic display title,
 * mono eyebrow, hairline-separated rows, one thing per row, no nested
 * cards, no pillars — so opening it doesn't feel like leaving Team DNA.
 *
 * Concept and copy are aligned to the monolith
 * (`teamTooling.home.team{Pulse,Coaching}*`,
 * `teamTooling.teamPulseSetup.*`, `teamTooling.teamCoaching.home.*`).
 */

const PULSE_CATEGORIES = [
  { name: 'Energy', lastUsed: '3d ago', score: 78, delta: '+6' },
  { name: 'Overwhelm', lastUsed: '2w ago', score: 64, delta: '\u22124' },
  { name: 'Support', lastUsed: '1w ago', score: 71, delta: '+1' },
  { name: 'Alignment', lastUsed: 'Never', score: null, delta: null },
];

const COACHING_SESSIONS = [
  {
    title: 'Protecting the team\u2019s capacity',
    reason: 'Overwhelm pulse · 64 / 100',
  },
  {
    title: 'From competing priorities to a shared bet',
    reason: 'DNA · wide range on Approach',
  },
  {
    title: 'Hand-offs and a shared definition of done',
    reason: 'Popular this quarter',
  },
];

const PANEL_META = {
  pulse: {
    pill: 'Team insights',
    title: 'Team Pulse',
    tagline: 'Live \u00b7 Anonymous \u00b7 Actionable',
    description:
      'A quick, anonymous read on how the team is doing right now.',
    primary: 'Start a new pulse',
    secondary: 'View team hub',
    crosslink: { label: 'Go deeper with Team Coaching', target: 'coaching' },
  },
  coaching: {
    pill: 'Team development',
    title: 'Team Coaching',
    tagline: 'Live \u00b7 Coach-led \u00b7 Practical',
    description:
      'Live, coach-led sessions built around your team\u2019s real challenges.',
    primary: 'Explore coaching topics',
    secondary: 'View upcoming sessions',
    crosslink: { label: 'Run a Team Pulse first', target: 'pulse' },
  },
};

export function TeamSurfacePanel({ surface, onClose, onOpenSurface }) {
  useEffect(() => {
    if (!surface) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [surface, onClose]);

  const meta = surface ? PANEL_META[surface] : null;

  return (
    <AnimatePresence>
      {surface && meta ? (
        <>
          <motion.div
            className="team-surface-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key={surface}
            className="team-surface-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label={meta.title}
          >
            <button
              type="button"
              className="team-surface-panel-close"
              onClick={onClose}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <header className="team-surface-panel-header">
              <span className="team-surface-panel-eyebrow">{meta.pill}</span>
              <h2 className="team-surface-panel-title">{meta.title}</h2>
              <span className="team-surface-panel-tagline">{meta.tagline}</span>
            </header>

            <div className="team-surface-panel-body">
              <p className="team-surface-panel-body-copy">{meta.description}</p>

              {surface === 'pulse' ? (
                <PulseRows />
              ) : (
                <CoachingRows />
              )}

              <button
                type="button"
                className="team-surface-panel-crosslink"
                onClick={() => onOpenSurface?.(meta.crosslink.target)}
              >
                {meta.crosslink.label}
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                  <path
                    d="M7 17L17 7M9 7h8v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <footer className="team-surface-panel-footer">
              <button
                type="button"
                className="bu-button bu-button--secondary"
                onClick={onClose}
              >
                {meta.secondary}
              </button>
              <button
                type="button"
                className="bu-button bu-button--primary"
                onClick={onClose}
              >
                {meta.primary}
              </button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function PulseRows() {
  return (
    <section className="team-surface-rows" aria-label="Pulse categories">
      <span className="team-surface-rows-eyebrow">Check-in focus</span>
      <ul className="team-surface-rows-list">
        {PULSE_CATEGORIES.map((cat) => (
          <li key={cat.name} className="team-surface-row">
            <span className="team-surface-row-name">{cat.name}</span>
            <span className="team-surface-row-aside">
              {cat.score !== null ? (
                <>
                  <span className="team-surface-row-meta">{cat.lastUsed}</span>
                  <span className="team-surface-row-score">
                    {cat.score}
                    <span
                      className="team-surface-row-delta"
                      data-tone={cat.delta?.startsWith('+') ? 'up' : 'down'}
                    >
                      {cat.delta}
                    </span>
                  </span>
                </>
              ) : (
                <span className="team-surface-row-meta team-surface-row-meta--empty">
                  Never used
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CoachingRows() {
  return (
    <section className="team-surface-rows" aria-label="Suggested coaching sessions">
      <span className="team-surface-rows-eyebrow">Suggested for this team</span>
      <ul className="team-surface-rows-list">
        {COACHING_SESSIONS.map((session) => (
          <li key={session.title} className="team-surface-row team-surface-row--stack">
            <span className="team-surface-row-name">{session.title}</span>
            <span className="team-surface-row-meta">{session.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
