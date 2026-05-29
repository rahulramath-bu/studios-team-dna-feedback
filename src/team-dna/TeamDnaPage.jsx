import React, { useMemo, useState } from 'react';
import { TeamDnaExperience } from './TeamDnaExperience.jsx';
import { TeamDnaEmptyPreview } from './components/TeamDnaEmptyPreview.jsx';
import { TeamManagementOverlay } from './components/TeamManagementOverlay.jsx';
import { TeamLeftRail } from './components/TeamLeftRail.jsx';
import { TeamSurfacePanel } from './components/TeamSurfacePanel.jsx';
import {
  buildTeamDnaDatasetFromTeamRecord,
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

const NEUTRAL_BIG_FIVE = {
  openness: 50,
  conscientiousness: 50,
  extraversion: 50,
  agreeableness: 50,
  neuroticism: 50,
};
const FAKE_ASSESSMENT_REMINDER_LATENCY_MS = 650;
const DEMO_INVITED_EMAIL = 'new.teammate@betterup.co';

const DEMO_SETUP_TEAM_RECORD = {
  id: null,
  name: 'Product team',
  teamType: 'Cross-functional',
  memberEmployeeIds: ['sergio', 'justin'],
  invitedEmails: [DEMO_INVITED_EMAIL],
  sample: false,
};

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
  const [activeGenerationTarget, setActiveGenerationTarget] = useState(null);
  const [activeSurface, setActiveSurface] = useState(null);
  const [profileCopyEditsByMemberId, setProfileCopyEditsByMemberId] = useState(
    {}
  );
  const [emptyDevState, setEmptyDevState] = useState(() =>
    createInitialDevState(EMPTY_TEAM_DATASET.members)
  );
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
  const teamOptions = useMemo(
    () =>
      Object.values(teamRecords).map(({ teamRecord }) => ({
        id: teamRecord.id,
        name: teamRecord.name,
        teamType: teamRecord.teamType,
        memberCount: teamRecord.memberEmployeeIds.length + teamRecord.invitedEmails.length,
        sample: teamRecord.sample,
      })),
    [teamRecords]
  );
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
    // What: prototype-only Grow Chat seam for the bottom Team DNA ask box.
    // How: emits a local event with the exact monolith route/search-param shape;
    // no Lighthouse request is made from this standalone surface.
    // Port: replace this dispatch with `setLocation('lighthouse.chat', {
    // searchParams: action.payload.monolith.searchParams })`. Monolith ChatRouter
    // already stores `initial_user_message` as `LH.initial-user-message`, creates
    // the conversation, and lets MainArea send it when the socket is ready.
    window.dispatchEvent(new CustomEvent('team-dna:grow-chat-prompt', {
      detail: action,
    }));

    if (import.meta.env.DEV) {
      console.info('[Team DNA Grow Chat prompt]', action);
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

  const handleStartAssessment = () => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === '/assessment') return;
    window.history.pushState({}, '', '/assessment');
    window.dispatchEvent(new PopStateEvent('popstate'));
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
    if (!draftTeamRecord.id) {
      resetMembersForFreshTeam(nextTeamRecord);
    }
    setActiveTeamId(teamId);
    setTeamManagementOverlay(null);
  };

  const setActiveTeamSize = (teamSize) => {
    if (!activeRecord) return;

    updateActiveRecord((record) => ({
      ...record,
      teamRecord: getResizedTeamRecord(
        record.teamRecord,
        teamSize,
        organizationEmployees
      ),
    }));
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
          bigFive: currentResult.bigFive ?? NEUTRAL_BIG_FIVE,
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
          bigFive: currentResult.bigFive ?? NEUTRAL_BIG_FIVE,
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

  const activeTeamRecord = activeRecord?.teamRecord ?? null;
  const handleRailSelect = (id) => {
    if (id === 'pulse' || id === 'coaching') {
      setActiveSurface(id);
      return;
    }

    setActiveSurface(null);
  };

  return (
    <>
      <MonolithTeamShell enabled={devState.showMonolithShell}>
        <div
          className="team-dna-shell"
          data-has-rail={!isTrueEmptyState || undefined}
        >
          {!isTrueEmptyState ? (
            <TeamLeftRail
              activeId={activeSurface ?? 'dna'}
              teamName={activeTeamRecord?.name}
              teamType={activeTeamRecord?.teamType}
              teamOptions={teamOptions}
              selectedTeamId={activeTeamId}
              canManageTeam={canManageTeam}
              onSelect={handleRailSelect}
              onAddTeam={openCreateTeam}
              onEditTeam={openEditTeam}
              onTeamChange={switchTeam}
            />
          ) : null}
          <main className="team-dna-page" aria-label="Team DNA">
            {isTrueEmptyState ? (
              <TeamDnaEmptyState
                canManageTeam={canManageTeam}
                currentViewerMemberId={currentViewerMemberId}
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
                onGrowChatPrompt={handleGrowChatPrompt}
                onGenerationTargetChange={setActiveGenerationTarget}
                onInsightLifecycleAction={handleInsightLifecycleAction}
                onProfileCopySave={handleProfileCopySave}
                onStartAssessment={handleStartAssessment}
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
      {teamManagementOverlay && (
        <TeamManagementOverlay
          mode={teamManagementOverlay.mode}
          initialDemoState={teamManagementOverlay.initialDemoState}
          organizationEmployees={organizationEmployees}
          teamDnaResultsByEmployeeId={teamDnaResultsByEmployeeId}
          teamRecord={overlayTeamRecord}
          onCancel={closeTeamManagement}
          onSave={saveTeamRecord}
          onTeamManagementAction={handleTeamManagementAction}
        />
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

function TeamDnaEmptyState({ canManageTeam, onAddTeam, onTrySample, onOpenSurface }) {
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
            <div className="team-dna-empty-actions">
              <p className="team-dna-empty-note">
                After a manager or admin adds you to a team, you’ll see your team
                summary here.
              </p>
            </div>
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
