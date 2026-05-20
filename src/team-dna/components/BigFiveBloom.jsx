import { useMemo } from 'react';
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
const SUBJECT_COLORS = ['#ce0058', '#0072B7'];

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

function getPoint(index, score, traitCount) {
  const angle = -Math.PI / 2 + (index / traitCount) * Math.PI * 2;
  const boundaryBias = 1 - Math.abs(0 - 0.5) * 0.18;
  const radius =
    MIN_RADIUS +
    (Math.max(0, Math.min(score, 100)) / 100) *
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

function getBloomPath(subject, traits) {
  const baseAngle = -Math.PI / 2;
  const step = (2 * Math.PI) / traits.length;
  let path = '';

  for (let index = 0; index <= PATH_STEPS; index += 1) {
    const theta = baseAngle + (index * 2 * Math.PI) / PATH_STEPS;
    const rel =
      ((theta - baseAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const traitIndex = Math.floor(rel / step);
    const local = (rel - traitIndex * step) / step;
    const currentTrait = traits[traitIndex];
    const nextTrait = traits[(traitIndex + 1) % traits.length];
    const currentScore = getBigFiveScore(subject, currentTrait.key);
    const nextScore = getBigFiveScore(subject, nextTrait.key);
    const blendedScore =
      currentScore * (1 - smoothstep(local)) + nextScore * smoothstep(local);
    const petalBias = 1 - Math.abs(local - 0.5) * 0.18;
    const radius =
      MIN_RADIUS + (blendedScore / 100) * (MAX_RADIUS - MIN_RADIUS) * petalBias;
    const x = CENTER + Math.cos(theta) * radius;
    const y = CENTER + Math.sin(theta) * radius;

    path += `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }

  return `${path}Z`;
}

/**
 * Big Five bloom visualization.
 *
 * What: compact radial read of one person's Big Five shape, or two transparent
 * overlaid shapes in duo state.
 * How: maps each trait score to a point on a five-axis SVG and draws one
 * polygon per subject; subjects stay API-blind and only need `name` + `bigFive`.
 * Port: feed normalized member view-models into this component. Do not make it
 * call APIs or know backend field names.
 */
export function BigFiveBloom({ subjects, traits = BIG_FIVE_TRAITS }) {
  const visibleSubjects = subjects.filter((subject) => subject?.bigFive).slice(0, 2);
  const isDuo = visibleSubjects.length > 1;
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
  const labelDelay = isDuo ? 1.62 : 1.12;
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
          const color = SUBJECT_COLORS[index] ?? '#ce0058';

          return (
            <motion.path
              key={subject.id}
              className="big-five-bloom-shape"
              d={d}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeOpacity={isDuo ? 0.58 : 0.64}
              {...getShapeMotion(index)}
              style={{
                mixBlendMode: isDuo ? 'multiply' : 'normal',
                transformOrigin: `${CENTER}px ${CENTER}px`,
              }}
            />
          );
        })}
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
                    color: SUBJECT_COLORS[subjectIndex] ?? '#ce0058',
                  }}
                />
              );
            })
          )}
        </motion.g>
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
      {visibleSubjects.length > 1 && (
        <motion.div className="big-five-bloom-legend" {...labelMotion}>
          {visibleSubjects.map((subject, index) => (
            <span key={subject.id}>
              <i style={{ background: SUBJECT_COLORS[index] ?? '#ce0058' }} />
              {subject.name}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}
