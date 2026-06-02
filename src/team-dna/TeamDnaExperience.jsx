import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { TeamFaceField } from './components/TeamFaceField.jsx';
import { TeamContextSwitcher } from './components/TeamContextSwitcher.jsx';
import { InsightPanel } from './components/InsightPanel.jsx';
import { getInsightForSelection } from './data/teamDnaAdapter.js';
import { useTeamDnaSelection } from './hooks/useTeamDnaSelection.js';

const INTRO_CHROME_REVEAL_MS = 1200;
const PEOPLE_SELECTOR_SCALE_SCROLL_Y = 140;
const GROW_CHAT_BEHAVIOR = 'orchestration';

function canViewMemberProfile(member, currentViewerMemberId) {
  if (!member) return false;
  if (member.id === currentViewerMemberId) return true;
  return member.meta?.profileVisibility !== 'private';
}

function canUseMemberInPair(member) {
  if (!member) return false;
  return member.meta?.pairComparisonVisibility !== 'not_allowed';
}

function makeSelectionBlock(reason, label) {
  return { reason, label };
}

/**
 * Grow Chat handoff payload builder.
 *
 * What: converts the current Team DNA result state into the monolith
 * Lighthouse/Grow Chat initial-message route shape.
 * How: keeps the user's question as `initial_user_message`, adds Team DNA
 * context as `custom_instructions`, and points to the existing
 * `lighthouse.chat` route instead of inventing a local AI request.
 * Port: replace the prototype event consumer with
 * `setLocation('lighthouse.chat', { searchParams: payload.monolith.searchParams })`.
 * ChatRouter will create the conversation, store `LH.initial-user-message`,
 * and MainArea will send it once the socket is ready.
 */
function buildGrowChatPromptPayload({ dataset, insight, message, scope, selectedIds }) {
  const selectedMembers = dataset.members.filter((member) =>
    selectedIds.includes(member.id)
  );
  const contextTitle =
    insight.entityTitle ?? insight.title ?? dataset.team.name ?? 'Team DNA';
  const selectionSummary =
    selectedMembers.length > 0
      ? selectedMembers.map((member) => member.name).join(', ')
      : dataset.team.name;
  const customInstructions = [
    'Use the Team DNA context below when answering.',
    `Team: ${dataset.team.name}`,
    `Current view: ${scope}`,
    `Current selection: ${selectionSummary}`,
    'Keep advice practical, specific, and anchored in how this team can work better together.',
  ].join('\n');

  return {
    initialUserMessage: message,
    scope,
    team: {
      id: dataset.team.id,
      name: dataset.team.name,
    },
    selection: {
      ids: selectedIds,
      names: selectedMembers.map((member) => member.name),
    },
    monolith: {
      route: 'lighthouse.chat',
      searchParams: {
        behavior: GROW_CHAT_BEHAVIOR,
        initial_user_message: message,
        skip_initial_messages: 'true',
        title: `Team DNA: ${contextTitle}`,
        custom_instructions: customInstructions,
      },
    },
  };
}

/**
 * Team DNA feature panel.
 *
 * What: coordinates the two-pane Team DNA surface: face cluster on the left,
 * insight read on the right, and team/person/duo selection between them.
 * How: keeps selection local and ID-based, blocks members without completed
 * assessments from entering insight state, and delegates team management to
 * the route-level overlay so roster mutations stay outside the face field.
 * `canManageTeam` is the prototype permission seam for manager/admin-only
 * controls such as team switching/editing and lifecycle generation actions.
 * `currentViewerMemberId` is the auth/session seam for person-owned actions
 * such as editing your own profile copy.
 * Port: this is the main component to mount inside the monolith Team DNA tab.
 * Keep routing, gates, API hooks, analytics, shell tabs, and the real
 * role/permission lookup outside of it.
 */
export function TeamDnaExperience({
  dataset,
  showLayoutOutlines = false,
  preserveInsightScroll = false,
  initialSelectedIds = [],
  startWithIntroReleased = false,
  teamOptions = [],
  selectedTeamId,
  teamSwitcherTopOffset,
  canManageTeam = true,
  currentViewerMemberId,
  onAddTeam,
  onEditTeam,
  onTeamChange,
  onGrowChatPrompt,
  generationStatusByTargetId,
  onGenerationTargetChange,
  onInsightLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
  onDemoAdvance,
}) {
  const { selectedIds, setSelectedIds, toggleMember } = useTeamDnaSelection();
  const shouldReduceMotion = useReducedMotion();
  const [hasReleasedIntroGate, setHasReleasedIntroGate] = useState(
    () => Boolean(shouldReduceMotion || startWithIntroReleased)
  );
  const [isIntroChromeHidden, setIsIntroChromeHidden] = useState(
    !shouldReduceMotion && !startWithIntroReleased
  );
  const [blockedAttempt, setBlockedAttempt] = useState(null);
  const [isPeopleSelectorScaled, setIsPeopleSelectorScaled] = useState(false);
  const blockedTimeoutRef = useRef(null);
  const initialSelectedIdsKey = initialSelectedIds.join(',');
  const selectableMemberIds = useMemo(
    () =>
      new Set(
        dataset.members
          .filter((member) => member.assessmentComplete !== false)
          .map((member) => member.id)
      ),
    [dataset.members]
  );

  const isIntroGateActive = !hasReleasedIntroGate && !shouldReduceMotion;

  useEffect(() => {
    if (startWithIntroReleased) {
      setHasReleasedIntroGate(true);
      setIsIntroChromeHidden(false);
    }
  }, [startWithIntroReleased]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = current.filter((id) => selectableMemberIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [selectableMemberIds, setSelectedIds]);

  // When nobody on the team has completed their assessment yet, there are no
  // faces to explore, so the cinematic intro gate has nothing to reveal — and
  // worse, the only way to release it (clicking a face) is blocked. Release it
  // automatically so the waiting state and its "Start your assessment" CTA show
  // immediately instead of sitting hidden behind the gate.
  useEffect(() => {
    if (selectableMemberIds.size === 0) {
      setHasReleasedIntroGate(true);
      setIsIntroChromeHidden(false);
    }
  }, [selectableMemberIds]);

  useEffect(() => {
    const nextInitialSelectedIds = initialSelectedIds.filter((id) =>
      selectableMemberIds.has(id)
    );

    setSelectedIds(nextInitialSelectedIds);
    setBlockedAttempt(null);
  }, [
    dataset.team.id,
    initialSelectedIdsKey,
    selectableMemberIds,
    setSelectedIds,
  ]);

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

  useEffect(() => {
    if (isIntroGateActive || typeof window === 'undefined') {
      setIsPeopleSelectorScaled(false);
      return undefined;
    }

    let animationFrame = 0;

    const updateSelectorScale = () => {
      const scrollY = window.scrollY;

      setIsPeopleSelectorScaled(scrollY >= PEOPLE_SELECTOR_SCALE_SCROLL_Y);
      animationFrame = 0;
    };

    const handleScroll = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(updateSelectorScale);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isIntroGateActive]);

  const releaseIntroGate = useCallback(() => {
    setHasReleasedIntroGate(true);
  }, []);

  const handleSelectMember = (memberId, options = {}) => {
    const member = dataset.members.find((item) => item.id === memberId);
    const isDeselecting = selectedIds.includes(memberId);

    if (member?.assessmentComplete === false) {
      setBlockedAttempt((current) => ({
        memberId,
        attempt: (current?.attempt ?? 0) + 1,
        ...makeSelectionBlock('needs_assessment', 'Needs DNA assessment'),
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

    let selectionBlock = null;

    if (!isDeselecting) {
      const isPairAttempt =
        options.mode !== 'solo' && selectedIds.length > 0;

      if (isPairAttempt) {
        const anchorMember = dataset.members.find(
          (item) => item.id === selectedIds[0]
        );

        if (!canUseMemberInPair(anchorMember) || !canUseMemberInPair(member)) {
          selectionBlock = makeSelectionBlock(
            'pairing_not_allowed',
            'Pairing not allowed'
          );
        }
      } else if (!canViewMemberProfile(member, currentViewerMemberId)) {
        selectionBlock = makeSelectionBlock(
          'profile_private',
          'Profile not shared'
        );
      }
    }

    if (selectionBlock) {
      setBlockedAttempt((current) => ({
        memberId,
        attempt: (current?.attempt ?? 0) + 1,
        ...selectionBlock,
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

  const handleEditTeam = (teamId) => {
    setSelectedIds([]);
    onEditTeam?.(teamId);
  };

  const insight = getInsightForSelection(
    dataset,
    selectedIds,
    generationStatusByTargetId
  );
  const generationLifecycle = insight.generationLifecycle;
  const generationTarget = generationLifecycle?.target;

  useEffect(() => {
    onGenerationTargetChange?.(
      generationTarget
        ? {
            ...generationTarget,
            status: generationLifecycle?.status,
          }
        : null
    );
  }, [
    generationTarget?.id,
    generationTarget?.scope,
    generationTarget?.completedCount,
    generationTarget?.totalCount,
    generationTarget?.canGenerateTeam,
    generationTarget?.canGenerateTeamEarly,
    generationLifecycle?.status,
    onGenerationTargetChange,
  ]);

  const questionScope =
    selectedIds.length === 2 ? 'duo' : selectedIds.length === 1 ? 'person' : 'team';

  // Once the viewer has finished but teammates are still pending, the only face
  // worth tapping is the viewer's own — so nudge them to open their profile
  // while they wait. The existing tap-hint cycle already picks among completed
  // members, and the viewer is the only one, so enabling it lands on them.
  const viewerMember = dataset.members.find(
    (member) => member.id === currentViewerMemberId
  );
  const viewerHasCompleted =
    Boolean(viewerMember) && viewerMember.assessmentComplete !== false;
  const teammatesStillPending = dataset.members.some(
    (member) =>
      member.id !== currentViewerMemberId && member.assessmentComplete === false
  );
  const showViewerProfileHint =
    !isIntroGateActive &&
    selectedIds.length === 0 &&
    viewerHasCompleted &&
    teammatesStillPending;

  // Settled team view: everyone is in and nothing is selected, so gently invite
  // tapping a teammate's face to open their profile.
  const otherCompleteMembersExist = dataset.members.some(
    (member) =>
      member.id !== currentViewerMemberId && member.assessmentComplete !== false
  );
  const showTeamExploreHint =
    !isIntroGateActive &&
    selectedIds.length === 0 &&
    !showViewerProfileHint &&
    viewerHasCompleted &&
    !teammatesStillPending &&
    otherCompleteMembersExist;

  // One profile open and at least one other teammate to compare against: pulse
  // the other faces so the second-tap-to-compare interaction is discoverable.
  const completeMemberCount = dataset.members.filter(
    (member) => member.assessmentComplete !== false
  ).length;
  const showCompareHint =
    !isIntroGateActive && selectedIds.length === 1 && completeMemberCount > 1;
  const handleGrowChatPromptSubmit = ({ message, scope, submittedAt }) => {
    onGrowChatPrompt?.({
      type: 'growChatInitialPromptRequested',
      payload: buildGrowChatPromptPayload({
        dataset,
        insight,
        message,
        scope,
        selectedIds,
      }),
      timestamp: submittedAt,
    });
  };
  // Per-section AI coach CTAs hand off the current view's context with a
  // pre-selected starter prompt, replacing the floating ask box.
  const handleCoachPrompt = (message) => {
    if (!message) return;
    handleGrowChatPromptSubmit({
      message,
      scope: questionScope,
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <section
      className="team-dna-experience"
      data-intro={isIntroGateActive || undefined}
      data-layout-debug={showLayoutOutlines || undefined}
      data-people-selector={isPeopleSelectorScaled ? 'scaled' : undefined}
    >
      <TeamContextSwitcher
        teamOptions={teamOptions.length > 0 ? teamOptions : [dataset.team]}
        selectedTeamId={selectedTeamId ?? dataset.team.id}
        selectedTeamName={dataset.team.name}
        introHidden={isIntroChromeHidden}
        topOffset={teamSwitcherTopOffset}
        onAddTeam={canManageTeam ? onAddTeam : undefined}
        onEditTeam={canManageTeam ? handleEditTeam : undefined}
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
          hideConnections={isPeopleSelectorScaled}
          introActive={isIntroGateActive}
          showIntroHint={isIntroGateActive}
          showViewerProfileHint={showViewerProfileHint}
          showTeamExploreHint={showTeamExploreHint}
          showCompareHint={showCompareHint}
          currentViewerMemberId={currentViewerMemberId}
          canPreviewDuoMember={(memberId) => {
            const member = dataset.members.find((item) => item.id === memberId);
            const anchorMember = dataset.members.find(
              (item) => item.id === selectedIds[0]
            );
            return canUseMemberInPair(anchorMember) && canUseMemberInPair(member);
          }}
          onSelectMember={handleSelectMember}
          onSelectTeam={handleSelectTeam}
        />
      </div>
      <InsightPanel
        insight={insight}
        isHidden={isIntroGateActive}
        preserveScroll={preserveInsightScroll}
        resetScrollTop={
          isPeopleSelectorScaled ? PEOPLE_SELECTOR_SCALE_SCROLL_Y : 0
        }
        canManageTeam={canManageTeam}
        currentViewerMemberId={currentViewerMemberId}
        members={dataset.members}
        teamName={dataset.team?.name}
        coachScope={questionScope}
        onSelectMember={handleSelectMember}
        onCoachPrompt={handleCoachPrompt}
        onLifecycleAction={onInsightLifecycleAction}
        onProfileCopySave={onProfileCopySave}
        onStartAssessment={onStartAssessment}
        onDemoAdvance={onDemoAdvance}
      />
    </section>
  );
}
