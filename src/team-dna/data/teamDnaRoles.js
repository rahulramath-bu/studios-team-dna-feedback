import { BIG_FIVE_TRAITS, getBigFiveScore } from './bigFiveTraits.js';

/**
 * Big Five 10-role map.
 *
 * What: each Big Five pole maps to a named "team role" with a short read
 * (`blurb`), the strength it brings, and a how-to-work-with cue.
 * How: the two scores furthest from the midpoint become a member's primary and
 * secondary roles (the assessment framework's "most likely team roles"). The
 * same map powers the role read in the description, the Strengths card, and the
 * How-to-work-with card so every profile is consistent.
 * Port: replace with backend-approved role copy; keep the `${trait}_${pole}` key
 * so the scoring seam stays stable.
 */
export const ROLE_BY_TRAIT_POLE = {
  extraversion_high: {
    name: 'Mobilizer',
    gift: 'momentum',
    blurb: 'brings energy and turns talk into momentum',
    strength:
      'Brings energy and momentum, engages people quickly, and helps the team turn discussion into motion.',
    workWith:
      'Give them a clear goal to run at, and protect space for quieter teammates before the pace sets in.',
  },
  extraversion_low: {
    name: 'Reflective Synthesizer',
    gift: 'synthesis',
    blurb: 'listens closely, then offers a distilled read',
    strength:
      'Listens deeply and synthesizes well, turning many views into one clear, well-shaped read.',
    workWith:
      'Ask for their early read directly — they often hold a useful view back until it feels fully formed.',
  },
  openness_high: {
    name: 'Innovator',
    gift: 'fresh thinking',
    blurb: 'introduces fresh angles and reframes the problem',
    strength:
      'Generates fresh angles and reframes problems, keeping the team exploring before it narrows too soon.',
    workWith:
      'Invite their ideas early, then help them pick one or two to pursue once the team needs to converge.',
  },
  openness_low: {
    name: 'Practical Stabilizer',
    gift: 'grounding',
    blurb: 'grounds the work in what is realistic and proven',
    strength:
      'Grounds the work in what is realistic and proven, keeping plans feasible, resourced, and workable.',
    workWith:
      'Bring them in to pressure-test feasibility, and give new ideas a little room before asking them to ground it.',
  },
  conscientiousness_high: {
    name: 'Implementer',
    gift: 'structure and follow-through',
    blurb: 'adds structure, ownership, and follow-through',
    strength:
      'Adds structure, ownership, and follow-through, turning decisions into clear, accountable execution.',
    workWith:
      'Hand them ownership and a clear definition of done, and agree on the minimum structure so process stays light.',
  },
  conscientiousness_low: {
    name: 'Adaptive Responder',
    gift: 'adaptability',
    blurb: 'stays flexible and keeps things moving when plans shift',
    strength:
      'Stays flexible and improvises well, keeping the team moving when plans and priorities shift.',
    workWith:
      'Give them room to adapt, paired with one or two firm anchors so flexibility does not become drift.',
  },
  agreeableness_high: {
    name: 'Harmonizer',
    gift: 'trust and cohesion',
    blurb: 'builds trust, inclusion, and smoother collaboration',
    strength:
      'Builds trust and cohesion, includes quieter voices, and keeps collaboration smooth under pressure.',
    workWith:
      'Make it safe for them to raise hard things directly, and do not mistake their tact for full agreement.',
  },
  agreeableness_low: {
    name: 'Candid Challenger',
    gift: 'honest challenge',
    blurb: 'tests logic and names the tradeoffs others avoid',
    strength:
      'Tests logic and names the hard tradeoffs, protecting the team from drifting into false consensus.',
    workWith:
      'Welcome the challenge and ask for the most precise version, framed so it is easy for the room to receive.',
  },
  neuroticism_low: {
    name: 'Steadying Presence',
    gift: 'steadiness',
    blurb: 'stays composed and keeps the room grounded',
    strength:
      'Stays composed under pressure, regulates the room, and keeps perspective when things get tense.',
    workWith:
      'Lean on their calm in tense moments, and ask them to name urgency out loud when something truly needs it.',
  },
  neuroticism_high: {
    name: 'Vigilant Sentinel',
    gift: 'early risk signals',
    blurb: 'reads risk early and tracks the weak signals',
    strength:
      'Reads risk early and tracks weak signals, surfacing what could go wrong before it becomes loud.',
    workWith:
      'Ask which risks matter most and what would cover them, so vigilance turns into focused action.',
  },
};

function getDirection(score) {
  return score >= 50 ? 'high' : 'low';
}

function getRankedSignals(member) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const score = getBigFiveScore(member, trait.key);
    const direction = getDirection(score);

    return {
      trait: trait.key,
      direction,
      distance: Math.abs(score - 50),
      role: ROLE_BY_TRAIT_POLE[`${trait.key}_${direction}`],
    };
  }).sort((first, second) => second.distance - first.distance);
}

/**
 * Primary + secondary team roles for a member.
 *
 * The two Big Five scores furthest from the midpoint set the primary and
 * secondary roles, mirroring the assessment-side "two scores closest to the max"
 * rule so the role read matches across the product.
 */
export function getMemberRoles(member) {
  if (!member?.bigFive) {
    return null;
  }

  const ranked = getRankedSignals(member);
  const primary = ranked[0]?.role;
  const secondary = ranked[1]?.role;

  if (!primary || !secondary) {
    return null;
  }

  return { primary, secondary };
}

/**
 * Deterministic How-to-work-with card for any member.
 *
 * Strengths now render as a structured, trait-based card (see teamDnaStrengths);
 * this only fills the collaboration section so every profile — not just
 * hand-authored ones — gets working tips. Authored copy still wins (see adapter).
 */
export function getPersonGuidanceCards(member) {
  const roles = getMemberRoles(member);
  if (!roles) {
    return [];
  }

  const id = member?.id ?? 'member';
  const object = member?.pronouns?.object ?? 'them';
  const workWith = `${roles.primary.workWith} ${roles.secondary.workWith}`;

  return [
    {
      id: `person-${id}-work-with`,
      kind: 'guidance',
      label: `How to work with ${object}`,
      data: { guidance: { sections: [{ body: workWith }] } },
    },
  ];
}

function getFirstName(member) {
  return member?.name?.split(' ')?.[0] ?? 'They';
}

/**
 * Deterministic pair collaboration card. Strengths and blind spots render as
 * structured trait cards; this fills the "How they can work best together"
 * section, built from each person's primary and secondary roles so it reads as a
 * real combination rather than two solo profiles.
 */
export function getPairGuidanceCards(first, second) {
  const firstRoles = getMemberRoles(first);
  const secondRoles = getMemberRoles(second);
  if (!firstRoles || !secondRoles) {
    return [];
  }

  const a = getFirstName(first);
  const b = getFirstName(second);
  const id = `pair-${first?.id ?? 'a'}-${second?.id ?? 'b'}`;
  const sameLead = firstRoles.primary.name === secondRoles.primary.name;

  const workBest = sameLead
    ? [
        `Because you share a lead, divide the work by your second strengths — let ${a} carry the ${firstRoles.secondary.gift} side and ${b} the ${secondRoles.secondary.gift} side.`,
        `Name the blind spot you both share out loud, and assign one of you to watch for it on each piece of work.`,
        `Decide up front who owns the final call so two similar instincts don't quietly compete.`,
      ]
    : [
        `Lean on ${a} when the work needs ${firstRoles.primary.gift}, and on ${b} when it needs ${secondRoles.primary.gift}.`,
        `Decide up front who owns the final call so your different instincts don't pull the work in two directions.`,
        `Treat the moments you disagree as coverage, not friction — it usually means both angles are finally on the table.`,
      ];

  return [
    {
      id: `${id}-work-best`,
      kind: 'guidance',
      label: 'How they can work best together',
      data: { guidance: { sections: [{ bullets: workBest }] } },
    },
  ];
}
