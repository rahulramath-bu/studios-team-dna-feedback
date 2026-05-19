import { useCallback, useState } from 'react';

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
