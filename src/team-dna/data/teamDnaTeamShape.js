import { BIG_FIVE_TRAITS } from './bigFiveTraits.js';

const SCOTT_ROLE_BY_SIGNAL = {
  'extraversion:high': {
    key: 'mobilizer',
    label: 'Mobilizers',
    description: 'energy and momentum',
  },
  'extraversion:low': {
    key: 'reflective-synthesizer',
    label: 'Reflective synthesizers',
    description: 'listening and sense-making',
  },
  'openness:high': {
    key: 'innovator',
    label: 'Innovators',
    description: 'new angles and exploration',
  },
  'openness:low': {
    key: 'practical-stabilizer',
    label: 'Practical stabilizers',
    description: 'grounding and feasibility',
  },
  'conscientiousness:high': {
    key: 'implementer',
    label: 'Implementers',
    description: 'structure and follow-through',
  },
  'conscientiousness:low': {
    key: 'adaptive-responder',
    label: 'Adaptive responders',
    description: 'flexibility and quick adjustment',
  },
  'agreeableness:high': {
    key: 'harmonizer',
    label: 'Harmonizers',
    description: 'trust and cohesion',
  },
  'agreeableness:low': {
    key: 'candid-challenger',
    label: 'Candid challengers',
    description: 'clear challenge and sharper standards',
  },
  'neuroticism:high': {
    key: 'vigilant-sentinel',
    label: 'Vigilant sentinels',
    description: 'early risk signals',
  },
  'neuroticism:low': {
    key: 'steadying-presence',
    label: 'Steadying presences',
    description: 'calm and perspective',
  },
};

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
