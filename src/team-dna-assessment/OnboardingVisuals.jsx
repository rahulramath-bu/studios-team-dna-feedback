import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

const PAIR_LEFT_AVATAR = '/team-dna/avatars/mae-gowda.png';
const PAIR_RIGHT_AVATAR = '/team-dna/avatars/darshan-bhatt.png';
const PAIR_SMALL_AVATAR = '/team-dna/avatars/preetoshi.png';

const CLUSTER_AVATARS = [
  '/team-dna/avatars/mae-gowda.png',
  '/team-dna/avatars/darshan-bhatt.png',
  '/team-dna/avatars/jon-blomgren.png',
  '/team-dna/avatars/rainy-gu.png',
];

/**
 * Home-page "pair" hero: two ringed faces joined by a dashed connection line
 * with a small floating insight card — the signature Team DNA interaction,
 * recreated as a decorative still for the value page.
 */
export function OnboardingPairVisual() {
  const reduceMotion = useReducedMotion();
  const float = reduceMotion
    ? {}
    : {
        animate: { y: [0, -8, 0] },
        transition: { duration: 5.2, ease: 'easeInOut', repeat: Infinity },
      };
  const floatDelayed = reduceMotion
    ? {}
    : {
        animate: { y: [0, -8, 0] },
        transition: {
          duration: 5.2,
          ease: 'easeInOut',
          repeat: Infinity,
          delay: 1.6,
        },
      };

  return (
    <div className="tdna-pair-visual" aria-hidden="true">
      <svg className="tdna-pair-line" viewBox="0 0 380 360" fill="none">
        <line
          x1="118"
          y1="132"
          x2="268"
          y2="190"
          stroke="var(--rubine)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="2 16"
        />
      </svg>

      <span className="tdna-pair-card">2x impact</span>

      <motion.span
        className="tdna-pair-face tdna-pair-face--left"
        {...float}
      >
        <img src={PAIR_LEFT_AVATAR} alt="" />
      </motion.span>

      <motion.span
        className="tdna-pair-face tdna-pair-face--right"
        {...floatDelayed}
      >
        <img src={PAIR_RIGHT_AVATAR} alt="" />
      </motion.span>

      <span className="tdna-pair-face tdna-pair-face--small">
        <img src={PAIR_SMALL_AVATAR} alt="" />
      </span>
    </div>
  );
}

// A clean, on-brand "this is the kind of read you get" cue for the account
// carousel: a compact set of trait spectrum rows, echoing the real Big Five
// spectrum without pulling in the full interactive component.
const TRAIT_PREVIEW = [
  { label: 'Openness', value: 86 },
  { label: 'Drive', value: 62 },
  { label: 'Energy', value: 74 },
  { label: 'Candor', value: 46 },
  { label: 'Calm', value: 70 },
];

export function OnboardingTraitPreview() {
  return (
    <div className="tdna-onboarding-traits" aria-hidden="true">
      {TRAIT_PREVIEW.map((trait) => (
        <div className="tdna-onboarding-trait-row" key={trait.label}>
          <span className="tdna-onboarding-trait-label">{trait.label}</span>
          <span className="tdna-onboarding-trait-track">
            <span
              className="tdna-onboarding-trait-fill"
              style={{ width: `${trait.value}%` }}
            />
            <span
              className="tdna-onboarding-trait-dot"
              style={{ left: `${trait.value}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact overlapping face cluster used inside the account carousel.
 */
export function OnboardingFaceCluster() {
  return (
    <div className="tdna-face-cluster" aria-hidden="true">
      {CLUSTER_AVATARS.map((src, index) => (
        <span
          key={src}
          className="tdna-face-cluster-face"
          style={{ '--cluster-index': index }}
        >
          <img src={src} alt="" />
        </span>
      ))}
    </div>
  );
}
