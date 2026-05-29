import React from 'react';
import { TEAM_DNA_GENERATION_STATUSES } from '../data/teamDnaGenerationLifecycle.mock.js';

/**
 * Productized AI lifecycle strip.
 *
 * What: surfaces the same generation lifecycle states that live in the hidden
 * debug panel (waiting / generating / ready / failed / stale), but as a visible
 * piece of the page so the AI-native nature of the experience is legible.
 * How: receives the resolved generation target + a setter, renders the active
 * status as a productized status pill, and exposes the five canonical states as
 * clickable affordances so the prototype can demo each one without `\` debug.
 * Port: in production, only the active status pill (left side) ships. The
 * state controls on the right are prototype-only demo affordances and should
 * be replaced with real product mutations (refresh, retry, etc).
 */

const STATUS_META = {
  not_ready: { label: 'Waiting', tone: 'waiting' },
  pending: { label: 'Generating', tone: 'pending' },
  ready: { label: 'Ready', tone: 'ready' },
  failed: { label: 'Failed', tone: 'failed' },
  stale: { label: 'Stale', tone: 'stale' },
};

export function LifecycleStrip({ target, status, onSetStatus }) {
  if (!target) return null;
  const activeMeta = STATUS_META[status] ?? STATUS_META.not_ready;

  return (
    <aside
      className="team-dna-lifecycle-strip"
      data-tone={activeMeta.tone}
      aria-label="AI insight lifecycle"
    >
      <div className="team-dna-lifecycle-strip-status">
        <span className="team-dna-lifecycle-strip-dot" aria-hidden="true" />
        <span className="team-dna-lifecycle-strip-label" data-tone={activeMeta.tone}>
          {activeMeta.label}
        </span>
      </div>
      <div
        className="team-dna-lifecycle-strip-controls"
        role="group"
        aria-label="Simulate lifecycle state"
      >
        <span className="team-dna-lifecycle-strip-controls-label">Simulate</span>
        {TEAM_DNA_GENERATION_STATUSES.map((statusKey) => {
          const meta = STATUS_META[statusKey];
          const isActive = status === statusKey;
          return (
            <button
              key={statusKey}
              type="button"
              className="team-dna-lifecycle-strip-pill"
              data-active={isActive || undefined}
              data-tone={meta.tone}
              onClick={() =>
                onSetStatus?.(target, statusKey, `lifecycle-strip:${statusKey}`)
              }
              aria-pressed={isActive}
            >
              <span className="team-dna-lifecycle-strip-pill-dot" aria-hidden="true" />
              {meta.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
