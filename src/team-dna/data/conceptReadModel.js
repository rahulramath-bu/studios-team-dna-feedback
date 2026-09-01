import { BIG_FIVE_TRAITS, getBigFiveScore } from './bigFiveTraits.js';
import {
  getTraitPattern,
  getPatternSentence,
  getPairDistance,
  getChemistryLevel,
  getArchetypeStats,
  getEndMembers,
  FRIENDLY_TRAIT_WORD,
} from './teamReadModel.js';
import { getStrengthForSubjects } from './teamDnaStrengths.js';
import { getWatchOutForSubjects } from './teamDnaWatchOuts.js';
import {
  getScottRoleSignalsForMember,
  buildTeamRoleCoverage,
} from './teamDnaTeamShape.js';

/**
 * Concept read models.
 *
 * What: the deterministic schemas behind the page concepts (Expanded, The
 * Map, Four tabs). Each builder takes the current scope's subjects (one
 * person, a pair, or the team) plus the full roster and returns plain data
 * the components render without further logic.
 * How: every slot is computed from Big Five scores through the existing
 * read-model helpers; sentence templates live here as authored copy. The
 * same schema shape is produced regardless of team size — that is the
 * scalability contract.
 * Port: AI-generated copy can replace any string slot; the shapes stay.
 */

function firstNameOf(member) {
  return member?.name?.split(' ')[0] ?? 'Teammate';
}

function ordinal(n) {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

export function getMostExtremeTraits(member, count = 2) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const score = getBigFiveScore(member, trait.key);
    return {
      trait,
      score,
      side: score >= 50 ? 'high' : 'low',
      distance: Math.abs(score - 50),
    };
  })
    .sort((a, b) => b.distance - a.distance)
    .slice(0, count);
}

function getTeamAverage(subjects, traitKey) {
  const total = subjects.reduce(
    (sum, member) => sum + getBigFiveScore(member, traitKey),
    0
  );
  return Math.round(total / (subjects.length || 1));
}

/* ── Widgets (Expanded hero row): three things you can learn ────────────── */

const CHEMISTRY_WORD = {
  similar: 'Similar defaults',
  mixed: 'A workable mix',
  different: 'Very different',
};

export function getScopeWidgets({ scope, subjects, allSubjects }) {
  if (scope === 'team') {
    const stats = getArchetypeStats(subjects);
    return [
      {
        key: 'strength',
        label: 'Top strength',
        value: String(stats.topStrength.percentile),
        unit: 'percentile',
        line: stats.topStrength.title,
        section: 'strengths',
      },
      {
        key: 'edge',
        label: 'Growth edge',
        line: stats.growthEdge.title,
        section: 'growth',
      },
      {
        key: 'distinct',
        label: 'Stand out',
        value: stats.distinction.label,
        faces: stats.distinction.carriers,
        line: stats.distinction.title,
        section: 'spectrums',
      },
    ];
  }

  if (scope === 'duo') {
    const [a, b] = subjects;
    const distance = getPairDistance(a, b);
    const level = getChemistryLevel(distance);
    let widest = null;
    BIG_FIVE_TRAITS.forEach((trait) => {
      const gap = Math.abs(
        getBigFiveScore(a, trait.key) - getBigFiveScore(b, trait.key)
      );
      if (!widest || gap > widest.gap) widest = { trait, gap };
    });
    const strengths = getStrengthForSubjects(subjects)?.items ?? [];

    return [
      {
        key: 'chemistry',
        label: 'Chemistry',
        value: CHEMISTRY_WORD[level],
        line: getPairMeaning(a, b).short,
        section: 'spectrums',
      },
      {
        key: 'gap',
        label: 'Widest gap',
        value: FRIENDLY_TRAIT_WORD[widest.trait.key],
        line: `${widest.trait.lowLabel} to ${widest.trait.highLabel.toLowerCase()}. The pair's biggest translation job.`,
        section: 'spectrums',
      },
      {
        key: 'together',
        label: 'Best together',
        line: strengths[0]?.title ?? 'A steady working pair.',
        section: 'strengths',
      },
    ];
  }

  // Person: snapshot widgets, each placing the person inside the team.
  const member = subjects[0];
  const [standout] = getMostExtremeTraits(member, 1);
  const poleLabel =
    standout.side === 'high'
      ? standout.trait.highLabel
      : standout.trait.lowLabel;
  const moreExtreme = allSubjects.filter((other) => {
    if (other.id === member.id) return false;
    const score = getBigFiveScore(other, standout.trait.key);
    return standout.side === 'high'
      ? score > standout.score
      : score < standout.score;
  }).length;
  const rankLine =
    moreExtreme === 0
      ? `the clearest lean on the team`
      : `${ordinal(moreExtreme + 1)} strongest of ${allSubjects.length} here`;

  const roleEntry = getScottRoleSignalsForMember(member)[0]?.role ?? null;
  const roleMates = roleEntry
    ? allSubjects.filter(
        (other) =>
          other.id !== member.id &&
          getScottRoleSignalsForMember(other)[0]?.role?.key === roleEntry.key
      )
    : [];

  const watch = getWatchOutForSubjects(subjects)?.items ?? [];

  return [
    {
      key: 'standout',
      label: 'Standout trait',
      value: poleLabel,
      line: `${standout.score} of 100, ${rankLine}.`,
      section: 'spectrums',
    },
    roleEntry
      ? {
          key: 'role',
          label: 'On this team',
          value: roleEntry.singular,
          faces: roleMates.slice(0, 3),
          line:
            roleMates.length === 0
              ? 'The only one on the team. This contribution leaves with them.'
              : `One of ${roleMates.length + 1} who carry ${roleEntry.description}.`,
          section: 'strengths',
        }
      : {
          key: 'role',
          label: 'On this team',
          value: 'Balanced',
          line: 'No single lean dominates this profile.',
          section: 'strengths',
        },
    {
      key: 'edge',
      label: 'Growth edge',
      line: watch[0]?.title ?? 'No sharp edges in this read.',
      section: 'growth',
    },
  ];
}

/* ── Dive deeper: per-section basis models ───────────────────────────────
   Each strength / growth line traces to one trait. The visualization is a
   side split — who sits on which end — because the claim is about counts
   and leans, not exact positions. */

export function getSideSplit(subjects, traitKey) {
  const trait = BIG_FIVE_TRAITS.find((candidate) => candidate.key === traitKey);
  const ends = getEndMembers(subjects, traitKey);
  const mean = getTeamAverage(subjects, traitKey);
  return {
    trait,
    low: ends.low,
    high: ends.high,
    mid: ends.mid,
    mean,
    leanSide: mean >= 50 ? 'high' : 'low',
  };
}

const WHY_STRENGTH = {
  team: (split) => {
    const otherMembers = split.leanSide === 'high' ? split.low : split.high;
    return otherMembers.length === 0
      ? 'The whole room works this way by default. The strength is real, and the other end has no natural cover.'
      : 'Enough of the room works this way that it is the default, not one person\u2019s job.';
  },
  person:
    'A lean this clear becomes a signature: teammates can rely on it without asking.',
  duoComplement:
    'One of you on each end: the pair covers more ground than either could alone.',
  duoShared:
    'Both on the same end: fast together, with the same blind side on both chairs.',
};

const WHY_GROWTH = {
  team: 'A shared lean is a shared blind side. This flags that edge.',
  teamSplit:
    'Two real defaults reading the same week differently. Named, the split is coverage; unnamed, it is friction.',
  person: 'This flags the moment the same strength tips too far.',
  duoWide: 'Named, this gap is coverage. Unnamed, it is friction.',
  duoShared:
    'A shared lean means nobody in this pair covers the other end by default.',
};

function sideLabelOf(split, side) {
  return side === 'high' ? split.trait.highLabel : split.trait.lowLabel;
}

/**
 * The stat-led insight above each strip: who is where, in numbers and
 * names, so the line carries value before the visual is even read.
 */
function getSplitLead(split, scope, subjects, isOwnProfile) {
  const total = split.low.length + split.mid.length + split.high.length;
  const leanLabel = sideLabelOf(split, split.leanSide).toLowerCase();
  const otherSide = split.leanSide === 'high' ? 'low' : 'high';
  const otherLabel = sideLabelOf(split, otherSide).toLowerCase();
  const leanMembers = split.leanSide === 'high' ? split.high : split.low;
  const otherMembers = split.leanSide === 'high' ? split.low : split.high;

  if (scope === 'duo') {
    const [a, b] = subjects;
    const aScore = getBigFiveScore(a, split.trait.key);
    const bScore = getBigFiveScore(b, split.trait.key);
    const sameSide = aScore >= 50 === (bScore >= 50);
    if (sameSide) {
      const side = aScore >= 50 ? split.trait.highLabel : split.trait.lowLabel;
      return `Both of you land ${side.toLowerCase()}, ${Math.abs(aScore - bScore)} points apart.`;
    }
    const [highPerson, lowPerson] = aScore >= bScore ? [a, b] : [b, a];
    return `${firstNameOf(highPerson)} lands ${split.trait.highLabel.toLowerCase()}, ${firstNameOf(lowPerson)} ${split.trait.lowLabel.toLowerCase()}: ${Math.abs(aScore - bScore)} points apart.`;
  }

  if (scope === 'person') {
    const person = subjects[0];
    const score = getBigFiveScore(person, split.trait.key);
    const side = score >= 50 ? 'high' : 'low';
    const sideLabel = sideLabelOf(split, side).toLowerCase();
    const company =
      (side === 'high' ? split.high.length : split.low.length) - 1;
    const name = isOwnProfile ? 'You' : firstNameOf(person);
    if (company <= 0) {
      return `${name} hold${isOwnProfile ? '' : 's'} the ${sideLabel} end alone on this team.`;
    }
    return `${name} land${isOwnProfile ? '' : 's'} ${sideLabel}, alongside ${company} teammate${company === 1 ? '' : 's'}.`;
  }

  if (otherMembers.length === 0) {
    return `${leanMembers.length} of ${total} land ${leanLabel}. No one anchors the ${otherLabel} end.`;
  }
  if (otherMembers.length <= 2) {
    const names = otherMembers.map(firstNameOf).join(' and ');
    return `${leanMembers.length} of ${total} land ${leanLabel}. Only ${names} hold${otherMembers.length === 1 ? 's' : ''} the ${otherLabel} end.`;
  }
  return `${leanMembers.length} lean ${leanLabel}, ${otherMembers.length} lean ${otherLabel}. A real split.`;
}

/**
 * The full trail for one section (strengths or growth): each claim, the
 * side split behind it, and the one-line why. Works on all scopes.
 */
export function getSectionBasis({
  section,
  scope,
  subjects,
  allSubjects,
  isOwnProfile = false,
}) {
  const items =
    section === 'strengths'
      ? (getStrengthForSubjects(subjects)?.items ?? [])
      : (getWatchOutForSubjects(subjects)?.items ?? []);

  return items.map((item) => {
    // Person claims are placed against the whole team so "why" has context.
    const splitSubjects = scope === 'person' ? allSubjects : subjects;
    const split = getSideSplit(splitSubjects, item.traitKey);
    const isSplitType = item.type === 'wide' || item.type === 'complement';

    let why;
    if (section === 'strengths') {
      why =
        scope === 'duo'
          ? item.type === 'complement'
            ? WHY_STRENGTH.duoComplement
            : WHY_STRENGTH.duoShared
          : scope === 'person'
            ? WHY_STRENGTH.person
            : WHY_STRENGTH.team(split);
    } else {
      why =
        scope === 'duo'
          ? isSplitType
            ? WHY_GROWTH.duoWide
            : WHY_GROWTH.duoShared
          : scope === 'person'
            ? WHY_GROWTH.person
            : isSplitType
              ? WHY_GROWTH.teamSplit
              : WHY_GROWTH.team;
    }

    return {
      item,
      split,
      lead: getSplitLead(split, scope, subjects, isOwnProfile),
      why,
      // Ring the subject(s) inside the split only when tracing a person or
      // pair against the wider team.
      focusIds: scope === 'team' ? [] : subjects.map((member) => member.id),
    };
  });
}

/* Pole meanings in plain words: the "behavioral explanation" layer for the
   Big Five. Traits explain; they do not drill into items. */
export const POLE_MEANING = {
  openness: {
    low: 'favors what already works',
    high: 'reaches for new approaches first',
  },
  conscientiousness: {
    low: 'keeps it loose and adapts',
    high: 'prepares and sees things through',
  },
  extraversion: {
    low: 'hangs back and listens first',
    high: 'speaks up and starts conversations',
  },
  agreeableness: {
    low: 'questions and pushes back first',
    high: 'leads with empathy and keeps people in sync',
  },
  neuroticism: {
    low: 'stays steady under pressure',
    high: 'feels things strongly and reacts readily',
  },
};

export function getTraitExplainers(subjects) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const pattern = getTraitPattern(trait, subjects);
    return {
      trait,
      friendly: FRIENDLY_TRAIT_WORD[trait.key],
      lowMeaning: POLE_MEANING[trait.key].low,
      highMeaning: POLE_MEANING[trait.key].high,
      patternLabel: pattern.label,
      split: getSideSplit(subjects, trait.key),
    };
  });
}

export function getSpectrumPositionLine(member, trait, allSubjects) {
  const score = getBigFiveScore(member, trait.key);
  const side = score >= 50 ? 'high' : 'low';
  const poleLabel = side === 'high' ? trait.highLabel : trait.lowLabel;
  const ranked = [...allSubjects].sort((a, b) => {
    const aScore = getBigFiveScore(a, trait.key);
    const bScore = getBigFiveScore(b, trait.key);
    return side === 'high' ? bScore - aScore : aScore - bScore;
  });
  const rank = ranked.findIndex((other) => other.id === member.id) + 1;
  return `${score} of 100 — ${ordinal(rank)} of ${allSubjects.length} toward ${poleLabel.toLowerCase()}.`;
}

/* ── The Map ─────────────────────────────────────────────────────────────── */

const MAP_EDGE_MIN = 7;
const MAP_EDGE_MAX = 93;
const MAP_MIN_SEPARATION = 7.5;
const CLUSTER_DISTANCE = 24;

function clampToCanvas(value) {
  return Math.max(MAP_EDGE_MIN, Math.min(MAP_EDGE_MAX, value));
}

/**
 * Three axis pairings, most telling first: the two widest-spread traits make
 * the sharpest picture, then the remaining traits pair off so every trait is
 * reachable from some view.
 */
export function getMapViews(allSubjects) {
  const bySpread = BIG_FIVE_TRAITS.map((trait) => ({
    trait,
    spread: getTraitPattern(trait, allSubjects).spread,
  }))
    .sort((a, b) => b.spread - a.spread)
    .map((entry) => entry.trait);

  const pairs = [
    [bySpread[0], bySpread[1]],
    [bySpread[2], bySpread[3]],
    [bySpread[4], bySpread[0]],
  ];

  return pairs.map(([xTrait, yTrait]) => ({
    id: `${xTrait.key}-${yTrait.key}`,
    xTrait,
    yTrait,
    label: `${FRIENDLY_TRAIT_WORD[xTrait.key]} \u00d7 ${FRIENDLY_TRAIT_WORD[yTrait.key]}`,
  }));
}

/** Deterministic overlap resolution: push near-coincident points apart. */
function resolveOverlaps(points) {
  const resolved = points.map((point) => ({ ...point }));
  for (let iteration = 0; iteration < 24; iteration += 1) {
    let moved = false;
    for (let i = 0; i < resolved.length; i += 1) {
      for (let j = i + 1; j < resolved.length; j += 1) {
        const dx = resolved[j].x - resolved[i].x;
        const dy = resolved[j].y - resolved[i].y;
        const dist = Math.hypot(dx, dy);
        if (dist >= MAP_MIN_SEPARATION) continue;
        const push = (MAP_MIN_SEPARATION - dist) / 2 + 0.2;
        const angle =
          dist > 0.001 ? Math.atan2(dy, dx) : ((i * 7 + j * 13) % 12) * (Math.PI / 6);
        resolved[i].x = clampToCanvas(resolved[i].x - Math.cos(angle) * push);
        resolved[i].y = clampToCanvas(resolved[i].y - Math.sin(angle) * push);
        resolved[j].x = clampToCanvas(resolved[j].x + Math.cos(angle) * push);
        resolved[j].y = clampToCanvas(resolved[j].y + Math.sin(angle) * push);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return resolved;
}

/** Greedy union clustering on raw score positions. */
function findClusters(points, view) {
  const parent = points.map((point, index) => index);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i, j) => {
    parent[find(i)] = find(j);
  };

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dist = Math.hypot(
        points[j].rawX - points[i].rawX,
        points[j].rawY - points[i].rawY
      );
      if (dist <= CLUSTER_DISTANCE) union(i, j);
    }
  }

  const groups = new Map();
  points.forEach((point, index) => {
    const root = find(index);
    const group = groups.get(root) ?? [];
    group.push(point);
    groups.set(root, group);
  });

  return [...groups.values()]
    .filter((group) => group.length >= 2)
    .map((group) => {
      const xs = group.map((point) => point.x);
      const ys = group.map((point) => point.y);
      const rawXMean =
        group.reduce((sum, point) => sum + point.rawX, 0) / group.length;
      const rawYMean =
        group.reduce((sum, point) => sum + point.rawY, 0) / group.length;
      // A smooth ellipse: centre + equal padding beyond the outermost faces.
      const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
      const radiusX = (Math.max(...xs) - Math.min(...xs)) / 2 + 7;
      const radiusY = (Math.max(...ys) - Math.min(...ys)) / 2 + 9;
      return {
        members: group.map((point) => point.member),
        centerX,
        centerY,
        radiusX: Math.max(radiusX, 9),
        radiusY: Math.max(radiusY, 10),
        homeLabel: quadrantLabel(view, quadrantOf(rawXMean, rawYMean)),
      };
    })
    .sort((a, b) => b.members.length - a.members.length);
}

function quadrantOf(rawX, rawY) {
  return `${rawX >= 50 ? 'right' : 'left'}-${rawY >= 50 ? 'top' : 'bottom'}`;
}

function quadrantLabel(view, quadrant) {
  const [xSide, ySide] = quadrant.split('-');
  const xPole = xSide === 'right' ? view.xTrait.highLabel : view.xTrait.lowLabel;
  const yPole = ySide === 'top' ? view.yTrait.highLabel : view.yTrait.lowLabel;
  return `${xPole.toLowerCase()} + ${yPole.toLowerCase()}`;
}

const QUADRANT_CENTER = {
  'left-top': { x: 25, y: 25 },
  'right-top': { x: 75, y: 25 },
  'left-bottom': { x: 25, y: 75 },
  'right-bottom': { x: 75, y: 75 },
};

/**
 * Everything one map view needs: positioned points, smooth cluster ellipses,
 * the empty quadrants ("open water"), and the quick bullets below.
 */
export function buildMapModel({ allSubjects, view, focusIds = [] }) {
  const rawPoints = allSubjects.map((member) => {
    const rawX = getBigFiveScore(member, view.xTrait.key);
    const rawY = getBigFiveScore(member, view.yTrait.key);
    return {
      member,
      rawX,
      rawY,
      x: clampToCanvas(rawX),
      // y axis: high pole at the top.
      y: clampToCanvas(100 - rawY),
      isFocus: focusIds.includes(member.id),
    };
  });
  const points = resolveOverlaps(rawPoints);
  const clusters = findClusters(points, view);

  // Count from raw scores, not overlap-resolved positions.
  const quadrantCounts = { 'left-top': 0, 'right-top': 0, 'left-bottom': 0, 'right-bottom': 0 };
  rawPoints.forEach((point) => {
    quadrantCounts[quadrantOf(point.rawX, point.rawY)] += 1;
  });

  const openQuadrants =
    allSubjects.length >= 4
      ? Object.entries(quadrantCounts)
          .filter(([, count]) => count === 0)
          .map(([quadrant]) => ({
            quadrant,
            ...QUADRANT_CENTER[quadrant],
            label: quadrantLabel(view, quadrant),
          }))
      : [];

  return { view, points, clusters, openQuadrants };
}

/**
 * The quick bullets under the team map: what you are looking at, in one
 * short line each — clusters, the widest split on these axes, open ground.
 */
export function getMapBullets({ model, allSubjects }) {
  const bullets = [];
  const { view, clusters, openQuadrants } = model;

  if (clusters.length > 0) {
    const largest = clusters[0];
    bullets.push({
      key: 'clusters',
      strong: `A cluster of ${largest.members.length}`,
      tail: `share similar defaults around ${largest.homeLabel} — fast together, with the same blind side.`,
    });
  } else {
    bullets.push({
      key: 'clusters',
      strong: 'No tight clusters',
      tail: 'on these axes — everyone works from a noticeably different mix.',
    });
  }

  const xPattern = getTraitPattern(view.xTrait, allSubjects);
  const yPattern = getTraitPattern(view.yTrait, allSubjects);
  const divide = xPattern.spread >= yPattern.spread ? xPattern : yPattern;
  bullets.push({
    key: 'divide',
    strong: `Widest split: ${FRIENDLY_TRAIT_WORD[divide.trait.key].toLowerCase()}`,
    tail: `— ${Math.round(divide.spread)} points from ${divide.trait.lowLabel.toLowerCase()} to ${divide.trait.highLabel.toLowerCase()}.`,
  });

  if (openQuadrants.length > 0) {
    bullets.push({
      key: 'open',
      strong: 'Open ground:',
      tail: `nobody sits at ${openQuadrants
        .map((quadrant) => quadrant.label)
        .join(' or ')}. Work that needs that mix has no natural owner.`,
    });
  } else {
    bullets.push({
      key: 'open',
      strong: 'Every corner covered',
      tail: '— rare range. The trade-off: agreement takes longer.',
    });
  }

  return bullets;
}

/** Where one person fits: quadrant, closest colleague, sharpest contrast. */
export function getMapFit({ member, allSubjects, view }) {
  if (!member) return null;
  const others = allSubjects.filter((other) => other.id !== member.id);
  if (others.length === 0) return null;

  let neighbor = null;
  let contrast = null;
  others.forEach((other) => {
    const distance = getPairDistance(member, other);
    if (!neighbor || distance < neighbor.distance) neighbor = { member: other, distance };
    if (!contrast || distance > contrast.distance) contrast = { member: other, distance };
  });

  const quadrant = quadrantOf(
    getBigFiveScore(member, view.xTrait.key),
    getBigFiveScore(member, view.yTrait.key)
  );

  return {
    quadrant,
    quadrantLabel: quadrantLabel(view, quadrant),
    neighbor,
    contrast,
  };
}

/** Person scope: the five coordinates, each with a rank inside the team. */
export function getPersonCoordinates(member, allSubjects) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const score = getBigFiveScore(member, trait.key);
    const side = score >= 50 ? 'high' : 'low';
    return {
      trait,
      friendly: FRIENDLY_TRAIT_WORD[trait.key],
      score,
      poleLabel: side === 'high' ? trait.highLabel : trait.lowLabel,
      positionLine: getSpectrumPositionLine(member, trait, allSubjects),
    };
  }).sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));
}

/** Pair scope: the five gaps, widest first. */
export function getPairGapRows(first, second) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const a = getBigFiveScore(first, trait.key);
    const b = getBigFiveScore(second, trait.key);
    return {
      trait,
      friendly: FRIENDLY_TRAIT_WORD[trait.key],
      a,
      b,
      gap: Math.abs(a - b),
    };
  }).sort((x, y) => y.gap - x.gap);
}

/* ── Pair meaning (shared by map, widgets, tabs) ─────────────────────────── */

/** What the distance between two people actually means, in plain words. */
export function getPairMeaning(first, second) {
  const distance = getPairDistance(first, second);
  const level = getChemistryLevel(distance);
  const aName = firstNameOf(first);
  const bName = firstNameOf(second);

  if (level === 'similar') {
    return {
      level,
      word: CHEMISTRY_WORD.similar,
      short: 'Nearly the same working defaults.',
      line: `${aName} and ${bName} run on nearly the same defaults: fast and frictionless together, with the same blind spots.`,
    };
  }
  if (level === 'mixed') {
    return {
      level,
      word: CHEMISTRY_WORD.mixed,
      short: 'Different enough to cover for each other.',
      line: `${aName} and ${bName} are different enough to cover for each other and close enough to stay in sync. A workable mix.`,
    };
  }
  return {
    level,
    word: CHEMISTRY_WORD.different,
    short: 'Two genuinely different approaches to work.',
    line: `${aName} and ${bName} approach work from genuinely different directions. Named out loud, that is coverage; unnamed, it is friction.`,
  };
}

/** Where each of the two sits on the current map view, in words. */
export function getPairAxisLine(first, second, view) {
  const place = (member) => {
    const xSide =
      getBigFiveScore(member, view.xTrait.key) >= 50
        ? view.xTrait.highLabel
        : view.xTrait.lowLabel;
    const ySide =
      getBigFiveScore(member, view.yTrait.key) >= 50
        ? view.yTrait.highLabel
        : view.yTrait.lowLabel;
    return `${xSide.toLowerCase()} + ${ySide.toLowerCase()}`;
  };
  const aPlace = place(first);
  const bPlace = place(second);
  if (aPlace === bPlace) {
    return `On these two axes they sit in the same corner: ${aPlace}.`;
  }
  return `On these two axes, ${firstNameOf(first)} works from ${aPlace}; ${firstNameOf(second)} from ${bPlace}.`;
}

/* ── Four tabs concept ───────────────────────────────────────────────────── */

function spreadWord(spread) {
  if (spread <= 26) return 'aligned';
  if (spread <= 45) return 'mixed';
  return 'varied';
}

/** Overview tab: one strip per trait — everyone placed, average, state, and
 *  one useful read per line so the chart says something. Uses the real Big
 *  Five names (product language), with the friendly poles on the ends. */
export function getTraitStrips(allSubjects) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const pattern = getTraitPattern(trait, allSubjects);
    const average = getTeamAverage(allSubjects, trait.key);
    return {
      trait,
      label: trait.label,
      average,
      state: spreadWord(pattern.spread),
      insight: getPatternSentence(pattern),
      members: [...allSubjects]
        .map((member) => ({
          member,
          score: getBigFiveScore(member, trait.key),
        }))
        .sort((a, b) => a.score - b.score),
    };
  });
}

/** Overview tab: the two headline callouts (most aligned / most varied),
 *  each with the spread so the row can carry a small range bar, plus the
 *  one-paragraph read of the whole chart. */
export function getStripCallouts(allSubjects) {
  const patterns = BIG_FIVE_TRAITS.map((trait) =>
    getTraitPattern(trait, allSubjects)
  ).sort((a, b) => a.spread - b.spread);
  const tightest = patterns[0];
  const widest = patterns[patterns.length - 1];
  const rangeCount = patterns.filter(
    (pattern) => spreadWord(pattern.spread) !== 'aligned'
  ).length;
  const headline = `This team sits closest on ${tightest.trait.label.toLowerCase()} and stretches widest on ${widest.trait.label.toLowerCase()}, ${Math.round(widest.spread)} points between ${widest.trait.lowLabel.toLowerCase()} and ${widest.trait.highLabel.toLowerCase()}. ${
    rangeCount >= 4
      ? 'With real range on most spectrums, the same week can read very differently person to person.'
      : 'Where the range is wide, the same week reads differently person to person.'
  }`;
  return {
    headline,
    aligned: {
      label: tightest.trait.label,
      spread: Math.round(tightest.spread),
      line: 'The lowest spread on the team. Coordination is cheapest here.',
    },
    varied: {
      label: widest.trait.label,
      spread: Math.round(widest.spread),
      line: 'The widest range. A source of both friction and balance.',
    },
  };
}

/** Profile lens: five rows with a delta against the team average, plus the
 *  deeper reads (strengths, growth) so the lens can stand on its own. */
export function getProfileModel(member, allSubjects) {
  const rows = BIG_FIVE_TRAITS.map((trait) => {
    const score = getBigFiveScore(member, trait.key);
    const average = getTeamAverage(allSubjects, trait.key);
    const side = score >= 50 ? 'high' : 'low';
    return {
      trait,
      label: trait.label,
      poleLabel: side === 'high' ? trait.highLabel : trait.lowLabel,
      score,
      average,
      delta: score - average,
    };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const distinct = rows[0];
  const role = getScottRoleSignalsForMember(member)[0]?.role ?? null;
  const strengths = getStrengthForSubjects([member])?.items ?? [];
  const watchOuts = (getWatchOutForSubjects([member])?.items ?? []).map(
    (item) => ({
      ...item,
      tipLine: item.tip
        ? item.tip.charAt(0).toUpperCase() + item.tip.slice(1)
        : null,
    })
  );

  return {
    rows,
    role,
    strengths,
    watchOuts,
    superpower: strengths[0] ?? null,
    leanInto: {
      friendly: distinct.label,
      // The pole follows the delta, not the absolute score: being far below
      // an explorative team's average is a practical lean, wherever you sit.
      line: `${Math.abs(distinct.delta)} points ${distinct.delta >= 0 ? 'above' : 'below'} the team average. The nearest this team has to a ${(distinct.delta >= 0 ? distinct.trait.highLabel : distinct.trait.lowLabel).toLowerCase()} anchor.`,
    },
    growthEdge: watchOuts[0]
      ? {
          title: watchOuts[0].title,
          line: watchOuts[0].tipLine ?? watchOuts[0].body,
        }
      : null,
  };
}

/** Compare tab (team scope): the pairs most worth opening. */
export function getComparePairSuggestions(allSubjects, count = 3, viewerId = null) {
  const pairs = [];
  for (let i = 0; i < allSubjects.length; i += 1) {
    for (let j = i + 1; j < allSubjects.length; j += 1) {
      pairs.push({
        a: allSubjects[i],
        b: allSubjects[j],
        distance: getPairDistance(allSubjects[i], allSubjects[j]),
      });
    }
  }
  const byDistance = [...pairs].sort((x, y) => y.distance - x.distance);
  const closest = byDistance[byDistance.length - 1];

  // With a viewer: three distinct reads (widest, closest, and the viewer's
  // own contrast) so no two suggestions carry the same tag.
  if (viewerId) {
    const suggestions = [];
    if (byDistance[0]) {
      suggestions.push({
        ...byDistance[0],
        tag: 'Most different',
        line: getPairMeaning(byDistance[0].a, byDistance[0].b).short,
      });
    }
    if (closest && closest !== byDistance[0]) {
      suggestions.push({
        ...closest,
        tag: 'Most similar',
        line: getPairMeaning(closest.a, closest.b).short,
      });
    }
    const viewerContrast = byDistance.find(
      (pair) =>
        (pair.a.id === viewerId || pair.b.id === viewerId) &&
        !suggestions.some(
          (taken) => taken.a.id === pair.a.id && taken.b.id === pair.b.id
        )
    );
    if (viewerContrast) {
      suggestions.push({
        ...viewerContrast,
        tag: 'Your sharpest contrast',
        line: 'Covers what you don\u2019t \u2014 the pairing that stretches you most.',
      });
    }
    return suggestions.slice(0, count);
  }

  const widest = byDistance.slice(0, count - 1);
  return [
    ...widest.map((pair) => ({
      ...pair,
      tag: 'Most different',
      line: getPairMeaning(pair.a, pair.b).short,
    })),
    {
      ...closest,
      tag: 'Most similar',
      line: getPairMeaning(closest.a, closest.b).short,
    },
  ];
}

/** Chemistry tab: coverage, cohesion, superpowers, growth. */
export function getChemistryModel(allSubjects) {
  const coverage = buildTeamRoleCoverage(allSubjects);
  const present = coverage.filter((role) => role.members.length > 0);
  const open = coverage.filter((role) => role.members.length === 0);

  const cohesion = BIG_FIVE_TRAITS.map((trait) => {
    const pattern = getTraitPattern(trait, allSubjects);
    return {
      trait,
      label: trait.label,
      spread: Math.round(pattern.spread),
      state: spreadWord(pattern.spread),
    };
  }).sort((a, b) => a.spread - b.spread);

  const strengths = (getStrengthForSubjects(allSubjects)?.items ?? []).slice(0, 2);
  const watchOuts = (getWatchOutForSubjects(allSubjects)?.items ?? []).slice(0, 2);

  // The read of the grid: where the bench is deep, and what nobody covers.
  const ranked = [...present].sort((a, b) => b.members.length - a.members.length);
  const deep = ranked.slice(0, 2);
  const thin = present.filter((role) => role.members.length === 1);
  const haveLine =
    deep.length >= 2
      ? `Most of this team defaults to ${deep[0].description} (${deep[0].label.toLowerCase()} \u00d7${deep[0].members.length}) or ${deep[1].description} (\u00d7${deep[1].members.length}).`
      : deep.length === 1
        ? `Almost everyone here defaults to ${deep[0].description}.`
        : '';
  const gapLine =
    open.length > 0
      ? `No one defaults to ${listOut(open.map((role) => role.description))}. Work that needs those has no natural owner.`
      : thin.length > 0
        ? `Every archetype is covered, but ${listOut(thin.map((role) => role.singular.toLowerCase()))} ${thin.length === 1 ? 'sits' : 'sit'} with one person each.`
        : 'Every archetype has more than one natural owner.';
  const mixInsight = [haveLine, gapLine].filter(Boolean).join(' ');

  return { present, open, cohesion, strengths, watchOuts, mixInsight };
}

function listOut(items) {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;
}

