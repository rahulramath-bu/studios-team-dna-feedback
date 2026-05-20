import { teamDnaDataset } from './teamDnaMock.js';
import { BIG_FIVE_TRAITS } from './bigFiveTraits.js';
import { makePairId } from './teamDnaIds.js';
import { getWatchOutForSubjects } from './teamDnaWatchOuts.js';
import {
  buildPairInsight,
  buildPersonInsight,
} from './teamDnaPairInsights.js';

/**
 * Replaceable Team DNA data seam.
 *
 * What: presents fixture data through the same shape the UI should receive from
 * real monolith data.
 * How: normalizes selection into team/person/duo insights and falls back to
 * deterministic Big Five copy when authored fixture copy is missing.
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

function getCardsForSelection(dataset, selectedIds) {
  const selectedMembers = getSelectedMembers(dataset, selectedIds);
  const selectableMembers = getSelectableMembers(dataset);
  const subjects =
    selectedMembers.length > 0 ? selectedMembers : selectableMembers;
  const hasSelectedSubjects = selectedMembers.length > 0;
  const scopeId = selectedIds.join('-') || 'team';

  return [
    hasSelectedSubjects
      ? {
          id: `${scopeId}-bloom`,
          kind: 'bigFiveBloom',
          label: 'Big Five shape',
          showLabel: false,
          data: { subjects, traits: BIG_FIVE_TRAITS },
        }
      : {
          id: 'team-spectrum',
          kind: 'bigFiveSpectrumList',
          label: 'Team Big Five range',
          showLabel: false,
          data: { subjects, traits: BIG_FIVE_TRAITS },
        },
    hasSelectedSubjects
      ? {
          id: `${scopeId}-spectrum`,
          kind: 'bigFiveSpectrumList',
          label: 'Big Five spectrum',
          showLabel: false,
          data: { subjects, traits: BIG_FIVE_TRAITS },
        }
      : {
          id: 'team-watch-out',
          kind: 'watchOut',
          label: 'Look out for...',
          data: { watchOut: getWatchOutForSubjects(subjects) },
        },
    {
      id: hasSelectedSubjects
        ? `${scopeId}-watch-out`
        : 'team-info-placeholder-2',
      kind: hasSelectedSubjects ? 'watchOut' : undefined,
      label: hasSelectedSubjects ? 'Look out for...' : 'Other info block',
      data: hasSelectedSubjects
        ? { watchOut: getWatchOutForSubjects(subjects) }
        : undefined,
    },
  ];
}

function withSelectionCards(dataset, selectedIds, insight) {
  return {
    ...insight,
    cards: getCardsForSelection(dataset, selectedIds),
  };
}

export function getInsightForSelection(dataset, selectedIds) {
  if (selectedIds.length === 0) {
    const originalTeamName = dataset.insights.team.title;

    return withSelectionCards(dataset, selectedIds, {
      ...dataset.insights.team,
      title: dataset.team.name,
      summary: dataset.insights.team.summary.map((segment) => ({
        ...segment,
        text:
          typeof segment.text === 'string'
            ? segment.text.replaceAll(originalTeamName, dataset.team.name)
            : segment.text,
      })),
    });
  }

  if (selectedIds.length === 1) {
    const selectedMember = dataset.members.find(
      (member) => member.id === selectedIds[0]
    );

    return withSelectionCards(
      dataset,
      selectedIds,
      buildPersonInsight({
        member: selectedMember,
        cards: dataset.insights.team.cards,
        authoredInsight: dataset.insights.people[selectedIds[0]],
      })
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
    dataset.insights.pairs[pairId] ??
      buildPairInsight({
        first: firstMember,
        second: secondMember,
        cards: dataset.insights.team.cards,
      })
  );
}
