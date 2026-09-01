import { getBigFiveScore } from './bigFiveTraits.js';

/**
 * Working styles: Scott's single-item polarity questions.
 *
 * What: the ten "I prefer X rather than Y" items, grouped into the four
 * categories from the assessment doc. Single items are the layer that
 * legitimately shows a distribution (unlike Big Five traits), reported on
 * the 5-point scale as strong / moderate / neutral / moderate / strong.
 * How: the prototype has no real answers yet, so each member's response is
 * derived deterministically from their Big Five plus a stable per-item
 * jitter. When real assessment data lands, swap `getWorkingPosition` and
 * everything downstream keeps working.
 * Port: replace the derived positions with the member's actual 1-5 answer.
 */

// Pole A is always the first phrase in the item statement.
export const WORKING_STYLE_CATEGORIES = [
  {
    key: 'pace',
    label: 'Pace & decisions',
    sub: 'How fast the team moves and makes decisions.',
    items: [
      {
        key: 'speed',
        stake: 'This is why deadlines feel tense here: half the room hears “ship it”, the other half hears “rushed”.',
        label: 'Speed',
        aWord: 'move fast',
        bWord: 'work deliberately',
        aPole: 'Fast',
        bPole: 'Deliberate',
        // Scale nouns from the assessment doc: strong/moderate per pole.
        scaleA: 'Pace',
        scaleB: 'Deliberate',
        anchors: [
          { trait: 'conscientiousness', dir: 'low', weight: 0.7 },
          { trait: 'extraversion', dir: 'high', weight: 0.3 },
        ],
      },
      {
        key: 'decisions',
        stake: 'Meetings drag when consensus people and one-decider people don’t know which game they’re playing.',
        label: 'Decisions',
        aWord: 'decide by group consensus',
        bWord: 'have one person decide',
        aPole: 'Consensus',
        bPole: 'Unilateral',
        scaleA: 'Consensus',
        scaleB: 'Unilateral',
        anchors: [{ trait: 'agreeableness', dir: 'high', weight: 1 }],
      },
    ],
  },
  {
    key: 'structure',
    label: 'Structure & guidance',
    sub: 'How much structure and guidance the team wants.',
    items: [
      {
        key: 'clarity',
        stake: 'The same plan reads as clarity to one half of this room and as red tape to the other.',
        label: 'Structure',
        aWord: 'work from clear structure',
        bWord: 'keep it casual',
        aPole: 'Structured',
        bPole: 'Casual',
        scaleA: 'Structure',
        scaleB: 'Casual',
        anchors: [{ trait: 'conscientiousness', dir: 'high', weight: 1 }],
      },
      {
        key: 'checkins',
        stake: 'The same check-in reads as support to one person and surveillance to another.',
        label: 'Check-ins',
        aWord: 'check in frequently',
        bWord: 'touch base occasionally',
        aPole: 'Frequent',
        bPole: 'Occasional',
        scaleA: 'Frequent',
        scaleB: 'Occasional',
        anchors: [
          { trait: 'neuroticism', dir: 'high', weight: 0.6 },
          { trait: 'extraversion', dir: 'high', weight: 0.4 },
        ],
      },
    ],
  },
  {
    key: 'collaboration',
    label: 'Collaboration',
    sub: 'How closely the team works together and shares ownership.',
    items: [
      {
        key: 'closeness',
        stake: 'A calendar invite feels like collaboration to half this room and interruption to the other half.',
        label: 'Working together',
        aWord: 'work closely and live',
        bWord: 'work mostly async',
        aPole: 'Live',
        bPole: 'Async',
        scaleA: 'Live',
        scaleB: 'Async',
        anchors: [{ trait: 'extraversion', dir: 'high', weight: 1 }],
      },
      {
        key: 'ownership',
        stake: 'Sharers feel abandoned when work is divided up; dividers feel crowded when it isn’t.',
        label: 'Ownership',
        aWord: 'share work tightly',
        bWord: 'divide it into independent parts',
        aPole: 'Shared',
        bPole: 'Independent',
        scaleA: 'Shared',
        scaleB: 'Independent',
        anchors: [
          { trait: 'agreeableness', dir: 'high', weight: 0.6 },
          { trait: 'extraversion', dir: 'high', weight: 0.4 },
        ],
      },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    sub: 'How the team gives feedback and handles disagreement.',
    items: [
      {
        key: 'directness',
        stake: 'The same sentence lands as honesty for some and harshness for others — name which one you’re using.',
        label: 'Feedback style',
        aWord: 'give it direct and candid',
        bWord: 'soften it',
        aPole: 'Direct',
        bPole: 'Softened',
        scaleA: 'Direct',
        scaleB: 'Softened',
        anchors: [{ trait: 'agreeableness', dir: 'low', weight: 1 }],
      },
      {
        key: 'conflict',
        stake: 'Raisers hear silence as agreement; settlers hear pushing as aggression.',
        label: 'Disagreements',
        aWord: 'raise them directly',
        bWord: 'give them room to resolve',
        aPole: 'Raise it',
        bPole: 'Let it settle',
        scaleA: 'Raise',
        scaleB: 'Settle',
        anchors: [
          { trait: 'extraversion', dir: 'high', weight: 0.5 },
          { trait: 'agreeableness', dir: 'low', weight: 0.5 },
        ],
      },
    ],
  },
  {
    key: 'approach',
    label: 'Approach to work',
    sub: 'How the team does their work.',
    items: [
      {
        key: 'focus',
        stake: 'Switching costs are invisible to jugglers and expensive for one-taskers.',
        label: 'Focus',
        aWord: 'concentrate on one task',
        bWord: 'juggle several at once',
        aPole: 'One task',
        bPole: 'Juggle',
        scaleA: 'Single-task',
        scaleB: 'Multitask',
        anchors: [
          { trait: 'conscientiousness', dir: 'high', weight: 0.7 },
          { trait: 'openness', dir: 'low', weight: 0.3 },
        ],
      },
      {
        key: 'sharing',
        stake: 'Early sharers read polish as slowness; polishers read rough drafts as carelessness.',
        label: 'Sharing work',
        aWord: 'share it early and rough',
        bWord: 'polish it first',
        aPole: 'Early',
        bPole: 'Polished',
        scaleA: 'Early',
        scaleB: 'Polished',
        anchors: [
          { trait: 'neuroticism', dir: 'low', weight: 0.5 },
          { trait: 'openness', dir: 'high', weight: 0.5 },
        ],
      },
    ],
  },
];

function jitter(memberId, itemKey) {
  const seed = `${memberId}:ws:${itemKey}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 25) - 12;
}

/** 0-100 toward pole A. Swap this for the real 1-5 answer when it exists. */
export function getWorkingPosition(member, item) {
  const anchored = item.anchors.reduce((sum, anchor) => {
    const score = getBigFiveScore(member, anchor.trait);
    const oriented = anchor.dir === 'high' ? score : 100 - score;
    return sum + oriented * anchor.weight;
  }, 0);
  return Math.max(
    2,
    Math.min(98, Math.round(anchored * 0.8 + 10 + jitter(member.id, item.key)))
  );
}

/** 5 = strongly pole A ... 1 = strongly pole B. */
export function getWorkingBucket(member, item) {
  const position = getWorkingPosition(member, item);
  if (position >= 78) return 5;
  if (position >= 58) return 4;
  if (position > 42) return 3;
  if (position > 22) return 2;
  return 1;
}

const STANCE = {
  5: (item, second) =>
    `strongly ${second ? 'prefer' : 'prefers'} to ${item.aWord}`,
  4: (item, second) =>
    `usually ${second ? 'prefer' : 'prefers'} to ${item.aWord}`,
  3: (item, second) => `${second ? 'flex' : 'flexes'} depending on the work`,
  2: (item, second) =>
    `usually ${second ? 'prefer' : 'prefers'} to ${item.bWord}`,
  1: (item, second) =>
    `strongly ${second ? 'prefer' : 'prefers'} to ${item.bWord}`,
};

const sideOfBucket = (bucket) => (bucket >= 4 ? 'a' : bucket <= 2 ? 'b' : 'mid');

/**
 * The read for a focused view of one question.
 * One person: their stance against the room's majority. Two people: their
 * stances against each other; the rest of the team is out of frame.
 */
export function getFocusRead(reportItem, focusMembers, { isOwn = false } = {}) {
  const word = (side) => (side === 'a' ? reportItem.aWord : reportItem.bWord);
  const first = focusMembers[0];
  const second = focusMembers[1];
  const firstSide = sideOfBucket(getWorkingBucket(first, reportItem));
  const shortName = (member) => member.name.split(' ')[0];

  if (!second) {
    // Single focus reads like the team insight: a headline about the
    // person, the room's distribution, and why the split matters.
    const subject = isOwn ? 'You' : shortName(first);
    const their = isOwn ? 'your' : 'their';
    const roomLine = (excludeSide) => {
      const aRest = reportItem.aCount - (excludeSide === 'a' ? 1 : 0);
      const bRest = reportItem.bCount - (excludeSide === 'b' ? 1 : 0);
      const midRest = reportItem.midCount - (excludeSide === 'mid' ? 1 : 0);
      const parts = [];
      if (aRest > 0) parts.push(`**${aRest}** would rather ${reportItem.aWord}`);
      if (bRest > 0) parts.push(`**${bRest}** would rather ${reportItem.bWord}`);
      if (midRest > 0) parts.push(`${midRest} flex either way`);
      return `The rest of the room: ${parts.join(', ')}.`;
    };
    if (firstSide === 'mid') {
      return {
        headline: `**${subject} can go either way** on ${reportItem.label.toLowerCase()} — ${their} default matches whoever ${isOwn ? 'you' : 'they'} work with.`,
        bullets: [roomLine('mid'), reportItem.stake],
      };
    }
    // Majority among everyone else: does the room lean with or against them?
    const withCount =
      (firstSide === 'a' ? reportItem.aCount : reportItem.bCount) - 1;
    const againstCount =
      firstSide === 'a' ? reportItem.bCount : reportItem.aCount;
    const headline =
      withCount >= againstCount
        ? `**${subject} would rather ${word(firstSide)}**, and most of the room leans the same way.`
        : `**${subject} would rather ${word(firstSide)}** — most of the room goes the other way, so say it out loud.`;
    return { headline, bullets: [roomLine(firstSide), reportItem.stake] };
  }

  const secondSide = sideOfBucket(getWorkingBucket(second, reportItem));
  const a = shortName(first);
  const b = shortName(second);
  if (firstSide === 'mid' && secondSide === 'mid') {
    return `${a} and ${b} both flex on ${reportItem.label.toLowerCase()}; no agreement needed.`;
  }
  if (firstSide === secondSide) {
    return `${a} and ${b} both would rather ${word(firstSide)}: aligned here, no friction.`;
  }
  if (firstSide === 'mid' || secondSide === 'mid') {
    const anchored = firstSide === 'mid' ? b : a;
    const anchoredSide = firstSide === 'mid' ? secondSide : firstSide;
    const flexer = firstSide === 'mid' ? a : b;
    return `${flexer} can go either way; ${anchored} would rather ${word(anchoredSide)}. Easiest: default to ${anchored}'s mode.`;
  }
  return `${a} would rather ${word(firstSide)}, ${b} would rather ${word(secondSide)}. Agree whose mode wins before it matters.`;
}

/**
 * Team report: per category, per item, the 5-bucket histogram (bins[0] is
 * strongly pole A ... bins[4] strongly pole B, left to right) plus counts
 * and a one-line read.
 */
export function getWorkingReport(subjects) {
  return WORKING_STYLE_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      const bins = [0, 0, 0, 0, 0];
      subjects.forEach((member) => {
        bins[5 - getWorkingBucket(member, item)] += 1;
      });
      const aCount = bins[0] + bins[1];
      const bCount = bins[3] + bins[4];
      const midCount = bins[2];
      // Reads come structured like the map's: a headline naming the shape,
      // then bullets — the room's actual counts (everyone accounted for,
      // including the flexible middle) and the item's stake line. `read`
      // keeps the flat one-paragraph version for focused (profile/compare)
      // contexts.
      const topic = item.label;
      let headline;
      let bullets;
      if (aCount > 0 && bCount > 0 && Math.min(aCount, bCount) >= 2) {
        headline = `${topic} is a genuine split: **${item.aPole.toLowerCase()}** against **${item.bPole.toLowerCase()}**.`;
        bullets = [
          `**${aCount} people** would rather **${item.aWord}**, **${bCount}** would rather **${item.bWord}**${
            midCount > 0 ? `, and ${midCount} flex either way` : ''
          }.`,
          item.stake,
        ];
      } else if (aCount > 0 && bCount > 0) {
        const big = aCount > bCount ? 'a' : 'b';
        const bigWord = big === 'a' ? item.aWord : item.bWord;
        const bigPole = big === 'a' ? item.aPole : item.bPole;
        const bigCount = Math.max(aCount, bCount);
        const smallWord = big === 'a' ? item.bWord : item.aWord;
        headline = `${topic} is mostly settled: this room defaults **${bigPole.toLowerCase()}**.`;
        bullets = [
          `**${bigCount} of ${subjects.length}** default to **${bigWord}**${
            midCount > 0 ? `, ${midCount} flex either way,` : ''
          } and one person would still rather **${smallWord}**.`,
          item.stake,
        ];
      } else if (aCount === 0 && bCount === 0) {
        headline = `${topic} takes care of itself here.`;
        bullets = [
          `Nobody is locked into one mode: everyone flexes with the situation.`,
        ];
      } else {
        const domPole = aCount > 0 ? item.aPole : item.bPole;
        const dominantWord = aCount > 0 ? item.aWord : item.bWord;
        const otherWord = aCount > 0 ? item.bWord : item.aWord;
        const domCount = Math.max(aCount, bCount);
        headline = `${topic} is one culture here: **${domPole.toLowerCase()}**.`;
        bullets = [
          midCount > 0
            ? `**${domCount}** would rather **${dominantWord}**${
                midCount === 1
                  ? '; one more flexes'
                  : `; the other ${midCount} flex`
              }.`
            : `The whole room would rather **${dominantWord}**.`,
          `Nobody argues for the “${otherWord}” mode — bring that lens in on purpose when stakes are high.`,
        ];
      }
      const read = `${bullets.join(' ')}`;
      return { ...item, bins, aCount, bCount, midCount, headline, bullets, read };
    }),
  }));
}

/** One member's stances, grouped by category, for the profile lens. */
export function getMemberWorkingProfile(member, subjects) {
  return WORKING_STYLE_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      const bucket = getWorkingBucket(member, item);
      // The team's most common bucket, so a profile shows fit vs the room.
      const bins = [0, 0, 0, 0, 0];
      subjects.forEach((other) => {
        bins[5 - getWorkingBucket(other, item)] += 1;
      });
      const teamBucket = 5 - bins.indexOf(Math.max(...bins));
      return {
        ...item,
        bucket,
        teamBucket,
        stance: STANCE[bucket](item, false),
        stanceSecond: STANCE[bucket](item, true),
      };
    }),
  }));
}

/** A pair's stances per item, for compare reads. */
export function getPairWorkingRows(first, second) {
  return WORKING_STYLE_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      aBucket: getWorkingBucket(first, item),
      bBucket: getWorkingBucket(second, item),
    })),
  }));
}
