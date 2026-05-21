/**
 * Debug scenario state helpers.
 *
 * What: lets the standalone dev panel simulate different team sizes, missing
 * avatars, incomplete assessments, and monolith-shell preview state.
 * How: overlays debug choices on top of the fixture dataset without changing
 * the underlying sample data.
 * Port: do not port this file. Real monolith state should come from API data,
 * feature flags, permissions, and product routing.
 */
export const TEAM_SIZE_PRESETS = [0, 1, 3, 6, 9, 12];

export function createInitialDevState(members) {
  return {
    isOpen: false,
    showMonolithShell: true,
    preserveInsightScroll: false,
    teamSize: members.length,
    memberStates: Object.fromEntries(
      members.map((member) => [
        member.id,
        {
          hasAvatar: Boolean(member.avatarUrl),
          assessmentComplete: member.assessmentComplete !== false,
        },
      ])
    ),
  };
}

export function applyTeamDnaDevState(dataset, devState) {
  const visibleMembers = dataset.members.slice(0, devState.teamSize).map((member) => {
    const state = devState.memberStates[member.id] ?? {};
    const hasAvatar = state.hasAvatar ?? Boolean(member.avatarUrl);

    return {
      ...member,
      avatarUrl: hasAvatar ? member.avatarUrl : '',
      hasAvatar,
      assessmentComplete: state.assessmentComplete ?? member.assessmentComplete !== false,
    };
  });

  return {
    ...dataset,
    members: visibleMembers,
  };
}
