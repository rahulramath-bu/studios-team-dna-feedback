import { getCombinedFallbackRoleTitle } from './teamDnaFallbackRoles.js';

/**
 * Deterministic Team DNA insight helpers.
 *
 * What: turns Big Five scores into human-readable team, person, and duo
 * superpower language.
 * How: compares strongest traits, combined fallback role signals, shared
 * signals, and complements, then returns the same TeamDnaInsight shape used by
 * the panel.
 * Port: this is the default deterministic insight layer. Backend-authored or
 * AI-assisted copy can override it explicitly, but engineers should be able to
 * plug in real scores and get a complete readable page without hand-writing
 * every person or pair.
 */
const TRAIT_LANGUAGE = {
  openness: {
    label: 'ideas',
    poleLabel: {
      high: 'explorative',
      middle: 'practical / explorative',
      low: 'practical',
    },
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
    readLine: {
      high: 'bringing the team more options, reframes, and possible paths.',
      middle: 'helping the team test new ideas against what can actually hold.',
      low: 'helping the team stay close to what is proven, usable, and real.',
    },
    sharedTitle: 'The Explorers',
    contrastTitle: 'The Range Finders',
  },
  conscientiousness: {
    label: 'approach',
    poleLabel: {
      high: 'thorough',
      middle: 'casual / thorough',
      low: 'casual',
    },
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
    readLine: {
      high: 'giving the team clearer owners, standards, and next steps.',
      middle: 'helping the team move with enough structure without getting stiff.',
      low: 'helping the team adapt when the original plan stops fitting the work.',
    },
    sharedTitle: 'The Builders',
    contrastTitle: 'The Launch Crew',
  },
  extraversion: {
    label: 'energy',
    poleLabel: {
      high: 'expressive',
      middle: 'reserved / expressive',
      low: 'reserved',
    },
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
    readLine: {
      high: 'making momentum, verbal processing, and social energy easier to feel.',
      middle: 'moving between quiet processing and active participation.',
      low: 'bringing depth, listening, and quieter synthesis before the team moves.',
    },
    sharedTitle: 'The Signal Boosters',
    contrastTitle: 'The Rhythm Makers',
  },
  agreeableness: {
    label: 'stance with people',
    poleLabel: {
      high: 'cooperative',
      middle: 'challenging / cooperative',
      low: 'challenging',
    },
    personTitle: {
      high: 'The Warm Connector',
      middle: 'The Honest Ally',
      low: 'The Useful Challenger',
    },
    highGift: 'cooperation',
    middleGift: 'discernment',
    lowGift: 'skepticism',
    highLine: 'keeps people connected and cooperating when decisions get tense',
    middleLine: 'balances care for people with willingness to name what needs naming',
    lowLine: 'questions assumptions before the team over-agrees',
    readLine: {
      high: 'helping the team preserve trust, inclusion, and workable relationships.',
      middle: 'helping the team balance honest challenge with care for how it lands.',
      low: 'helping the team question assumptions, sharpen tradeoffs, and avoid false agreement.',
    },
    sharedTitle: 'The Trust Builders',
    contrastTitle: 'The Honest Allies',
  },
  neuroticism: {
    label: 'pressure',
    poleLabel: {
      high: 'intense',
      middle: 'calm / intense',
      low: 'calm',
    },
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
    readLine: {
      high: 'catching risk signals early and noticing what may need protection.',
      middle: 'reading pressure without letting it run the room.',
      low: 'helping the team stay regulated and keep perspective under pressure.',
    },
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

function getPersonTitle(primary, secondary) {
  const combinedRoleTitle = getCombinedFallbackRoleTitle(primary, secondary);

  if (combinedRoleTitle) {
    return combinedRoleTitle;
  }

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

  return [
    {
      text: `${firstName} helps the team by bringing ${getTraitGift(primary.trait, primary.direction)} into the work first. In practice, ${firstName} ${getTraitLine(primary.trait, primary.direction)}. That becomes most useful when the team also needs ${getTraitGift(secondary.trait, secondary.direction)}: ${getTraitLine(secondary.trait, secondary.direction)}.`,
    },
  ];
}

function getTraitRead(trait, direction, subject) {
  const language = TRAIT_LANGUAGE[trait];
  const poleLabel = language.poleLabel?.[direction] ?? language.label;
  const readLine = language.readLine?.[direction] ?? getTraitLine(trait, direction);

  return `${subject} is **${poleLabel}**, ${readLine}`;
}

function getPersonSpectrumReads(member) {
  const firstName = getFirstName(member);

  return Object.fromEntries(
    TRAIT_KEYS.map((trait) => {
      const direction = getTraitDirection(member?.bigFive?.[trait] ?? 50);
      return [trait, getTraitRead(trait, direction, firstName)];
    })
  );
}

function getTeamSpectrumReads(teamName, traitAverages) {
  return Object.fromEntries(
    traitAverages.map((stats) => [
      stats.trait,
      getTraitRead(stats.trait, stats.direction, teamName),
    ])
  );
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
        text: `${teamName} is shaped most by ${getTraitGift(primary.trait, primary.direction)}. As a group, the team ${getTraitLine(primary.trait, primary.direction)}. The biggest range is around ${widestLanguage.label}, so naming expectations there will save the team from guessing what each person means.`,
      },
    ],
    spectrumReads: getTeamSpectrumReads(teamName, traitAverages),
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
    title: getPersonTitle(primary, secondary),
    summary: buildPersonSummary(member, primary, secondary),
    spectrumReads: getPersonSpectrumReads(member),
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
        text: ` ${getTraitLine(trait, firstDirection)}, while `,
      },
      { text: secondName, emphasis: true },
      {
        text: ` ${getTraitLine(trait, secondDirection)}. Used well, this pair can do both at once — one pushes while the other keeps it grounded — so the team gets the full picture before it commits.`,
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
        text: ` both ${getTraitLine(trait, direction)}. Because they share that instinct, this pair tends to agree fast and move with little back-and-forth — just make sure a different angle still gets into the room.`,
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
        text: ` tends to ${getTraitLine(firstTrait.trait, firstTrait.direction)}, while `,
      },
      { text: secondName, emphasis: true },
      {
        text: ` tends to ${getTraitLine(secondTrait.trait, secondTrait.direction)}. They cover different ground, so together they catch things neither would alone.`,
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
