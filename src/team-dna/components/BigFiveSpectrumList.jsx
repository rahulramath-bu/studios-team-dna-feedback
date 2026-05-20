import React from 'react';
import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from '../data/bigFiveTraits.js';

const SUBJECT_COLORS = [
  '#ce0058',
  '#1b23ff',
  '#f55259',
  '#0f766e',
  '#7c3aed',
  '#b45309',
  '#2563eb',
  '#be123c',
  '#047857',
  '#6d28d9',
  '#4338ca',
  '#c2410c',
];

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getPromptText(trait, subjectCount) {
  if (subjectCount === 1) {
    return trait.promptSingular ?? trait.shortLabel;
  }

  return trait.promptPlural ?? trait.shortLabel;
}

function getDuoReadText(trait, subjects) {
  if (subjects.length !== 2) {
    return null;
  }

  const firstScore = getBigFiveScore(subjects[0], trait.key);
  const secondScore = getBigFiveScore(subjects[1], trait.key);
  const distance = Math.abs(firstScore - secondScore);
  const average = (firstScore + secondScore) / 2;
  const copy = trait.duoRead ?? {};

  if (distance >= 30) {
    return copy.wide ?? 'Together, the mix gets useful.';
  }

  if (distance >= 16) {
    return copy.offset ?? 'Together, something new shows up.';
  }

  if (average <= 40) {
    return copy.lowAligned ?? 'Together, the pattern gets stronger.';
  }

  if (average >= 60) {
    return copy.highAligned ?? 'Together, the pattern gets stronger.';
  }

  return copy.middleAligned ?? 'Together, we meet near the middle.';
}

function getQuantile(sortedScores, quantile) {
  if (sortedScores.length === 1) {
    return sortedScores[0];
  }

  const position = (sortedScores.length - 1) * quantile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const weight = position - lowerIndex;

  return (
    sortedScores[lowerIndex] * (1 - weight) +
    sortedScores[upperIndex] * weight
  );
}

function getPercentBand(start, end, minWidth) {
  const width = end - start;

  if (width >= minWidth) {
    return { left: start, width };
  }

  const center = (start + end) / 2;
  const left = Math.max(0, Math.min(100 - minWidth, center - minWidth / 2));

  return { left, width: minWidth };
}

function getTeamDistribution(subjects, trait) {
  const scores = subjects
    .map((subject) => getBigFiveScore(subject, trait.key))
    .sort((a, b) => a - b);
  const min = scores[0];
  const max = scores[scores.length - 1];
  const mean =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  const q1 = getQuantile(scores, 0.25);
  const q3 = getQuantile(scores, 0.75);

  return {
    cluster: getPercentBand(q1, q3, 10),
    mean,
    range: getPercentBand(min, max, 2),
  };
}

/**
 * Flexible Big Five spectrum list.
 *
 * What: renders one or more Big Five trait rows with one, two, or many subject
 * markers on each spectrum.
 * How: accepts a trait subset and a subject array, then maps each subject's
 * normalized `bigFive` scores to horizontal marker positions.
 * Port: keep this visualization API stable. Backend data should be normalized
 * into subjects before it reaches this component.
 */
export function BigFiveSpectrumList({ subjects, traits = BIG_FIVE_TRAITS }) {
  const visibleSubjects = subjects.filter((subject) => subject?.bigFive);

  if (visibleSubjects.length === 0) {
    return (
      <div className="big-five-empty">
        <p>Spectrum appears when assessment data is available.</p>
      </div>
    );
  }

  return (
    <div className="big-five-spectrum-list">
      {traits.map((trait) => (
        <div className="big-five-spectrum-row" key={trait.key}>
          <div className="big-five-spectrum-head">
            <span>
              {getDuoReadText(trait, visibleSubjects) ??
                getPromptText(trait, visibleSubjects.length)}
            </span>
          </div>
          <div
            className="big-five-spectrum-track"
            aria-label={`${trait.label} spectrum`}
          >
            <span className="big-five-spectrum-end low">{trait.lowLabel}</span>
            <span className="big-five-spectrum-end high">{trait.highLabel}</span>
            <span className="big-five-spectrum-line" />
            {visibleSubjects.length > 2 ? (
              <TeamDistribution
                subjects={visibleSubjects}
                trait={trait}
              />
            ) : (
              visibleSubjects.map((subject, index) => {
                const score = getBigFiveScore(subject, trait.key);
                const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

                return (
                  <span
                    key={`${subject.id}-${trait.key}`}
                    className="big-five-spectrum-marker"
                    style={{
                      left: `${score}%`,
                      '--subject-color': color,
                      zIndex: 10 + index,
                    }}
                    aria-label={`${subject.name}. ${trait.label}: ${score} out of 100.`}
                    tabIndex={0}
                  >
                    <span className="big-five-spectrum-avatar" aria-hidden="true">
                      {subject.avatarUrl ? (
                        <img src={subject.avatarUrl} alt="" />
                      ) : (
                        <span>{getInitials(subject.name)}</span>
                      )}
                    </span>
                    <span className="big-five-spectrum-tooltip" role="tooltip">
                      <strong>{subject.name}</strong>
                      <span>
                        {trait.label}: {score}/100
                      </span>
                    </span>
                  </span>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamDistribution({ subjects, trait }) {
  const distribution = getTeamDistribution(subjects, trait);

  return (
    <span
      className="big-five-spectrum-distribution"
      aria-label={`${trait.label} team range ${Math.round(
        distribution.range.left
      )} to ${Math.round(
        distribution.range.left + distribution.range.width
      )}, team average ${Math.round(distribution.mean)} out of 100.`}
    >
      <span
        className="big-five-spectrum-range"
        style={{
          left: `${distribution.range.left}%`,
          width: `${distribution.range.width}%`,
        }}
      />
      <span
        className="big-five-spectrum-density"
        style={{
          left: `${distribution.cluster.left}%`,
          width: `${distribution.cluster.width}%`,
        }}
      />
      <span
        className="big-five-spectrum-mean"
        style={{ left: `${distribution.mean}%` }}
      />
    </span>
  );
}
