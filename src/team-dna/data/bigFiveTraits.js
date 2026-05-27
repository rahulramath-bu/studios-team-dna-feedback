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
      lowAligned: 'This pair is **practical**, keeping ideas close to what is already known.',
      highAligned: 'This pair is **inventive**, letting ideas multiply quickly.',
      middleAligned: 'This pair is **practical / inventive**, landing ideas in a useful middle.',
      wide: 'This pair spans **practical / inventive**, stretching ideas and testing what can hold.',
      offset: 'This pair is **practical / inventive**, deepening ideas from two nearby angles.',
    },
    color: 'var(--purple)',
  },
  {
    key: 'conscientiousness',
    label: 'Conscientiousness',
    promptSingular: 'My approach tends to be...',
    promptPlural: 'Our approach tends to be...',
    lowLabel: 'Flexible',
    highLabel: 'Structured',
    shortLabel: 'Approach',
    duoRead: {
      lowAligned: 'This pair is **flexible**, so naming the next step helps the work land.',
      highAligned: 'This pair is **structured**, keeping the work moving toward done.',
      middleAligned: 'This pair is **flexible / structured**, letting plans bend without falling apart.',
      wide: 'This pair spans **flexible / structured**, so a shared definition of done matters.',
      offset: 'This pair is **flexible / structured**, keeping plans clear without getting stiff.',
    },
    color: 'var(--blue-aa)',
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
      lowAligned: 'This pair is **reflective**, letting energy build quietly before it moves.',
      highAligned: 'This pair is **expressive**, making energy easy for the room to feel.',
      middleAligned: 'This pair is **reflective / expressive**, moving at a comfortable pace.',
      wide: 'This pair spans **reflective / expressive**, so both rhythms should be named.',
      offset: 'This pair is **reflective / expressive**, with one rhythm to start and one to steady it.',
    },
    color: 'var(--data-series-three)',
  },
  {
    key: 'agreeableness',
    label: 'Agreeableness',
    promptSingular: 'With people, my stance tends to be...',
    promptPlural: 'With people, our stance tends to be...',
    lowLabel: 'Skeptical',
    highLabel: 'Cooperative',
    shortLabel: 'Stance',
    duoRead: {
      lowAligned: 'This pair is **skeptical**, so repair matters when feedback gets sharp.',
      highAligned: 'This pair is **cooperative**, so truth needs visible room too.',
      middleAligned: 'This pair is **skeptical / cooperative**, keeping feedback honest without breaking trust.',
      wide: 'This pair spans **skeptical / cooperative**, so feedback needs a shared signal.',
      offset: 'This pair is **skeptical / cooperative**, finding the line between challenge and trust.',
    },
    color: 'var(--green)',
  },
  {
    key: 'neuroticism',
    label: 'Pressure sensitivity',
    promptSingular: 'Under pressure, I tend to be...',
    promptPlural: 'Under pressure, we tend to be...',
    lowLabel: 'Steady',
    highLabel: 'Vigilant',
    shortLabel: 'Pressure',
    duoRead: {
      lowAligned: "This pair is **steady**, keeping perspective when pressure rises.",
      highAligned: 'This pair is **vigilant**, turning pressure into an early warning.',
      middleAligned: 'This pair is **steady / vigilant**, naming pressure and moving through it.',
      wide: 'This pair spans **steady / vigilant**, so pressure needs a translation layer.',
      offset: 'This pair is **steady / vigilant**, carrying both signal and steadiness.',
    },
    color: 'var(--data-series-one)',
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
