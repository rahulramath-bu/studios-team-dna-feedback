import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from './bigFiveTraits.js';

const WATCH_OUTS = {
  openness: {
    low: {
      title: 'When the answer needs to be new.',
      body: "The familiar path is often the right one, until it isn't.",
      tip: 'try asking, "what is one option I have not considered yet?"',
    },
    high: {
      title: 'When the ideas keep coming.',
      body: 'The pull toward the next idea can be stronger than the pull to land the current one.',
      tip: 'ask if the thing in front of you is actually done, or if you just want a new puzzle.',
    },
    wide: {
      title: 'When one wants new and one wants known.',
      body: "One side reaches for an option no one has tried; the other reaches for what's been proven.",
      tip: 'let the inventive side propose first, then let the grounded side ask what would have to be true.',
    },
  },
  conscientiousness: {
    low: {
      title: 'When the handoff matters most.',
      body: 'Working spontaneously is useful until someone else needs to pick up the thread.',
      tip: 'say what done looks like and when it is needed before passing work along.',
    },
    high: {
      title: 'When the plan stops being the plan.',
      body: 'Standards and follow-through are strengths, but the original plan is not always the right plan.',
      tip: 'add one midpoint check to ask if the plan still matches what you now know.',
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
      title: 'When the message lands harder than meant.',
      body: "Direct feedback is useful when it is wanted and a hit when it isn't.",
      tip: 'try saying, "I am going to be direct because I think this matters" before the hard part.',
    },
    high: {
      title: 'When the hard thing needs saying.',
      body: 'Keeping the room warm is real value, but some disagreements need to come above the surface.',
      tip: 'pick one disagreement and name it kindly but plainly.',
    },
    wide: {
      title: 'When direct meets warm.',
      body: 'One side may name what is wrong fast while the other protects how it lands.',
      tip: 'use a small signal like "I am being direct, not annoyed" or "I am being careful, not avoiding."',
    },
  },
  neuroticism: {
    low: {
      title: "When someone else's pressure is real.",
      body: 'Calm is a gift, except when it gets read as not caring.',
      tip: 'ask, "what are you carrying that I am not seeing?"',
    },
    high: {
      title: 'When worry becomes the work.',
      body: 'Catching what could go wrong is useful until the same worry repeats without changing the plan.',
      tip: 'name the worry, decide to act or release it, and then move on.',
    },
    wide: {
      title: 'Translating between steady and vigilant.',
      body: 'One side may read pressure as a signal to act while the other reads it as something to move through.',
      tip: 'ask what each person is seeing before deciding whether the signal needs action.',
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
