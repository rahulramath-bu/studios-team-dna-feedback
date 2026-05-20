import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TeamFaceField } from './components/TeamFaceField.jsx';
import { InsightPanel } from './components/InsightPanel.jsx';
import { getInsightForSelection } from './data/teamDnaAdapter.js';
import { useTeamDnaSelection } from './hooks/useTeamDnaSelection.js';

/**
 * Team DNA feature panel.
 *
 * What: coordinates the two-pane Team DNA surface: face cluster on the left,
 * insight read on the right, and team/person/duo selection between them.
 * How: keeps selection local and ID-based, blocks members without completed
 * assessments from entering insight state, and hides the insight panel during
 * edit mode while route-level handlers perform persistence.
 * Port: this is the main component to mount inside the monolith Team DNA tab.
 * Keep routing, gates, API hooks, analytics, and shell tabs outside of it.
 */
export function TeamDnaExperience({
  dataset,
  onAddMember,
  onBeginTeamEdit,
  onCancelTeamEdit,
  onCommitTeamEdit,
  onRemoveMember,
  onTeamNameChange,
}) {
  const { selectedIds, setSelectedIds, toggleMember } = useTeamDnaSelection();
  const [blockedAttempt, setBlockedAttempt] = useState(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
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
    if (isEditingTeam) return;

    const member = dataset.members.find((item) => item.id === memberId);

    if (member?.assessmentComplete === false) {
      setBlockedAttempt((current) => ({
        memberId,
        attempt: (current?.attempt ?? 0) + 1,
      }));
      if (blockedTimeoutRef.current) {
        window.clearTimeout(blockedTimeoutRef.current);
      }
      blockedTimeoutRef.current = window.setTimeout(() => {
        setBlockedAttempt(null);
        blockedTimeoutRef.current = null;
      }, 1300);
      return;
    }

    toggleMember(memberId);
  };

  const handleStartTeamEdit = () => {
    onBeginTeamEdit?.();
    setSelectedIds([]);
    setIsEditingTeam(true);
  };

  const handleDoneEditing = () => {
    onCommitTeamEdit?.();
    setIsEditingTeam(false);
  };

  const handleCancelEditing = () => {
    onCancelTeamEdit?.();
    setIsEditingTeam(false);
  };

  const insight = getInsightForSelection(dataset, selectedIds);

  return (
    <section
      className="team-dna-experience"
      data-editing={isEditingTeam || undefined}
    >
      <div className="team-dna-people-pane">
        <TeamFaceField
          members={dataset.members}
          selectedIds={selectedIds}
          blockedAttempt={blockedAttempt}
          isEditingTeam={isEditingTeam}
          teamName={dataset.team.name}
          onAddMember={onAddMember}
          onEditTeam={handleStartTeamEdit}
          onCancelEditing={handleCancelEditing}
          onDoneEditing={handleDoneEditing}
          onRemoveMember={onRemoveMember}
          onSelectMember={handleSelectMember}
          onTeamNameChange={onTeamNameChange}
        />
      </div>
      <InsightPanel
        insight={insight}
        isHidden={isEditingTeam}
      />
    </section>
  );
}
