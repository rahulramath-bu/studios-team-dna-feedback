import { useCallback, useState } from 'react';

/**
 * Team/person/duo selection state.
 *
 * What: keeps the current Team DNA read scope as zero, one, or two member IDs.
 * How: an empty array means team view, one ID means individual view, and two
 * IDs means duo view. When already paired, choosing another member preserves the
 * first selected person and replaces only the second.
 * Port: keep this state ID-based so it remains independent of backend response
 * shape, member ordering, and future View 2/mobile layouts.
 */
export function useTeamDnaSelection() {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleMember = useCallback((memberId) => {
    setSelectedIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }

      if (current.length === 0) {
        return [memberId];
      }

      if (current.length === 1) {
        return [current[0], memberId];
      }

      // Keep duo selection predictable: the first selected person stays anchored,
      // and choosing another member replaces only the second side of the pair.
      return [current[0], memberId];
    });
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    toggleMember,
  };
}
