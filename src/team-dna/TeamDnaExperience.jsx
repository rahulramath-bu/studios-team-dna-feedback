import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { TeamFaceField } from './components/TeamFaceField.jsx';
import { InsightPanel } from './components/InsightPanel.jsx';
import { TeamDnaChatInputBridge } from './components/TeamDnaChatInputBridge.jsx';
import { TeamContextSwitcher } from './components/TeamContextSwitcher.jsx';
import { getInsightForSelection } from './data/teamDnaAdapter.js';
import { useTeamDnaSelection } from './hooks/useTeamDnaSelection.js';

const INTRO_LAYOUT_RELEASE_MS = 2350;
const INTRO_INSIGHT_REVEAL_MS = 2850;
const INTRO_CHROME_REVEAL_MS = 4300;

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
  showLayoutOutlines = false,
  preserveInsightScroll = false,
  teamOptions = [],
  selectedTeamId,
  teamSwitcherTopOffset,
  onTeamChange,
  onAddMember,
  onBeginTeamEdit,
  onCancelTeamEdit,
  onCommitTeamEdit,
  onRemoveMember,
  onTeamNameChange,
}) {
  const { selectedIds, setSelectedIds, toggleMember } = useTeamDnaSelection();
  const shouldReduceMotion = useReducedMotion();
  const [isIntroLayoutActive, setIsIntroLayoutActive] = useState(
    !shouldReduceMotion
  );
  const [isIntroInsightHidden, setIsIntroInsightHidden] = useState(
    !shouldReduceMotion
  );
  const [isIntroChromeHidden, setIsIntroChromeHidden] = useState(
    !shouldReduceMotion
  );
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

  const resolvedTeamOptions =
    teamOptions.length > 0 ? teamOptions : [dataset.team];
  const resolvedSelectedTeamId = selectedTeamId ?? dataset.team.id;

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => selectableMemberIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [selectableMemberIds, setSelectedIds]);

  useEffect(() => {
    setSelectedIds([]);
    setBlockedAttempt(null);
    setIsEditingTeam(false);
  }, [dataset.team.id, setSelectedIds]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsIntroLayoutActive(false);
      setIsIntroInsightHidden(false);
      setIsIntroChromeHidden(false);
      return undefined;
    }

    const layoutTimeout = window.setTimeout(() => {
      setIsIntroLayoutActive(false);
    }, INTRO_LAYOUT_RELEASE_MS);
    const insightTimeout = window.setTimeout(() => {
      setIsIntroInsightHidden(false);
    }, INTRO_INSIGHT_REVEAL_MS);
    const chromeTimeout = window.setTimeout(() => {
      setIsIntroChromeHidden(false);
    }, INTRO_CHROME_REVEAL_MS);

    return () => {
      window.clearTimeout(layoutTimeout);
      window.clearTimeout(insightTimeout);
      window.clearTimeout(chromeTimeout);
    };
  }, [shouldReduceMotion]);

  useEffect(
    () => () => {
      if (blockedTimeoutRef.current) {
        window.clearTimeout(blockedTimeoutRef.current);
      }
    },
    []
  );

  const handleSelectMember = (memberId, options = {}) => {
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

    if (options.mode === 'solo') {
      setSelectedIds([memberId]);
      return;
    }

    toggleMember(memberId);
  };

  const handleSelectTeam = () => {
    if (isEditingTeam) return;
    setSelectedIds([]);
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
  const questionScope =
    selectedIds.length === 2 ? 'duo' : selectedIds.length === 1 ? 'person' : 'team';

  return (
    <section
      className="team-dna-experience"
      data-editing={isEditingTeam || undefined}
      data-intro={isIntroLayoutActive || undefined}
      data-layout-debug={showLayoutOutlines || undefined}
    >
      <TeamContextSwitcher
        teamOptions={resolvedTeamOptions}
        selectedTeamId={resolvedSelectedTeamId}
        selectedTeamName={dataset.team.name}
        disabled={isEditingTeam}
        introHidden={isIntroChromeHidden}
        topOffset={teamSwitcherTopOffset}
        onEditTeam={handleStartTeamEdit}
        onTeamChange={onTeamChange}
      />
      <div className="team-dna-people-pane">
        <TeamFaceField
          teamId={dataset.team.id}
          members={dataset.members}
          selectedIds={selectedIds}
          blockedAttempt={blockedAttempt}
          entityEyebrow={insight.entityEyebrow ?? insight.eyebrow}
          entityTitle={insight.entityTitle ?? insight.title}
          introActive={isIntroLayoutActive}
          isEditingTeam={isEditingTeam}
          teamName={dataset.team.name}
          onAddMember={onAddMember}
          onCancelEditing={handleCancelEditing}
          onDoneEditing={handleDoneEditing}
          onRemoveMember={onRemoveMember}
          onSelectMember={handleSelectMember}
          onSelectTeam={handleSelectTeam}
          onTeamNameChange={onTeamNameChange}
        />
      </div>
      <InsightPanel
        insight={insight}
        isHidden={isEditingTeam || isIntroInsightHidden}
        preserveScroll={preserveInsightScroll}
        onSelectMember={handleSelectMember}
      />
      <TeamDnaChatInputBridge
        scope={questionScope}
        isHidden={isEditingTeam || isIntroInsightHidden}
      />
    </section>
  );
}
