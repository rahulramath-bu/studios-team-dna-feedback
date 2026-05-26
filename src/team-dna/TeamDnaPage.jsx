import React, { useMemo, useState } from 'react';
import { TeamDnaExperience } from './TeamDnaExperience.jsx';
import { TeamDnaEmptyPreview } from './components/TeamDnaEmptyPreview.jsx';
import { TeamManagementOverlay } from './components/TeamManagementOverlay.jsx';
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

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
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
  const [organizationEmployees, setOrganizationEmployees] = useState(() =>
    cloneState(mockOrganizationEmployees)
  );
  const [teamDnaResultsByEmployeeId, setTeamDnaResultsByEmployeeId] = useState(
    () => cloneState(mockTeamDnaResultsByEmployeeId)
  );
  const [teamRecords, setTeamRecords] = useState(() =>
    Object.fromEntries(
      mockTeamRecords.map((teamRecord) => [
        teamRecord.id,
        createTeamRecordState(
          teamRecord,
          mockOrganizationEmployees,
          mockTeamDnaResultsByEmployeeId
        ),
      ])
    )
  );
  const [activeTeamId, setActiveTeamId] = useState(() => {
    const firstRealTeam = mockTeamRecords.find(
      (teamRecord) => !teamRecord.sample && teamRecord.memberEmployeeIds.length > 0
    );

    return firstRealTeam?.id ?? null;
  });
  const [teamManagementOverlay, setTeamManagementOverlay] = useState(null);
  const [activeGenerationTarget, setActiveGenerationTarget] = useState(null);
  const [emptyDevState, setEmptyDevState] = useState(() =>
    createInitialDevState(EMPTY_TEAM_DATASET.members)
  );
  const activeRecord = activeTeamId ? teamRecords[activeTeamId] : null;
  const activeDataset = useMemo(() => {
    if (!activeRecord) return null;

    return getDatasetForTeamRecord(
      activeRecord.teamRecord,
      organizationEmployees,
      teamDnaResultsByEmployeeId
    );
  }, [activeRecord, organizationEmployees, teamDnaResultsByEmployeeId]);
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
  const generationStatusByTargetId = devState.generationStatusByTargetId ?? {};
  const scenarioDataset = editableTeamDna;
  const teamOptions = useMemo(
    () =>
      Object.values(teamRecords).map(({ teamRecord }) => ({
        id: teamRecord.id,
        name: teamRecord.name,
        memberCount: teamRecord.memberEmployeeIds.length + teamRecord.invitedEmails.length,
        sample: teamRecord.sample,
      })),
    [teamRecords]
  );
  const overlayTeamRecord =
    teamManagementOverlay?.mode === 'edit' && teamManagementOverlay.teamId
      ? teamRecords[teamManagementOverlay.teamId]?.teamRecord
      : null;

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

  return (
    <>
      <MonolithTeamShell enabled={devState.showMonolithShell}>
        <main className="team-dna-page" aria-label="Team DNA">
          {isTrueEmptyState ? (
            <TeamDnaEmptyState
              canManageTeam={canManageTeam}
              onAddTeam={openCreateTeam}
              onTrySample={trySampleTeam}
            />
          ) : (
            <TeamDnaExperience
              dataset={scenarioDataset}
              generationStatusByTargetId={generationStatusByTargetId}
              teamOptions={teamOptions}
              selectedTeamId={activeTeamId}
              teamSwitcherTopOffset={devState.showMonolithShell ? 104 : 34}
              canManageTeam={canManageTeam}
              onAddTeam={openCreateTeam}
              onEditTeam={openEditTeam}
              onTeamChange={switchTeam}
              onGrowChatPrompt={handleGrowChatPrompt}
              onGenerationTargetChange={setActiveGenerationTarget}
              onInsightLifecycleAction={handleInsightLifecycleAction}
            />
          )}
        </main>
      </MonolithTeamShell>
      {teamManagementOverlay && (
        <TeamManagementOverlay
          mode={teamManagementOverlay.mode}
          organizationEmployees={organizationEmployees}
          teamDnaResultsByEmployeeId={teamDnaResultsByEmployeeId}
          teamRecord={overlayTeamRecord}
          onCancel={closeTeamManagement}
          onSave={saveTeamRecord}
          onTeamManagementAction={handleTeamManagementAction}
        />
      )}
      <TeamDnaDevPanel
        baseMembers={editableTeamDna.members}
        activeGenerationTarget={activeGenerationTarget}
        devState={devState}
        canResizeTeam={Boolean(activeRecord)}
        onSetGenerationStatus={setGenerationScenarioForTarget}
        onSetTeamSize={setActiveTeamSize}
        onToggleMemberAvatar={toggleMemberAvatar}
        onToggleMemberAssessment={toggleMemberAssessment}
        setDevState={updateActiveDevState}
      />
    </>
  );
}

function TeamDnaEmptyState({ canManageTeam, onAddTeam, onTrySample }) {
  return (
    <section
      className="team-dna-empty-state"
      aria-label="Team DNA empty state"
    >
      <div className="team-dna-empty-copy">
        <p className="team-dna-empty-eyebrow">Team DNA</p>
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
    </section>
  );
}
