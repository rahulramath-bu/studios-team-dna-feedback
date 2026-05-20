import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from '../data/bigFiveTraits.js';

const SIZE = 280;
const CENTER = SIZE / 2;
const MIN_RADIUS = 18;
const MAX_RADIUS = 104;
const PATH_STEPS = 180;
const SUBJECT_COLORS = ['var(--primary)', 'var(--blue-aa)'];
const TEAM_COLOR = 'var(--team-aggregate)';
const TEAM_AVERAGE_COLOR = 'var(--team-dna-ink)';

function getFirstName(subject) {
  return subject?.name?.split(' ')[0] ?? 'Teammate';
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function clampScore(score) {
  return Math.max(0, Math.min(score, 100));
}

function getPoint(index, score, traitCount) {
  const angle = -Math.PI / 2 + (index / traitCount) * Math.PI * 2;
  const boundaryBias = 1 - Math.abs(0 - 0.5) * 0.18;
  const radius =
    MIN_RADIUS +
    (clampScore(score) / 100) *
      (MAX_RADIUS - MIN_RADIUS) *
      boundaryBias;

  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function getAxisPoint(index, traitCount, radius = MAX_RADIUS + 2) {
  const angle = -Math.PI / 2 + (index / traitCount) * Math.PI * 2;

  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function getBloomPoints(traits, getScore) {
  const baseAngle = -Math.PI / 2;
  const step = (2 * Math.PI) / traits.length;
  const points = [];

  for (let index = 0; index <= PATH_STEPS; index += 1) {
    const theta = baseAngle + (index * 2 * Math.PI) / PATH_STEPS;
    const rel =
      ((theta - baseAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const traitIndex = Math.floor(rel / step);
    const local = (rel - traitIndex * step) / step;
    const currentTrait = traits[traitIndex];
    const nextTrait = traits[(traitIndex + 1) % traits.length];
    const currentScore = getScore(currentTrait.key);
    const nextScore = getScore(nextTrait.key);
    const blendedScore =
      currentScore * (1 - smoothstep(local)) + nextScore * smoothstep(local);
    const petalBias = 1 - Math.abs(local - 0.5) * 0.18;
    const radius =
      MIN_RADIUS + (blendedScore / 100) * (MAX_RADIUS - MIN_RADIUS) * petalBias;
    const x = CENTER + Math.cos(theta) * radius;
    const y = CENTER + Math.sin(theta) * radius;

    points.push({ x, y });
  }

  return points;
}

function getPathFromPoints(points) {
  return `${points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ')} Z`;
}

function getBloomPathFromScores(traits, getScore) {
  return getPathFromPoints(getBloomPoints(traits, getScore));
}

function getBloomPath(subject, traits) {
  return getBloomPathFromScores(
    traits,
    (traitKey) => getBigFiveScore(subject, traitKey)
  );
}

function getAverageBloomPath(subjects, traits) {
  return getBloomPathFromScores(
    traits,
    (traitKey) => {
      const total = subjects.reduce(
        (sum, subject) => sum + getBigFiveScore(subject, traitKey),
        0
      );

      return subjects.length ? total / subjects.length : 0;
    }
  );
}

/**
 * Big Five bloom visualization.
 *
 * What: compact radial read of one person's Big Five shape, two transparent
 * overlaid shapes in duo state, or every teammate overlaid in team state.
 * How: maps trait scores to a five-axis SVG. Solo/duo draw one polygon per
 * subject; team mode uses the same transparent turquoise shape for every member
 * so concentration emerges from overlap, with a first-name hover legend for
 * isolating one member at a time.
 * Port: feed normalized member view-models into this component. Do not make it
 * call APIs or know backend field names.
 */
export function BigFiveBloom({
  onSelectMember,
  subjects,
  traits = BIG_FIVE_TRAITS,
}) {
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const scoredSubjects = subjects.filter((subject) => subject?.bigFive);
  const isTeam = scoredSubjects.length > 2;
  const visibleSubjects = isTeam ? scoredSubjects : scoredSubjects.slice(0, 2);
  const isDuo = !isTeam && visibleSubjects.length > 1;
  const shouldReduceMotion = useReducedMotion();
  const axes = useMemo(
    () =>
      traits.map((trait, index) => ({
        trait,
        point: getAxisPoint(index, traits.length),
        labelPoint: getAxisPoint(index, traits.length, MAX_RADIUS + 27),
      })),
    [traits]
  );
  const bloomPaths = useMemo(
    () =>
      visibleSubjects.map((subject) => ({
        subject,
        d: getBloomPath(subject, traits),
      })),
    [traits, visibleSubjects]
  );
  const averageBloomPath = useMemo(
    () => (isTeam ? getAverageBloomPath(visibleSubjects, traits) : null),
    [isTeam, traits, visibleSubjects]
  );

  if (visibleSubjects.length === 0) {
    return (
      <div className="big-five-empty">
        <p>Big Five shape appears when assessment data is available.</p>
      </div>
    );
  }

  const gridMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.55, ease: 'easeOut' },
      };
  const detailDelay = isDuo ? 1.42 : 0.92;
  const labelDelay = isTeam ? 1.02 : isDuo ? 1.62 : 1.12;
  const detailMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1, scale: 1 } }
    : {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.42, delay: detailDelay, ease: 'easeOut' },
      };
  const labelMotion = shouldReduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.56, delay: labelDelay, ease: 'easeOut' },
      };
  const getShapeMotion = (index) => {
    if (shouldReduceMotion) {
      return { initial: false, animate: { opacity: 1, scale: 1 } };
    }

    const delay = isDuo ? 0.34 + index * 0.5 : 0.34;

    return {
      initial: { opacity: 0, scale: 0.84 },
      animate: { opacity: 1, scale: 1 },
      transition: {
        opacity: { duration: 0.42, delay, ease: 'easeOut' },
        scale: { duration: 0.78, delay, ease: [0.22, 1, 0.36, 1] },
      },
    };
  };

  return (
    <div className="big-five-bloom-card">
      <svg
        className="big-five-bloom"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Big Five shape"
      >
        <motion.g {...gridMotion}>
          {[0.25, 0.5, 0.75, 1].map((factor) => (
            <circle
              key={factor}
              className="big-five-bloom-grid"
              cx={CENTER}
              cy={CENTER}
              r={MAX_RADIUS * factor}
            />
          ))}
          {axes.map(({ trait, point }) => (
            <line
              key={trait.key}
              className="big-five-bloom-axis"
              x1={CENTER}
              y1={CENTER}
              x2={point.x}
              y2={point.y}
            />
          ))}
        </motion.g>
        {bloomPaths.map(({ subject, d }, index) => {
          const color = isTeam ? TEAM_COLOR : SUBJECT_COLORS[index] ?? 'var(--primary)';
          const isInteractiveShape = isTeam || isDuo;
          const isDimmedShape =
            isInteractiveShape &&
            activeSubjectId &&
            activeSubjectId !== subject.id;
          const isActiveShape =
            isInteractiveShape && activeSubjectId === subject.id;
          const shapeMotion = getShapeMotion(index);
          const teamFillOpacity = isDimmedShape
            ? 0
            : isActiveShape
              ? 0.28
              : 0.09;
          const teamStrokeOpacity = isActiveShape ? 0.62 : 0;
          const duoFillOpacity = isDimmedShape
            ? 0.05
            : isActiveShape
              ? 0.32
              : 0.2;
          const duoStrokeOpacity = isDimmedShape
            ? 0.14
            : isActiveShape
              ? 0.78
              : 0.58;

          return (
            <motion.path
              key={subject.id}
              className={[
                'big-five-bloom-shape',
                isTeam ? 'big-five-bloom-team-shape' : '',
              ].filter(Boolean).join(' ')}
              {...shapeMotion}
              animate={{
                ...(shapeMotion.animate ?? {}),
                fillOpacity: isTeam ? teamFillOpacity : isDuo ? duoFillOpacity : 0.2,
                strokeOpacity: isTeam
                  ? teamStrokeOpacity
                  : isDuo
                    ? duoStrokeOpacity
                    : 0.64,
              }}
              d={d}
              fill={color}
              stroke={color}
              transition={{
                ...(shapeMotion.transition ?? {}),
                fillOpacity: { duration: 0.26, ease: 'easeOut' },
                strokeOpacity: { duration: 0.26, ease: 'easeOut' },
              }}
              style={{
                mixBlendMode: isTeam || isDuo ? 'multiply' : 'normal',
                transformOrigin: `${CENTER}px ${CENTER}px`,
              }}
            />
          );
        })}
        {averageBloomPath &&
          (() => {
            const averageMotion = getShapeMotion(0);

            return (
              <motion.path
                className="big-five-bloom-team-average"
                {...averageMotion}
                animate={{
                  ...(averageMotion.animate ?? {}),
                  opacity: activeSubjectId ? 0 : 0.92,
                }}
                d={averageBloomPath}
                fill="none"
                stroke={TEAM_AVERAGE_COLOR}
                transition={{
                  ...(averageMotion.transition ?? {}),
                  opacity: { duration: 0.26, ease: 'easeOut' },
                }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              />
            );
          })()}
        {!isTeam && (
          <motion.g
            {...detailMotion}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          >
            {visibleSubjects.map((subject, subjectIndex) =>
              traits.map((trait, traitIndex) => {
                const point = getPoint(
                  traitIndex,
                  getBigFiveScore(subject, trait.key),
                  traits.length
                );

                return (
                  <rect
                    key={`${subject.id}-${trait.key}`}
                    className="big-five-bloom-point"
                    x={point.x - 3}
                    y={point.y - 3}
                    width="6"
                    height="6"
                    rx="1.4"
                    style={{
                      color: SUBJECT_COLORS[subjectIndex] ?? 'var(--primary)',
                      opacity:
                        isDuo && activeSubjectId && activeSubjectId !== subject.id
                          ? 0.18
                          : 1,
                      transition: 'opacity 220ms ease',
                    }}
                  />
                );
              })
            )}
          </motion.g>
        )}
        <motion.g {...labelMotion}>
          {axes.map(({ trait, labelPoint }) => (
            <text
              key={`${trait.key}-label`}
              className="big-five-bloom-label"
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {trait.shortLabel}
            </text>
          ))}
        </motion.g>
      </svg>
      {!isTeam && visibleSubjects.length > 1 && (
        <motion.div
          className="big-five-bloom-legend big-five-bloom-legend--duo"
          {...labelMotion}
        >
          {visibleSubjects.map((subject, index) => (
            <button
              className={[
                'big-five-bloom-legend-name',
                'big-five-bloom-legend-name--duo',
                activeSubjectId === subject.id
                  ? 'big-five-bloom-legend-name--active'
                  : '',
              ].filter(Boolean).join(' ')}
              key={subject.id}
              onBlur={() => setActiveSubjectId(null)}
              onClick={() => onSelectMember?.(subject.id, { mode: 'solo' })}
              onFocus={() => setActiveSubjectId(subject.id)}
              onMouseEnter={() => setActiveSubjectId(subject.id)}
              onMouseLeave={() => setActiveSubjectId(null)}
              type="button"
            >
              <i style={{ background: SUBJECT_COLORS[index] ?? 'var(--primary)' }} />
              {subject.name}
            </button>
          ))}
        </motion.div>
      )}
      {isTeam && (
        <motion.div
          className="big-five-bloom-legend big-five-bloom-legend--team"
          {...labelMotion}
        >
          {visibleSubjects.map((subject) => (
            <button
              className={[
                'big-five-bloom-legend-name',
                activeSubjectId === subject.id
                  ? 'big-five-bloom-legend-name--active'
                  : '',
              ].filter(Boolean).join(' ')}
              key={subject.id}
              onBlur={() => setActiveSubjectId(null)}
              onClick={() => onSelectMember?.(subject.id, { mode: 'solo' })}
              onFocus={() => setActiveSubjectId(subject.id)}
              onMouseEnter={() => setActiveSubjectId(subject.id)}
              onMouseLeave={() => setActiveSubjectId(null)}
              type="button"
            >
              {getFirstName(subject)}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
