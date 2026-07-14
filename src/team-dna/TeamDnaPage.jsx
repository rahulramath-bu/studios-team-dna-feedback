import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { TeamDnaExperience } from './TeamDnaExperience.jsx';
import { BetterUpIcon } from './components/BetterUpIcon.jsx';
import { TeamDnaEmptyPreview } from './components/TeamDnaEmptyPreview.jsx';
import { TeamManagementOverlay } from './components/TeamManagementOverlay.jsx';
import { AssessmentOverlay } from './components/AssessmentOverlay.jsx';
import { AssessmentResultsOverlay } from './components/AssessmentResultsOverlay.jsx';
import { CoachOnboardingOverlay } from './components/CoachOnboardingOverlay.jsx';
import { getInsightForSelection } from './data/teamDnaAdapter.js';
import { TeamSurfacePanel } from './components/TeamSurfacePanel.jsx';
import {
  buildTeamDnaDatasetFromTeamRecord,
  CURRENT_MANAGER_EMPLOYEE_ID,
  makeFallbackBigFive,
  mockOrganizationEmployees,
  mockTeamDnaResultsByEmployeeId,
  mockTeamRecords,
  normalizeTeamRecord,
  sampleTeamRecord,
} from './data/teamManagementMock.js';
import { MonolithTeamShell } from './dev/MonolithTeamShell.jsx';
import { TeamDnaDevPanel } from './dev/TeamDnaDevPanel.jsx';
import { createInitialDevState } from './dev/teamDnaDevState.js';

const EMPTY_TEAM_DATASET = {
  team: { id: 'empty-state', name: 'Empty state' },
  members: [],
  insights: {
    team: undefined,
    people: {},
    pairs: {},
  },
};

const FAKE_ASSESSMENT_REMINDER_LATENCY_MS = 650;
// How long the demo lingers on the generating screen before resolving to ready.
const DEMO_GENERATION_MS = 2800;
const DEMO_INVITED_EMAIL = 'new.teammate@betterup.co';

const DEMO_SETUP_TEAM_RECORD = {
  id: null,
  name: 'Product team',
  teamType: 'Cross-functional',
  memberEmployeeIds: ['sergio', 'justin'],
  invitedEmails: [DEMO_INVITED_EMAIL],
  sample: false,
};

// Prototype-only fixtures backing the "manager has N teams" landing scenarios
// the demo state switcher exposes. They reuse the sample roster so every member
// already has Team DNA results, and overlap is fine for a visual demo.
const DEMO_MANAGER_TEAMS = [
  {
    id: 'demo-manager-product',
    name: 'Product team',
    teamType: 'Direct reports',
    memberEmployeeIds: sampleTeamRecord.memberEmployeeIds.slice(0, 5),
    invitedEmails: [],
    sample: false,
  },
  {
    id: 'demo-manager-platform',
    name: 'Platform team',
    teamType: 'Cross-functional',
    memberEmployeeIds: sampleTeamRecord.memberEmployeeIds.slice(2),
    invitedEmails: [],
    sample: false,
  },
];

const LANDING_SCENARIOS = [
  { id: 'none', label: 'No team' },
  { id: 'single', label: '1 team' },
  { id: 'multi', label: '2 teams' },
];

function getLandingScenarioForCount(count) {
  if (count <= 0) return 'none';
  if (count === 1) return 'single';
  return 'multi';
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function getGuidanceCardSections(card) {
  return card?.data?.guidance?.sections ?? [];
}

function getPersonCardBySuffix(insight, suffix) {
  return insight?.cards?.find((card) => card.id.endsWith(suffix));
}

// Prototype-only stand-in for the production profile-copy override read model.
// The important seam is that edited copy is merged before TeamDnaExperience
// renders, so visual cards still consume the normal TeamDnaInsight shape.
function applyProfileCopyEdits(dataset, profileCopyEditsByMemberId) {
  const entries = Object.entries(profileCopyEditsByMemberId);

  if (entries.length === 0) {
    return dataset;
  }

  const people = { ...(dataset.insights.people ?? {}) };

  entries.forEach(([memberId, edit]) => {
    const baseInsight = people[memberId];

    if (!baseInsight) return;

    const nextCards = (baseInsight.cards ?? []).map((card) => {
      if (card.id.endsWith('-work-with') && edit.workWithSections?.length) {
        return {
          ...card,
          label: 'How to work with me',
          data: {
            guidance: {
              sections: edit.workWithSections.map((body) => ({ body })),
            },
          },
        };
      }

      if (card.id.endsWith('-where-shines') && edit.whereShines) {
        return {
          ...card,
          label: 'Where I shine',
          data: {
            guidance: {
              sections: [{ body: edit.whereShines }],
            },
          },
        };
      }

      if (card.kind === 'watchOut' && edit.watchOutSections?.length) {
        const currentItems = card.data?.watchOut?.items ?? [];

        return {
          ...card,
          data: {
            watchOut: {
              items: edit.watchOutSections.map((body, index) => ({
                ...(currentItems[index] ?? {
                  traitKey: `viewer-edit-${index}`,
                  type: 'viewer-edit',
                  title: index === 0 ? 'Look out for' : `Look out for ${index + 1}`,
                }),
                body,
                tip: '',
              })),
            },
          },
        };
      }

      return card;
    });

    people[memberId] = {
      ...baseInsight,
      source: 'override',
      summary: edit.overview ? [{ text: edit.overview }] : baseInsight.summary,
      meetingBehavior: edit.meetingBehaviorSections?.length
        ? {
            items: edit.meetingBehaviorSections.map((body, index) => ({
              traitKey: `viewer-edit-meeting-${index}`,
              type: 'viewer-edit',
              title: index === 0 ? 'In meetings' : `In meetings ${index + 1}`,
              body,
            })),
          }
        : baseInsight.meetingBehavior,
      cards: nextCards,
      meta: {
        ...(baseInsight.meta ?? {}),
        profileCopyEditedByViewer: true,
      },
    };
  });

  return {
    ...dataset,
    insights: {
      ...dataset.insights,
      people,
    },
  };
}

function applyMemberPrivacyOverrides(dataset, memberPrivacyById = {}) {
  const entries = Object.entries(memberPrivacyById);

  if (entries.length === 0) {
    return dataset;
  }

  return {
    ...dataset,
    members: dataset.members.map((member) => {
      const override = memberPrivacyById[member.id];
      if (!override) return member;

      return {
        ...member,
        meta: {
          ...(member.meta ?? {}),
          profileVisibility: override.profileVisibility ?? 'teams',
          pairComparisonVisibility:
            override.pairComparisonVisibility ?? 'teams',
        },
      };
    }),
  };
}

function makeTeamRecordId(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'team';

  return `${slug}-${Date.now()}`;
}

function getDatasetForTeamRecord(
  teamRecord,
  organizationEmployees,
  teamDnaResultsByEmployeeId
) {
  return buildTeamDnaDatasetFromTeamRecord(teamRecord, {
    organizationEmployees,
    teamDnaResultsByEmployeeId,
  });
}

function createTeamRecordState(
  teamRecord,
  organizationEmployees,
  teamDnaResultsByEmployeeId
) {
  const dataset = getDatasetForTeamRecord(
    teamRecord,
    organizationEmployees,
    teamDnaResultsByEmployeeId
  );

  return {
    teamRecord: cloneState(teamRecord),
    devState: createInitialDevState(dataset.members),
  };
}

function getResizedTeamRecord(teamRecord, teamSize, organizationEmployees) {
  const currentItems = [
    ...teamRecord.memberEmployeeIds.map((employeeId) => ({
      type: 'employee',
      value: employeeId,
    })),
    ...teamRecord.invitedEmails.map((email) => ({
      type: 'invite',
      value: email,
    })),
  ];
  const nextItems = currentItems.slice(0, teamSize);
  const nextEmployeeIds = new Set(
    nextItems
      .filter((item) => item.type === 'employee')
      .map((item) => item.value)
  );
  const availableEmployeeIds = organizationEmployees
    .map((employee) => employee.id)
    .filter((employeeId) => !nextEmployeeIds.has(employeeId));

  while (nextItems.length < teamSize) {
    const employeeId = availableEmployeeIds.shift();

    if (employeeId) {
      nextItems.push({ type: 'employee', value: employeeId });
      nextEmployeeIds.add(employeeId);
    } else {
      nextItems.push({
        type: 'invite',
        value: `new-teammate-${nextItems.length + 1}@example.com`,
      });
    }
  }

  return normalizeTeamRecord({
    ...teamRecord,
    memberEmployeeIds: nextItems
      .filter((item) => item.type === 'employee')
      .map((item) => item.value),
    invitedEmails: nextItems
      .filter((item) => item.type === 'invite')
      .map((item) => item.value),
  });
}

function readTeamDnaDemoConfig() {
  if (typeof window === 'undefined') {
    return { enabled: false, selectedMemberIds: [] };
  }

  const params = new URLSearchParams(window.location.search);
  const demoMode = params.get('demo') ?? '';
  const selectedMemberIds =
    params
      .get('members')
      ?.split(',')
      .map((memberId) => memberId.trim())
      .filter(Boolean) ?? [];

  return {
    enabled: Boolean(demoMode),
    mode: demoMode,
    selectedMemberIds,
  };
}

function getInitialTeamRecordsForDemo(demoConfig) {
  if (!demoConfig.enabled) return mockTeamRecords;
  if (
    ['empty', 'add-team', 'add-team-search', 'add-team-selected'].includes(
      demoConfig.mode
    )
  ) {
    return [];
  }

  return [sampleTeamRecord];
}

function getCompletedMemberIdsForDemo(demoConfig) {
  if (demoConfig.mode === 'waiting') {
    return new Set(sampleTeamRecord.memberEmployeeIds.slice(0, 2));
  }

  if (['mixed-roster', 'reminder-sent', 'enough-to-generate'].includes(demoConfig.mode)) {
    return new Set(sampleTeamRecord.memberEmployeeIds.slice(0, 3));
  }

  return null;
}

function getInitialTeamDnaResultsForDemo(demoConfig) {
  const results = cloneState(mockTeamDnaResultsByEmployeeId);
  const completedMemberIds = getCompletedMemberIdsForDemo(demoConfig);

  if (demoConfig.enabled && completedMemberIds) {
    sampleTeamRecord.memberEmployeeIds.forEach((memberId) => {
      if (!results[memberId]) return;

      results[memberId] = {
        ...results[memberId],
        assessmentComplete: completedMemberIds.has(memberId),
      };
    });
  }

  return results;
}

function applyDemoRecordState(recordState, demoConfig) {
  if (!demoConfig.enabled || demoConfig.mode !== 'generating') {
    return recordState;
  }

  return {
    ...recordState,
    devState: {
      ...recordState.devState,
      generationStatusByTargetId: {
        ...(recordState.devState.generationStatusByTargetId ?? {}),
        [`team:${sampleTeamRecord.id}`]: 'pending',
      },
    },
  };
}

function getInitialTeamManagementOverlayForDemo(demoConfig) {
  if (!demoConfig.enabled) return null;

  if (demoConfig.mode === 'add-team') {
    return {
      mode: 'create',
          teamRecord: {
            id: null,
            name: 'Product team',
            teamType: 'Cross-functional',
            memberEmployeeIds: [],
            invitedEmails: [],
            sample: false,
      },
    };
  }

  if (demoConfig.mode === 'add-team-search') {
    return {
      mode: 'create',
          teamRecord: {
            id: null,
            name: 'Product team',
            teamType: 'Cross-functional',
            memberEmployeeIds: [],
            invitedEmails: [],
            sample: false,
      },
      initialDemoState: {
        isAddingTeammate: true,
        query: 'sergio',
      },
    };
  }

  if (demoConfig.mode === 'add-team-selected') {
    return {
      mode: 'create',
      teamRecord: DEMO_SETUP_TEAM_RECORD,
    };
  }

  if (demoConfig.mode === 'mixed-roster') {
    return {
      mode: 'edit',
      teamId: sampleTeamRecord.id,
    };
  }

  if (demoConfig.mode === 'reminder-sent') {
    return {
      mode: 'edit',
      teamId: sampleTeamRecord.id,
      initialDemoState: {
        reminderStatuses: {
          [`employee:${sampleTeamRecord.memberEmployeeIds[3]}`]: 'sent',
        },
      },
    };
  }

  return null;
}

/**
 * Standalone prototype page.
 *
 * What: local route harness for the Team DNA experience.
 * How: owns three separate in-memory sources: monolith-shaped organization
 * employees, temporary team records, and Team DNA assessment/results records.
 * A mapper combines those into `TeamDnaDataset` for the current UI.
 * Port: replace this with a monolith route/page that owns BrowserTitle,
 * analytics, loading/error states, generated API hooks, real team mutations,
 * and the data mapper. The portable feature is TeamDnaExperience.
 */
export function TeamDnaPage() {
  const demoConfig = useMemo(readTeamDnaDemoConfig, []);

  // When this page runs inside the demo viewer iframe, report which demo surface
  // it landed on so the demo control panel can follow along — e.g. after the
  // assessment's "Save and continue" CTA navigates straight to the team read.
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;
    if (!demoConfig.enabled) return;
    window.parent.postMessage(
      {
        type: 'team-dna-demo-progress',
        demo: demoConfig.mode,
      },
      '*'
    );
  }, [demoConfig.enabled, demoConfig.mode]);

  const initialTeamRecords = useMemo(
    () => getInitialTeamRecordsForDemo(demoConfig),
    [demoConfig.enabled, demoConfig.mode]
  );
  const initialTeamDnaResults = useMemo(
    () => getInitialTeamDnaResultsForDemo(demoConfig),
    [demoConfig.enabled, demoConfig.mode]
  );
  const initialTeamManagementOverlay = useMemo(
    () => getInitialTeamManagementOverlayForDemo(demoConfig),
    [demoConfig.enabled, demoConfig.mode]
  );
  const [organizationEmployees, setOrganizationEmployees] = useState(() =>
    cloneState(mockOrganizationEmployees)
  );
  const [teamDnaResultsByEmployeeId, setTeamDnaResultsByEmployeeId] = useState(
    () => initialTeamDnaResults
  );
  const [teamRecords, setTeamRecords] = useState(() =>
    Object.fromEntries(
      initialTeamRecords.map((teamRecord) => {
        const recordState = createTeamRecordState(
          teamRecord,
          mockOrganizationEmployees,
          initialTeamDnaResults
        );

        return [
          teamRecord.id,
          applyDemoRecordState(recordState, demoConfig),
        ];
      })
    )
  );
  const [activeTeamId, setActiveTeamId] = useState(() => {
    if (demoConfig.enabled) {
      return ['empty', 'add-team', 'add-team-search', 'add-team-selected'].includes(
        demoConfig.mode
      )
        ? null
        : sampleTeamRecord.id;
    }

    const firstRealTeam = mockTeamRecords.find(
      (teamRecord) => !teamRecord.sample && teamRecord.memberEmployeeIds.length > 0
    );

    return firstRealTeam?.id ?? null;
  });
  const [teamManagementOverlay, setTeamManagementOverlay] = useState(
    () => initialTeamManagementOverlay
  );
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const creatingTeamTimerRef = useRef(null);
  const [activeGenerationTarget, setActiveGenerationTarget] = useState(null);
  const demoGenerationTimerRef = useRef(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isSelfResultsOpen, setIsSelfResultsOpen] = useState(false);
  // GROW AI coach onboarding stand-in. Opened when the per-section coach CTA is
  // triggered from a single-person profile so the demo visibly moves into the
  // coach with a "setup needed" moment. Holds the subject name for personalized
  // copy.
  const [coachOnboarding, setCoachOnboarding] = useState(null);
  const [activeSurface, setActiveSurface] = useState(null);
  const [profileCopyEditsByMemberId, setProfileCopyEditsByMemberId] = useState(
    {}
  );
  const [emptyDevState, setEmptyDevState] = useState(() =>
    createInitialDevState(EMPTY_TEAM_DATASET.members)
  );
  // Demo-only: which direct-report CTA treatment to preview on the hub.
  const [ctaLayout, setCtaLayout] = useState('split');
  const activeRecord = activeTeamId ? teamRecords[activeTeamId] : null;
  const activeDataset = useMemo(() => {
    if (!activeRecord) return null;

    const baseDataset = getDatasetForTeamRecord(
      activeRecord.teamRecord,
      organizationEmployees,
      teamDnaResultsByEmployeeId
    );
    const privacyDataset = applyMemberPrivacyOverrides(
      baseDataset,
      activeRecord.devState.memberPrivacyById
    );

    return applyProfileCopyEdits(privacyDataset, profileCopyEditsByMemberId);
  }, [
    activeRecord,
    organizationEmployees,
    teamDnaResultsByEmployeeId,
    profileCopyEditsByMemberId,
  ]);
  const visibleRecord = activeRecord
    ? {
        dataset: activeDataset,
        devState: activeRecord.devState,
      }
    : {
        dataset: EMPTY_TEAM_DATASET,
        devState: emptyDevState,
      };
  // Empty state is intentionally data-shaped: the selected canonical team must
  // have members. Sample teams do not get a special bypass; clicking the sample
  // CTA simply reseeds Sample Team as a normal team record and selects it.
  const isTrueEmptyState =
    !activeRecord || visibleRecord.dataset.members.length === 0;
  const editableTeamDna = visibleRecord.dataset;
  const devState = visibleRecord.devState;
  const canManageTeam = devState.canManageTeam !== false;
  const currentViewerMemberId =
    editableTeamDna.members.some((member) => member.id === devState.viewerMemberId)
      ? devState.viewerMemberId
      : editableTeamDna.members[0]?.id ?? null;
  const generationStatusByTargetId = devState.generationStatusByTargetId ?? {};
  const scenarioDataset = editableTeamDna;
  // Viewer's own profile read for the post-assessment results page. Built the
  // same way the team panel builds a person read, but forced to "ready" and with
  // the archetype image dropped so it matches the single-profile review page.
  const selfResultsInsight = useMemo(() => {
    if (!isSelfResultsOpen || !currentViewerMemberId) return null;

    const base = getInsightForSelection(
      editableTeamDna,
      [currentViewerMemberId],
      {
        ...generationStatusByTargetId,
        [`person:${currentViewerMemberId}`]: 'ready',
      }
    );

    return {
      ...base,
      cards: (base.cards ?? []).filter(
        (card) => card.kind !== 'archetypeImage'
      ),
    };
  }, [
    isSelfResultsOpen,
    currentViewerMemberId,
    editableTeamDna,
    generationStatusByTargetId,
  ]);
  const teamOptions = useMemo(() => {
    const employeeById = new Map(
      organizationEmployees.map((employee) => [employee.id, employee])
    );

    return Object.values(teamRecords).map(({ teamRecord }) => {
      const members = teamRecord.memberEmployeeIds
        .map((employeeId) => {
          const employee = employeeById.get(employeeId);
          if (!employee) return null;

          return {
            id: employee.id,
            name:
              [employee.firstName, employee.lastName].filter(Boolean).join(' ') ||
              employee.email ||
              employee.id,
            avatarUrl: employee.avatar || null,
          };
        })
        .filter(Boolean);

      return {
        id: teamRecord.id,
        name: teamRecord.name,
        teamType: teamRecord.teamType,
        memberCount:
          teamRecord.memberEmployeeIds.length + teamRecord.invitedEmails.length,
        members,
        sample: teamRecord.sample,
      };
    });
  }, [teamRecords, organizationEmployees]);
  const overlayTeamRecord =
    teamManagementOverlay?.mode === 'edit' && teamManagementOverlay.teamId
      ? teamRecords[teamManagementOverlay.teamId]?.teamRecord
      : teamManagementOverlay?.teamRecord ?? null;

  const updateActiveRecord = (updater) => {
    setTeamRecords((current) => {
      const targetTeamId = activeTeamId;
      const record = current[targetTeamId];
      if (!record) return current;

      return {
        ...current,
        [targetTeamId]: updater(record),
      };
    });
  };

  const updateActiveDevState = (updater) => {
    if (!activeRecord) {
      setEmptyDevState((current) =>
        typeof updater === 'function' ? updater(current) : updater
      );
      return;
    }

    updateActiveRecord((record) => ({
      ...record,
      devState:
        typeof updater === 'function' ? updater(record.devState) : updater,
    }));
  };

  const openCreateTeam = () => {
    if (!canManageTeam) return;
    setTeamManagementOverlay({ mode: 'create' });
  };

  const openEditTeam = (teamId = activeTeamId) => {
    if (!canManageTeam) return;

    if (!teamId) {
      openCreateTeam();
      return;
    }

    setTeamManagementOverlay({ mode: 'edit', teamId });
  };

  const closeTeamManagement = () => {
    setTeamManagementOverlay(null);
  };

  const handleTeamManagementAction = (action) => {
    // Prototype-only action seam. In the monolith, replace this with real
    // reminder mutations, analytics, and product feedback. Returning a promise
    // keeps the UI shaped like a real async mutation: pending first, then sent
    // only after success.
    if (import.meta.env.DEV) {
      console.info('[Team DNA team management action]', action);
    }

    if (action.type === 'assessmentReminderRequested') {
      return new Promise((resolve) => {
        window.setTimeout(resolve, FAKE_ASSESSMENT_REMINDER_LATENCY_MS);
      });
    }

    return Promise.resolve();
  };

  const handleGrowChatPrompt = (action) => {
    // What: hands the section's context off to the AI Coaching page.
    // How: mirrors monolith ChatRouter's `LH.initial-user-message` pattern —
    // the message + Team DNA custom instructions are stashed in sessionStorage
    // and the coaching page sends them when it mounts.
    // Port: replace with `setLocation('lighthouse.chat', { searchParams:
    // action.payload.monolith.searchParams })`; ChatRouter creates the
    // conversation and MainArea sends the message once the socket is ready.
    window.dispatchEvent(new CustomEvent('team-dna:grow-chat-prompt', {
      detail: action,
    }));

    if (import.meta.env.DEV) {
      console.info('[Team DNA Grow Chat prompt]', action);
    }

    const params = action?.payload?.monolith?.searchParams;
    if (!params?.initial_user_message) return;

    try {
      window.sessionStorage.setItem(
        'ai-coaching.handoff',
        JSON.stringify({
          message: params.initial_user_message,
          instructions: params.custom_instructions,
          title: params.title,
        })
      );
    } catch {
      // Storage unavailable (e.g. sandboxed iframe): fall through and let the
      // coaching page open without the pre-seeded prompt.
    }

    // The demo flow renders Team DNA inside an iframe; break out to the top
    // window so the coaching page takes over the full tab.
    const destination = '/ai-coaching';
    try {
      if (window.top && window.top !== window) {
        window.top.location.href = destination;
        return;
      }
    } catch {
      // Cross-origin top frame: fall back to navigating this frame.
    }
    window.location.href = destination;

    // When the coach CTA fires from a single-person profile, move the user into
    // the AI coach: surface the GROW onboarding stand-in. Other scopes (team /
    // duo) keep the existing pass-the-prompt behavior only.
    if (action?.payload?.scope === 'person') {
      setCoachOnboarding({
        subjectName: action.payload.selection?.names?.[0] ?? null,
      });
    }
  };

  const setGenerationStatusForTarget = (
    target,
    status,
    eventType = 'teamDnaInsightGenerationSucceeded'
  ) => {
    if (!target?.id) return;

    const event = {
      type: eventType,
      targetId: target.id,
      status,
      timestamp: new Date().toISOString(),
    };

    updateActiveDevState((current) => ({
      ...current,
      generationStatusByTargetId: {
        ...(current.generationStatusByTargetId ?? {}),
        [target.id]: status,
      },
      lastGenerationEvent: event,
    }));

    if (import.meta.env.DEV) {
      console.info('[Team DNA generation lifecycle event]', event);
    }
  };

  const handleInsightLifecycleAction = (action) => {
    const nextStatus =
      action.type === 'teamDnaInsightGenerationFailed'
        ? 'failed'
        : action.type === 'teamDnaTeamInsightMarkedStale'
          ? 'stale'
          : action.type === 'teamDnaAssessmentCompleted'
            ? 'pending'
            : 'pending';

    setGenerationStatusForTarget(action.target, nextStatus, action.type);
  };

  const handleProfileCopySave = ({
    memberId,
    overview,
    workWithSections,
    whereShines,
    watchOutSections,
    meetingBehaviorSections,
  }) => {
    setProfileCopyEditsByMemberId((current) => ({
      ...current,
      [memberId]: {
        overview,
        workWithSections,
        whereShines,
        watchOutSections,
        meetingBehaviorSections,
      },
    }));
  };

  // The "Start your assessment" CTA opens a lightweight, on-brand stand-in for
  // the real assessment flow so the demo has a believable "your turn" moment.
  const handleStartAssessment = () => {
    if (!currentViewerMemberId) return;
    setIsAssessmentOpen(true);
  };

  // Completing the stand-in marks the viewer's assessment done, then lands on
  // the viewer's own results page (the same "You are the…" read as the single
  // profile review) before they head back to the team view.
  const handleCompleteAssessment = () => {
    setIsAssessmentOpen(false);
    if (!currentViewerMemberId) return;
    setMemberAssessmentStates([
      { memberId: currentViewerMemberId, assessmentComplete: true },
    ]);
    setIsSelfResultsOpen(true);
  };

  const handleCloseSelfResults = () => {
    setIsSelfResultsOpen(false);
  };

  const viewerMember = editableTeamDna.members.find(
    (member) => member.id === currentViewerMemberId
  );
  const viewerMemberName = viewerMember?.name ?? null;

  // Demo-only fast-forward. Once the viewer has "finished" and is waiting on the
  // rest of the team, this stands in for everyone else finishing: it marks the
  // whole team complete and kicks off generation, then resolves to ready after a
  // short beat. Generating and ready intentionally read off the SAME team data —
  // the generating screen is just a loading veil over the real summary — so the
  // teammate running this demo never sees the content swap.
  const handleDemoAdvanceToReady = () => {
    const target = activeGenerationTarget;
    if (!target?.id) return;

    setGenerationScenarioForTarget(target, 'pending', 'demo:generating');

    if (demoGenerationTimerRef.current) {
      window.clearTimeout(demoGenerationTimerRef.current);
    }
    demoGenerationTimerRef.current = window.setTimeout(() => {
      setGenerationStatusForTarget(target, 'ready', 'demo:ready');
      demoGenerationTimerRef.current = null;
    }, DEMO_GENERATION_MS);
  };

  const resetMembersForFreshTeam = (teamRecord) => {
    const dataset = getDatasetForTeamRecord(
      teamRecord,
      organizationEmployees,
      teamDnaResultsByEmployeeId
    );

    setMemberAssessmentStates(
      dataset.members.map((member) => ({
        memberId: member.id,
        assessmentComplete: false,
      }))
    );
  };

  const saveTeamRecord = (draftTeamRecord) => {
    const teamId = draftTeamRecord.id ?? makeTeamRecordId(draftTeamRecord.name);
    const nextTeamRecord = normalizeTeamRecord({
      ...draftTeamRecord,
      id: teamId,
    });

    setTeamRecords((current) => ({
      ...current,
      [teamId]: {
        teamRecord: nextTeamRecord,
        devState:
          current[teamId]?.devState ??
          createInitialDevState(
            getDatasetForTeamRecord(
              nextTeamRecord,
              organizationEmployees,
              teamDnaResultsByEmployeeId
            ).members
          ),
      },
    }));
    const isNewTeam = !draftTeamRecord.id;
    if (isNewTeam) {
      resetMembersForFreshTeam(nextTeamRecord);
    }
    setActiveTeamId(teamId);
    setTeamManagementOverlay(null);

    // Briefly cover the hand-off with a full-screen loader so the new team page
    // resolves behind it instead of popping in.
    if (isNewTeam) {
      window.clearTimeout(creatingTeamTimerRef.current);
      setIsCreatingTeam(true);
      creatingTeamTimerRef.current = window.setTimeout(() => {
        setIsCreatingTeam(false);
      }, 1200);
    }
  };

  const setActiveTeamSize = (teamSize) => {
    if (!activeRecord) return;

    const resizedRecord = getResizedTeamRecord(
      activeRecord.teamRecord,
      teamSize,
      organizationEmployees
    );

    updateActiveRecord((record) => ({
      ...record,
      teamRecord: resizedRecord,
    }));

    // Keep the team data in sync when the roster grows: newly added members
    // count as complete (with seeded Big Five) so they immediately appear on the
    // team spectrum / role distribution, while existing members keep their state.
    const previousMemberIds = new Set(
      (activeDataset?.members ?? []).map((member) => member.id)
    );
    const resizedDataset = getDatasetForTeamRecord(
      resizedRecord,
      organizationEmployees,
      teamDnaResultsByEmployeeId
    );
    const newlyAddedMembers = resizedDataset.members.filter(
      (member) => !previousMemberIds.has(member.id)
    );

    if (newlyAddedMembers.length > 0) {
      setMemberAssessmentStates(
        newlyAddedMembers.map((member) => ({
          memberId: member.id,
          assessmentComplete: true,
        }))
      );
    }
  };

  const toggleMemberAvatar = (memberId) => {
    const sourceEmployee = mockOrganizationEmployees.find(
      (employee) => employee.id === memberId
    );

    if (!sourceEmployee) return;

    setOrganizationEmployees((current) =>
      current.map((employee) =>
        employee.id === memberId
          ? {
              ...employee,
              avatar: employee.avatar ? '' : sourceEmployee.avatar,
            }
          : employee
      )
    );
  };

  const toggleMemberAssessment = (memberId) => {
    setTeamDnaResultsByEmployeeId((current) => {
      const currentResult = current[memberId] ?? {};
      const nextAssessmentComplete = currentResult.assessmentComplete !== true;

      return {
        ...current,
        [memberId]: {
          ...currentResult,
          assessmentComplete: nextAssessmentComplete,
          bigFive: currentResult.bigFive ?? makeFallbackBigFive(memberId),
        },
      };
    });
  };

  const setMemberPrivacy = (memberId, key, enabled) => {
    updateActiveDevState((current) => {
      const currentPrivacy = current.memberPrivacyById?.[memberId] ?? {
        profileVisibility: 'teams',
        pairComparisonVisibility: 'teams',
      };
      const nextValue =
        key === 'profileVisibility'
          ? enabled ? 'teams' : 'private'
          : enabled ? 'teams' : 'not_allowed';

      return {
        ...current,
        memberPrivacyById: {
          ...(current.memberPrivacyById ?? {}),
          [memberId]: {
            ...currentPrivacy,
            [key]: nextValue,
          },
        },
      };
    });
  };

  const setMemberAssessmentStates = (memberAssessmentStates) => {
    setTeamDnaResultsByEmployeeId((current) => {
      const next = { ...current };

      memberAssessmentStates.forEach(({ memberId, assessmentComplete }) => {
        const currentResult = next[memberId] ?? {};

        next[memberId] = {
          ...currentResult,
          assessmentComplete,
          bigFive: currentResult.bigFive ?? makeFallbackBigFive(memberId),
        };
      });

      return next;
    });
  };

  const clearGenerationStatusForTarget = (target) => {
    if (!target?.id) return;

    updateActiveDevState((current) => {
      const nextStatusByTargetId = { ...(current.generationStatusByTargetId ?? {}) };
      delete nextStatusByTargetId[target.id];

      return {
        ...current,
        generationStatusByTargetId: nextStatusByTargetId,
      };
    });
  };

  const getMemberIdsForGenerationScenario = (target) => {
    if (target?.scope === 'team') {
      return editableTeamDna.members.map((member) => member.id);
    }

    return target?.memberIds ?? [];
  };

  const makeNotReadyAssessmentScenario = (target) => {
    const memberIds = getMemberIdsForGenerationScenario(target);

    if (target?.scope === 'team') {
      const completeCount = Math.max(
        0,
        Math.min(
          memberIds.length,
          (target.minimumCompletedCount ?? 1) - 1
        )
      );

      return memberIds.map((memberId, index) => ({
        memberId,
        assessmentComplete: index < completeCount,
      }));
    }

    if (target?.scope === 'duo') {
      return memberIds.map((memberId, index) => ({
        memberId,
        assessmentComplete: index === 0,
      }));
    }

    return memberIds.map((memberId) => ({
      memberId,
      assessmentComplete: false,
    }));
  };

  const setGenerationScenarioForTarget = (
    target,
    status,
    eventType = 'teamDnaInsightGenerationSucceeded'
  ) => {
    if (!target?.id) return;

    if (status === 'not_ready') {
      // `not_ready` is source-data readiness, not an AI job result. The debug
      // harness mutates the same member assessment data the real product will
      // use, then lets the normal lifecycle resolver derive the waiting state.
      setMemberAssessmentStates(makeNotReadyAssessmentScenario(target));
      clearGenerationStatusForTarget(target);
      return;
    }

    setMemberAssessmentStates(
      getMemberIdsForGenerationScenario(target).map((memberId) => ({
        memberId,
        assessmentComplete: true,
      }))
    );
    setGenerationStatusForTarget(target, status, eventType);
  };

  const switchTeam = (teamId) => {
    if (!teamRecords[teamId]) return;

    setTeamManagementOverlay(null);
    setActiveTeamId(teamId);
    setActiveSurface(null);
  };

  // Breadcrumb "Team" crumb: drop the active selection so the Team tooling home
  // (Team DNA / Pulse / Coaching landing) renders as the parent of this read.
  const exitToTeamHome = () => {
    setTeamManagementOverlay(null);
    setActiveSurface(null);
    setActiveTeamId(null);
  };

  const trySampleTeam = () => {
    const sampleRecordState = createTeamRecordState(
      sampleTeamRecord,
      organizationEmployees,
      teamDnaResultsByEmployeeId
    );

    setTeamManagementOverlay(null);
    setTeamRecords((current) => ({
      ...current,
      [sampleTeamRecord.id]: sampleRecordState,
    }));
    setActiveTeamId(sampleTeamRecord.id);
  };

  // Demo-only: preview the direct-report landing states (no team / one team /
  // multiple teams). A direct report can't create teams, so this also flips the
  // viewer into a non-manager (canManageTeam: false) and stays on the hub
  // (activeTeamId = null) so the reviewer sees the CTA rather than jumping in.
  const applyLandingScenario = (scenario) => {
    const defs =
      scenario === 'single'
        ? DEMO_MANAGER_TEAMS.slice(0, 1)
        : scenario === 'multi'
          ? DEMO_MANAGER_TEAMS
          : [];

    setTeamManagementOverlay(null);
    setActiveSurface(null);
    setActiveTeamId(null);
    setEmptyDevState((current) => ({ ...current, canManageTeam: false }));
    setTeamRecords(
      Object.fromEntries(
        defs.map((def) => {
          const recordState = createTeamRecordState(
            def,
            organizationEmployees,
            teamDnaResultsByEmployeeId
          );

          return [
            def.id,
            {
              ...recordState,
              devState: { ...recordState.devState, canManageTeam: false },
            },
          ];
        })
      )
    );
  };

  // Demo-only: flip back to the manager hub (can create teams, no teams yet).
  const resetToManagerScenario = () => {
    setTeamManagementOverlay(null);
    setActiveSurface(null);
    setActiveTeamId(null);
    setTeamRecords({});
    setEmptyDevState((current) => ({ ...current, canManageTeam: true }));
  };

  // Demo-only: subtle nav toggle between the manager hub and the direct-report
  // hub. Direct report defaults to the one-team state (the View Team DNA CTA);
  // the scenario sub-bar then lets the reviewer try no-team / 1 / 2 teams.
  const viewerPersona = canManageTeam ? 'manager' : 'member';
  const selectViewerPersona = (persona) => {
    if (persona === 'manager') {
      if (canManageTeam) return;
      resetToManagerScenario();
      return;
    }

    if (!canManageTeam) return;
    applyLandingScenario('single');
  };

  return (
    <>
      <MonolithTeamShell
        enabled={devState.showMonolithShell}
        viewerPersona={viewerPersona}
        onSelectPersona={selectViewerPersona}
        toolbar={
          isTrueEmptyState && !canManageTeam ? (
            <LandingScenarioSwitcher
              activeScenario={getLandingScenarioForCount(teamOptions.length)}
              onSelect={applyLandingScenario}
              ctaLayout={ctaLayout}
              onSelectLayout={setCtaLayout}
              showLayout={teamOptions.length > 0}
            />
          ) : null
        }
      >
        <div className="team-dna-shell">
          <main className="team-dna-page" aria-label="Team DNA">
            {isTrueEmptyState ? (
              <TeamDnaEmptyState
                canManageTeam={canManageTeam}
                currentViewerMemberId={currentViewerMemberId}
                teamOptions={teamOptions}
                ctaLayout={ctaLayout}
                onViewTeamDna={switchTeam}
                onAddTeam={openCreateTeam}
                onTrySample={trySampleTeam}
                onOpenSurface={setActiveSurface}
              />
            ) : (
              <TeamDnaExperience
                dataset={scenarioDataset}
                generationStatusByTargetId={generationStatusByTargetId}
                initialSelectedIds={demoConfig.selectedMemberIds}
                startWithIntroReleased={demoConfig.enabled}
                teamOptions={teamOptions}
                selectedTeamId={activeTeamId}
                teamSwitcherTopOffset={devState.showMonolithShell ? 104 : 34}
                canManageTeam={canManageTeam}
                currentViewerMemberId={currentViewerMemberId}
                onAddTeam={openCreateTeam}
                onEditTeam={openEditTeam}
                onTeamChange={switchTeam}
                onExitToTeamHome={exitToTeamHome}
                onGrowChatPrompt={handleGrowChatPrompt}
                onGenerationTargetChange={setActiveGenerationTarget}
                onInsightLifecycleAction={handleInsightLifecycleAction}
                onProfileCopySave={handleProfileCopySave}
                onStartAssessment={handleStartAssessment}
                onDemoAdvance={handleDemoAdvanceToReady}
              />
            )}
          </main>
          <TeamSurfacePanel
            surface={activeSurface}
            onClose={() => setActiveSurface(null)}
            onOpenSurface={setActiveSurface}
          />
        </div>
      </MonolithTeamShell>
      {isAssessmentOpen && (
        <AssessmentOverlay
          viewerName={viewerMemberName}
          onComplete={handleCompleteAssessment}
          onClose={() => setIsAssessmentOpen(false)}
        />
      )}
      {isSelfResultsOpen && selfResultsInsight && (
        <AssessmentResultsOverlay
          insight={selfResultsInsight}
          members={editableTeamDna.members}
          teamName={editableTeamDna.team?.name}
          currentViewerMemberId={currentViewerMemberId}
          viewerName={viewerMemberName}
          viewerAvatarUrl={viewerMember?.avatarUrl ?? null}
          viewerBigFive={viewerMember?.bigFive ?? null}
          onBackToTeam={handleCloseSelfResults}
        />
      )}
      {coachOnboarding && (
        <CoachOnboardingOverlay
          subjectName={coachOnboarding.subjectName}
          onStart={() => setCoachOnboarding(null)}
          onClose={() => setCoachOnboarding(null)}
        />
      )}
      {teamManagementOverlay && (
        <TeamManagementOverlay
          mode={teamManagementOverlay.mode}
          initialDemoState={teamManagementOverlay.initialDemoState}
          organizationEmployees={organizationEmployees}
          teamDnaResultsByEmployeeId={teamDnaResultsByEmployeeId}
          currentManagerEmployeeId={CURRENT_MANAGER_EMPLOYEE_ID}
          teamRecord={overlayTeamRecord}
          onCancel={closeTeamManagement}
          onSave={saveTeamRecord}
          onTeamManagementAction={handleTeamManagementAction}
        />
      )}
      {isCreatingTeam && (
        <div className="team-creating-overlay" role="status" aria-live="polite">
          <div className="team-creating-overlay-inner">
            <span className="team-creating-spinner" aria-hidden="true" />
            <p className="team-creating-label">Creating new team</p>
          </div>
        </div>
      )}
      {!demoConfig.enabled && (
        <TeamDnaDevPanel
          baseMembers={editableTeamDna.members}
          activeGenerationTarget={activeGenerationTarget}
          devState={devState}
          canResizeTeam={Boolean(activeRecord)}
          onSetGenerationStatus={setGenerationScenarioForTarget}
          onSetTeamSize={setActiveTeamSize}
          onToggleMemberAvatar={toggleMemberAvatar}
          onToggleMemberAssessment={toggleMemberAssessment}
          onSetMemberPrivacy={setMemberPrivacy}
          setDevState={updateActiveDevState}
        />
      )}
    </>
  );
}

function TeamDnaEmptyState({
  canManageTeam,
  teamOptions = [],
  ctaLayout = 'split',
  onViewTeamDna,
  onAddTeam,
  onTrySample,
  onOpenSurface,
}) {
  return (
    <section className="team-tooling-home" aria-label="Team tooling home">
      <div
        className="team-dna-empty-state"
        aria-label="Team DNA empty state"
      >
        <div className="team-dna-empty-copy">
          <p className="team-dna-empty-eyebrow">
            Team DNA
            <span className="team-dna-empty-new">New</span>
          </p>
          <h1>Work better together.</h1>
          <p className="team-dna-empty-body">
            Team DNA uses the research-backed <strong>Big Five</strong>
            <a
              href="https://doi.org/10.1037/0022-3514.59.6.1216"
              target="_blank"
              rel="noreferrer"
              aria-label="Goldberg 1990 Big Five factor structure source"
              title="Goldberg, L. R. (1990). An alternative description of personality: The Big-Five factor structure."
            >
              [1]
            </a>{' '}
            framework to reveal how people work, what brings out their best, and
            where teammates can multiply each other’s impact.
          </p>
          {canManageTeam ? (
            <div className="team-dna-empty-actions">
              <button
                type="button"
                className="team-dna-empty-primary"
                onClick={onAddTeam}
              >
                Add your team
              </button>
              <button
                type="button"
                className="team-dna-empty-secondary"
                onClick={onTrySample}
              >
                Try with sample data
              </button>
            </div>
          ) : (
            <TeamDnaAccessCta
              teamOptions={teamOptions}
              layout={ctaLayout}
              onViewTeamDna={onViewTeamDna}
            />
          )}
        </div>
        <TeamDnaEmptyPreview />
      </div>

      <div className="team-tooling-more">
        <div className="team-tooling-divider" aria-hidden="true" />
        <div className="team-tooling-tools">
          <TeamToolingEntry
            surface="pulse"
            eyebrow="Team Pulse"
            title="See how the team is really doing."
            body="Quick, anonymous check-ins on energy, overwhelm, and support so you catch what matters early."
            cta="Run a quick pulse"
            onOpenSurface={onOpenSurface}
          />
          <TeamToolingEntry
            surface="coaching"
            eyebrow="Team Coaching"
            title="Grow with a coach."
            body="Live, coach-led sessions built around your team's real challenges."
            cta="Explore coaching topics"
            onOpenSurface={onOpenSurface}
          />
        </div>
      </div>
    </section>
  );
}

function formatHeadcount(count) {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

function getInitialsFromName(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

// Closes a popover on outside click / Escape. Returns nothing; wire the ref.
function useDismissable(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (ref.current?.contains(event.target)) return;
      onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isOpen, onClose]);
}

// Overlapping member faces so a team reads as people, not an abstract count.
// Deliberately small (2 faces + a count) so it stays a glanceable accent.
function TeamAvatarStack({ members = [], max = 2, variant = 'default' }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;

  if (!shown.length) return null;

  return (
    <span
      className="team-dna-avatar-stack"
      data-variant={variant}
      aria-hidden="true"
    >
      {shown.map((member) => (
        <span className="team-dna-avatar-stack-item" key={member.id}>
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" />
          ) : (
            <span className="team-dna-avatar-stack-initials">
              {getInitialsFromName(member.name)}
            </span>
          )}
        </span>
      ))}
      {extra > 0 ? (
        <span className="team-dna-avatar-stack-item team-dna-avatar-stack-more">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}

// Shared frosted team menu used by the split + in-button variants.
function TeamChooserMenu({ teamOptions, selectedId, onSelect, isOpen, menuId }) {
  return (
    <div
      id={menuId}
      role="menu"
      className="team-dna-team-menu"
      aria-label="Choose a team"
      aria-hidden={!isOpen}
    >
      {teamOptions.map((team) => (
        <button
          key={team.id}
          type="button"
          role="menuitemradio"
          aria-checked={team.id === selectedId}
          className="team-dna-team-menu-item"
          data-selected={team.id === selectedId || undefined}
          tabIndex={isOpen ? 0 : -1}
          onClick={() => onSelect(team.id)}
        >
          <TeamAvatarStack members={team.members} />
          <span className="team-dna-team-menu-copy">
            <span className="team-dna-team-menu-name">{team.name}</span>
            <span className="team-dna-team-menu-meta">
              {team.teamType} · {formatHeadcount(team.memberCount)}
            </span>
          </span>
          {team.id === selectedId ? (
            <BetterUpIcon name="Check" size={16} strokeWidth={2} />
          ) : null}
        </button>
      ))}
    </div>
  );
}

/**
 * Direct-report CTA on the Team DNA hub. A direct report can't create teams, so
 * this never offers "add team". When they're on no team it locks with guidance;
 * otherwise it renders one of three explorable treatments (demo `layout`):
 *   - split:    action-first pill, faces beside it, caret menu for >1 team
 *   - inButton: the team name + faces live inside the button
 *   - cards:    each team is a tappable, face-forward card
 */
function TeamDnaAccessCta({ teamOptions, layout = 'split', onViewTeamDna }) {
  if (teamOptions.length === 0) {
    return (
      <div className="team-dna-empty-actions team-dna-empty-actions--locked">
        <span className="team-dna-cta-locked-wrap">
          <button
            type="button"
            className="team-dna-empty-primary team-dna-empty-primary--locked"
            aria-disabled="true"
            aria-describedby="team-dna-locked-tip"
            onClick={(event) => event.preventDefault()}
          >
            <BetterUpIcon name="Lock" size={15} strokeWidth={2} />
            View Team DNA
          </button>
          <span
            id="team-dna-locked-tip"
            role="tooltip"
            className="team-dna-cta-tooltip"
          >
            You’re not on a team yet. Ask your manager or admin to add you to a
            team to view your Team DNA.
          </span>
        </span>
      </div>
    );
  }

  if (layout === 'cards') {
    return <CtaVariantCards teamOptions={teamOptions} onViewTeamDna={onViewTeamDna} />;
  }
  if (layout === 'inButton') {
    return (
      <CtaVariantInButton teamOptions={teamOptions} onViewTeamDna={onViewTeamDna} />
    );
  }
  return <CtaVariantSplit teamOptions={teamOptions} onViewTeamDna={onViewTeamDna} />;
}

// Variant A — action-first split button. Faces sit beside the CTA so you see
// who's on the team; with multiple teams a caret opens a frosted chooser.
function CtaVariantSplit({ teamOptions, onViewTeamDna }) {
  const [selectedId, setSelectedId] = useState(teamOptions[0]?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();
  const multi = teamOptions.length > 1;
  const selected =
    teamOptions.find((team) => team.id === selectedId) ?? teamOptions[0];

  useDismissable(ref, isOpen, () => setIsOpen(false));

  return (
    <div className="team-dna-cta team-dna-cta--split">
      <div ref={ref} className="team-dna-split" data-open={isOpen || undefined}>
        <button
          type="button"
          className="team-dna-empty-primary team-dna-split-main"
          onClick={() => onViewTeamDna?.(selected?.id)}
        >
          View Team DNA
        </button>
        {multi ? (
          <>
            <button
              type="button"
              className="team-dna-empty-primary team-dna-split-caret"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              aria-label="Choose a team"
              onClick={() => setIsOpen((current) => !current)}
            >
              <BetterUpIcon name="ChevronDown" size={16} strokeWidth={2} />
            </button>
            <TeamChooserMenu
              teamOptions={teamOptions}
              selectedId={selectedId}
              isOpen={isOpen}
              menuId={menuId}
              onSelect={(teamId) => {
                setSelectedId(teamId);
                setIsOpen(false);
              }}
            />
          </>
        ) : null}
      </div>
      <div className="team-dna-cta-team">
        <TeamAvatarStack members={selected?.members} />
        <span className="team-dna-cta-team-copy">
          <span className="team-dna-cta-team-name">{selected?.name}</span>
          <span className="team-dna-cta-team-meta">
            {selected?.teamType} · {formatHeadcount(selected?.memberCount)}
          </span>
        </span>
      </div>
    </div>
  );
}

// Variant B — the team lives inside the button: faces + "View {team}'s DNA".
// With multiple teams the button carries a caret that opens the chooser.
function CtaVariantInButton({ teamOptions, onViewTeamDna }) {
  const [selectedId, setSelectedId] = useState(teamOptions[0]?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();
  const multi = teamOptions.length > 1;
  const selected =
    teamOptions.find((team) => team.id === selectedId) ?? teamOptions[0];

  useDismissable(ref, isOpen, () => setIsOpen(false));

  return (
    <div className="team-dna-cta team-dna-cta--in-button">
      <div ref={ref} className="team-dna-context" data-open={isOpen || undefined}>
        <button
          type="button"
          className="team-dna-empty-primary team-dna-context-main"
          onClick={() => onViewTeamDna?.(selected?.id)}
        >
          <TeamAvatarStack members={selected?.members} variant="onPrimary" />
          <span className="team-dna-context-label">
            View {selected?.name}’s DNA
          </span>
          {multi ? null : (
            <BetterUpIcon name="ChevronRight" size={16} strokeWidth={2} />
          )}
        </button>
        {multi ? (
          <>
            <button
              type="button"
              className="team-dna-empty-primary team-dna-context-caret"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls={menuId}
              aria-label="Switch team"
              onClick={() => setIsOpen((current) => !current)}
            >
              <BetterUpIcon name="ChevronDown" size={16} strokeWidth={2} />
            </button>
            <TeamChooserMenu
              teamOptions={teamOptions}
              selectedId={selectedId}
              isOpen={isOpen}
              menuId={menuId}
              onSelect={(teamId) => {
                setSelectedId(teamId);
                setIsOpen(false);
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

// Variant C — face-forward team cards. Each card is the CTA; one card for a
// single team, a short stack when there are several.
function CtaVariantCards({ teamOptions, onViewTeamDna }) {
  return (
    <div className="team-dna-cta team-dna-team-cards">
      {teamOptions.map((team) => (
        <button
          key={team.id}
          type="button"
          className="team-dna-team-card"
          onClick={() => onViewTeamDna?.(team.id)}
        >
          <TeamAvatarStack members={team.members} />
          <span className="team-dna-team-card-copy">
            <span className="team-dna-team-card-name">{team.name}</span>
            <span className="team-dna-team-card-meta">
              {team.teamType} · {formatHeadcount(team.memberCount)}
            </span>
          </span>
          <span className="team-dna-team-card-cta">
            View Team DNA
            <BetterUpIcon name="ChevronRight" size={16} strokeWidth={2} />
          </span>
        </button>
      ))}
    </div>
  );
}

const CTA_LAYOUTS = [
  { id: 'split', label: 'Split' },
  { id: 'inButton', label: 'In button' },
  { id: 'cards', label: 'Cards' },
];

function LandingScenarioSwitcher({
  activeScenario,
  onSelect,
  ctaLayout,
  onSelectLayout,
  showLayout = false,
}) {
  return (
    <div
      className="team-dna-landing-switcher"
      role="group"
      aria-label="Demo: direct-report team scenarios"
    >
      <div className="team-dna-landing-switcher-inner">
        <span className="team-dna-landing-switcher-label">
          <BetterUpIcon name="Info" size={14} strokeWidth={1.9} />
          Demo · Direct report on
        </span>
        <div className="team-dna-landing-switcher-seg">
          {LANDING_SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className="team-dna-landing-switcher-button"
              data-active={scenario.id === activeScenario || undefined}
              aria-pressed={scenario.id === activeScenario}
              onClick={() => onSelect?.(scenario.id)}
            >
              {scenario.label}
            </button>
          ))}
        </div>
        {showLayout ? (
          <>
            <span className="team-dna-landing-switcher-label team-dna-landing-switcher-label--secondary">
              CTA style
            </span>
            <div className="team-dna-landing-switcher-seg">
              {CTA_LAYOUTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="team-dna-landing-switcher-button"
                  data-active={option.id === ctaLayout || undefined}
                  aria-pressed={option.id === ctaLayout}
                  onClick={() => onSelectLayout?.(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TeamToolingEntry({ surface, eyebrow, title, body, cta, onOpenSurface }) {
  const open = () => onOpenSurface?.(surface);

  return (
    <article
      className="team-tooling-tool"
      data-surface={surface}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
    >
      <p className="team-tooling-tool-eyebrow">{eyebrow}</p>
      <h2 className="team-tooling-tool-title">{title}</h2>
      <p className="team-tooling-tool-body">{body}</p>
      <span className="team-tooling-tool-cta">
        {cta}
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </article>
  );
}
