import React from 'react';
import { motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';

/**
 * Demo-only stand-in for the real Big Five assessment.
 *
 * What: a small, on-brand modal that explains the Big Five assessment would
 * happen here and lets the demo skip straight past it.
 * How: "Skip for demo" calls onComplete, which marks the viewer's assessment
 * done upstream so the demo advances to the "waiting on the team" state.
 * Port: replace wholesale with the real assessment route.
 */
const EASE = [0.22, 1, 0.36, 1];

export function AssessmentOverlay({ viewerName, onComplete, onClose }) {
  const firstName = viewerName ? viewerName.split(' ')[0] : null;

  return (
    <div
      className="assessment-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <motion.div
        className="assessment-panel"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <header className="assessment-header">
          <div>
            <p className="assessment-eyebrow">Team DNA</p>
            <h2 id="assessment-title">
              {firstName
                ? `${firstName}, your Big Five assessment`
                : 'Your Big Five assessment'}
            </h2>
          </div>
          <button
            type="button"
            className="assessment-close"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            <BetterUpIcon name="X" size={18} strokeWidth={2} />
          </button>
        </header>

        <p className="assessment-copy">
          This is where you’d complete the Big Five assessment to add your DNA to
          the team. For this demo, you can skip ahead — we’ll assume it’s done.
        </p>

        <footer className="assessment-footer">
          <button
            type="button"
            className="bu-button bu-button--secondary"
            onClick={() => onClose?.()}
          >
            Not now
          </button>
          <button
            type="button"
            className="bu-button bu-button--primary"
            onClick={() => onComplete?.()}
          >
            Skip for demo
            <span aria-hidden="true">&rarr;</span>
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
