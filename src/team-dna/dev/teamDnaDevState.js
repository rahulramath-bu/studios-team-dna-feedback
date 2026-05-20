export const TEAM_SIZE_PRESETS = [0, 1, 3, 6, 9, 12];

export function createInitialDevState(members) {
  return {
    isOpen: false,
    showMonolithShell: false,
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
