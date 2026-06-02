import { BIG_FIVE_TRAITS } from '../team-dna/data/bigFiveTraits.js';

const IMAGE_BREAK_ASSETS = {
  desert:
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Desert_Desolation_(Unsplash).jpg?width=1600',
  moodyForest:
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Moody_Forest_(Unsplash).jpg?width=1600',
  quietMeetingRoom:
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Quiet_meeting_room_(Unsplash).jpg?width=1600',
  communalInterior:
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Communal_Coworking_interior_(Unsplash).jpg?width=1600',
  bookshelf:
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bookshelf_(Unsplash).jpg?width=1600',
  takeASeat:
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Take_a_seat_(Unsplash).jpg?width=1600',
};

export const IMAGE_BREAK_URLS = Object.values(IMAGE_BREAK_ASSETS);

export const TEAM_DNA_ASSESSMENT_STORAGE_KEY = 'team-dna.surface-1.profile-draft';

export const LIKERT_OPTIONS = [
  { value: 1, label: 'Not at all' },
  { value: 2, label: 'Not much' },
  { value: 3, label: 'Somewhat' },
  { value: 4, label: 'Very much' },
  { value: 5, label: 'Absolutely' },
];

// Prototype item keys intentionally look like AssessmentItem keys. In the
// monolith, these should be replaced by the real assessment_response_set values
// from the Team DNA assessment definition, not invented client-side keys.
export const BIG_FIVE_ITEMS = [
  {
    id: 'tdna_b5_extraversion_1',
    trait: 'extraversion',
    text: 'I bring energy into a room.',
  },
  {
    id: 'tdna_b5_agreeableness_1',
    trait: 'agreeableness',
    text: 'I try to make sure people feel included.',
  },
  {
    id: 'tdna_b5_conscientiousness_1',
    trait: 'conscientiousness',
    text: 'I like to have a clear plan before I start.',
  },
  {
    id: 'tdna_b5_neuroticism_1',
    trait: 'neuroticism',
    text: 'I notice potential problems early.',
  },
  {
    id: 'tdna_b5_openness_1',
    trait: 'openness',
    text: 'I enjoy exploring new ideas.',
  },
  {
    id: 'tdna_b5_extraversion_2',
    trait: 'extraversion',
    reverse: true,
    text: 'I usually keep my thoughts to myself in group settings.',
  },
  {
    id: 'tdna_b5_agreeableness_2',
    trait: 'agreeableness',
    reverse: true,
    text: 'I tend to challenge ideas before I support them.',
  },
  {
    id: 'tdna_b5_conscientiousness_2',
    trait: 'conscientiousness',
    reverse: true,
    text: 'I am comfortable leaving some details open until later.',
  },
  {
    id: 'tdna_b5_neuroticism_2',
    trait: 'neuroticism',
    reverse: true,
    text: 'I stay calm even when the situation is uncertain.',
  },
  {
    id: 'tdna_b5_openness_2',
    trait: 'openness',
    reverse: true,
    text: 'I prefer familiar approaches over untested ones.',
  },
  {
    id: 'tdna_b5_extraversion_3',
    trait: 'extraversion',
    text: 'I think out loud when I am working through something.',
  },
  {
    id: 'tdna_b5_agreeableness_3',
    trait: 'agreeableness',
    text: 'I look for common ground when people disagree.',
  },
  {
    id: 'tdna_b5_conscientiousness_3',
    trait: 'conscientiousness',
    text: 'I follow through on commitments carefully.',
  },
  {
    id: 'tdna_b5_neuroticism_3',
    trait: 'neuroticism',
    text: 'I feel tension when important things are unresolved.',
  },
  {
    id: 'tdna_b5_openness_3',
    trait: 'openness',
    text: 'I connect ideas across different topics.',
  },
  {
    id: 'tdna_b5_extraversion_4',
    trait: 'extraversion',
    reverse: true,
    text: 'I need quiet time before I share my point of view.',
  },
  {
    id: 'tdna_b5_agreeableness_4',
    trait: 'agreeableness',
    reverse: true,
    text: 'I am quick to name what does not make sense.',
  },
  {
    id: 'tdna_b5_conscientiousness_4',
    trait: 'conscientiousness',
    reverse: true,
    text: 'I can move forward without much structure.',
  },
  {
    id: 'tdna_b5_neuroticism_4',
    trait: 'neuroticism',
    reverse: true,
    text: 'I rarely worry about things going wrong.',
  },
  {
    id: 'tdna_b5_openness_4',
    trait: 'openness',
    reverse: true,
    text: 'I like to keep ideas close to what already works.',
  },
];

export const WORKING_STYLE_ITEMS = [
  {
    id: 'tdna_ws_pace',
    key: 'pace',
    label: 'Work pace',
    text: 'When the work starts moving, I prefer the pace to feel...',
    low: 'steady',
    high: 'fast',
  },
  {
    id: 'tdna_ws_structure',
    key: 'structure',
    label: 'Structure',
    text: 'When roles and process are still taking shape, I prefer the next steps to feel...',
    low: 'flexible',
    high: 'clear',
  },
  {
    id: 'tdna_ws_collaboration',
    key: 'collaboration',
    label: 'Collaboration',
    text: 'When a project needs coordination, I prefer the team rhythm to feel...',
    low: 'mostly async',
    high: 'closely synced',
  },
  {
    id: 'tdna_ws_communication',
    key: 'communication',
    label: 'Communication',
    text: 'When something important needs to be said, I prefer the message to be...',
    low: 'careful',
    high: 'direct',
  },
  {
    id: 'tdna_ws_autonomy',
    key: 'autonomy',
    label: 'Autonomy',
    text: 'When I am trusted with a goal, I prefer my path to feel...',
    low: 'guided',
    high: 'autonomous',
  },
  {
    id: 'tdna_ws_innovation',
    key: 'innovation',
    label: 'Innovation',
    text: 'When the team is choosing an approach, I am drawn toward a path that feels...',
    low: 'proven',
    high: 'experimental',
  },
  {
    id: 'tdna_ws_decision_speed',
    key: 'decisionSpeed',
    label: 'Decision making',
    text: 'When a decision is in front of us, I prefer the move to be...',
    low: 'deliberate',
    high: 'quick',
  },
];

// Short, plain encouragements between question blocks. Image-choice "vibe"
// questions were removed: they implied a picture could map to a working-style
// score, which is not something we can defend. Interstitials are non-scored
// pacing beats only.
export const EXPERIENCE_BREAKS = [
  {
    id: 'tdna_break_1',
    kind: 'interstitial',
    nonScored: true,
    text: 'Nice — keep going.',
  },
  {
    id: 'tdna_break_2',
    kind: 'interstitial',
    nonScored: true,
    text: 'You’re about halfway.',
  },
  {
    id: 'tdna_break_3',
    kind: 'interstitial',
    nonScored: true,
    text: 'Last few questions.',
  },
];

export const ROLE_BY_TRAIT_POLE = {
  extraversion_high: {
    name: 'Mobilizer',
    strength: 'Energy, momentum, stakeholder connection, and quick verbal processing.',
    watch: 'Watch for setting the pace before everyone has had time to think.',
    meeting: 'You tend to speak early, think out loud, and create forward motion.',
    coaching: 'Use your energy to invite participation, not just create speed.',
  },
  extraversion_low: {
    name: 'Reflective Synthesizer',
    strength: 'Deep listening, careful synthesis, and thoughtful judgment.',
    watch: 'Watch for waiting so long that the group misses your useful early read.',
    meeting: 'You tend to listen first, then offer a shaped point or clarifying question.',
    coaching: 'Share the early version before it feels fully finished.',
  },
  openness_high: {
    name: 'Innovator',
    strength: 'Fresh thinking, experimentation, and comfort with ambiguity.',
    watch: 'Watch for opening more possibilities after the group needs to narrow.',
    meeting: 'You tend to suggest alternatives, question assumptions, and reframe the problem.',
    coaching: 'Turn possibilities into one or two usable options.',
  },
  openness_low: {
    name: 'Practical Stabilizer',
    strength: 'Feasibility, realism, continuity, and attention to what will work.',
    watch: 'Watch for narrowing before the team has explored enough new options.',
    meeting: 'You tend to ask what is proven, realistic, resourced, and workable.',
    coaching: 'Stay open a little longer before grounding the group.',
  },
  conscientiousness_high: {
    name: 'Implementer',
    strength: 'Structure, quality, accountability, and execution discipline.',
    watch: 'Watch for adding more process than the moment needs.',
    meeting: 'You tend to ask about owners, timing, standards, dependencies, and next steps.',
    coaching: 'Look for the minimum structure that will help the work land.',
  },
  conscientiousness_low: {
    name: 'Adaptive Responder',
    strength: 'Flexibility, improvisation, responsiveness, and comfort with ambiguity.',
    watch: 'Watch for leaving too much unstated when the team needs anchors.',
    meeting: 'You tend to adapt quickly and help the team keep moving when plans shift.',
    coaching: 'Add one concrete next step so flexibility does not become drift.',
  },
  agreeableness_high: {
    name: 'Harmonizer',
    strength: 'Trust, cohesion, diplomacy, inclusion, and smoother collaboration.',
    watch: 'Watch for softening a concern that needs to be named clearly.',
    meeting: 'You tend to notice tone, include quieter voices, and keep tension workable.',
    coaching: 'Say difficult things clearly while preserving trust.',
  },
  agreeableness_low: {
    name: 'Candid Challenger',
    strength: 'Honest critique, sharper standards, and protection against false consensus.',
    watch: 'Watch for being heard as more forceful than you intend.',
    meeting: 'You tend to test logic, name tradeoffs, and say what others may avoid.',
    coaching: 'Keep your edge while making the challenge easier to receive.',
  },
  neuroticism_low: {
    name: 'Steadying Presence',
    strength: 'Composure, resilience, perspective, and regulation under stress.',
    watch: 'Watch for under-signaling urgency when something truly needs action.',
    meeting: 'You tend to stay composed and help the room stay grounded.',
    coaching: 'Make your calmness legible without minimizing what matters.',
  },
  neuroticism_high: {
    name: 'Vigilant Sentinel',
    strength: 'Risk sensitivity, early warning, preparedness, and attention to weak signals.',
    watch: 'Watch for staying with possible risks longer than the group needs.',
    meeting: 'You tend to ask what could fail, what is fragile, and what needs a contingency.',
    coaching: 'Turn risk sensitivity into focused action by naming likelihood and impact.',
  },
};

export function buildAssessmentSteps() {
  const steps = [];
  const workingStyleInsertions = new Map([
    [2, 0],
    [5, 1],
    [8, 2],
    [11, 3],
    [14, 4],
    [17, 5],
    [19, 6],
  ]);
  const experienceBreakInsertions = new Map([
    [6, [0]],
    [11, [1]],
    [16, [2]],
  ]);

  BIG_FIVE_ITEMS.forEach((item, index) => {
    steps.push({
      id: item.id,
      kind: 'bigFive',
      item,
    });

    if (workingStyleInsertions.has(index)) {
      const workingStyleItem =
        WORKING_STYLE_ITEMS[workingStyleInsertions.get(index)];

      steps.push({
        id: workingStyleItem.id,
        kind: 'workingStyle',
        item: workingStyleItem,
      });
    }

    if (experienceBreakInsertions.has(index)) {
      experienceBreakInsertions.get(index).forEach((breakIndex) => {
        const experienceBreak = EXPERIENCE_BREAKS[breakIndex];
        steps.push({
          id: experienceBreak.id,
          kind: experienceBreak.kind,
          item: experienceBreak,
          nonScored: true,
        });
      });
    }
  });

  return steps.map((step, index) => ({
    ...step,
    questionIndex: index + 1,
  }));
}

export function scoreBigFive(responses) {
  const scores = {};

  BIG_FIVE_TRAITS.forEach((trait) => {
    const answers = BIG_FIVE_ITEMS
      .filter((item) => item.trait === trait.key)
      .map((item) => {
        const rawValue = Number(responses[item.id]);
        if (!Number.isFinite(rawValue)) return null;
        return item.reverse ? 6 - rawValue : rawValue;
      })
      .filter(Number.isFinite);

    const average =
      answers.length > 0
        ? answers.reduce((sum, value) => sum + value, 0) / answers.length
        : 3;

    scores[trait.key] = Math.round(((average - 1) / 4) * 100);
  });

  return scores;
}

export function scoreWorkingStyle(responses) {
  return Object.fromEntries(
    WORKING_STYLE_ITEMS.map((item) => [
      item.key,
      Number.isFinite(Number(responses[item.id]))
        ? Number(responses[item.id])
        : 50,
    ])
  );
}

function getTraitSignal(score, traitKey) {
  const pole = score >= 50 ? 'high' : 'low';
  const role = ROLE_BY_TRAIT_POLE[`${traitKey}_${pole}`];

  return {
    traitKey,
    pole,
    distance: Math.abs(score - 50),
    role,
  };
}

function getStrongestSignals(bigFive) {
  return Object.entries(bigFive)
    .map(([traitKey, score]) => getTraitSignal(score, traitKey))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 2);
}

function getWorkingStyleSummary(workingStyle) {
  return WORKING_STYLE_ITEMS.map((item) => {
    const value = workingStyle[item.key] ?? 50;
    const label = value >= 58 ? item.high : value <= 42 ? item.low : 'Balanced';
    return `${item.label}: ${label.toLowerCase()}`;
  }).join(', ');
}

export function generateTeamDnaProfile({
  bigFive,
  workingStyle,
  name = 'You',
  avatarDataUrl = '',
}) {
  const [primary, secondary] = getStrongestSignals(bigFive);
  const primaryRole = primary?.role ?? ROLE_BY_TRAIT_POLE.openness_high;
  const secondaryRole = secondary?.role ?? ROLE_BY_TRAIT_POLE.conscientiousness_high;
  const workingSummary = getWorkingStyleSummary(workingStyle);

  return {
    source: 'deterministic-prototype',
    name,
    avatarDataUrl,
    bigFive,
    workingStyle,
    roles: {
      primary: primaryRole.name,
      secondary: secondaryRole.name,
    },
    copy: {
      overview: `${name}'s Team DNA currently reads as ${primaryRole.name} with a secondary ${secondaryRole.name} signal. That means the strongest contribution is ${primaryRole.strength.toLowerCase()}`,
      strengths: `${primaryRole.strength} ${secondaryRole.strength}`,
      workingStyle: `Working style preferences: ${workingSummary}.`,
      watchOuts: `${primaryRole.watch} ${secondaryRole.watch}`,
      meetingBehavior: `${primaryRole.meeting} ${secondaryRole.meeting}`,
      coaching: `${primaryRole.coaching} ${secondaryRole.coaching}`,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      promptVersion: 'local-deterministic-v1',
      profileVisibility: 'teams',
      pairComparisonVisibility: 'teams',
    },
  };
}

export function serializeAssessmentEnginePayload(responses) {
  return Object.fromEntries(
    Object.entries(responses).map(([key, value]) => [
      key,
      value === undefined || value === null ? null : String(value),
    ])
  );
}
