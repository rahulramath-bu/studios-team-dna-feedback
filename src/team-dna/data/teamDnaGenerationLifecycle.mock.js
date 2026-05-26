import { makePairId } from './teamDnaIds.js';

export const TEAM_DNA_GENERATION_STATUSES = [
  'not_ready',
  'pending',
  'ready',
  'failed',
  'stale',
];

export const TEAM_DNA_TEAM_MIN_COMPLETED_ASSESSMENTS = 3;

/**
 * Mock Team DNA generated-insight lifecycle contract.
 *
 * What: describes the frontend-visible states for backend AI generation jobs.
 * How: turns the current team/person/duo selection into a stable generation
 * target id, then resolves a status from local debug overrides plus product
 * readiness rules.
 * Port: replace this file with backend generation status fields from the real
 * Team DNA API. Keep the idea: data creates targets; AI enriches those targets.
 */

export function getTeamDnaGenerationScope(selectedIds = []) {
  if (selectedIds.length === 2) return 'duo';
  if (selectedIds.length === 1) return 'person';
  return 'team';
}

export function makeTeamDnaGenerationTargetId(dataset, selectedIds = []) {
  const scope = getTeamDnaGenerationScope(selectedIds);

  if (scope === 'person') return `person:${selectedIds[0]}`;
  if (scope === 'duo') return `duo:${makePairId(selectedIds[0], selectedIds[1])}`;

  return `team:${dataset.team.id}`;
}

function getCompletedMembers(dataset) {
  return dataset.members.filter((member) => member.assessmentComplete !== false);
}

function getSelectedMembers(dataset, selectedIds) {
  return selectedIds
    .map((id) => dataset.members.find((member) => member.id === id))
    .filter(Boolean);
}

function getDefaultGenerationStatus(dataset, selectedIds = []) {
  const scope = getTeamDnaGenerationScope(selectedIds);

  if (scope === 'person') {
    const [member] = getSelectedMembers(dataset, selectedIds);
    return member?.assessmentComplete === false ? 'not_ready' : 'ready';
  }

  if (scope === 'duo') {
    const members = getSelectedMembers(dataset, selectedIds);
    return members.length === 2 &&
      members.every((member) => member.assessmentComplete !== false)
      ? 'ready'
      : 'not_ready';
  }

  const completedCount = getCompletedMembers(dataset).length;
  const totalCount = dataset.members.length;

  if (completedCount < TEAM_DNA_TEAM_MIN_COMPLETED_ASSESSMENTS) {
    return 'not_ready';
  }

  return completedCount === totalCount ? 'ready' : 'not_ready';
}

function getTargetMembers(dataset, selectedIds) {
  const scope = getTeamDnaGenerationScope(selectedIds);

  if (scope === 'team') return getCompletedMembers(dataset);
  return getSelectedMembers(dataset, selectedIds);
}

export function getTeamDnaGenerationTarget(dataset, selectedIds = []) {
  const scope = getTeamDnaGenerationScope(selectedIds);
  const completedCount = getCompletedMembers(dataset).length;
  const totalCount = dataset.members.length;

  return {
    id: makeTeamDnaGenerationTargetId(dataset, selectedIds),
    scope,
    teamId: dataset.team.id,
    memberIds: getTargetMembers(dataset, selectedIds).map((member) => member.id),
    completedCount,
    totalCount,
    minimumCompletedCount: TEAM_DNA_TEAM_MIN_COMPLETED_ASSESSMENTS,
    canGenerateTeam:
      scope === 'team' &&
      completedCount >= TEAM_DNA_TEAM_MIN_COMPLETED_ASSESSMENTS,
    canGenerateTeamEarly:
      scope === 'team' &&
      completedCount >= TEAM_DNA_TEAM_MIN_COMPLETED_ASSESSMENTS &&
      completedCount < totalCount,
  };
}

export function shouldUseGeneratedTeamDnaInsight(lifecycle) {
  return lifecycle?.status === 'ready' || lifecycle?.status === 'stale';
}

export function resolveTeamDnaGenerationLifecycle(
  dataset,
  selectedIds = [],
  statusByTargetId = {}
) {
  const target = getTeamDnaGenerationTarget(dataset, selectedIds);
  const status = statusByTargetId[target.id] ?? getDefaultGenerationStatus(dataset, selectedIds);

  return {
    target,
    status,
    isPrototypeSimulation: true,
  };
}
