import { teamDnaDataset } from './teamDnaMock.js';
import { BIG_FIVE_TRAITS } from './bigFiveTraits.js';
import { makePairId } from './teamDnaIds.js';
import { getWatchOutForSubjects } from './teamDnaWatchOuts.js';
import {
  buildPairInsight,
  buildPersonInsight,
  buildTeamInsight,
} from './teamDnaPairInsights.js';

/**
 * Replaceable Team DNA data seam.
 *
 * What: presents fixture data through the same shape the UI should receive from
 * real monolith data.
 * How: normalizes selection into team/person/duo insights and generates
 * deterministic Big Five copy from scores by default.
 * Port: replace `getTeamDna` with generated API hooks plus one mapper into the
 * Team DNA view model. Keep components API-blind; place unknown future backend
 * fields under `meta` until a specific card needs them.
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
  if (selectedMembers.length === 0) {
    return 'How this team works';
  }

  if (selectedMembers.length === 1) {
    return `How ${selectedMembers[0].name.split(' ')[0]} works`;
  }

  return `How ${selectedMembers
    .map((member) => member.name.split(' ')[0])
    .join(' and ')} work`;
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
  const spectrumReads = insight.spectrumReads;
  const insightCards = insight.cards ?? [];

  const coreCards = [
    hasSelectedSubjects
      ? {
          id: `${scopeId}-bloom`,
          kind: 'bigFiveBloom',
          label: 'Big Five shape',
          showLabel: false,
          data: { subjects, traits: BIG_FIVE_TRAITS },
        }
      : {
          id: 'team-bloom',
          kind: 'bigFiveBloom',
          label: 'Team Big Five shape',
          showLabel: false,
          data: { subjects, traits: BIG_FIVE_TRAITS },
        },
    hasSelectedSubjects
      ? {
          id: `${scopeId}-spectrum`,
          kind: 'bigFiveSpectrumList',
          label: spectrumLabel,
          data: { subjects, traits: BIG_FIVE_TRAITS, reads: spectrumReads },
        }
      : {
          id: 'team-spectrum',
          kind: 'bigFiveSpectrumList',
          label: spectrumLabel,
          data: { subjects, traits: BIG_FIVE_TRAITS, reads: spectrumReads },
        },
    {
      id: hasSelectedSubjects
        ? `${scopeId}-watch-out`
        : 'team-watch-out',
      kind: 'watchOut',
      label: 'Look out for...',
      data: { watchOut },
    },
  ];

  return [...coreCards.filter((card) => card.kind), ...insightCards];
}

function withSelectionCards(dataset, selectedIds, insight) {
  return {
    ...insight,
    cards: getCardsForSelection(dataset, selectedIds, insight),
  };
}

function getResolvedInsightCopy(insight) {
  return insight?.source === 'ai' || insight?.source === 'override'
    ? insight
    : undefined;
}

export function getInsightForSelection(dataset, selectedIds) {
  if (selectedIds.length === 0) {
    return withSelectionCards(
      dataset,
      selectedIds,
      withEntityHeading(
        buildTeamInsight({
          team: dataset.team,
          members: getSelectableMembers(dataset),
          cards: [],
          authoredInsight: getResolvedInsightCopy(dataset.insights.team),
        }),
        'Team',
        dataset.team.name
      )
    );
  }

  if (selectedIds.length === 1) {
    const selectedMember = dataset.members.find(
      (member) => member.id === selectedIds[0]
    );

    return withSelectionCards(
      dataset,
      selectedIds,
      withEntityHeading(
        buildPersonInsight({
          member: selectedMember,
          cards: [],
          authoredInsight: getResolvedInsightCopy(
            dataset.insights.people?.[selectedIds[0]]
          ),
        }),
        'Person',
        selectedMember?.name ?? 'Team member'
      )
    );
  }

  const pairId = makePairId(selectedIds[0], selectedIds[1]);
  const firstMember = dataset.members.find(
    (member) => member.id === selectedIds[0]
  );
  const secondMember = dataset.members.find(
    (member) => member.id === selectedIds[1]
  );

  return withSelectionCards(
    dataset,
    selectedIds,
    withEntityHeading(
      buildPairInsight({
        first: firstMember,
        second: secondMember,
        cards: [],
        authoredInsight: getResolvedInsightCopy(dataset.insights.pairs?.[pairId]),
      }),
      'Pair',
      `${getFirstName(firstMember)} x ${getFirstName(secondMember)}`
    )
  );
}
