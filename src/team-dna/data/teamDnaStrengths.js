import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from './bigFiveTraits.js';

// Strengths are the positive mirror of the blind spots and use the same
// personalization moves: a solo read names the person, a team read says "this
// team", and a pair read either celebrates a real contrast ("polar opposites")
// or a shared strong tendency ("both of them"). Each item is a short headline
// plus a concrete, plain-language description — never "high/low openness".

// Singular leads. Read as "{subject} {lead}", where subject is a person's first
// name or "This team", so the same copy works for solo and team views.
const STRENGTHS = {
  openness: {
    high: {
      title: 'Quick to find new angles.',
      lead: "opens fresh directions and reframes problems easily, so the obvious answer rarely wins by default — there's usually a stronger option on the table before a decision lands.",
    },
    low: {
      title: 'Grounded in what works.',
      lead: 'keeps ideas tied to what is realistic and proven, so plans stay buildable and energy goes toward the options that can actually ship.',
    },
  },
  conscientiousness: {
    high: {
      title: 'Turns plans into finished work.',
      lead: 'brings real structure and follow-through, so decisions become owned, finished outcomes instead of good intentions.',
    },
    low: {
      title: 'Adapts fast when plans change.',
      lead: 'stays loose and improvises well, so momentum holds and the work keeps moving even when priorities shift.',
    },
  },
  extraversion: {
    high: {
      title: 'Creates momentum and energy.',
      lead: 'brings energy and gets people moving, so discussion turns into action instead of stalling.',
    },
    low: {
      title: 'Brings depth and a considered read.',
      lead: 'listens and synthesizes before reacting, so the thinking goes deeper instead of defaulting to the fastest take in the room.',
    },
  },
  agreeableness: {
    high: {
      title: 'Builds trust and keeps people engaged.',
      lead: 'builds trust and draws in quieter voices, so collaboration stays smooth and people stay bought in, even under pressure.',
    },
    low: {
      title: 'Willing to challenge the logic.',
      lead: 'names the hard tradeoffs and tests weak logic, so easy, false agreement gets caught before it becomes expensive.',
    },
  },
  neuroticism: {
    low: {
      title: 'Steady under pressure.',
      lead: 'holds composure when things get tense, so judgment stays clear and the work keeps moving under pressure.',
    },
    high: {
      title: 'Catches risk early.',
      lead: 'reads risk early and notices weak signals, so problems get seen while there is still time to act on them.',
    },
  },
};

// Pair copy. `complement` describes a real contrast between the two people as a
// strength ({high}/{low} are filled with the right names). `high`/`low`
// describe a shared strong tendency ({a}/{b} are both names).
const PAIR = {
  openness: {
    complement: {
      title: 'Invention balanced by grounding.',
      body: '{high} pushes for new directions while {low} keeps things grounded in what works, so the pair can explore widely without drifting from what will actually ship.',
    },
    high: {
      title: 'Two strong idea engines.',
      body: '{a} and {b} both gravitate toward new directions, so this pair generates options fast and rarely settles for the obvious answer.',
    },
    low: {
      title: 'Both grounded in what works.',
      body: '{a} and {b} both keep ideas realistic, so plans stay buildable and the pair wastes little energy on options that cannot ship.',
    },
  },
  conscientiousness: {
    complement: {
      title: 'Structure meets adaptability.',
      body: '{high} brings structure and follow-through while {low} stays flexible when plans shift, so the work stays organized without going rigid.',
    },
    high: {
      title: 'Both finish what they start.',
      body: '{a} and {b} both bring structure and follow-through, so commitments between them reliably turn into done work.',
    },
    low: {
      title: 'Both move fast and flex.',
      body: '{a} and {b} both improvise easily, so the pair adapts quickly when the plan changes.',
    },
  },
  extraversion: {
    complement: {
      title: 'Spark paired with depth.',
      body: '{high} brings energy and momentum while {low} brings a slower, considered read, so the pair gets both the push and the pause it needs.',
    },
    high: {
      title: 'Shared momentum.',
      body: '{a} and {b} both bring energy, so this pair gets things moving and keeps the conversation active.',
    },
    low: {
      title: 'Shared depth.',
      body: '{a} and {b} both think before reacting, so the pair goes deep instead of chasing the fastest take.',
    },
  },
  agreeableness: {
    complement: {
      title: 'Candor balanced by warmth.',
      body: '{high} protects trust and keeps people engaged while {low} is willing to challenge weak logic, so hard things get said without costing the relationship.',
    },
    high: {
      title: 'Strong mutual trust.',
      body: '{a} and {b} both lead with cooperation, so this pair builds trust quickly and keeps things collaborative.',
    },
    low: {
      title: 'Both willing to be direct.',
      body: '{a} and {b} are both comfortable challenging weak logic, so this pair catches problems early instead of over-agreeing.',
    },
  },
  neuroticism: {
    complement: {
      title: 'Vigilance meets steadiness.',
      body: '{high} catches risk early while {low} keeps perspective under pressure, so the pair neither dismisses real signals nor gets swept up in them.',
    },
    high: {
      title: 'Both quick to spot risk.',
      body: '{a} and {b} both read weak signals early, so little gets past this pair before it grows.',
    },
    low: {
      title: 'Both steady under pressure.',
      body: '{a} and {b} both keep composure when things get tense, so the pair stays clear-headed when the stakes rise.',
    },
  },
};

function getFirstName(subject) {
  return subject?.name?.split(' ')?.[0] ?? 'They';
}

function getScores(subjects, trait) {
  return subjects.map((subject) => getBigFiveScore(subject, trait.key));
}

function getTraitStats(subjects, trait) {
  const scores = getScores(subjects, trait);
  const average =
    scores.reduce((total, score) => total + score, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  return {
    average,
    distanceFromMiddle: Math.abs(average - 50),
    max,
    min,
    range: max - min,
    side: average >= 50 ? 'high' : 'low',
    trait,
  };
}

function getExtremeTraits(subjects) {
  return BIG_FIVE_TRAITS.map((trait) => getTraitStats(subjects, trait)).sort(
    (a, b) => b.distanceFromMiddle - a.distanceFromMiddle
  );
}

function getWidestTraits(subjects) {
  return BIG_FIVE_TRAITS.map((trait) => getTraitStats(subjects, trait)).sort(
    (a, b) => b.range - a.range
  );
}

function getSoloStrengths(subjects) {
  const name = getFirstName(subjects[0]);

  return getExtremeTraits(subjects)
    .slice(0, 2)
    .map((stats) => {
      const copy = STRENGTHS[stats.trait.key][stats.side];
      return {
        title: copy.title,
        body: `${name} ${copy.lead}`,
        traitKey: stats.trait.key,
        type: stats.side,
      };
    });
}

function getTeamStrengths(subjects) {
  return getExtremeTraits(subjects)
    .slice(0, 2)
    .map((stats) => {
      const copy = STRENGTHS[stats.trait.key][stats.side];
      return {
        title: copy.title,
        body: `This team ${copy.lead}`,
        traitKey: stats.trait.key,
        type: stats.side,
      };
    });
}

function getDuoStrengths(subjects) {
  const nameA = getFirstName(subjects[0]);
  const nameB = getFirstName(subjects[1]);

  const complements = getWidestTraits(subjects)
    .filter((stats) => stats.range >= 26)
    .map((stats) => {
      const scoreA = getBigFiveScore(subjects[0], stats.trait.key);
      const scoreB = getBigFiveScore(subjects[1], stats.trait.key);
      const highName = scoreA >= scoreB ? nameA : nameB;
      const lowName = scoreA >= scoreB ? nameB : nameA;
      const copy = PAIR[stats.trait.key].complement;
      return {
        title: copy.title,
        body: copy.body.replace('{high}', highName).replace('{low}', lowName),
        traitKey: stats.trait.key,
        type: 'complement',
      };
    });

  const shared = getExtremeTraits(subjects)
    .filter((stats) => {
      const scoreA = getBigFiveScore(subjects[0], stats.trait.key);
      const scoreB = getBigFiveScore(subjects[1], stats.trait.key);
      return (scoreA >= 50) === (scoreB >= 50);
    })
    .map((stats) => {
      const copy = PAIR[stats.trait.key][stats.side];
      return {
        title: copy.title,
        body: copy.body.replace('{a}', nameA).replace('{b}', nameB),
        traitKey: stats.trait.key,
        type: stats.side,
      };
    });

  // Prefer one contrast plus one shared strength so the pair read shows both
  // "polar opposites" and "alike" where the scores support it, then top up.
  const items = [];

  if (complements.length) {
    items.push(complements[0]);
  }

  const sharedPick = shared.find(
    (item) => !items.some((existing) => existing.traitKey === item.traitKey)
  );
  if (sharedPick) {
    items.push(sharedPick);
  }

  for (const candidate of [...complements.slice(1), ...shared]) {
    if (items.length >= 2) break;
    if (!items.some((existing) => existing.traitKey === candidate.traitKey)) {
      items.push(candidate);
    }
  }

  return items.slice(0, 2);
}

/**
 * Deterministic strengths generator.
 *
 * What: turns Big Five patterns into two personalized strength reads that mirror
 * the watch-out card's shape and voice, so Strengths and Potential blind spots
 * read as a matched pair.
 * How: a solo read names the person on their two most pronounced traits, a team
 * read says "this team", and a pair read pairs one real contrast ("polar
 * opposites") with one shared strong tendency where the scores support it.
 * Port: map any backend-approved strength copy into the same
 * `{ title, body, traitKey, type }` item shape and leave the UI unchanged.
 */
export function getStrengthForSubjects(subjects) {
  const scoredSubjects = subjects.filter((subject) => subject?.bigFive);

  if (scoredSubjects.length === 0) {
    return null;
  }

  if (scoredSubjects.length === 1) {
    return { items: getSoloStrengths(scoredSubjects) };
  }

  if (scoredSubjects.length === 2) {
    return { items: getDuoStrengths(scoredSubjects) };
  }

  return { items: getTeamStrengths(scoredSubjects) };
}
