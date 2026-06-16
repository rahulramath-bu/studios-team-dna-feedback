import React from 'react';
import { motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import './coachOnboarding.css';

/**
 * GROW AI coach onboarding stand-in.
 *
 * What: a simple, on-brand full-screen placeholder for the BetterUp AI coach
 * (GROW) onboarding. It is shown when the per-section "…with AI coach" CTA is
 * triggered from a single-person profile, so the demo visibly moves into the
 * coach and signals that a little setup is needed first.
 * How: a focused panel with a small GROW header, a short setup line, a few
 * setup steps, a primary "Start setup" action and a back/close affordance that
 * returns the user to where they were (the person profile read).
 * Port: replace this with the real GROW coaching onboarding route/asset; keep
 * the entry point (coach CTA on a person profile) and the back affordance.
 */
const EASE = [0.22, 1, 0.36, 1];

const SETUP_STEPS = [
  {
    title: 'Connect your Team DNA',
    body: 'Your coach reads this profile so its guidance is grounded in how this person actually works.',
  },
  {
    title: 'Pick a focus',
    body: 'Choose what you want to get better at together — collaboration, growth opportunities, or day-to-day teamwork.',
  },
  {
    title: 'Start the conversation',
    body: 'Your AI coach opens with a prompt tailored to this profile and you take it from there.',
  },
];

export function CoachOnboardingOverlay({ subjectName, onStart, onClose }) {
  const firstName = subjectName ? subjectName.split(' ')[0] : null;

  return (
    <div
      className="coach-onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-onboarding-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <motion.div
        className="coach-onboarding-panel"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <header className="coach-onboarding-header">
          <div className="coach-onboarding-brand">
            <span className="coach-onboarding-brand-mark" aria-hidden="true">
              <BetterUpIcon name="Dna" size={22} strokeWidth={1.8} />
            </span>
            <div>
              <p className="coach-onboarding-eyebrow">AI Coach · GROW</p>
              <p className="coach-onboarding-brand-name">BetterUp AI Coach</p>
            </div>
          </div>
          <button
            type="button"
            className="coach-onboarding-close"
            onClick={() => onClose?.()}
            aria-label="Back to profile"
          >
            <BetterUpIcon name="X" size={18} strokeWidth={2} />
          </button>
        </header>

        <h2 className="coach-onboarding-title" id="coach-onboarding-title">
          Let&rsquo;s set up your AI coach
        </h2>
        <p className="coach-onboarding-lede">
          {firstName
            ? `Before we dig into working with ${firstName}, take a moment to set up your coach. It only takes a few steps.`
            : 'Before we dig in, take a moment to set up your coach. It only takes a few steps.'}
        </p>

        <ol className="coach-onboarding-steps">
          {SETUP_STEPS.map((step, index) => (
            <li className="coach-onboarding-step" key={step.title}>
              <span className="coach-onboarding-step-index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="coach-onboarding-step-text">
                <span className="coach-onboarding-step-title">{step.title}</span>
                <span className="coach-onboarding-step-body">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <footer className="coach-onboarding-footer">
          <button
            type="button"
            className="bu-button bu-button--secondary"
            onClick={() => onClose?.()}
          >
            Back
          </button>
          <button
            type="button"
            className="bu-button bu-button--primary"
            onClick={() => onStart?.()}
          >
            Start setup
            <span aria-hidden="true">&rarr;</span>
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
