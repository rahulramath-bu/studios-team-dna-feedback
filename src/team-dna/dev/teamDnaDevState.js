/**
 * Debug scenario state helpers.
 *
 * What: creates local-only debug flags for the standalone route.
 * How: keeps only local debug UI flags here, including the prototype
 * `canManageTeam` permission toggle and `viewerMemberId` auth seam. Roster,
 * avatar availability, and assessment completion are canonical member data
 * owned by TeamDnaPage.
 * Port: do not port this file. Real monolith state should come from API data,
 * feature flags, permissions, and product routing.
 */
export function createInitialDevState(members) {
  return {
    isOpen: false,
    showMonolithShell: true,
    canManageTeam: true,
    viewerMemberId: members[0]?.id ?? null,
    generationStatusByTargetId: {},
    lastGenerationEvent: null,
  };
}
