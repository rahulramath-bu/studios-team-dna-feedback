export const DEMO_FLOW_PATH = '/flow-demo';

// Add/remove/reorder demo beats here. The tour shell only reads this list, so
// new scripted states should be a small URL adapter instead of custom page code.
const userJourneyMoments = [
  {
    id: 'surface-0-account',
    phase: 'Onboarding',
    label: 'Account',
    title: 'Create an account',
    note: 'Before the assessment, the user signs up and consents to sharing their Team DNA results with their teams.',
    surfaceUrl: '/assessment?demo=account',
  },
  {
    id: 'surface-0-value',
    phase: 'Onboarding',
    label: 'Value',
    title: 'Frame the value',
    note: 'A short value page explains what Team DNA unlocks and what getting started involves.',
    surfaceUrl: '/assessment?demo=value',
  },
  {
    id: 'surface-1-start',
    phase: 'Assessment',
    label: 'Welcome',
    title: 'Kick off the assessment',
    note: 'The Big Five assessment starts here, with a short explainer and a hidden note on the research and how the data is used. In this demo you can skip ahead.',
    surfaceUrl: '/assessment?demo=welcome',
  },
  {
    id: 'surface-1-question',
    phase: 'Assessment',
    label: 'Question',
    title: 'Answer the Big Five prompts',
    note: 'Each screen shows one statement; the user rates how much they agree on a 1–5 scale. There are 20 in all — the standard Mini-IPIP Big Five set.',
    surfaceUrl: '/assessment?demo=questions&q=0',
  },
  {
    id: 'surface-1-question-later',
    phase: 'Assessment',
    label: 'Progress',
    title: 'Move through the questionnaire',
    note: 'The bottom bar tracks progress, and a “Skip for demo” control jumps straight to the photo step.',
    surfaceUrl: '/assessment?demo=questions&q=12',
  },
  {
    id: 'surface-1-photo',
    phase: 'Profile',
    label: 'Photo',
    title: 'Make it feel like a person',
    note: 'The photo step gives the profile a human anchor before it appears in the team view.',
    surfaceUrl: '/assessment?demo=avatar',
  },
  {
    id: 'surface-1-review',
    phase: 'Profile',
    label: 'Profile',
    title: 'See your Team DNA profile',
    note: 'The user sees their finished read — strengths, blind spots, and how teammates can work with them — before it appears to their teams.',
    surfaceUrl: '/assessment?demo=review',
  },
  {
    id: 'surface-2-team',
    phase: 'Team view',
    label: 'Team',
    title: 'See the team pattern',
    note: 'Individual signals now roll up into a shared read for the team.',
    surfaceUrl: '/team-dna?demo=team',
  },
  {
    id: 'surface-2-person',
    phase: 'Team view',
    label: 'Person',
    title: 'Open a person read',
    note: 'A teammate profile keeps the same language and cards the user reviewed earlier.',
    surfaceUrl: '/team-dna?demo=person&members=preetoshi',
  },
  {
    id: 'surface-2-pair',
    phase: 'Team view',
    label: 'Pair',
    title: 'Compare two teammates',
    note: 'Pair views turn the data into practical collaboration guidance.',
    surfaceUrl: '/team-dna?demo=pair&members=preetoshi,jon',
  },
];

const managerJourneyMoments = [
  {
    id: 'manager-empty',
    phase: 'Manager view',
    label: 'Empty',
    title: 'Start before the team is ready',
    note: 'A manager can understand the value before any Team DNA data exists.',
    surfaceUrl: '/team-dna?demo=empty',
  },
  {
    id: 'manager-add-team',
    phase: 'Team setup',
    label: 'Add team',
    title: 'Open the team setup pane',
    note: 'The manager can start from the empty state and create a Team DNA group.',
    surfaceUrl: '/team-dna?demo=add-team',
  },
  {
    id: 'manager-search-team',
    phase: 'Team setup',
    label: 'Search',
    title: 'Find teammates',
    note: 'The setup pane uses the organization directory and can also support manual invites.',
    surfaceUrl: '/team-dna?demo=add-team-search',
  },
  {
    id: 'manager-selected-team',
    phase: 'Team setup',
    label: 'Roster',
    title: 'Stage a first roster',
    note: 'The manager sees who will be added and whether new teammates should be notified.',
    surfaceUrl: '/team-dna?demo=add-team-selected',
  },
  {
    id: 'manager-mixed-roster',
    phase: 'Readiness',
    label: 'Readiness',
    title: 'Review who is ready',
    note: 'The edit pane shows completed teammates, pending assessments, and reminder actions in one place.',
    surfaceUrl: '/team-dna?demo=mixed-roster',
  },
  {
    id: 'manager-reminder',
    phase: 'Readiness',
    label: 'Reminder',
    title: 'Send a nudge',
    note: 'Pending teammates can be reminded without leaving the team setup context.',
    surfaceUrl: '/team-dna?demo=reminder-sent',
  },
  {
    id: 'manager-waiting',
    phase: 'Readiness',
    label: 'Waiting',
    title: 'See what is still needed',
    note: 'The team page explains when more assessments are needed before a responsible read appears.',
    surfaceUrl: '/team-dna?demo=waiting',
  },
  {
    id: 'manager-enough-to-generate',
    phase: 'Readiness',
    label: 'Enough',
    title: 'Generate before everyone finishes',
    note: 'Once enough responses are in, the manager can wait for everyone or create an early team read.',
    surfaceUrl: '/team-dna?demo=enough-to-generate',
  },
  {
    id: 'manager-generating',
    phase: 'Team read',
    label: 'Generating',
    title: 'Show the generation moment',
    note: 'Once enough responses are in, the page can show that the team read is being built.',
    surfaceUrl: '/team-dna?demo=generating',
  },
  {
    id: 'manager-team-ready',
    phase: 'Team read',
    label: 'Team read',
    title: 'Reveal the team pattern',
    note: 'The team read turns individual signals into a shared view of how the team works.',
    surfaceUrl: '/team-dna?demo=team',
  },
  {
    id: 'manager-person',
    phase: 'Team read',
    label: 'Person',
    title: 'Open a person read',
    note: 'A teammate profile uses the same language the person reviewed before sharing.',
    surfaceUrl: '/team-dna?demo=person&members=preetoshi',
  },
  {
    id: 'manager-pair',
    phase: 'Team read',
    label: 'Pair',
    title: 'Compare two teammates',
    note: 'Pair views make the data useful for day-to-day collaboration.',
    surfaceUrl: '/team-dna?demo=pair&members=preetoshi,jon',
  },
];

export const demoFlowJourneys = {
  user: {
    id: 'user',
    label: 'Direct report flow',
    moments: userJourneyMoments,
  },
  manager: {
    id: 'manager',
    label: 'Manager flow',
    moments: managerJourneyMoments,
  },
};

export const demoFlowMoments = userJourneyMoments;

export function getDemoFlowJourney(journeyId) {
  return demoFlowJourneys[journeyId] ?? demoFlowJourneys.user;
}
