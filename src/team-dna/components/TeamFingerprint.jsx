import React from 'react';
import { BIG_FIVE_TRAITS, getBigFiveScore } from '../data/bigFiveTraits.js';
import { getTraitPattern } from '../data/teamReadModel.js';

/**
 * Team fingerprint.
 *
 * What: the team's five trait distributions as one quiet figure. Each row is
 * a spectrum with the team as small dots, a shaded band where most people
 * sit, and the pole words underneath. One glance answers "where are we
 * together, where are we spread, where is the gap".
 * How: dots are anonymous by default (hover for the name, the viewer's dot is
 * filled) so the figure reads as a shape, not a lineup. Pattern labels are
 * two or three plain words, only when a row earns one.
 * Port: pure presentation; scores come from the same normalized subjects the
 * spectrum uses.
 */

export function TeamFingerprint({
  subjects,
  viewerId = null,
  showReads = true,
  onSelectMember = null,
  onlyTraitKey = null,
}) {
  const traits = onlyTraitKey
    ? BIG_FIVE_TRAITS.filter((trait) => trait.key === onlyTraitKey)
    : BIG_FIVE_TRAITS;

  return (
    <div
      className={onlyTraitKey ? 'fp-figure fp-figure--single' : 'fp-figure'}
      aria-label="Team fingerprint"
    >
      {traits.map((trait) => (
        <FingerprintRow
          key={trait.key}
          trait={trait}
          subjects={subjects}
          viewerId={viewerId}
          showRead={showReads}
          onSelectMember={onSelectMember}
        />
      ))}
      {onlyTraitKey ? null : (
        <p className="fp-legend">
          Each dot is a teammate; the shaded band is where most of the team
          sits.
        </p>
      )}
    </div>
  );
}

function FingerprintRow({ trait, subjects, viewerId, showRead, onSelectMember }) {
  const pattern = getTraitPattern(trait, subjects);
  const band = getBand(pattern);

  return (
    <div className="fp-row">
      {showRead ? <span className="fp-row-read">{pattern.label}</span> : null}
      <div className="fp-track" aria-label={`${trait.label}: ${pattern.label}`}>
        <span className="fp-line" aria-hidden="true" />
        <span
          className="fp-band"
          aria-hidden="true"
          style={{ left: `${band.left}%`, width: `${band.width}%` }}
        />
        {subjects.map((subject) => {
          const score = getBigFiveScore(subject, trait.key);
          const isViewer = subject.id === viewerId;
          return (
            <button
              key={subject.id}
              type="button"
              className="fp-dot"
              data-viewer={isViewer || undefined}
              style={{ left: `${score}%` }}
              title={subject.name}
              aria-label={`${subject.name}: ${score} of 100`}
              onClick={
                onSelectMember
                  ? () => onSelectMember(subject.id, { mode: 'solo' })
                  : undefined
              }
              tabIndex={onSelectMember ? 0 : -1}
            />
          );
        })}
      </div>
      <div className="fp-poles" aria-hidden="true">
        <span>{trait.lowLabel}</span>
        <span>{trait.highLabel}</span>
      </div>
    </div>
  );
}

function getBand(pattern) {
  const { scores } = pattern;
  if (scores.length < 3) {
    return { left: pattern.min, width: Math.max(2, pattern.max - pattern.min) };
  }
  const q1 = quantile(scores, 0.25);
  const q3 = quantile(scores, 0.75);
  const width = Math.max(8, q3 - q1);
  const left = Math.max(0, Math.min(100 - width, (q1 + q3) / 2 - width / 2));
  return { left, width };
}

function quantile(sortedScores, q) {
  const position = (sortedScores.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;
  return sortedScores[lower] * (1 - weight) + sortedScores[upper] * weight;
}
