import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from './bigFiveTraits.js';

const WATCH_OUTS = {
  openness: {
    low: {
      title: 'When the answer needs to be new.',
      body: "Practical judgment is useful because it keeps the team close to what works. Watch when it narrows the room before a new option has been tested.",
      tip: 'try asking, "what is one option I have not considered yet?"',
    },
    high: {
      title: 'When the ideas keep coming.',
      body: 'Inventive energy is useful because it opens paths the team would not see otherwise. Watch when opening another path delays choosing the one in front of you.',
      tip: 'ask if the thing in front of you is done, or if you just want a new puzzle.',
    },
    wide: {
      title: 'When one wants new and one wants known.',
      body: "This range is useful because one side opens possibility while the other tests feasibility. Watch when either exploration or grounding becomes the only voice in the room.",
      tip: 'let the inventive side propose first, then let the grounded side ask what would have to be true.',
    },
  },
  conscientiousness: {
    low: {
      title: 'When the handoff matters most.',
      body: 'Flexibility is useful because it helps the work adapt when the plan changes. Watch when too much looseness makes the next owner guess what done means.',
      tip: 'say what done looks like and when it is needed before passing work along.',
    },
    high: {
      title: 'When the plan stops being the plan.',
      body: 'Structure is useful because it turns intent into owners, standards, and next steps. Watch when the plan gets protected after the situation has changed.',
      tip: 'add one midpoint check to ask if the plan still matches what you now know.',
    },
    wide: {
      title: 'Getting agreement on the handoff.',
      body: 'This range is useful because one side adapts quickly while the other creates anchors. Watch when the handoff depends on assumptions instead of an explicit agreement.',
      tip: 'before switching owners, try saying exactly what done means.',
    },
  },
  extraversion: {
    low: {
      title: 'Mistaking quiet for no energy.',
      body: 'Reflection is useful because it gives the team a more considered read. Watch when the room moves on before that read has entered the conversation.',
      tip: 'send the question first, then discuss it live.',
    },
    high: {
      title: 'Letting the loudest energy lead every time.',
      body: 'Expressive energy is useful because it creates momentum the room can feel. Watch when that momentum sets the pace before quieter signals have surfaced.',
      tip: 'ask for one quiet read before the group decides.',
    },
    wide: {
      title: 'Losing either pause or spark.',
      body: 'This range is useful because one side creates spark while the other creates space. Watch when the team treats one rhythm as the default.',
      tip: 'give the room a minute to think, then invite the push.',
    },
  },
  agreeableness: {
    low: {
      title: 'When the message lands harder than meant.',
      body: 'Skepticism is useful because it tests weak logic before the team over-agrees. Watch when the challenge arrives without enough landing context.',
      tip: 'try saying, "I am going to be direct because I think this matters" before the hard part.',
    },
    high: {
      title: 'When the hard thing needs saying.',
      body: 'Cooperation is useful because it keeps trust and participation intact. Watch when preserving warmth makes the real disagreement harder to see.',
      tip: 'pick one disagreement and name it kindly but plainly.',
    },
    wide: {
      title: 'When direct meets warm.',
      body: 'This range is useful because one side sharpens the issue while the other protects trust. Watch when directness or warmth has to carry the whole exchange alone.',
      tip: 'use a small signal like "I am being direct, not annoyed" or "I am being careful, not avoiding."',
    },
  },
  neuroticism: {
    low: {
      title: "When someone else's pressure is real.",
      body: 'Steadiness is useful because it keeps perspective when pressure rises. Watch when calm gets read as not noticing what others are carrying.',
      tip: 'ask, "what are you carrying that I am not seeing?"',
    },
    high: {
      title: 'When risk-sensing needs a next step.',
      body: 'Vigilance is useful because it catches weak signals before they become expensive. Watch when the risk keeps repeating without becoming a decision or action.',
      tip: 'name the signal, decide to act or release it, and then move on.',
    },
    wide: {
      title: 'Translating between steady and vigilant.',
      body: 'This range is useful because one side detects risk while the other keeps perspective. Watch when pressure is either dismissed too quickly or held too long.',
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
