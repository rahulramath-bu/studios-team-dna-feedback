/**
 * Debug scenario state helpers.
 *
 * What: creates local-only debug flags for the standalone route.
 * How: keeps only local debug UI flags here. Roster, avatar availability, and
 * assessment completion are canonical member data owned by TeamDnaPage.
 * Port: do not port this file. Real monolith state should come from API data,
 * feature flags, permissions, and product routing.
 */
export const TEAM_SIZE_PRESETS = [0, 1, 3, 6, 9, 12];

export function createInitialDevState(members) {
  return {
    isOpen: false,
    showMonolithShell: true,
    preserveInsightScroll: false,
    generationStatusByTargetId: {},
    lastGenerationEvent: null,
  };
}
