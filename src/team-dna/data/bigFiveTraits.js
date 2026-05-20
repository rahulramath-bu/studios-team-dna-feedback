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
    lowLabel: 'Grounded',
    highLabel: 'Inventive',
    shortLabel: 'Ideas',
    duoKeyword: 'ideas',
    duoRead: {
      lowAligned: 'The ideas stay close to what is already known.',
      highAligned: 'The ideas can multiply quickly.',
      middleAligned: 'The ideas land in a practical middle.',
      wide: 'The best ideas come from stretching and testing.',
      offset: 'The ideas get deeper from two nearby angles.',
    },
    color: '#AB37EB',
  },
  {
    key: 'conscientiousness',
    label: 'Conscientiousness',
    promptSingular: 'My approach tends to be...',
    promptPlural: 'Our approach tends to be...',
    lowLabel: 'Spontaneous',
    highLabel: 'Methodical',
    shortLabel: 'Approach',
    duoKeyword: 'plans',
    duoRead: {
      lowAligned: 'The plans may stay loose, so name the next step.',
      highAligned: 'The plans keep moving toward done.',
      middleAligned: 'The plans can bend without falling apart.',
      wide: 'The plan needs a shared definition of done.',
      offset: 'The plans stay clear without getting stiff.',
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
    duoKeyword: 'energy',
    duoRead: {
      lowAligned: 'The energy stays quiet and thoughtful.',
      highAligned: 'The energy can get loud and fast.',
      middleAligned: 'The energy moves at a comfortable pace.',
      wide: 'The energy works best when both rhythms are named.',
      offset: 'The energy has one voice to start and one to steady it.',
    },
    color: '#F64B33',
  },
  {
    key: 'agreeableness',
    label: 'Agreeableness',
    promptSingular: 'With people, my stance tends to be...',
    promptPlural: 'With people, our stance tends to be...',
    lowLabel: 'Direct',
    highLabel: 'Warm',
    shortLabel: 'Stance',
    duoKeyword: 'people',
    duoRead: {
      lowAligned: 'The feedback comes fast, so repair matters.',
      highAligned: 'The feedback stays kind, so truth needs room.',
      middleAligned: 'The feedback can be honest without breaking trust.',
      wide: 'The feedback needs a shared signal.',
      offset: 'The feedback finds the line between direct and warm.',
    },
    color: '#00AB69',
  },
  {
    key: 'neuroticism',
    label: 'Pressure sensitivity',
    promptSingular: 'Under pressure, I tend to be...',
    promptPlural: 'Under pressure, we tend to be...',
    lowLabel: 'Steady',
    highLabel: 'Vigilant',
    shortLabel: 'Pressure',
    duoKeyword: 'pressure',
    duoRead: {
      lowAligned: "The pressure doesn't move the room much.",
      highAligned: 'The pressure turns into an early warning.',
      middleAligned: 'The pressure gets named and moved through.',
      wide: 'The pressure needs a translation layer.',
      offset: 'The pressure has both signal and steadiness.',
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
