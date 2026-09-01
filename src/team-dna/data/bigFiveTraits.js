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
    highLabel: 'Explorative',
    shortLabel: 'Openness',
    definition:
      'Openness is how someone approaches ideas: practical favors what already works, explorative reaches for new ways of doing things.',
    duoRead: {
      lowAligned: 'This pair is **practical**, keeping ideas close to what is already known.',
      highAligned: 'This pair is **explorative**, letting ideas multiply quickly.',
      middleAligned: 'This pair is **practical / explorative**, landing ideas in a useful middle.',
      wide: 'This pair spans **practical / explorative**, stretching ideas and testing what can hold.',
      offset: 'This pair is **practical / explorative**, deepening ideas from two nearby angles.',
    },
    color: 'var(--purple)',
  },
  {
    key: 'conscientiousness',
    label: 'Conscientiousness',
    promptSingular: 'My approach tends to be...',
    promptPlural: 'Our approach tends to be...',
    lowLabel: 'Casual',
    highLabel: 'Thorough',
    shortLabel: 'Conscientiousness',
    definition:
      'Conscientiousness is the drive and follow-through someone brings: casual keeps it loose and adaptable, thorough prepares and sees things through.',
    duoRead: {
      lowAligned: 'This pair is **casual**, so naming the next step helps the work land.',
      highAligned: 'This pair is **thorough**, keeping the work moving toward done.',
      middleAligned: 'This pair is **casual / thorough**, letting plans bend without falling apart.',
      wide: 'This pair spans **casual / thorough**, so a shared definition of done matters.',
      offset: 'This pair is **casual / thorough**, keeping plans clear without getting stiff.',
    },
    color: 'var(--blue-aa)',
  },
  {
    key: 'extraversion',
    label: 'Extraversion',
    promptSingular: 'My energy is usually...',
    promptPlural: 'Our energy is usually...',
    lowLabel: 'Reserved',
    highLabel: 'Expressive',
    shortLabel: 'Extraversion',
    definition:
      'Extraversion is how outwardly someone engages: reserved hangs back and speaks with intention, expressive speaks up and starts conversations.',
    duoRead: {
      lowAligned: 'This pair is **reserved**, letting energy build quietly before it moves.',
      highAligned: 'This pair is **expressive**, making energy easy for the room to feel.',
      middleAligned: 'This pair is **reserved / expressive**, moving at a comfortable pace.',
      wide: 'This pair spans **reserved / expressive**, so both rhythms should be named.',
      offset: 'This pair is **reserved / expressive**, with one rhythm to start and one to steady it.',
    },
    color: 'var(--data-series-three)',
  },
  {
    key: 'agreeableness',
    label: 'Agreeableness',
    promptSingular: 'With people, my stance tends to be...',
    promptPlural: 'With people, our stance tends to be...',
    lowLabel: 'Challenging',
    highLabel: 'Cooperative',
    shortLabel: 'Agreeableness',
    definition:
      'Agreeableness balances warmth with candor: challenging questions and pushes back, cooperative leads with empathy and keeps people in sync.',
    duoRead: {
      lowAligned: 'This pair is **challenging**, so repair matters when feedback gets sharp.',
      highAligned: 'This pair is **cooperative**, so truth needs visible room too.',
      middleAligned: 'This pair is **challenging / cooperative**, keeping feedback honest without breaking trust.',
      wide: 'This pair spans **challenging / cooperative**, so feedback needs a shared signal.',
      offset: 'This pair is **challenging / cooperative**, finding the line between challenge and trust.',
    },
    color: 'var(--green)',
  },
  {
    // Stored scores are reactivity-oriented (higher = more intense), so the
    // low end of this row is Calm. The doc's pole names map onto that axis.
    key: 'neuroticism',
    label: 'Emotional Stability',
    promptSingular: 'Under pressure, I tend to be...',
    promptPlural: 'Under pressure, we tend to be...',
    lowLabel: 'Calm',
    highLabel: 'Intense',
    shortLabel: 'Emotional Stability',
    definition:
      'Emotional Stability is how emotions respond to pressure: calm stays steady and even, intense feels things strongly and reacts readily.',
    duoRead: {
      lowAligned: "This pair is **calm**, keeping perspective when pressure rises.",
      highAligned: 'This pair is **intense**, feeling the stakes early and visibly.',
      middleAligned: 'This pair is **calm / intense**, naming pressure and moving through it.',
      wide: 'This pair spans **calm / intense**, so pressure needs a translation layer.',
      offset: 'This pair is **calm / intense**, carrying both signal and steadiness.',
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
