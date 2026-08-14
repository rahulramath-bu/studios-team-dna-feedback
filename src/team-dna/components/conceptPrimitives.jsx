import React from 'react';
import { BetterUpIcon } from './BetterUpIcon.jsx';

/**
 * Shared primitives for the page concepts (Expanded / Map / Four tabs):
 * the small face chip, the per-card AI-coach handoff link, and text helpers.
 * Kept dependency-free so concept components can share them without cycles.
 */

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function Face({ member, size = 30, ringed = false, titled = true }) {
  return (
    <span
      className="dxp-face"
      data-ringed={ringed || undefined}
      style={{ '--dxp-face-size': `${size}px` }}
      title={titled ? member.name : undefined}
    >
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" />
      ) : (
        <span>{getInitials(member.name)}</span>
      )}
    </span>
  );
}

export function CoachFootLink({
  prompt,
  onCoachPrompt,
  label = 'Discuss with AI coach',
}) {
  if (!onCoachPrompt) return null;
  return (
    <button
      className="info-block-coach-link"
      type="button"
      onClick={() => onCoachPrompt(prompt)}
    >
      <span>{label}</span>
      <BetterUpIcon name="ArrowUpRight" size={13} strokeWidth={2} />
    </button>
  );
}

export function firstName(member) {
  return member?.name?.split(' ')[0] ?? 'Teammate';
}

export function summaryText(insight) {
  return (insight.summary ?? []).map((segment) => segment.text).join('');
}

/* Tiny renderer for authored copy with **bold** spans (duo reads). */
export function renderEmphasis(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

/* ── The team wave (original page's distribution visual), shared ────────── */

function getQuantile(sortedScores, quantile) {
  if (sortedScores.length === 1) return sortedScores[0];
  const position = (sortedScores.length - 1) * quantile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weight = position - lowerIndex;
  return (
    sortedScores[lowerIndex] * (1 - weight) + sortedScores[upperIndex] * weight
  );
}

function getPercentBand(start, end, minWidth) {
  const width = end - start;
  if (width >= minWidth) return { left: start, width };
  const center = (start + end) / 2;
  const left = Math.max(0, Math.min(100 - minWidth, center - minWidth / 2));
  return { left, width: minWidth };
}

export function getFieldModel(scores) {
  const sorted = [...scores].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, score) => sum + score, 0) / sorted.length;
  return {
    range: getPercentBand(sorted[0], sorted[sorted.length - 1], 2),
    cluster: getPercentBand(
      getQuantile(sorted, 0.25),
      getQuantile(sorted, 0.75),
      10
    ),
    mean,
  };
}

/** Range band + concentration glow + mean tick, in the aggregate teal.
 *  Dots or faces render on top of it. */
export function FieldWave({ scores, showMean = true }) {
  const field = getFieldModel(scores);
  return (
    <span className="fvw" aria-hidden="true">
      <span
        className="fvw-range"
        style={{ left: `${field.range.left}%`, width: `${field.range.width}%` }}
      />
      <span
        className="fvw-density"
        style={{
          left: `${field.cluster.left}%`,
          width: `${field.cluster.width}%`,
        }}
      />
      {showMean ? (
        <span className="fvw-mean" style={{ left: `${field.mean}%` }} />
      ) : null}
    </span>
  );
}
