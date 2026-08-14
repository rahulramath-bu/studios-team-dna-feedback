import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from './bigFiveTraits.js';

const WATCH_OUTS = {
  openness: {
    low: {
      title: 'Can rule out a new idea too soon.',
      body: 'Staying practical keeps the team realistic, but it can shut down a better option before it gets a fair test.',
      tip: 'ask "what option have we not considered yet?"',
    },
    high: {
      title: 'Can keep exploring past the decision.',
      body: 'Generating options is useful, but opening yet another path can delay choosing the one already on the table.',
      tip: 'ask if the option on the table is good enough to commit.',
    },
    wide: {
      title: 'One wants new, one wants proven.',
      body: 'One side pushes for new ideas while the other tests what is realistic. It goes wrong when only one of those voices gets heard.',
      tip: 'let the new idea get proposed first, then ask what would have to be true for it to work.',
    },
  },
  conscientiousness: {
    low: {
      title: 'Can leave the handoff unclear.',
      body: 'Flexibility keeps the work adaptable, but too little structure leaves the next person guessing what "done" means.',
      tip: 'say what "done" means before handing work off.',
    },
    high: {
      title: 'Can hold the plan too long.',
      body: 'Structure turns intent into action, but a plan can get protected even after the situation has changed.',
      tip: 'add one midpoint check: does the plan still fit?',
    },
    wide: {
      title: 'Different ideas of "done".',
      body: 'One side adapts on the fly while the other wants a clear plan. Handoffs slip when those expectations are never said out loud.',
      tip: 'before switching owners, agree on exactly what done means.',
    },
  },
  extraversion: {
    low: {
      title: 'Quiet can read as no opinion.',
      body: 'Thinking before speaking gives a more considered read, but the room can move on before that read gets shared.',
      tip: 'share your take before it feels finished.',
    },
    high: {
      title: 'Loud energy can set the pace too early.',
      body: 'Visible energy creates momentum, but it can lock in a direction before quieter people have weighed in.',
      tip: 'ask for one quiet read before the group decides.',
    },
    wide: {
      title: 'Two different rhythms.',
      body: 'One person processes out loud while the other needs space to think. It strains when one rhythm becomes the default.',
      tip: 'give the room a minute to think, then open the discussion.',
    },
  },
  agreeableness: {
    low: {
      title: 'Challenge can land harder than meant.',
      body: 'Testing weak logic protects the team, but the challenge can come across sharper than intended.',
      tip: 'open with "I am direct because this matters."',
    },
    high: {
      title: 'Can soften the hard message.',
      body: 'Keeping things warm protects trust, but it can blur a disagreement that the team needs stated clearly.',
      tip: 'name one real disagreement plainly, and kindly.',
    },
    wide: {
      title: 'Direct meets diplomatic.',
      body: 'One person sharpens the issue while the other protects the relationship. It gets awkward when either has to carry the whole exchange alone.',
      tip: 'use a quick signal like "I am being direct, not annoyed."',
    },
  },
  neuroticism: {
    low: {
      title: 'Calm can miss real urgency.',
      body: 'Staying steady keeps perspective, but it can read as not noticing the pressure other people are under.',
      tip: 'ask "what are you carrying that I am not seeing?"',
    },
    high: {
      title: 'Risk-spotting needs a next step.',
      body: 'Catching risk early is valuable, but naming the same risk over and over without a decision wears the team down.',
      tip: 'name the risk, decide on it, and move on.',
    },
    wide: {
      title: 'One senses risk, one stays calm.',
      body: 'One person flags what could go wrong while the other keeps perspective. It tips over when pressure is either dismissed too fast or held too long.',
      tip: 'ask what each person is seeing before deciding whether the risk needs action.',
    },
  },
};

function getFirstName(subject) {
  return subject?.name?.split(' ')?.[0] ?? 'This person';
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

function makeWatchOut(stats, type, eyebrow) {
  return {
    ...WATCH_OUTS[stats.trait.key][type],
    eyebrow,
    traitKey: stats.trait.key,
    type,
  };
}

function uniqueWatchOuts(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.traitKey}-${item.type}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getSoloWatchOuts(subjects) {
  const subject = subjects[0];
  const eyebrow = `For ${getFirstName(subject)}`;

  return getExtremeTraits(subjects)
    .slice(0, 2)
    .map((stats) => makeWatchOut(stats, stats.side, eyebrow));
}

function getDuoWatchOuts(subjects) {
  const wideItems = getWidestTraits(subjects)
    .filter((stats) => stats.range >= 26)
    .map((stats) => makeWatchOut(stats, 'wide', 'For this pair'));
  const extremeItems = getExtremeTraits(subjects).map((stats) =>
    makeWatchOut(stats, stats.side, 'For this pair')
  );

  return uniqueWatchOuts([...wideItems, ...extremeItems]).slice(0, 2);
}

function getTeamWatchOuts(subjects) {
  const wideItems = getWidestTraits(subjects)
    .filter((stats) => stats.range >= 38)
    .map((stats) => makeWatchOut(stats, 'wide', 'For the team'));
  const extremeItems = getExtremeTraits(subjects).map((stats) =>
    makeWatchOut(stats, stats.side, 'For the team')
  );

  return uniqueWatchOuts([...wideItems, ...extremeItems]).slice(0, 2);
}

/**
 * Deterministic watch-out generator.
 *
 * What: turns Big Five patterns into three plain caution reads for team, solo,
 * or duo views.
 * How: uses the most stretched traits for solo, the widest gaps plus strongest
 * shared patterns for duo/team, and simple copy that never exposes
 * "high/low openness" language.
 * Port: this can be the default deterministic watch-out layer when the backend
 * only returns scores. If the backend later sends approved watch-out copy, map
 * it into the same `{ eyebrow, title, body }` card data and leave the UI
 * component unchanged.
 */
export function getWatchOutForSubjects(subjects) {
  const scoredSubjects = subjects.filter((subject) => subject?.bigFive);

  if (scoredSubjects.length === 0) {
    return null;
  }

  if (scoredSubjects.length === 1) {
    return { items: getSoloWatchOuts(scoredSubjects) };
  }

  if (scoredSubjects.length === 2) {
    return { items: getDuoWatchOuts(scoredSubjects) };
  }

  return { items: getTeamWatchOuts(scoredSubjects) };
}
