import { BIG_FIVE_TRAITS } from './bigFiveTraits.js';

/* Scott's Big Five Team Role Map (Aug 14): ten roles, one per pole of each
   trait. Names and descriptions come from the updated assessment doc; both
   poles of every trait are a genuine contribution. This map is the single
   source for archetypes across every lens and page variation. */
const SCOTT_ROLE_BY_SIGNAL = {
  'extraversion:high': {
    key: 'energizer',
    label: 'Energizers',
    singular: 'Energizer',
    description: 'voice, visibility, momentum',
    openLine:
      'Nobody here defaults to rallying the room, so when momentum stalls it needs a named owner.',
  },
  'extraversion:low': {
    key: 'listener',
    label: 'Listeners',
    singular: 'Listener',
    description: 'room for other voices',
    openLine:
      'Nobody here defaults to sitting back and distilling, so build the pause in before the fastest take wins.',
  },
  'openness:high': {
    key: 'explorer',
    label: 'Explorers',
    singular: 'Explorer',
    description: 'fresh options and new angles',
    openLine:
      'Fresh options will not appear on their own here; book time to look outside the current playbook.',
  },
  'openness:low': {
    key: 'builder',
    label: 'Builders',
    singular: 'Builder',
    description: 'grounding and reality checks',
    openLine:
      'Nobody here defaults to the feasibility check, so make "will this actually ship?" a standing question.',
  },
  'conscientiousness:high': {
    key: 'finisher',
    label: 'Finishers',
    singular: 'Finisher',
    description: 'preparation and follow-through',
    openLine:
      'Getting things over the line takes deliberate effort here; name owners and dates every time.',
  },
  'conscientiousness:low': {
    key: 'easygoer',
    label: 'Easygoers',
    singular: 'Easygoer',
    description: 'adaptability when plans shift',
    openLine:
      'Course-correcting mid-flight is nobody\u2019s default here; decide in advance how a plan gets changed.',
  },
  'agreeableness:high': {
    key: 'connector',
    label: 'Connectors',
    singular: 'Connector',
    description: 'empathy and cohesion',
    openLine:
      'Nobody here defaults to tending the relationships, so check in on the people, not just the work.',
  },
  'agreeableness:low': {
    key: 'challenger',
    label: 'Challengers',
    singular: 'Challenger',
    description: 'constructive friction',
    openLine:
      'Hard questions tend to arrive late or softened here; invite the pushback explicitly.',
  },
  'neuroticism:high': {
    key: 'spark',
    label: 'Sparks',
    singular: 'Spark',
    description: 'energy, urgency, visible care',
    openLine:
      'Nobody here runs hot by default, so urgency needs an explicit owner when it matters.',
  },
  'neuroticism:low': {
    key: 'anchor',
    label: 'Anchors',
    singular: 'Anchor',
    description: 'steadiness under pressure',
    openLine:
      'Under pressure nobody here defaults to ballast; plan the calm response before you need it.',
  },
};

/* Canonical display order for the coverage map: paired poles, trait by trait,
   so "both ends bring value" stays visible in the layout itself. */
const ROLE_COVERAGE_ORDER = [
  'explorer',
  'builder',
  'finisher',
  'easygoer',
  'energizer',
  'listener',
  'challenger',
  'connector',
  'spark',
  'anchor',
];

/* One signature name per pole: the team's most extreme trait average names
   the team. */
const TEAM_SIGNATURE_BY_SIGNAL = {
  'openness:high': 'The Idea Engine',
  'openness:low': 'The Proven Path',
  'conscientiousness:high': 'The Finishing Crew',
  'conscientiousness:low': 'The Quick Pivot',
  'extraversion:high': 'The Live Wire',
  'extraversion:low': 'The Quiet Powerhouse',
  'agreeableness:high': 'The Glue',
  'agreeableness:low': 'The Sharpening Stone',
  'neuroticism:high': 'The Early-Warning System',
  'neuroticism:low': 'The Steady Hands',
};

/** A generated team name from the trait where the team leans hardest. */
export function getTeamSignature(members) {
  const scored = members.filter((member) => member?.bigFive);
  if (!scored.length) return null;
  const strongest = BIG_FIVE_TRAITS.map((trait) => {
    const avg =
      scored.reduce(
        (sum, member) => sum + (member.bigFive[trait.key] ?? 50),
        0
      ) / scored.length;
    return {
      trait: trait.key,
      distance: Math.abs(avg - 50),
      direction: avg >= 50 ? 'high' : 'low',
    };
  }).sort((first, second) => second.distance - first.distance)[0];
  return TEAM_SIGNATURE_BY_SIGNAL[`${strongest.trait}:${strongest.direction}`];
}

const MIN_SIGNAL_DISTANCE = 10;

function getTraitDirection(score) {
  if (score >= 67) return 'high';
  if (score <= 33) return 'low';
  return score >= 50 ? 'high' : 'low';
}

function getRankedSignals(member) {
  const scores = member?.bigFive ?? {};

  return BIG_FIVE_TRAITS.map((trait) => {
    const score = scores[trait.key] ?? 50;

    return {
      trait: trait.key,
      score,
      direction: getTraitDirection(score),
      distance: Math.abs(score - 50),
    };
  }).sort((first, second) => second.distance - first.distance);
}

export function getScottRoleSignalsForMember(member) {
  return getRankedSignals(member)
    .filter((signal) => signal.distance >= MIN_SIGNAL_DISTANCE)
    .slice(0, 1)
    .map((signal) => ({
      signal,
      role: SCOTT_ROLE_BY_SIGNAL[`${signal.trait}:${signal.direction}`],
    }))
    .filter((entry) => Boolean(entry.role));
}

/** A member's strongest archetypes in order (primary, secondary, ...). */
export function getMemberArchetypes(member, count = 2) {
  return getRankedSignals(member)
    .filter((signal) => signal.distance >= MIN_SIGNAL_DISTANCE)
    .map((signal) => SCOTT_ROLE_BY_SIGNAL[`${signal.trait}:${signal.direction}`])
    .filter(Boolean)
    .slice(0, count);
}

export function buildTeamShapeContributions(members) {
  const groups = new Map();

  members
    .filter((member) => member?.assessmentComplete !== false && member?.bigFive)
    .forEach((member) => {
      getScottRoleSignalsForMember(member).forEach(({ role, signal }) => {
        const current = groups.get(role.key) ?? {
          ...role,
          members: [],
          maxDistance: 0,
        };

        current.members.push(member);
        current.maxDistance = Math.max(current.maxDistance, signal.distance);
        groups.set(role.key, current);
      });
    });

  return [...groups.values()]
    .sort((first, second) => {
      if (second.members.length !== first.members.length) {
        return second.members.length - first.members.length;
      }

      return second.maxDistance - first.maxDistance;
    })
    .slice(0, 4)
    .map(({ maxDistance, ...contribution }) => contribution);
}

/**
 * Full role coverage for the Coverage lens ("archipelago"): all ten roles in
 * canonical order, each with the members who naturally carry it and a state.
 * Unlike the team-shape card (one strongest signal per person, top four
 * groups), coverage counts each person's top two clear signals, because the
 * point of this lens is what the team has, what is thin, and what nobody
 * covers by default.
 */
export function buildTeamRoleCoverage(members) {
  const subjects = members.filter(
    (member) => member?.assessmentComplete !== false && member?.bigFive
  );
  const groups = new Map();

  subjects.forEach((member) => {
    getRankedSignals(member)
      .filter((signal) => signal.distance >= MIN_SIGNAL_DISTANCE)
      .slice(0, 2)
      .forEach((signal) => {
        const role = SCOTT_ROLE_BY_SIGNAL[`${signal.trait}:${signal.direction}`];
        if (!role) return;
        const current = groups.get(role.key) ?? { members: [], maxDistance: 0 };
        current.members.push(member);
        current.maxDistance = Math.max(current.maxDistance, signal.distance);
        groups.set(role.key, current);
      });
  });

  return ROLE_COVERAGE_ORDER.map((key) => {
    const role = Object.values(SCOTT_ROLE_BY_SIGNAL).find(
      (candidate) => candidate.key === key
    );
    const group = groups.get(key);
    const roleMembers = group?.members ?? [];

    return {
      ...role,
      members: roleMembers,
      state:
        roleMembers.length >= 2 ? 'deep' : roleMembers.length === 1 ? 'thin' : 'open',
    };
  });
}
