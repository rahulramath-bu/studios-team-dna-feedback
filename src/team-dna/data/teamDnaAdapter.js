import { teamDnaDataset } from './teamDnaMock.js';
import { makePairId } from './teamDnaIds.js';
import { buildPairInsight } from './teamDnaPairInsights.js';

// Monolith integration tip: this file is the replaceable data seam. Generated
// API hooks can feed the same view model later without leaking API shape into JSX.
export function getTeamDna({ teamId }) {
  if (teamId !== teamDnaDataset.team.id) {
    return teamDnaDataset;
  }

  return teamDnaDataset;
}

export function getInsightForSelection(dataset, selectedIds) {
  if (selectedIds.length === 0) {
    return dataset.insights.team;
  }

  if (selectedIds.length === 1) {
    const selectedMember = dataset.members.find(
      (member) => member.id === selectedIds[0]
    );

    return (
      dataset.insights.people[selectedIds[0]] ??
      buildFallbackPersonInsight(selectedMember, dataset)
    );
  }

  const pairId = makePairId(selectedIds[0], selectedIds[1]);
  const firstMember = dataset.members.find((member) => member.id === selectedIds[0]);
  const secondMember = dataset.members.find((member) => member.id === selectedIds[1]);

  return (
    dataset.insights.pairs[pairId] ??
    buildPairInsight({
      first: firstMember,
      second: secondMember,
      cards: dataset.insights.team.cards,
    })
  );
}

function buildFallbackPersonInsight(member, dataset) {
  return {
    id: `person-${member?.id ?? 'unknown'}-fallback`,
    eyebrow: member?.name ?? 'Team member',
    title: 'The Catalyst',
    summary: [
      {
        text: 'This person changes the team by shifting its center of gravity. Their individual pattern is still waiting for a more specific content pass, but the interaction is already wired to support a person-level read.',
      },
    ],
    cards: dataset.insights.team.cards,
  };
}
