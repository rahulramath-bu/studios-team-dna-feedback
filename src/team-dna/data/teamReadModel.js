import { BIG_FIVE_TRAITS, getBigFiveScore } from './bigFiveTraits.js';

/**
 * Team read model for the depth iterations.
 *
 * What: turns raw scores into the small set of reads the depth variations
 * share: per-trait patterns for the fingerprint figure, merged
 * strength-and-flip items (reusing the page's existing authored copy), and
 * the one or two working agreements worth making.
 * How: analysis is deterministic; all sentences here are authored templates,
 * short and in the page's voice. Working-style positions derive from Big Five
 * plus a stable offset (stand-in for the real working-style answers).
 * Port: swap derived positions for real assessment data; keep the shapes.
 */

/* ── Per-trait distribution pattern (for the fingerprint) ───────────────── */

export function getTraitPattern(trait, subjects) {
  const scores = subjects
    .map((subject) => getBigFiveScore(subject, trait.key))
    .sort((a, b) => a - b);
  const min = scores[0] ?? 50;
  const max = scores[scores.length - 1] ?? 50;
  const mean = scores.reduce((total, s) => total + s, 0) / (scores.length || 1);
  const spread = max - min;

  // Largest gap between neighbours, for split/outlier detection.
  let gap = 0;
  let gapIndex = -1;
  for (let i = 0; i < scores.length - 1; i += 1) {
    if (scores[i + 1] - scores[i] > gap) {
      gap = scores[i + 1] - scores[i];
      gapIndex = i;
    }
  }
  const lowCount = gapIndex + 1;
  const highCount = scores.length - lowCount;

  let type = 'spread';
  if (scores.length >= 4 && gap >= 26 && lowCount >= 2 && highCount >= 2) {
    type = 'twoCamps';
  } else if (scores.length >= 4 && gap >= 26 && (lowCount === 1 || highCount === 1)) {
    type = 'outlier';
  } else if (spread <= 26) {
    type = mean >= 58 ? 'leansHigh' : mean <= 42 ? 'leansLow' : 'tight';
  }

  const label =
    type === 'twoCamps'
      ? 'two camps'
      : type === 'outlier'
        ? 'one outlier'
        : type === 'leansHigh'
          ? `mostly ${trait.highLabel.toLowerCase()}`
          : type === 'leansLow'
            ? `mostly ${trait.lowLabel.toLowerCase()}`
            : type === 'tight'
              ? 'close together'
              : 'full range';

  return { trait, scores, min, max, mean, spread, gap, type, label };
}

export function getFingerprint(subjects) {
  return BIG_FIVE_TRAITS.map((trait) => getTraitPattern(trait, subjects));
}

/* One-sentence reads for the fingerprint's callouts, by pattern. */
const PATTERN_SENTENCES = {
  openness: {
    leansHigh: 'Ideas come easily across the whole team; deciding is the muscle to protect.',
    leansLow: 'This team keeps work close to what is proven; new approaches need an explicit invitation.',
    tight: 'The team sits together on how far to push ideas, so this rarely causes friction.',
    spread: 'Fresh angles and feasibility checks live in the same room; decide which leads when deadlines hit.',
    twoCamps: 'Half this team opens options, half grounds them. In that order, it is a pipeline; unmanaged, it is friction.',
    outlier: 'Most of the exploratory thinking is carried by one person; check that new angles still surface without them.',
  },
  conscientiousness: {
    leansHigh: 'Structure and follow-through are the default; process can quietly outgrow its usefulness.',
    leansLow: 'Plans stay light and the team absorbs change well; loose ends need a named owner.',
    tight: 'Everyone plans about the same way, which makes coordination cheap.',
    spread: 'Planners and improvisers share the work; the planners tend to absorb the tracking, so check the load.',
    twoCamps: 'One camp builds the rails, the other handles what jumps them; agree on the minimum plan both respect.',
    outlier: 'One person plans very differently from the rest; name it before it reads as carelessness or rigidity.',
  },
  extraversion: {
    leansHigh: 'Energy is visible and meetings move; thinking time has to be protected on purpose.',
    leansLow: 'This team processes before it speaks; silence is deliberation, not agreement.',
    tight: 'The room shares one rhythm, so air time mostly takes care of itself.',
    spread: 'Some start the conversation, some distill it; air time skews unless someone stewards it.',
    twoCamps: 'The vocal half decides in the meeting, the reflective half after it. Both decisions count.',
    outlier: 'One voice carries a different rhythm from the room; make deliberate space for it.',
  },
  agreeableness: {
    leansHigh: 'Trust runs high, so hard truths arrive late and softened; make direct feedback feel safe.',
    leansLow: 'Debate is honest and logic gets tested; repair matters, because friction compounds.',
    tight: 'Feedback lands about the same way for everyone, which keeps calibration easy.',
    spread: 'The same pushback can land as challenge or as friction depending on who receives it; name which it is.',
    twoCamps: 'One camp protects honesty, the other protects the relationships. Both are half right.',
    outlier: 'One person gives and takes feedback very differently from the rest; calibrate before judging.',
  },
  neuroticism: {
    leansHigh: 'Risks get spotted early here; shared vigilance can tip into shared anxiety under load.',
    leansLow: 'Pressure stays regulated; early warnings can get waved off as worry, so give them a channel.',
    tight: 'The team reads pressure the same way, so escalations rarely surprise anyone.',
    spread: 'Calm and vigilant read the same week differently; treat the flag as data and the calm as ballast.',
    twoCamps: 'Built-in early warning and built-in ballast; under pressure the halves need a translation layer.',
    outlier: 'One person senses risk on a different frequency; their flag deserves a listen before a verdict.',
  },
};

export function getPatternSentence(pattern) {
  return PATTERN_SENTENCES[pattern.trait.key]?.[pattern.type] ?? '';
}

/**
 * The two or three most tellable patterns, for callouts and insights:
 * camps and outliers first, then strong leans, then the tightest cluster.
 */
export function getHeadlinePatterns(fingerprint, count = 3) {
  const score = (pattern) => {
    if (pattern.type === 'twoCamps') return 400 + pattern.gap;
    if (pattern.type === 'outlier') return 300 + pattern.gap;
    if (pattern.type === 'leansHigh' || pattern.type === 'leansLow')
      return 200 + Math.abs(pattern.mean - 50);
    if (pattern.type === 'spread') return 100 + pattern.spread;
    return 50 - pattern.spread;
  };
  return [...fingerprint].sort((a, b) => score(b) - score(a)).slice(0, count);
}

/* ── Merged strength + flip items ───────────────────────────────────────
   Reuses the page's existing authored copy: each strength pairs with the
   growth item driven by the same trait, so nothing here is new prose. */

export function getMergedStrengthItems(strengths, watchOut) {
  const strengthItems = strengths?.items ?? [];
  const watchItems = watchOut?.items ?? [];
  const usedWatch = new Set();

  const merged = strengthItems.map((item) => {
    const flip = watchItems.find(
      (candidate) =>
        !usedWatch.has(candidate) && candidate.traitKey === item.traitKey
    );
    if (flip) usedWatch.add(flip);
    return {
      key: `${item.traitKey}-${item.type ?? 'strength'}`,
      traitKey: item.traitKey,
      title: item.title,
      body: item.body,
      flip: flip ? `${flip.body}${flip.tip ? ` So ${flip.tip}` : ''}` : null,
      flipTitle: flip?.title ?? null,
    };
  });

  const leftoverWatch = watchItems
    .filter((item) => !usedWatch.has(item))
    .map((item) => ({
      key: `${item.traitKey}-watch`,
      traitKey: item.traitKey,
      title: item.title,
      body: `${item.body}${item.tip ? ` So ${item.tip}` : ''}`,
      flip: null,
      flipTitle: null,
      isGrowth: true,
    }));

  return [...merged, ...leftoverWatch];
}

/* ── Working agreements (derived working-style stand-in) ────────────────── */

const AGREEMENT_ITEMS = [
  {
    key: 'planning',
    topic: 'How much plan is enough',
    trait: { key: 'conscientiousness', towardHigh: 'high' },
    highSide: 'work from a plan',
    lowSide: 'start and adjust',
    proposal:
      'Agree how much plan is enough before the planners write it for everyone.',
    question: 'What is the minimum plan both ends of this room respect?',
    sentence: (a, b) =>
      `${a} of you work from a plan, ${b} start and adjust. Agree how much plan is enough before the planners write it for everyone.`,
  },
  {
    key: 'time',
    topic: 'Protecting the week',
    trait: { key: 'conscientiousness', towardHigh: 'high' },
    highSide: 'time-block the week',
    lowSide: 'flow with the day',
    proposal: 'Protect one shared focus block and keep the rest personal.',
    question: 'Which hours are protected for everyone, and which stay personal?',
    sentence: (a, b) =>
      `${a} of you time-block the week, ${b} flow with the day. Protect one shared focus block and keep the rest personal.`,
  },
  {
    key: 'voice',
    topic: 'How things get raised',
    trait: { key: 'extraversion', towardHigh: 'high' },
    highSide: 'raise things right away',
    lowSide: 'wait for the right moment',
    proposal:
      'Pair a standing "anything unsaid?" prompt with room to raise things in writing.',
    question: 'Where does a concern go when it is real but not urgent yet?',
    sentence: (a, b) =>
      `${a} of you raise things right away, ${b} wait for the right moment. Pair a standing "anything unsaid?" prompt with room to raise things in writing.`,
  },
  {
    key: 'decisions',
    topic: 'How decisions close',
    trait: { key: 'agreeableness', towardHigh: 'low' },
    highSide: 'decide and adjust',
    lowSide: 'align everyone first',
    proposal:
      'Name the decider per decision, and give alignment a deadline instead of a veto.',
    question: 'For the next big call: who decides, and when is alignment done?',
    sentence: (a, b) =>
      `${a} of you would decide and adjust, ${b} would align everyone first. Name the decider per decision, and give alignment a deadline instead of a veto.`,
  },
  {
    key: 'feedback',
    topic: 'When feedback lands',
    trait: { key: 'neuroticism', towardHigh: 'high' },
    highSide: 'want feedback as it happens',
    lowSide: 'want it at milestones',
    proposal:
      'Keep one lightweight continuous channel plus one milestone review.',
    question: 'What is our default: feedback in the moment, or at checkpoints?',
    sentence: (a, b) =>
      `${a} of you want feedback as it happens, ${b} at milestones. Keep one lightweight continuous channel plus one milestone review.`,
  },
];

function styleJitter(memberId, itemKey) {
  const seed = `${memberId}:${itemKey}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 37) - 18;
}

function getStylePosition(member, item) {
  const traitScore = getBigFiveScore(member, item.trait.key);
  const oriented =
    item.trait.towardHigh === 'high' ? traitScore : 100 - traitScore;
  return Math.max(
    6,
    Math.min(94, Math.round(oriented * 0.72 + 14 + styleJitter(member.id, item.key)))
  );
}

/* Plain-word anchors so callouts never lead with psychometric jargon. */
export const FRIENDLY_TRAIT_WORD = {
  openness: 'Ideas',
  conscientiousness: 'Structure',
  extraversion: 'Energy',
  agreeableness: 'Challenge',
  neuroticism: 'Pressure',
};

/* ── Headline stats (widest / tightest / sharpest divide) ───────────────── */

export function getHeadlineStats(subjects) {
  const fingerprint = getFingerprintInternal(subjects);
  const bySpread = [...fingerprint].sort((a, b) => b.spread - a.spread);
  const widest = bySpread[0];
  const tightest = bySpread[bySpread.length - 1];
  const byGap = [...fingerprint].sort((a, b) => b.gap - a.gap);
  const sharpest = byGap[0];

  return { widest, tightest, sharpest, fingerprint };
}

function getFingerprintInternal(subjects) {
  return BIG_FIVE_TRAITS.map((trait) => getTraitPattern(trait, subjects));
}

/* Practice moves per trait and pattern: a 2-5 word imperative title; the body
   reuses the pattern sentence so nothing is generated twice. */
const PRACTICE_TITLES = {
  openness: {
    twoCamps: 'Sequence it: explore, then land',
    outlier: 'Protect the new-angle supply',
    leansHigh: 'Name who closes',
    leansLow: 'Book space for wild ideas',
    spread: 'Decide which mode leads',
    tight: 'Keep idea flow deliberate',
  },
  conscientiousness: {
    twoCamps: 'Set the minimum plan',
    outlier: 'Do not make one person the process',
    leansHigh: 'Prune the process',
    leansLow: 'Name owners and dates',
    spread: 'Balance the tracking load',
    tight: 'Agree what done means',
  },
  extraversion: {
    twoCamps: 'Collect the quiet half\u2019s read',
    outlier: 'Make space for the odd rhythm',
    leansHigh: 'Protect thinking time',
    leansLow: 'Force the early signal',
    spread: 'Steward the air time',
    tight: 'Rotate the facilitator',
  },
  agreeableness: {
    twoCamps: 'Set feedback ground rules',
    outlier: 'Calibrate before judging',
    leansHigh: 'Invite the hard truth',
    leansLow: 'Repair after the debate',
    spread: 'Name challenge versus friction',
    tight: 'Stress-test the consensus',
  },
  neuroticism: {
    twoCamps: 'Translate calm and alarm',
    outlier: 'Give the flag a listen',
    leansHigh: 'Batch the worries',
    leansLow: 'Assign a risk owner',
    spread: 'Treat both reads as coverage',
    tight: 'Schedule the risk check',
  },
};

export function getPracticeMoves(fingerprint, count = 3) {
  return getHeadlinePatterns(fingerprint, count).map((pattern) => ({
    key: pattern.trait.key,
    friendly: FRIENDLY_TRAIT_WORD[pattern.trait.key],
    title:
      PRACTICE_TITLES[pattern.trait.key]?.[normalizePatternType(pattern.type)] ??
      'Name it out loud',
    body: getPatternSentence(pattern),
  }));
}

function normalizePatternType(type) {
  if (type === 'leansHigh' || type === 'leansLow') return type;
  if (type === 'twoCamps' || type === 'outlier' || type === 'tight') return type;
  return 'spread';
}

/* ── Archetype hero stats (top strength / growth edge / distinction) ────── */

const POLE_VALUE_PHRASES = {
  openness: { high: 'curiosity and fresh thinking', low: 'practicality and focus' },
  conscientiousness: { high: 'structure and follow-through', low: 'flexibility and quick adjustment' },
  extraversion: { high: 'energy and momentum', low: 'depth and reflection' },
  agreeableness: { high: 'empathy and trust', low: 'candor and honest challenge' },
  neuroticism: { high: 'early risk-sensing', low: 'calm under pressure' },
};

const GROWTH_EDGE_TITLES = {
  openness: 'A mix of practical + explorative thinkers needs a named decision point',
  conscientiousness: 'A mix of planners + improvisers needs an explicit agreement',
  extraversion: 'A mix of reflective + expressive voices needs intentional space',
  agreeableness: 'A mix of challengers + harmonizers needs feedback ground rules',
  neuroticism: 'A mix of calm + vigilant reads needs a shared risk channel',
};

function teamHash(subjects) {
  const seed = subjects.map((subject) => subject.id).join('|');
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }
  return hash;
}

/**
 * The three hero stats for the archetype page. Percentile framing uses a
 * deterministic demo benchmark; in production these come from the norm base.
 */
export function getArchetypeStats(subjects) {
  const fingerprint = getFingerprint(subjects);
  const hash = teamHash(subjects);

  // Top strength: the two traits where the team is most aligned AND most
  // clearly leaning to one pole.
  const ranked = [...fingerprint].sort(
    (a, b) =>
      Math.abs(b.mean - 50) - b.spread / 4 - (Math.abs(a.mean - 50) - a.spread / 4)
  );
  const [first, second] = ranked;
  const firstPole = first.mean >= 50 ? 'high' : 'low';
  const secondPole = second.mean >= 50 ? 'high' : 'low';
  const topStrength = {
    percentile: 78 + (hash % 17),
    title: `${first.mean >= 50 ? 'High' : 'Low'} ${first.trait.shortLabel ?? first.trait.label} & ${
      second.mean >= 50 ? 'high' : 'low'
    } ${second.trait.shortLabel ?? second.trait.label}`,
    line: `Your team leads with ${POLE_VALUE_PHRASES[first.trait.key][firstPole]} and ${POLE_VALUE_PHRASES[second.trait.key][secondPole]}, a foundation it can build on deliberately.`,
  };

  // Growth edge: the sharpest tension pattern.
  const tension = getHeadlinePatterns(fingerprint, 1)[0];
  const growthEdge = {
    title: GROWTH_EDGE_TITLES[tension.trait.key],
    line: getPatternSentence(tension),
  };

  // Distinction: the steady claim, with the people who carry it.
  const calm = fingerprint.find((pattern) => pattern.trait.key === 'neuroticism');
  const distinctionTrait = calm && calm.mean <= 46 ? calm : ranked[0];
  const towardLow = distinctionTrait.trait.key === 'neuroticism' ? distinctionTrait.mean <= 50 : distinctionTrait.mean < 50;
  const carriers = [...subjects]
    .sort((a, b) => {
      const aScore = getBigFiveScore(a, distinctionTrait.trait.key);
      const bScore = getBigFiveScore(b, distinctionTrait.trait.key);
      return towardLow ? aScore - bScore : bScore - aScore;
    })
    .slice(0, 3);
  const distinction = {
    label: `Top ${3 + (hash % 9)}%`,
    title:
      distinctionTrait.trait.key === 'neuroticism' && distinctionTrait.mean <= 46
        ? 'Your team demonstrates resilience under pressure'
        : `Your team stands out for ${POLE_VALUE_PHRASES[distinctionTrait.trait.key][distinctionTrait.mean >= 50 ? 'high' : 'low']}`,
    line:
      distinctionTrait.trait.key === 'neuroticism' && distinctionTrait.mean <= 46
        ? 'You stay composed through change and support one another with calm confidence during difficult stretches.'
        : getPatternSentence(distinctionTrait),
    carriers,
  };

  return { topStrength, growthEdge, distinction, fingerprint };
}

/** The spread as a concrete stat line: what the variance actually is. */
export function getSpreadStatLine(pattern) {
  const spread = Math.round(pattern.spread);
  const gap = Math.round(pattern.gap);
  switch (pattern.type) {
    case 'twoCamps':
      return `Two camps, ${gap} points apart at the widest jump.`;
    case 'outlier':
      return `One person sits ${gap} points from the nearest teammate.`;
    case 'leansHigh':
      return `Clustered within ${spread} points toward ${pattern.trait.highLabel.toLowerCase()}.`;
    case 'leansLow':
      return `Clustered within ${spread} points toward ${pattern.trait.lowLabel.toLowerCase()}.`;
    case 'tight':
      return `Everyone within ${spread} points of each other.`;
    default:
      return `A ${spread}-point range, end to end.`;
  }
}

/**
 * What one strength / growth item is based on: the trait behind it, the
 * team's actual distribution on that trait, and the spread stated as a
 * number. Feeds the per-section depth panel.
 */
export function getItemBasis(item, subjects) {
  const trait = BIG_FIVE_TRAITS.find(
    (candidate) => candidate.key === item.traitKey
  );
  if (!trait || subjects.length < 2) return null;

  const pattern = getTraitPattern(trait, subjects);
  return {
    trait,
    pattern,
    statLine: getSpreadStatLine(pattern),
    friendlyWord: FRIENDLY_TRAIT_WORD[trait.key] ?? trait.label.toLowerCase(),
  };
}

/* ── Pair chemistry (how different two people's defaults are) ───────────── */

export function getPairDistance(first, second) {
  const total = BIG_FIVE_TRAITS.reduce(
    (sum, trait) =>
      sum +
      Math.abs(
        getBigFiveScore(first, trait.key) - getBigFiveScore(second, trait.key)
      ),
    0
  );
  return Math.round(total / BIG_FIVE_TRAITS.length);
}

export function getChemistryLevel(distance) {
  if (distance >= 26) return 'different';
  if (distance >= 14) return 'mixed';
  return 'similar';
}

/** The single trait where a pair differs most, as one readable line. */
export function getPairContrast(first, second) {
  let best = null;
  BIG_FIVE_TRAITS.forEach((trait) => {
    const a = getBigFiveScore(first, trait.key);
    const b = getBigFiveScore(second, trait.key);
    const diff = Math.abs(a - b);
    if (!best || diff > best.diff) best = { trait, a, b, diff };
  });
  const firstName = first.name.split(' ')[0];
  const secondName = second.name.split(' ')[0];
  const firstPole = best.a >= best.b ? best.trait.highLabel : best.trait.lowLabel;
  const secondPole = best.a >= best.b ? best.trait.lowLabel : best.trait.highLabel;
  return {
    trait: best.trait,
    line: `Widest on ${(FRIENDLY_TRAIT_WORD[best.trait.key] ?? best.trait.label).toLowerCase()}: ${firstName} leans ${firstPole.toLowerCase()}, ${secondName} leans ${secondPole.toLowerCase()}.`,
  };
}

export function getTopContrastPairs(subjects, count = 3) {
  const pairs = [];
  for (let i = 0; i < subjects.length; i += 1) {
    for (let j = i + 1; j < subjects.length; j += 1) {
      pairs.push({
        a: subjects[i],
        b: subjects[j],
        distance: getPairDistance(subjects[i], subjects[j]),
      });
    }
  }
  return pairs
    .sort((x, y) => y.distance - x.distance)
    .slice(0, count)
    .map((pair) => ({ ...pair, contrast: getPairContrast(pair.a, pair.b) }));
}

export function getChemistryHighlights(subjects) {
  let mostDifferent = null;
  let mostSimilar = null;

  for (let i = 0; i < subjects.length; i += 1) {
    for (let j = i + 1; j < subjects.length; j += 1) {
      const distance = getPairDistance(subjects[i], subjects[j]);
      if (!mostDifferent || distance > mostDifferent.distance) {
        mostDifferent = { a: subjects[i], b: subjects[j], distance };
      }
      if (!mostSimilar || distance < mostSimilar.distance) {
        mostSimilar = { a: subjects[i], b: subjects[j], distance };
      }
    }
  }

  return { mostDifferent, mostSimilar };
}

/**
 * One person's working-style reads: which side of each split they sit on,
 * as plain sentences ("You tend to work from a plan"). Powers the person
 * scope of the Dive deeper working-styles tab.
 */
export function getPersonalWorkingReads(member, { secondPerson = true } = {}) {
  const subject = secondPerson ? 'You' : member.name.split(' ')[0];
  return AGREEMENT_ITEMS.map((item) => {
    const position = getStylePosition(member, item);
    const stance =
      position >= 56
        ? item.highSide
        : position <= 44
          ? item.lowSide
          : `flex between "${item.highSide}" and "${item.lowSide}" depending on the work`;
    return {
      key: item.key,
      topic: item.topic,
      sentence: `${subject} tend${secondPerson ? '' : 's'} to ${stance}.`,
    };
  });
}

/** A pair's working-style reads: where the two land on each split. */
export function getPairWorkingReads(first, second) {
  const firstName = first.name.split(' ')[0];
  const secondName = second.name.split(' ')[0];
  return AGREEMENT_ITEMS.map((item) => {
    const positionA = getStylePosition(first, item);
    const positionB = getStylePosition(second, item);
    const sideOf = (position) =>
      position >= 56 ? 'high' : position <= 44 ? 'low' : 'mid';
    const a = sideOf(positionA);
    const b = sideOf(positionB);
    const phrase = (side) =>
      side === 'high' ? item.highSide : side === 'low' ? item.lowSide : null;

    let sentence;
    if (a === b && a !== 'mid') {
      sentence = `Both of you ${phrase(a)}. Fast together, but nobody covers the other mode.`;
    } else if (a === 'mid' && b === 'mid') {
      sentence = `Both of you flex on this one; friction is unlikely.`;
    } else if (a === 'mid' || b === 'mid') {
      const anchored = a === 'mid' ? secondName : firstName;
      const anchoredSide = a === 'mid' ? phrase(b) : phrase(a);
      const flexer = a === 'mid' ? firstName : secondName;
      sentence = `${anchored} tends to ${anchoredSide}; ${flexer} can flex either way.`;
    } else {
      sentence = `${firstName} tends to ${phrase(a)}, ${secondName} to ${phrase(b)}: worth an explicit agreement.`;
    }

    return { key: item.key, topic: item.topic, sentence };
  });
}

/**
 * The working-style items as placeable single-item scales: every member's
 * position on each polarity, with counts per side. This is the shape Scott
 * described — single items are the layer that legitimately shows a
 * distribution, unlike Big Five traits.
 */
export function getWorkingItems(subjects) {
  return AGREEMENT_ITEMS.map((item) => {
    const placements = subjects.map((member) => ({
      member,
      position: getStylePosition(member, item),
    }));
    const highCount = placements.filter((entry) => entry.position >= 56).length;
    const lowCount = placements.filter((entry) => entry.position <= 44).length;
    return {
      key: item.key,
      topic: item.topic,
      highSide: item.highSide,
      lowSide: item.lowSide,
      proposal: item.proposal,
      question: item.question,
      placements: placements.sort((a, b) => a.position - b.position),
      highCount,
      lowCount,
      midCount: subjects.length - highCount - lowCount,
      sentence: item.sentence(highCount, lowCount),
    };
  });
}

/** All working-preference lines, for the report. */
export function getWorkingPreferenceLines(subjects) {
  return AGREEMENT_ITEMS.map((item) => {
    let high = 0;
    let low = 0;
    subjects.forEach((member) => {
      const position = getStylePosition(member, item);
      if (position >= 56) high += 1;
      else if (position <= 44) low += 1;
    });
    return { key: item.key, sentence: item.sentence(high, low) };
  });
}

/* ── Signals (drip, not dump) ─────────────────────────────────────────────
   Plain-word headlines for the two or three patterns most worth talking
   about, so the page can lead with the finding instead of the trait. */

export function getSignalHeadline(pattern) {
  const friendly = (
    FRIENDLY_TRAIT_WORD[pattern.trait.key] ?? pattern.trait.label
  ).toLowerCase();

  switch (pattern.type) {
    case 'twoCamps':
      return `Two camps on ${friendly}.`;
    case 'outlier':
      return `One outlier on ${friendly}.`;
    case 'leansHigh':
      return `The whole team leans ${pattern.trait.highLabel.toLowerCase()}.`;
    case 'leansLow':
      return `The whole team leans ${pattern.trait.lowLabel.toLowerCase()}.`;
    case 'tight':
      return `In step on ${friendly}.`;
    default:
      return `End to end on ${friendly}.`;
  }
}

/* ── Moments of work (day-to-day lens) ────────────────────────────────────
   The five traits translated into the moments of a normal working week:
   who anchors each end, what that looks like in the room, and one
   facilitation move. All copy is authored; names come from real scores. */

const MOMENTS = [
  {
    key: 'openness',
    moment: 'When ideas are needed',
    highDoes: 'open new directions fast',
    lowDoes: 'test them against what has actually worked',
    bothEndsLine:
      'You have both the option-openers and the feasibility check in the same room. Sequence them and it is a pipeline.',
    oneEndHighLine:
      'New options come easily across this team; the feasibility check is the muscle to add on purpose.',
    oneEndLowLine:
      'This team keeps ideas close to what is proven; give new angles an explicit slot, or they will not surface.',
    move: 'Give exploration a time box, then hand the pick to the grounded end.',
  },
  {
    key: 'conscientiousness',
    moment: 'When work gets planned',
    highDoes: 'write the plan, owners, and dates',
    lowDoes: 'start moving and adjust as they learn',
    bothEndsLine:
      'Planners and improvisers share this work. The planners tend to absorb the tracking, so check the load.',
    oneEndHighLine:
      'Structure is the default here; prune the process before it outgrows its usefulness.',
    oneEndLowLine:
      'Plans stay light and the team absorbs change well; loose ends need a named owner.',
    move: 'Agree the minimum plan both ends respect before the planners write it for everyone.',
  },
  {
    key: 'extraversion',
    moment: 'In the room',
    highDoes: 'think out loud and get the conversation moving',
    lowDoes: 'process quietly and land a considered read',
    bothEndsLine:
      'Some of you start the conversation, some distill it. Air time skews unless someone stewards it.',
    oneEndHighLine:
      'Meetings move and energy is visible; thinking time has to be protected on purpose.',
    oneEndLowLine:
      'This room processes before it speaks. Silence is deliberation, not agreement.',
    move: 'Close big topics with a written round, so the considered reads arrive before the decision.',
  },
  {
    key: 'agreeableness',
    moment: 'When something needs a challenge',
    highDoes: 'protect trust and keep people in',
    lowDoes: 'name the weak spot directly',
    bothEndsLine:
      'The same pushback lands as challenge for some and friction for others. Name which one it is.',
    oneEndHighLine:
      'Trust runs high, so hard truths arrive late and softened. Make direct feedback feel safe.',
    oneEndLowLine:
      'Debate is honest and logic gets tested here. Repair matters, because friction compounds.',
    move: 'Before the debate: agree it is the idea being tested, not the person.',
  },
  {
    key: 'neuroticism',
    moment: 'When pressure hits',
    highDoes: 'feel it early and flag what could go wrong',
    lowDoes: 'hold perspective and keep the room steady',
    bothEndsLine:
      'Built-in early warning and built-in ballast. Treat the flag as data and the calm as cover.',
    oneEndHighLine:
      'Risks get spotted early here; shared vigilance can tip into shared anxiety under load.',
    oneEndLowLine:
      'Pressure stays regulated; early warnings can get waved off as worry, so give them a channel.',
    move: 'Give the early flag a channel and a listener, not a verdict.',
  },
];

export function getEndMembers(subjects, traitKey) {
  const scored = subjects
    .map((member) => ({ member, score: getBigFiveScore(member, traitKey) }))
    .sort((a, b) => b.score - a.score);

  return {
    high: scored.filter((entry) => entry.score >= 56).map((entry) => entry.member),
    low: scored
      .filter((entry) => entry.score <= 44)
      .reverse()
      .map((entry) => entry.member),
    mid: scored
      .filter((entry) => entry.score > 44 && entry.score < 56)
      .map((entry) => entry.member),
  };
}

export function getMomentReads(subjects) {
  return MOMENTS.map((item) => {
    const trait = BIG_FIVE_TRAITS.find(
      (candidate) => candidate.key === item.key
    );
    const ends = getEndMembers(subjects, item.key);
    const hasBothEnds = ends.high.length >= 1 && ends.low.length >= 1;
    const line = hasBothEnds
      ? item.bothEndsLine
      : ends.high.length
        ? item.oneEndHighLine
        : item.oneEndLowLine;

    return {
      key: item.key,
      trait,
      moment: item.moment,
      highDoes: item.highDoes,
      lowDoes: item.lowDoes,
      highMembers: ends.high,
      lowMembers: ends.low,
      midMembers: ends.mid,
      line,
      move: item.move,
    };
  });
}

/* ── Agreement details (agreements lens) ─────────────────────────────────
   The working-style splits worth an explicit agreement, with the people on
   each side so the split can be shown, not just counted. */

export function getAgreementDetails(subjects, count = 3) {
  const candidates = AGREEMENT_ITEMS.map((item) => {
    const high = [];
    const low = [];
    const mid = [];
    subjects.forEach((member) => {
      const position = getStylePosition(member, item);
      if (position >= 56) high.push({ member, position });
      else if (position <= 44) low.push({ member, position });
      else mid.push({ member, position });
    });

    return {
      key: item.key,
      topic: item.topic,
      highSide: item.highSide,
      lowSide: item.lowSide,
      proposal: item.proposal,
      question: item.question,
      highMembers: high
        .sort((a, b) => b.position - a.position)
        .map((entry) => entry.member),
      lowMembers: low
        .sort((a, b) => a.position - b.position)
        .map((entry) => entry.member),
      midCount: mid.length,
      balance: Math.min(high.length, low.length),
    };
  });

  return candidates
    .filter((candidate) => candidate.balance >= 1)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, count);
}

/* ── Basis story ("Original plus" drill-down) ─────────────────────────────
   Traces one strength / growth line back through a chain a member can
   follow: the question everyone answered, where people actually landed
   (with counts), and why that pattern produced this exact sentence. */

export function getBasisStory(item, subjects, sectionKind = 'strengths') {
  const trait = BIG_FIVE_TRAITS.find(
    (candidate) => candidate.key === item.traitKey
  );
  if (!trait || subjects.length < 2) return null;

  const pattern = getTraitPattern(trait, subjects);
  const ends = getEndMembers(subjects, trait.key);
  const total = subjects.length;

  // Split-based items ('wide' / 'complement'): the claim comes from the gap,
  // not the lean, so the trail has to show the split.
  if (item.type === 'wide' || item.type === 'complement') {
    return {
      trait,
      pattern,
      prompt: trait.promptPlural,
      countLine: `${ends.high.length} of ${total} land toward ${trait.highLabel.toLowerCase()}, ${ends.low.length} toward ${trait.lowLabel.toLowerCase()} — a genuine split, ${Math.round(pattern.spread)} points end to end.`,
      whyLine:
        item.type === 'complement'
          ? `Two clear leans in opposite directions cover more ground than either could alone. That contrast is the strength this line names.`
          : `When a group splits like this, the two ends read the same week differently. This flag names where that split can rub.`,
      sideLabel: trait.highLabel,
    };
  }
  // The insight was generated from the side the item names (item.type), which
  // matches where the team's average leans for that trait.
  const side = item.type === 'high' || item.type === 'low'
    ? item.type
    : pattern.mean >= 50
      ? 'high'
      : 'low';
  const sideLabel = side === 'high' ? trait.highLabel : trait.lowLabel;
  const sideCount = side === 'high' ? ends.high.length : ends.low.length;
  const valuePhrase = POLE_VALUE_PHRASES[trait.key][side];

  // Where people actually landed, with real counts — no psychometric language.
  const countLine =
    sideCount >= total - 1
      ? `Nearly everyone (${sideCount} of ${total}) lands toward ${sideLabel.toLowerCase()}.`
      : sideCount >= Math.ceil(total / 2)
        ? `${sideCount} of ${total} land toward ${sideLabel.toLowerCase()}, and the team's center of gravity sits there too.`
        : `The team's center of gravity leans toward ${sideLabel.toLowerCase()}, carried by ${sideCount} of ${total} with a clear lean that way.`;

  // Why that pattern produced this line: strengths are the shared default;
  // growth items are the same lean overextended.
  const whyLine =
    sectionKind === 'growth'
      ? `A strength overextended: when this much of a team defaults to ${valuePhrase}, the same lean creates a shared blind side. This flag watches that edge.`
      : `When this many people share the same lean, the team gets ${valuePhrase} by default — no one has to carry it alone. That is what this line describes.`;

  return {
    trait,
    pattern,
    prompt: trait.promptPlural,
    countLine,
    whyLine,
    sideLabel,
  };
}

/**
 * The agreements worth making: working-style items where the team genuinely
 * splits. Returns at most `count`, each as one authored sentence.
 */
export function getWorkingAgreements(subjects, count = 2) {
  const candidates = AGREEMENT_ITEMS.map((item) => {
    let high = 0;
    let low = 0;
    subjects.forEach((member) => {
      const position = getStylePosition(member, item);
      if (position >= 56) high += 1;
      else if (position <= 44) low += 1;
    });
    return {
      key: item.key,
      high,
      low,
      balance: Math.min(high, low),
      sentence: item.sentence(high, low),
    };
  });

  return candidates
    .filter((candidate) => candidate.high >= 2 && candidate.low >= 2)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, count);
}
