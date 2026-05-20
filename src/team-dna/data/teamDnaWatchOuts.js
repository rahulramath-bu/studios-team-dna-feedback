import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from './bigFiveTraits.js';

const WATCH_OUTS = {
  openness: {
    low: {
      title: 'Closing the door too soon.',
      body: 'Make room for one strange idea before choosing the safest one.',
      tip: 'try asking, "what is one version we have not tried yet?"',
    },
    high: {
      title: 'Chasing every idea.',
      body: 'Pick one path before the room fills up with possibilities.',
      tip: 'choose one idea to test before adding another.',
    },
    wide: {
      title: 'Forgetting to name what is real and what is new.',
      body: 'One side may want proof while the other wants space to imagine.',
      tip: 'start by naming the bold idea, then the simplest proof.',
    },
  },
  conscientiousness: {
    low: {
      title: 'Leaving the next step fuzzy.',
      body: 'Say who owns what before everyone walks away.',
      tip: 'end with one owner, one next step, and one date.',
    },
    high: {
      title: 'Planning the life out of it.',
      body: 'Leave enough room for the work to change once it meets real life.',
      tip: 'decide what must be fixed and what can stay flexible.',
    },
    wide: {
      title: 'Getting agreement on the handoff.',
      body: 'One side may move with flow while the other needs a clear plan.',
      tip: 'before switching owners, try saying exactly what done means.',
    },
  },
  extraversion: {
    low: {
      title: 'Mistaking quiet for no energy.',
      body: 'Give people time to think before asking for the big answer.',
      tip: 'send the question first, then discuss it live.',
    },
    high: {
      title: 'Letting the loudest energy lead every time.',
      body: 'Pause long enough for quieter signals to enter the room.',
      tip: 'ask for one quiet read before the group decides.',
    },
    wide: {
      title: 'Losing either pause or spark.',
      body: 'Some energy may need space, and some may need motion.',
      tip: 'give the room a minute to think, then invite the push.',
    },
  },
  agreeableness: {
    low: {
      title: 'Letting truth become too sharp.',
      body: 'Say the hard thing, then make sure it can still be heard.',
      tip: 'pair the clear point with why it matters.',
    },
    high: {
      title: 'Smoothing over the hard thing.',
      body: 'Kindness helps most when the real issue still gets named.',
      tip: 'say the kind thing and the true thing.',
    },
    wide: {
      title: 'Making honesty hard to hear.',
      body: 'One side may push for truth while the other protects trust.',
      tip: 'start with care, then name the real issue plainly.',
    },
  },
  neuroticism: {
    low: {
      title: 'Missing the early signal.',
      body: 'Calm is useful, but check if someone else is noticing risk first.',
      tip: 'ask, "is there anything here we are not seeing yet?"',
    },
    high: {
      title: 'Letting every signal become a fire.',
      body: 'Notice the risk, then choose what truly needs action.',
      tip: 'name the worry, then pick the next useful move.',
    },
    wide: {
      title: 'Letting stress stay blurry.',
      body: 'One side may bring calm while the other notices what needs care.',
      tip: 'separate what is urgent from what is only noisy.',
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
    .slice(0, 3)
    .map((stats) => makeWatchOut(stats, stats.side, eyebrow));
}

function getDuoWatchOuts(subjects) {
  const wideItems = getWidestTraits(subjects)
    .filter((stats) => stats.range >= 26)
    .map((stats) => makeWatchOut(stats, 'wide', 'For this pair'));
  const extremeItems = getExtremeTraits(subjects).map((stats) =>
    makeWatchOut(stats, stats.side, 'For this pair')
  );

  return uniqueWatchOuts([...wideItems, ...extremeItems]).slice(0, 3);
}

function getTeamWatchOuts(subjects) {
  const wideItems = getWidestTraits(subjects)
    .filter((stats) => stats.range >= 38)
    .map((stats) => makeWatchOut(stats, 'wide', 'For the team'));
  const extremeItems = getExtremeTraits(subjects).map((stats) =>
    makeWatchOut(stats, stats.side, 'For the team')
  );

  return uniqueWatchOuts([...wideItems, ...extremeItems]).slice(0, 3);
}

/**
 * Deterministic watch-out generator.
 *
 * What: turns Big Five patterns into three plain caution reads for team, solo,
 * or duo views.
 * How: uses the most stretched traits for solo, the widest gaps plus strongest
 * shared patterns for duo/team, and simple copy that never exposes
 * "high/low openness" language.
 * Port: keep this as fallback/client-side insight logic. If the backend later
 * sends approved watch-out copy, map it into the same `{ eyebrow, title, body }`
 * card data and leave the UI component unchanged.
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
