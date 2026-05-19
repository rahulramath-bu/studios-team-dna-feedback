import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TeamFaceField } from './components/TeamFaceField.jsx';
import { InsightPanel } from './components/InsightPanel.jsx';
import { getInsightForSelection } from './data/teamDnaAdapter.js';
import { useTeamDnaSelection } from './hooks/useTeamDnaSelection.js';

export function TeamDnaExperience({ dataset }) {
  const { selectedIds, setSelectedIds, toggleMember } = useTeamDnaSelection();
  const [blockedMemberId, setBlockedMemberId] = useState(null);
  const blockedTimeoutRef = useRef(null);
  const selectableMemberIds = useMemo(
    () =>
      new Set(
        dataset.members
          .filter((member) => member.assessmentComplete !== false)
          .map((member) => member.id)
      ),
    [dataset.members]
  );

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => selectableMemberIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [selectableMemberIds, setSelectedIds]);

  useEffect(
    () => () => {
      if (blockedTimeoutRef.current) {
        window.clearTimeout(blockedTimeoutRef.current);
      }
    },
    []
  );

  const handleSelectMember = (memberId) => {
    const member = dataset.members.find((item) => item.id === memberId);

    if (member?.assessmentComplete === false) {
      setBlockedMemberId(memberId);
      if (blockedTimeoutRef.current) {
        window.clearTimeout(blockedTimeoutRef.current);
      }
      blockedTimeoutRef.current = window.setTimeout(() => {
        setBlockedMemberId(null);
        blockedTimeoutRef.current = null;
      }, 1300);
      return;
    }

    toggleMember(memberId);
  };

  // Monolith integration tip: keep this component as the panel-level owner only.
  // The future Team tab/subtab shell should own routing, gates, nav, and analytics.
  const insight = getInsightForSelection(dataset, selectedIds);

  return (
    <section className="team-dna-experience">
      <div className="team-dna-people-pane">
        <TeamFaceField
          members={dataset.members}
          selectedIds={selectedIds}
          blockedMemberId={blockedMemberId}
          onSelectMember={handleSelectMember}
        />
      </div>
      <InsightPanel insight={insight} selectionCount={selectedIds.length} />
    </section>
  );
}
