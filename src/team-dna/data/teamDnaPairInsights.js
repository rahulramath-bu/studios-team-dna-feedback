/**
 * Deterministic Team DNA insight helpers.
 *
 * What: turns Big Five scores into human-readable person and duo superpower
 * language when authored or backend-generated copy is unavailable.
 * How: compares strongest traits, shared signals, and complements, then returns
 * the same TeamDnaInsight shape used by the panel.
 * Port: treat this as fallback logic or prototyping support. Prefer
 * backend-owned insight copy/statuses when the monolith has real Team DNA data,
 * and do not add live frontend AI calls here.
 */
const TRAIT_LANGUAGE = {
  openness: {
    label: 'openness',
    personTitle: {
      high: 'The Possibility Opener',
      middle: 'The Perspective Shifter',
      low: 'The Grounding Force',
    },
    highGift: 'possibility',
    middleGift: 'perspective',
    lowGift: 'grounding',
    highLine: 'opens up new ways to see the work',
    middleLine: 'moves between new ideas and familiar constraints',
    lowLine: 'keeps the work connected to what is already real',
    sharedTitle: 'The Explorers',
    contrastTitle: 'The Range Finders',
  },
  conscientiousness: {
    label: 'conscientiousness',
    personTitle: {
      high: 'The Momentum Builder',
      middle: 'The Calibrator',
      low: 'The Adaptive Improviser',
    },
    highGift: 'follow-through',
    middleGift: 'calibration',
    lowGift: 'adaptability',
    highLine: 'turns intent into sequence, standards, and next steps',
    middleLine: 'can shift between planning and adapting',
    lowLine: 'keeps the work flexible when the path needs to change',
    sharedTitle: 'The Builders',
    contrastTitle: 'The Launch Crew',
  },
  extraversion: {
    label: 'extraversion',
    personTitle: {
      high: 'The Activator',
      middle: 'The Presence Setter',
      low: 'The Deep Focus',
    },
    highGift: 'activation',
    middleGift: 'presence',
    lowGift: 'depth',
    highLine: 'adds visible energy and momentum to the room',
    middleLine: 'can choose when to energize and when to make room',
    lowLine: 'creates space for quieter thinking before the team moves',
    sharedTitle: 'The Signal Boosters',
    contrastTitle: 'The Rhythm Makers',
  },
  agreeableness: {
    label: 'agreeableness',
    personTitle: {
      high: 'The Trust Carrier',
      middle: 'The Honest Ally',
      low: 'The Useful Challenger',
    },
    highGift: 'trust',
    middleGift: 'discernment',
    lowGift: 'candor',
    highLine: 'keeps people connected when decisions get tense',
    middleLine: 'balances care for people with willingness to name what needs naming',
    lowLine: 'brings useful challenge before the team over-agrees',
    sharedTitle: 'The Trust Builders',
    contrastTitle: 'The Honest Allies',
  },
  neuroticism: {
    label: 'emotional sensitivity',
    personTitle: {
      high: 'The Signal Reader',
      middle: 'The Pressure Sensor',
      low: 'The Steady Center',
    },
    highGift: 'early signal',
    middleGift: 'attunement',
    lowGift: 'steadiness',
    highLine: 'notices risk and emotional static before it becomes loud',
    middleLine: 'can notice pressure without letting it run the room',
    lowLine: 'keeps the room steady when pressure rises',
    sharedTitle: 'The Weather Readers',
    contrastTitle: 'The Stabilizers',
  },
};

const TRAIT_KEYS = Object.keys(TRAIT_LANGUAGE);
const HIGH_TRAIT = 67;
const LOW_TRAIT = 33;
const COMPLEMENT_THRESHOLD = 26;

function getFirstName(member) {
  return member?.name?.split(' ')?.[0] ?? 'This person';
}

function getTraitDirection(score) {
  if (score >= HIGH_TRAIT) return 'high';
  if (score <= LOW_TRAIT) return 'low';
  return 'middle';
}

function getTraitGift(trait, direction) {
  const language = TRAIT_LANGUAGE[trait];
  if (direction === 'low') return language.lowGift;
  if (direction === 'middle') return language.middleGift;
  return language.highGift;
}

function getTraitLine(trait, direction) {
  const language = TRAIT_LANGUAGE[trait];
  if (direction === 'low') return language.lowLine;
  if (direction === 'middle') return language.middleLine;
  return language.highLine;
}

function getStrongestTrait(member) {
  const scores = member?.bigFive ?? {};
  return TRAIT_KEYS.map((trait) => ({
    trait,
    score: scores[trait] ?? 50,
    distance: Math.abs((scores[trait] ?? 50) - 50),
    direction: getTraitDirection(scores[trait] ?? 50),
  })).sort((a, b) => b.distance - a.distance)[0];
}

function getRankedTraits(member) {
  const scores = member?.bigFive ?? {};

  return TRAIT_KEYS.map((trait) => ({
    trait,
    score: scores[trait] ?? 50,
    distance: Math.abs((scores[trait] ?? 50) - 50),
    direction: getTraitDirection(scores[trait] ?? 50),
  })).sort((a, b) => b.distance - a.distance);
}

function getStrongestComplement(first, second) {
  const firstScores = first?.bigFive ?? {};
  const secondScores = second?.bigFive ?? {};

  return TRAIT_KEYS.map((trait) => ({
    trait,
    distance: Math.abs((firstScores[trait] ?? 50) - (secondScores[trait] ?? 50)),
  })).sort((a, b) => b.distance - a.distance)[0];
}

function getStrongestSharedTrait(first, second) {
  const firstScores = first?.bigFive ?? {};
  const secondScores = second?.bigFive ?? {};

  return TRAIT_KEYS.map((trait) => {
    const firstScore = firstScores[trait] ?? 50;
    const secondScore = secondScores[trait] ?? 50;
    const sharedDistance = Math.min(
      Math.abs(firstScore - 50),
      Math.abs(secondScore - 50)
    );

    return {
      trait,
      sharedDistance,
      direction:
        getTraitDirection(firstScore) === getTraitDirection(secondScore)
          ? getTraitDirection(firstScore)
          : 'middle',
    };
  }).sort((a, b) => b.sharedDistance - a.sharedDistance)[0];
}

function getPersonTitle(primary) {
  const title = TRAIT_LANGUAGE[primary.trait].personTitle;
  return title[primary.direction] ?? title.middle;
}

function buildPersonSummary(member, primary, secondary) {
  const firstName = getFirstName(member);

  return [
    {
      text: `${firstName} changes the team by bringing ${getTraitGift(primary.trait, primary.direction)} into the work first. They ${getTraitLine(primary.trait, primary.direction)}, then support that pattern with ${getTraitGift(secondary.trait, secondary.direction)}. The result is a presence that helps the team feel both more capable and more aware of what the moment is asking for.`,
    },
  ];
}

export function buildPersonInsight({ member, cards, authoredInsight }) {
  const rankedTraits = getRankedTraits(member);
  const primary = rankedTraits[0];
  const secondary = rankedTraits[1];

  return {
    id: `person-${member?.id ?? 'unknown'}-generated`,
    eyebrow: member?.name ?? 'Team member',
    title: authoredInsight?.title ?? getPersonTitle(primary),
    summary: authoredInsight?.summary ?? buildPersonSummary(member, primary, secondary),
    cards,
  };
}

function buildComplementInsight(first, second, complement) {
  const trait = complement.trait;
  const language = TRAIT_LANGUAGE[trait];
  const firstDirection = getTraitDirection(first.bigFive?.[trait] ?? 50);
  const secondDirection = getTraitDirection(second.bigFive?.[trait] ?? 50);
  const firstName = getFirstName(first);
  const secondName = getFirstName(second);

  return {
    title: language.contrastTitle,
    summary: [
      { text: firstName, emphasis: true },
      {
        text: ` brings ${getTraitGift(trait, firstDirection)}: ${getTraitLine(trait, firstDirection)}; `,
      },
      { text: secondName, emphasis: true },
      {
        text: ` brings ${getTraitGift(trait, secondDirection)}: ${getTraitLine(trait, secondDirection)}. Together, ${firstName} and ${secondName} create useful tension around ${language.label}. ${firstName}'s ${getTraitGift(trait, firstDirection)} gives the pair one pole; ${secondName}'s ${getTraitGift(trait, secondDirection)} gives it the other.`,
      },
    ],
  };
}

function buildSharedInsight(first, second, shared) {
  const trait = shared.trait;
  const language = TRAIT_LANGUAGE[trait];
  const firstName = getFirstName(first);
  const secondName = getFirstName(second);
  const direction = shared.direction === 'low' ? 'low' : 'high';

  return {
    title: language.sharedTitle,
    summary: [
      { text: firstName, emphasis: true },
      { text: ` and ` },
      { text: secondName, emphasis: true },
      {
        text: ` both bring ${getTraitGift(trait, direction)}. That shared ${language.label} gives this pair an easy rhythm: they tend to recognize the same kind of signal quickly, reinforce each other's instincts, and help the team move with less translation cost.`,
      },
    ],
  };
}

function buildBalancedInsight(first, second) {
  const firstTrait = getStrongestTrait(first);
  const secondTrait = getStrongestTrait(second);
  const firstName = getFirstName(first);
  const secondName = getFirstName(second);

  return {
    title: 'The Complement',
    summary: [
      { text: firstName, emphasis: true },
      {
        text: ` brings ${getTraitGift(firstTrait.trait, firstTrait.direction)}; `,
      },
      { text: secondName, emphasis: true },
      {
        text: ` brings ${getTraitGift(secondTrait.trait, secondTrait.direction)}. This pair works because ${firstName} and ${secondName} do not need to be the same to be useful to each other. Their combined value is the way their strongest instincts give the team more range.`,
      },
    ],
  };
}

// Runtime note: this stays deterministic so the feature can render stable
// pair readouts without needing a live AI call in the browser.
export function buildPairInsight({ first, second, cards }) {
  const complement = getStrongestComplement(first, second);
  const shared = getStrongestSharedTrait(first, second);
  const content =
    complement.distance >= COMPLEMENT_THRESHOLD
      ? buildComplementInsight(first, second, complement)
      : shared.direction !== 'middle'
        ? buildSharedInsight(first, second, shared)
        : buildBalancedInsight(first, second);

  return {
    id: `pair-${first?.id ?? 'unknown'}-${second?.id ?? 'unknown'}-generated`,
    eyebrow: `${getFirstName(first)} x ${getFirstName(second)}`,
    title: content.title,
    summary: content.summary,
    cards,
  };
}
