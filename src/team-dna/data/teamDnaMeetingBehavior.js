import {
  BIG_FIVE_TRAITS,
  getBigFiveScore,
} from './bigFiveTraits.js';

const MEETING_BEHAVIOR = {
  openness: {
    high: {
      title: (name) => `${name} probably opens new paths.`,
      body: 'They are likely to reframe the problem, connect ideas, and keep the room exploring before it narrows.',
    },
    low: {
      title: (name) => `${name} probably grounds the room.`,
      body: 'They are likely to ask what is proven, usable, and realistic before the group runs too far ahead.',
    },
  },
  conscientiousness: {
    high: {
      title: (name) => `${name} probably turns talk into next steps.`,
      body: 'They are likely to ask about owners, standards, timelines, and what needs to happen after the meeting.',
    },
    low: {
      title: (name) => `${name} probably keeps the path flexible.`,
      body: 'They are likely to adapt quickly when new information changes what the group thought it was doing.',
    },
  },
  extraversion: {
    high: {
      title: (name) => `${name} probably creates momentum out loud.`,
      body: 'They are likely to think verbally, energize the discussion, and help the group feel movement.',
    },
    low: {
      title: (name) => `${name} probably listens before shaping the read.`,
      body: 'They are likely to take in several views first, then offer a clearer synthesis or question.',
    },
  },
  agreeableness: {
    high: {
      title: (name) => `${name} probably keeps people connected.`,
      body: 'They are likely to notice tone, make room for participation, and help disagreement stay workable.',
    },
    low: {
      title: (name) => `${name} probably tests the logic.`,
      body: 'They are likely to challenge assumptions, sharpen tradeoffs, and say what the room may be avoiding.',
    },
  },
  neuroticism: {
    high: {
      title: (name) => `${name} probably catches the risk early.`,
      body: 'They are likely to notice weak signals, name what could go wrong, and ask what needs protection.',
    },
    low: {
      title: (name) => `${name} probably steadies the room.`,
      body: 'They are likely to stay composed, lower the temperature, and help the group keep perspective.',
    },
  },
};

function getFirstName(member) {
  return member?.name?.split(' ')?.[0] ?? 'This person';
}

function getDirection(score) {
  return score >= 50 ? 'high' : 'low';
}

function getRankedSignals(member) {
  return BIG_FIVE_TRAITS.map((trait) => {
    const score = getBigFiveScore(member, trait.key);

    return {
      trait: trait.key,
      direction: getDirection(score),
      distance: Math.abs(score - 50),
    };
  }).sort((first, second) => second.distance - first.distance);
}

/**
 * Deterministic fallback for Scott's likely-meeting-behavior idea.
 *
 * What: turns a person's strongest Big Five signals into two plain sentences
 * about how they likely show up in meetings.
 * How: uses the same source scores as fallback titles/watch-outs, so this card
 * still renders when AI copy has not been generated.
 * Port: backend AI can provide approved meeting-behavior copy in the same
 * `{ items: [{ title, body }] }` shape.
 */
export function getMeetingBehaviorForMember(member) {
  if (!member?.bigFive) {
    return null;
  }

  const firstName = getFirstName(member);
  const items = getRankedSignals(member)
    .slice(0, 2)
    .map((signal) => {
      const meetingRead = MEETING_BEHAVIOR[signal.trait][signal.direction];

      return {
        traitKey: signal.trait,
        type: 'deterministic',
        title: meetingRead.title(firstName),
        body: meetingRead.body,
      };
    });

  return { items };
}
