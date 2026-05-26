import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { TeamFaceField } from './components/TeamFaceField.jsx';
import { InsightPanel } from './components/InsightPanel.jsx';
import { TeamDnaChatInputBridge } from './components/TeamDnaChatInputBridge.jsx';
import { TeamContextSwitcher } from './components/TeamContextSwitcher.jsx';
import { getInsightForSelection } from './data/teamDnaAdapter.js';
import { useTeamDnaSelection } from './hooks/useTeamDnaSelection.js';

const INTRO_CHROME_REVEAL_MS = 4300;

/**
 * Team DNA feature panel.
 *
 * What: coordinates the two-pane Team DNA surface: face cluster on the left,
 * insight read on the right, and team/person/duo selection between them.
 * How: keeps selection local and ID-based, blocks members without completed
 * assessments from entering insight state, and delegates team management to
 * the route-level overlay so roster mutations stay outside the face field.
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
  onAddTeam,
  onEditTeam,
  onTeamChange,
}) {
  const { selectedIds, setSelectedIds, toggleMember } = useTeamDnaSelection();
  const shouldReduceMotion = useReducedMotion();
  const [hasReleasedIntroGate, setHasReleasedIntroGate] = useState(
    () => Boolean(shouldReduceMotion)
  );
  const [isIntroChromeHidden, setIsIntroChromeHidden] = useState(
    !shouldReduceMotion
  );
  const [blockedAttempt, setBlockedAttempt] = useState(null);
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
  const isIntroGateActive = !hasReleasedIntroGate && !shouldReduceMotion;

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => selectableMemberIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [selectableMemberIds, setSelectedIds]);

  useEffect(() => {
    setSelectedIds([]);
    setBlockedAttempt(null);
  }, [dataset.team.id, setSelectedIds]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setHasReleasedIntroGate(true);
      setIsIntroChromeHidden(false);
      return undefined;
    }

    if (hasReleasedIntroGate) {
      setIsIntroChromeHidden(false);
      return undefined;
    }

    const chromeTimeout = window.setTimeout(() => {
      setIsIntroChromeHidden(false);
    }, INTRO_CHROME_REVEAL_MS);

    return () => {
      window.clearTimeout(chromeTimeout);
    };
  }, [hasReleasedIntroGate, shouldReduceMotion]);

  useEffect(
    () => () => {
      if (blockedTimeoutRef.current) {
        window.clearTimeout(blockedTimeoutRef.current);
      }
    },
    []
  );

  const releaseIntroGate = useCallback(() => {
    setHasReleasedIntroGate(true);
  }, []);

  const handleSelectMember = (memberId, options = {}) => {
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

    releaseIntroGate();

    if (options.mode === 'solo') {
      setSelectedIds([memberId]);
      return;
    }

    toggleMember(memberId);
  };

  const handleSelectTeam = () => {
    setSelectedIds([]);
  };

  const handleEditTeam = () => {
    setSelectedIds([]);
    onEditTeam?.();
  };

  const insight = getInsightForSelection(dataset, selectedIds);
  const questionScope =
    selectedIds.length === 2 ? 'duo' : selectedIds.length === 1 ? 'person' : 'team';

  return (
    <section
      className="team-dna-experience"
      data-intro={isIntroGateActive || undefined}
      data-layout-debug={showLayoutOutlines || undefined}
    >
      <TeamContextSwitcher
        teamOptions={resolvedTeamOptions}
        selectedTeamId={resolvedSelectedTeamId}
        selectedTeamName={dataset.team.name}
        introHidden={isIntroChromeHidden}
        topOffset={teamSwitcherTopOffset}
        onAddTeam={onAddTeam}
        onEditTeam={handleEditTeam}
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
          introActive={isIntroGateActive}
          showIntroHint={isIntroGateActive}
          onSelectMember={handleSelectMember}
          onSelectTeam={handleSelectTeam}
        />
      </div>
      <InsightPanel
        insight={insight}
        isHidden={isIntroGateActive}
        preserveScroll={preserveInsightScroll}
        onSelectMember={handleSelectMember}
      />
      <TeamDnaChatInputBridge
        scope={questionScope}
        isHidden={isIntroGateActive}
      />
    </section>
  );
}
