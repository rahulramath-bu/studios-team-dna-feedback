/**
 * Deterministic fallback role titles for completed individual profiles.
 *
 * What: combines the two strongest Big Five pole signals into one plain role
 * title instead of exposing separate primary and secondary roles.
 * How: the caller ranks traits by distance from neutral, then this matrix
 * maps the top two trait poles to a single title.
 * Port: treat these as fallback product/content taxonomy. AI-generated titles
 * can be more specific, but fallback should stay stable and explainable.
 */
const TRAIT_ORDER = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

export const COMBINED_FALLBACK_ROLES = {
  'openness:high|conscientiousness:high': 'The Systems Innovator',
  'openness:high|conscientiousness:low': 'The Adaptive Inventor',
  'openness:low|conscientiousness:high': 'The Practical Implementer',
  'openness:low|conscientiousness:low': 'The Flexible Stabilizer',

  'openness:high|extraversion:high': 'The Energizing Innovator',
  'openness:high|extraversion:low': 'The Quiet Inventor',
  'openness:low|extraversion:high': 'The Practical Mobilizer',
  'openness:low|extraversion:low': 'The Grounded Synthesizer',

  'openness:high|agreeableness:high': 'The Inclusive Innovator',
  'openness:high|agreeableness:low': 'The Constructive Challenger',
  'openness:low|agreeableness:high': 'The Grounded Harmonizer',
  'openness:low|agreeableness:low': 'The Reality Tester',

  'openness:high|neuroticism:high': 'The Risk-Sensing Innovator',
  'openness:high|neuroticism:low': 'The Calm Explorer',
  'openness:low|neuroticism:high': 'The Practical Sentinel',
  'openness:low|neuroticism:low': 'The Steady Pragmatist',

  'conscientiousness:high|extraversion:high': 'The Action Organizer',
  'conscientiousness:high|extraversion:low': 'The Quiet Implementer',
  'conscientiousness:low|extraversion:high': 'The Agile Mobilizer',
  'conscientiousness:low|extraversion:low': 'The Responsive Synthesizer',

  'conscientiousness:high|agreeableness:high': 'The Collaborative Implementer',
  'conscientiousness:high|agreeableness:low': 'The Standards Setter',
  'conscientiousness:low|agreeableness:high': 'The Flexible Harmonizer',
  'conscientiousness:low|agreeableness:low': 'The Adaptive Challenger',

  'conscientiousness:high|neuroticism:high': 'The Prepared Implementer',
  'conscientiousness:high|neuroticism:low': 'The Steady Finisher',
  'conscientiousness:low|neuroticism:high': 'The Adaptive Sentinel',
  'conscientiousness:low|neuroticism:low': 'The Calm Improviser',

  'extraversion:high|agreeableness:high': 'The Team Energizer',
  'extraversion:high|agreeableness:low': 'The Direct Mobilizer',
  'extraversion:low|agreeableness:high': 'The Reflective Connector',
  'extraversion:low|agreeableness:low': 'The Quiet Challenger',

  'extraversion:high|neuroticism:high': 'The Alert Mobilizer',
  'extraversion:high|neuroticism:low': 'The Steady Mobilizer',
  'extraversion:low|neuroticism:high': 'The Vigilant Synthesizer',
  'extraversion:low|neuroticism:low': 'The Calm Synthesizer',

  'agreeableness:high|neuroticism:high': 'The Protective Harmonizer',
  'agreeableness:high|neuroticism:low': 'The Steady Harmonizer',
  'agreeableness:low|neuroticism:high': 'The Candid Sentinel',
  'agreeableness:low|neuroticism:low': 'The Calm Challenger',
};

function getTraitOrderIndex(trait) {
  const index = TRAIT_ORDER.indexOf(trait);
  return index === -1 ? TRAIT_ORDER.length : index;
}

function getRolePole(signal) {
  if (signal?.direction === 'high' || signal?.direction === 'low') {
    return signal.direction;
  }

  if (Number.isFinite(signal?.score) && signal.score !== 50) {
    return signal.score > 50 ? 'high' : 'low';
  }

  return null;
}

export function getCombinedFallbackRoleKey(first, second) {
  const firstPole = getRolePole(first);
  const secondPole = getRolePole(second);

  if (!first?.trait || !second?.trait || !firstPole || !secondPole) {
    return null;
  }

  return [first, second]
    .sort((a, b) => getTraitOrderIndex(a.trait) - getTraitOrderIndex(b.trait))
    .map((signal) => `${signal.trait}:${getRolePole(signal)}`)
    .join('|');
}

export function getCombinedFallbackRoleTitle(primary, secondary) {
  const roleKey = getCombinedFallbackRoleKey(primary, secondary);

  if (!roleKey) {
    return null;
  }

  return COMBINED_FALLBACK_ROLES[roleKey] ?? null;
}

export function getCombinedFallbackRoleSlug(primary, secondary) {
  const title = getCombinedFallbackRoleTitle(primary, secondary);

  if (!title) {
    return null;
  }

  return title
    .replace(/^The\s+/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCombinedFallbackRole(primary, secondary) {
  const key = getCombinedFallbackRoleKey(primary, secondary);
  const title = key ? COMBINED_FALLBACK_ROLES[key] : null;

  if (!key || !title) {
    return null;
  }

  return {
    key,
    slug: getCombinedFallbackRoleSlug(primary, secondary),
    title,
  };
}
