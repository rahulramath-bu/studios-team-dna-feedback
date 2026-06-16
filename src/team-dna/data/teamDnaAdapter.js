import { teamDnaDataset } from './teamDnaMock.js';
import { BIG_FIVE_TRAITS } from './bigFiveTraits.js';
import { makePairId } from './teamDnaIds.js';
import { getWatchOutForSubjects } from './teamDnaWatchOuts.js';
import { getStrengthForSubjects } from './teamDnaStrengths.js';
import {
  getMemberRoles,
  getPersonGuidanceCards,
  getPairGuidanceCards,
} from './teamDnaRoles.js';
import { getArchetypeImageForTeam } from './teamDnaArchetypeImages.js';
import {
  buildPairInsight,
  buildPersonInsight,
  buildTeamInsight,
} from './teamDnaPairInsights.js';
import {
  resolveTeamDnaGenerationLifecycle,
  shouldUseGeneratedTeamDnaInsight,
} from './teamDnaGenerationLifecycle.mock.js';

/**
 * Replaceable Team DNA data seam.
 *
 * What: presents fixture data through the same shape the UI should receive from
 * real monolith data.
 * How: normalizes selection into team/person/duo insights and generates
 * deterministic Big Five copy from scores by default.
 * Port: replace `getTeamDna` with generated API hooks plus one mapper into the
 * Team DNA view model documented in `teamDnaViewModel.d.ts`. Keep components
 * API-blind; place unknown future backend fields under `meta` until a specific
 * card needs them.
 */
export function getTeamDna({ teamId }) {
  if (teamId !== teamDnaDataset.team.id) {
    return teamDnaDataset;
  }

  return teamDnaDataset;
}

function getSelectableMembers(dataset) {
  return dataset.members.filter((member) => member.assessmentComplete !== false);
}

function getSelectedMembers(dataset, selectedIds) {
  return selectedIds
    .map((id) => dataset.members.find((member) => member.id === id))
    .filter(Boolean);
}

function getFirstName(member) {
  return member?.name?.split(' ')[0] ?? 'Teammate';
}

function withEntityHeading(insight, entityEyebrow, entityTitle) {
  return {
    ...insight,
    entityEyebrow,
    entityTitle,
  };
}

function getSpectrumLabel(selectedMembers) {
  return 'Big Five';
}

function getCardsForSelection(dataset, selectedIds, insight = {}) {
  const selectedMembers = getSelectedMembers(dataset, selectedIds);
  const selectableMembers = getSelectableMembers(dataset);
  const subjects =
    selectedMembers.length > 0 ? selectedMembers : selectableMembers;
  const hasSelectedSubjects = selectedMembers.length > 0;
  const scopeId = selectedIds.join('-') || 'team';
  const spectrumLabel = getSpectrumLabel(selectedMembers);
  const watchOut =
    insight.watchOut ?? getWatchOutForSubjects(subjects);
  const strengths = getStrengthForSubjects(subjects);
  const spectrumReads = insight.spectrumReads;
  let insightCards = insight.cards ?? [];
  // Strengths is now a structured, multi-item card (a matched pair with blind
  // spots), so drop any authored/role one-paragraph "where this shines" copy.
  insightCards = insightCards.filter(
    (card) => !(card.kind === 'guidance' && card.id.endsWith('-where-shines'))
  );
  const isSingleMember = selectedMembers.length === 1;
  const isPair = selectedMembers.length === 2;
  const isTeam = !hasSelectedSubjects;

  // Static archetype illustrations are retired across all views. The team view
  // shows a role-distribution box (see below); profiles lead with their copy.
  const teamArchetype = isTeam ? getArchetypeImageForTeam(selectableMembers) : null;
  const teamShapeContributions = teamArchetype?.contributions?.length
    ? teamArchetype.contributions
    : [];

  // Deterministic collaboration guidance so every profile has full copy, not just
  // hand-authored members. Strengths + blind spots are structured core cards; the
  // generators below only fill the "how to work with / together" section.
  let deterministicGuidance = [];
  if (isSingleMember) {
    const hasAuthoredWorkWith = insightCards.some(
      (card) => card.kind === 'guidance' && card.id.endsWith('-work-with')
    );
    if (!hasAuthoredWorkWith) {
      deterministicGuidance = getPersonGuidanceCards(selectedMembers[0]);
    }
  } else if (isPair) {
    deterministicGuidance = getPairGuidanceCards(
      selectedMembers[0],
      selectedMembers[1]
    );
    insightCards = insightCards.filter((card) => card.kind !== 'guidance');
  }

  const strengthsCard = strengths?.items?.length
    ? {
        id: `${scopeId}-strengths`,
        kind: 'strengthsList',
        label: 'Strengths',
        data: { strengths },
      }
    : null;

  const coreCards = [
    strengthsCard,
    // Team composition: role distribution rendered as a single box (showLabel
    // off; the box renders its own subsection divider).
    teamShapeContributions.length
      ? {
          id: 'team-shape-contributions',
          kind: 'teamShapeContributions',
          label: 'Team shape',
          showLabel: false,
          data: {
            contributions: teamShapeContributions,
          },
        }
      : null,
    {
      id: hasSelectedSubjects ? `${scopeId}-spectrum` : 'team-spectrum',
      kind: 'bigFiveSpectrumList',
      label: spectrumLabel,
      data: { subjects, traits: BIG_FIVE_TRAITS, reads: spectrumReads },
    },
    {
      id: hasSelectedSubjects ? `${scopeId}-watch-out` : 'team-watch-out',
      kind: 'watchOut',
      label: 'Growth opportunities',
      data: { watchOut },
    },
  ];

  return [...coreCards.filter(Boolean), ...deterministicGuidance, ...insightCards];
}

function withSelectionCards(dataset, selectedIds, insight) {
  return {
    ...insight,
    cards: getCardsForSelection(dataset, selectedIds, insight),
  };
}

function getResolvedInsightCopy(insight, lifecycle) {
  const canUseGeneratedInsight =
    insight?.source !== 'ai' || shouldUseGeneratedTeamDnaInsight(lifecycle);

  return canUseGeneratedInsight &&
    (insight?.source === 'ai' || insight?.source === 'override')
    ? insight
    : undefined;
}

function withGenerationLifecycle(insight, lifecycle) {
  return {
    ...insight,
    generationLifecycle: lifecycle,
  };
}

export function getInsightForSelection(
  dataset,
  selectedIds,
  generationStatusByTargetId = {}
) {
  const lifecycle = resolveTeamDnaGenerationLifecycle(
    dataset,
    selectedIds,
    generationStatusByTargetId
  );

  if (selectedIds.length === 0) {
    return withGenerationLifecycle(
      withSelectionCards(
        dataset,
        selectedIds,
        withEntityHeading(
          buildTeamInsight({
            team: dataset.team,
            members: getSelectableMembers(dataset),
            cards: [],
            authoredInsight: getResolvedInsightCopy(
              dataset.insights.team,
              lifecycle
            ),
          }),
          'Team',
          dataset.team.name
        )
      ),
      lifecycle
    );
  }

  if (selectedIds.length === 1) {
    const selectedMember = dataset.members.find(
      (member) => member.id === selectedIds[0]
    );
    const personInsight = buildPersonInsight({
      member: selectedMember,
      cards: [],
      authoredInsight: getResolvedInsightCopy(
        dataset.insights.people?.[selectedIds[0]],
        lifecycle
      ),
    });
    // Primary + secondary team roles, woven into the description as a short
    // labeled read rather than separate cards/chips. Kept as its own field so it
    // stays out of the editable overview draft.
    const roleRead = getMemberRoles(selectedMember);

    return withGenerationLifecycle(
      withSelectionCards(
        dataset,
        selectedIds,
        withEntityHeading(
          {
            ...personInsight,
            roleRead: roleRead ?? undefined,
          },
          'Person',
          selectedMember?.name ?? 'Team member'
        )
      ),
      lifecycle
    );
  }

  const pairId = makePairId(selectedIds[0], selectedIds[1]);
  const firstMember = dataset.members.find(
    (member) => member.id === selectedIds[0]
  );
  const secondMember = dataset.members.find(
    (member) => member.id === selectedIds[1]
  );

  return withGenerationLifecycle(
    withSelectionCards(
      dataset,
      selectedIds,
      withEntityHeading(
        buildPairInsight({
          first: firstMember,
          second: secondMember,
          cards: [],
          authoredInsight: getResolvedInsightCopy(
            dataset.insights.pairs?.[pairId],
            lifecycle
          ),
        }),
        'Pair',
        `${getFirstName(firstMember)} x ${getFirstName(secondMember)}`
      )
    ),
    lifecycle
  );
}
