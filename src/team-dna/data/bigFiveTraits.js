/**
 * Shared Big Five trait metadata.
 *
 * What: canonical trait order, strength-framed labels, spectrum endpoints, and
 * colors for Team DNA visualizations.
 * How: shape and spectrum visualizations read this metadata by trait key
 * instead of redefining names or labels per component.
 * Port: keep this UI metadata close to the Team DNA feature. Real scores should
 * enter through the adapter; these labels can be replaced by product-approved
 * copy without changing visualization components.
 */
export const BIG_FIVE_TRAITS = [
  {
    key: 'openness',
    label: 'Openness',
    promptSingular: 'With ideas, I tend to be...',
    promptPlural: 'With ideas, we tend to be...',
    lowLabel: 'Practical',
    highLabel: 'Inventive',
    shortLabel: 'Ideas',
    duoRead: {
      lowAligned: 'Together, ideas become concrete.',
      highAligned: 'Together, ideas become wild.',
      middleAligned: 'Together, ideas become useful.',
      wide: 'Together, ideas become actionable.',
      offset: 'Together, ideas become sharper.',
    },
    color: '#AB37EB',
  },
  {
    key: 'conscientiousness',
    label: 'Conscientiousness',
    promptSingular: 'With plans, I tend to be...',
    promptPlural: 'With plans, we tend to be...',
    lowLabel: 'Adaptive',
    highLabel: 'Structured',
    shortLabel: 'Structure',
    duoRead: {
      lowAligned: 'Together, plans become fluid.',
      highAligned: 'Together, plans become precise.',
      middleAligned: 'Together, plans become workable.',
      wide: 'Together, plans become nimble.',
      offset: 'Together, plans become responsive.',
    },
    color: '#0072B7',
  },
  {
    key: 'extraversion',
    label: 'Extraversion',
    promptSingular: 'My energy is usually...',
    promptPlural: 'Our energy is usually...',
    lowLabel: 'Reflective',
    highLabel: 'Expressive',
    shortLabel: 'Energy',
    duoRead: {
      lowAligned: 'Together, energy becomes thoughtful.',
      highAligned: 'Together, energy becomes spark.',
      middleAligned: 'Together, energy becomes steady.',
      wide: 'Together, energy becomes dynamic.',
      offset: 'Together, energy becomes rhythmic.',
    },
    color: '#F64B33',
  },
  {
    key: 'agreeableness',
    label: 'Agreeableness',
    promptSingular: 'With people, I tend to be...',
    promptPlural: 'With people, we tend to be...',
    lowLabel: 'Candid',
    highLabel: 'Collaborative',
    shortLabel: 'People',
    duoRead: {
      lowAligned: 'Together, conversations become direct.',
      highAligned: 'Together, conversations become generous.',
      middleAligned: 'Together, conversations become easy.',
      wide: 'Together, feedback becomes clear.',
      offset: 'Together, feedback becomes honest.',
    },
    color: '#00AB69',
  },
  {
    key: 'neuroticism',
    label: 'Emotional reactivity',
    promptSingular: 'Under pressure, I tend to be...',
    promptPlural: 'Under pressure, we tend to be...',
    lowLabel: 'Steady',
    highLabel: 'Responsive',
    shortLabel: 'Reactivity',
    duoRead: {
      lowAligned: 'Together, pressure becomes calm.',
      highAligned: 'Together, pressure becomes alert.',
      middleAligned: 'Together, pressure becomes readable.',
      wide: 'Together, pressure becomes composed.',
      offset: 'Together, pressure becomes clear.',
    },
    color: '#4956FF',
  },
];

export const BIG_FIVE_TRAIT_KEYS = BIG_FIVE_TRAITS.map((trait) => trait.key);

export function getBigFiveTrait(traitKey) {
  return BIG_FIVE_TRAITS.find((trait) => trait.key === traitKey);
}

export function getBigFiveScore(subject, traitKey) {
  return Number.isFinite(subject?.bigFive?.[traitKey])
    ? subject.bigFive[traitKey]
    : 50;
}
