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
    name: 'Energizer',
    gift: 'momentum',
    blurb: 'brings the voice, the visibility, and the social momentum',
    strength:
      'Speaks up, starts conversations, and gets discussion going — the social momentum that pulls others in.',
    workWith:
      'Give them room to open the discussion, and protect space for quieter teammates before the pace sets in.',
  },
  extraversion_low: {
    name: 'Listener',
    gift: 'room for other voices',
    blurb: 'speaks with intention and makes room for other voices',
    strength:
      'Hangs back before jumping in and speaks with intention rather than volume, creating room for other voices.',
    workWith:
      'Ask for their read directly — they often hold a useful view back until it feels fully formed.',
  },
  openness_high: {
    name: 'Explorer',
    gift: 'fresh options',
    blurb: 'generates ideas and reaches for new approaches',
    strength:
      'Energized by possibility: quick to suggest a different way of doing things, and the push to try something new when the usual way isn\u2019t working.',
    workWith:
      'Invite their options early, then help them pick one or two to pursue once the team needs to converge.',
  },
  openness_low: {
    name: 'Builder',
    gift: 'grounding',
    blurb: 'trusts what works and keeps the group anchored to the reliable',
    strength:
      'The grounding force and the reality check on new proposals — the one who asks whether an idea will actually hold up.',
    workWith:
      'Bring them in to pressure-test feasibility, and give new ideas a little room before asking them to ground it.',
  },
  conscientiousness_high: {
    name: 'Finisher',
    gift: 'follow-through',
    blurb: 'prepares, digs in, and sees things through',
    strength:
      'Comes ready and carries tasks all the way to completion — who you count on to close the loop and deliver dependable work.',
    workWith:
      'Hand them ownership and a clear definition of done, and agree on the minimum structure so process stays light.',
  },
  conscientiousness_low: {
    name: 'Easygoer',
    gift: 'adaptability',
    blurb: 'keeps it loose and stays comfortable when things shift',
    strength:
      'Brings adaptability and a light touch — doesn\u2019t seize up when the plan changes underneath them.',
    workWith:
      'Give them room to adapt, paired with one or two firm anchors so flexibility does not become drift.',
  },
  agreeableness_high: {
    name: 'Connector',
    gift: 'cohesion',
    blurb: 'leads with empathy and keeps the team in sync',
    strength:
      'Keeps people together: smooths friction and strengthens the relationships that hold the group together.',
    workWith:
      'Make it safe for them to raise hard things directly, and do not mistake their tact for full agreement.',
  },
  agreeableness_low: {
    name: 'Challenger',
    gift: 'constructive friction',
    blurb: 'says the hard thing and stress-tests ideas',
    strength:
      'Willing to question, disagree, and push back — surfacing what others hesitate to name keeps the thinking honest.',
    workWith:
      'Welcome the challenge and ask for the most precise version, framed so it is easy for the room to receive.',
  },
  neuroticism_low: {
    name: 'Anchor',
    gift: 'steadiness',
    blurb: 'stays steady and keeps an even keel under pressure',
    strength:
      'A stabilizing presence: doesn\u2019t get rattled when things get tense, and helps everyone else settle when stakes rise.',
    workWith:
      'Lean on their calm in tense moments, and ask them to name urgency out loud when something truly needs it.',
  },
  neuroticism_high: {
    name: 'Spark',
    gift: 'visible investment',
    blurb: 'feels things strongly and brings urgency to the work',
    strength:
      'Raises the emotional signal — the investment and passion others can feel, which drives momentum on the things that matter.',
    workWith:
      'Point their energy at the work that matters most, and read the intensity as investment rather than alarm.',
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
        `Name the growth opportunity you both share out loud, and assign one of you to watch for it on each piece of work.`,
        `Decide up front who owns the final call so two similar instincts don't quietly compete.`,
      ]
    : [
        `Use this pair on the same problem when it needs both ${firstRoles.primary.gift} and ${secondRoles.primary.gift} — putting those two strengths together is the point of pairing ${a} and ${b}.`,
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
