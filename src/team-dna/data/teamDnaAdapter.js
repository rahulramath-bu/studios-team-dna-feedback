import { teamDnaDataset } from './teamDnaMock.js';
import { makePairId } from './teamDnaIds.js';
import {
  buildPairInsight,
  buildPersonInsight,
} from './teamDnaPairInsights.js';

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
    const originalTeamName = dataset.insights.team.title;

    return {
      ...dataset.insights.team,
      title: dataset.team.name,
      summary: dataset.insights.team.summary.map((segment) => ({
        ...segment,
        text:
          typeof segment.text === 'string'
            ? segment.text.replaceAll(originalTeamName, dataset.team.name)
            : segment.text,
      })),
    };
  }

  if (selectedIds.length === 1) {
    const selectedMember = dataset.members.find(
      (member) => member.id === selectedIds[0]
    );

    return buildPersonInsight({
      member: selectedMember,
      cards: dataset.insights.team.cards,
      authoredInsight: dataset.insights.people[selectedIds[0]],
    });
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
