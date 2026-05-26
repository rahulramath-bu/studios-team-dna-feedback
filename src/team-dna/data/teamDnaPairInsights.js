/**
 * Deterministic Team DNA insight helpers.
 *
 * What: turns Big Five scores into human-readable team, person, and duo
 * superpower language.
 * How: compares strongest traits, shared signals, and complements, then returns
 * the same TeamDnaInsight shape used by the panel.
 * Port: this is the default deterministic insight layer. Backend-authored or
 * AI-assisted copy can override it explicitly, but engineers should be able to
 * plug in real scores and get a complete readable page without hand-writing
 * every person or pair.
 */
const TRAIT_LANGUAGE = {
  openness: {
    label: 'ideas',
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
    label: 'approach',
    personTitle: {
      high: 'The Momentum Builder',
      middle: 'The Calibrator',
      low: 'The Spontaneous Improviser',
    },
    highGift: 'follow-through',
    middleGift: 'calibration',
    lowGift: 'spontaneity',
    highLine: 'turns intent into sequence, standards, and next steps',
    middleLine: 'can shift between planning and adjusting',
    lowLine: 'keeps the work loose enough to change when the path changes',
    sharedTitle: 'The Builders',
    contrastTitle: 'The Launch Crew',
  },
  extraversion: {
    label: 'energy',
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
    label: 'stance with people',
    personTitle: {
      high: 'The Warm Connector',
      middle: 'The Honest Ally',
      low: 'The Useful Challenger',
    },
    highGift: 'warmth',
    middleGift: 'discernment',
    lowGift: 'directness',
    highLine: 'keeps people connected when decisions get tense',
    middleLine: 'balances care for people with willingness to name what needs naming',
    lowLine: 'brings useful challenge before the team over-agrees',
    sharedTitle: 'The Trust Builders',
    contrastTitle: 'The Honest Allies',
  },
  neuroticism: {
    label: 'pressure',
    personTitle: {
      high: 'The Sentinel',
      middle: 'The Pressure Sensor',
      low: 'The Anchor',
    },
    highGift: 'vigilance',
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

function getPronouns(member) {
  const pronouns = member?.pronouns;

  if (pronouns?.subject && pronouns?.object && pronouns?.possessive) {
    return pronouns;
  }

  return {
    subject: 'they',
    object: 'them',
    possessive: 'their',
  };
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

function getTeamTitle(primary, widest) {
  if (primary.trait === 'openness' && primary.direction === 'high') {
    return 'The Possibility Studio';
  }

  if (primary.trait === 'conscientiousness' && primary.direction === 'high') {
    return 'The Delivery Engine';
  }

  if (primary.trait === 'agreeableness' && primary.direction === 'high') {
    return 'The Trust Channel';
  }

  if (primary.trait === 'neuroticism' && primary.direction === 'high') {
    return 'The Signal Watch';
  }

  if (widest?.range >= 38) {
    return 'The Range Team';
  }

  return 'The Working Shape';
}

function buildPersonSummary(member, primary, secondary) {
  const firstName = getFirstName(member);
  const pronouns = getPronouns(member);

  return [
    {
      text: `${firstName} changes the team by bringing ${getTraitGift(primary.trait, primary.direction)} into the work first. ${firstName} ${getTraitLine(primary.trait, primary.direction)}, then supports that pattern with ${getTraitGift(secondary.trait, secondary.direction)}. The result is that ${pronouns.possessive} presence helps the team feel both more capable and more aware of what the moment is asking for.`,
    },
  ];
}

function mergeResolvedInsight(generatedInsight, authoredInsight) {
  if (
    authoredInsight?.source !== 'ai' &&
    authoredInsight?.source !== 'override'
  ) {
    return {
      ...generatedInsight,
      source: 'deterministic',
    };
  }

  return {
    ...generatedInsight,
    ...authoredInsight,
    summary: authoredInsight.summary ?? generatedInsight.summary,
    title: authoredInsight.title ?? generatedInsight.title,
  };
}

export function buildTeamInsight({ team, members, cards, authoredInsight }) {
  const scoredMembers = members.filter((member) => member?.bigFive);

  if (scoredMembers.length === 0) {
    return mergeResolvedInsight(
      {
        id: `team-${team?.id ?? 'unknown'}-generated`,
        eyebrow: 'Team',
        title: team?.name ?? 'This team',
        isEditable: true,
        summary: [
          {
            text: 'Team summary appears when assessment data is available.',
          },
        ],
        cards,
      },
      authoredInsight
    );
  }

  const traitAverages = TRAIT_KEYS.map((trait) => {
    const scores = scoredMembers.map((member) => member.bigFive[trait] ?? 50);
    const average =
      scores.reduce((total, score) => total + score, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    return {
      trait,
      average,
      range: max - min,
      direction: getTraitDirection(average),
      distance: Math.abs(average - 50),
    };
  }).sort((a, b) => b.distance - a.distance);
  const primary = traitAverages[0];
  const widest = [...traitAverages].sort((a, b) => b.range - a.range)[0];
  const teamName = team?.name ?? 'This team';
  const widestLanguage = TRAIT_LANGUAGE[widest.trait];
  const generatedInsight = {
    id: `team-${team?.id ?? 'unknown'}-generated`,
    eyebrow: 'Team',
    title: getTeamTitle(primary, widest),
    isEditable: true,
    summary: [
      {
        text: `${teamName} is shaped most by ${getTraitGift(primary.trait, primary.direction)}. As a group, the team ${getTraitLine(primary.trait, primary.direction)}, which gives the work a clear center of gravity. The biggest range is around ${widestLanguage.label}, so this is the place where naming expectations out loud will save the most translation cost.`,
      },
    ],
    cards,
  };

  return mergeResolvedInsight(generatedInsight, authoredInsight);
}

export function buildPersonInsight({ member, cards, authoredInsight }) {
  const rankedTraits = getRankedTraits(member);
  const primary = rankedTraits[0];
  const secondary = rankedTraits[1];
  const generatedInsight = {
    id: `person-${member?.id ?? 'unknown'}-generated`,
    eyebrow: member?.name ?? 'Team member',
    title: getPersonTitle(primary),
    summary: buildPersonSummary(member, primary, secondary),
    cards,
  };

  return mergeResolvedInsight(generatedInsight, authoredInsight);
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
    title: 'The Counterparts',
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
export function buildPairInsight({ first, second, cards, authoredInsight }) {
  const complement = getStrongestComplement(first, second);
  const shared = getStrongestSharedTrait(first, second);
  const content =
    complement.distance >= COMPLEMENT_THRESHOLD
      ? buildComplementInsight(first, second, complement)
      : shared.direction !== 'middle'
        ? buildSharedInsight(first, second, shared)
        : buildBalancedInsight(first, second);

  const generatedInsight = {
    id: `pair-${first?.id ?? 'unknown'}-${second?.id ?? 'unknown'}-generated`,
    eyebrow: `${getFirstName(first)} x ${getFirstName(second)}`,
    title: content.title,
    summary: content.summary,
    cards,
  };

  return mergeResolvedInsight(generatedInsight, authoredInsight);
}
