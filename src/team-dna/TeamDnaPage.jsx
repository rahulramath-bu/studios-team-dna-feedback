import React, { useMemo, useState } from 'react';
import { TeamDnaExperience } from './TeamDnaExperience.jsx';
import { TeamDnaEmptyPreview } from './components/TeamDnaEmptyPreview.jsx';
import { getTeamDna } from './data/teamDnaAdapter.js';
import { MonolithTeamShell } from './dev/MonolithTeamShell.jsx';
import { TeamDnaDevPanel } from './dev/TeamDnaDevPanel.jsx';
import {
  applyTeamDnaDevState,
  createInitialDevState,
} from './dev/teamDnaDevState.js';

const primaryTeamDna = getTeamDna({ teamId: 'flighthouse' });
const SAMPLE_TEAM_ID = 'sample-team';

function cloneTeamDataset(baseDataset, { id, name, sample = false }) {
  return {
    ...baseDataset,
    team: { id, name, sample },
    members: baseDataset.members.map((member) => ({
      ...member,
      id: `${id}-${member.id}`,
    })),
    insights: {
      team: undefined,
      people: {},
      pairs: {},
    },
  };
}

function makeTeamVariant(baseDataset, { id, name, memberIds, pendingIds = [] }) {
  const members = memberIds.map((memberId) => {
    const member = baseDataset.members.find((item) => item.id === memberId);
    return {
      ...member,
      id: `${id}-${member.id}`,
      assessmentComplete: !pendingIds.includes(memberId),
    };
  });

  return {
    team: { id, name },
    members,
    insights: {
      team: undefined,
      people: {},
      pairs: {},
    },
  };
}

const initialTeamDatasets = [
  cloneTeamDataset(primaryTeamDna, {
    id: SAMPLE_TEAM_ID,
    name: 'Sample Team',
    sample: true,
  }),
];

/**
 * Standalone prototype page.
 *
 * What: local route harness for the Team DNA experience.
 * How: loads fixture data, applies debug scenarios, owns in-memory team edits,
 * and optionally wraps the feature in a fake monolith shell preview.
 * Port: replace this with a monolith route/page that owns BrowserTitle,
 * analytics, loading/error states, generated API hooks, adapter mapping, and
 * real add/remove/rename mutations. The portable feature is TeamDnaExperience.
 */
function cloneEditState(value) {
  return JSON.parse(JSON.stringify(value));
}

function createNewMember(teamId, index) {
  return {
    id: `${teamId}-new-member-${Date.now()}`,
    name: `New teammate ${index}`,
    avatarUrl: '',
    assessmentComplete: false,
    bigFive: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    },
  };
}

function hasRealTeamMembers(records) {
  return Object.values(records).some(
    (record) => !record.dataset.team.sample && record.dataset.members.length > 0
  );
}

export function TeamDnaPage() {
  const [activeTeamId, setActiveTeamId] = useState(() => {
    const firstRealTeam = initialTeamDatasets.find(
      (dataset) => !dataset.team.sample && dataset.members.length > 0
    );

    return firstRealTeam?.team.id ?? null;
  });
  const [showLayoutOutlines, setShowLayoutOutlines] = useState(false);
  const [teamRecords, setTeamRecords] = useState(() =>
    Object.fromEntries(
      initialTeamDatasets.map((dataset) => [
        dataset.team.id,
        {
          dataset,
          devState: createInitialDevState(dataset.members),
        },
      ])
    )
  );
  const sampleRecord = teamRecords[SAMPLE_TEAM_ID] ?? Object.values(teamRecords)[0];
  const activeRecord = activeTeamId ? teamRecords[activeTeamId] : null;
  const visibleRecord = activeRecord ?? sampleRecord;
  const isTrueEmptyState =
    !activeRecord && !hasRealTeamMembers(teamRecords);
  const editableTeamDna = visibleRecord.dataset;
  const devState = visibleRecord.devState;
  const [editSnapshot, setEditSnapshot] = useState(null);
  const scenarioDataset = useMemo(
    () => applyTeamDnaDevState(editableTeamDna, devState),
    [editableTeamDna, devState]
  );
  const teamOptions = useMemo(
    () => Object.values(teamRecords).map((record) => record.dataset.team),
    [teamRecords]
  );

  const updateActiveRecord = (updater) => {
    setTeamRecords((current) => {
      const targetTeamId = activeTeamId ?? SAMPLE_TEAM_ID;
      const record = current[targetTeamId];
      if (!record) return current;

      return {
        ...current,
        [targetTeamId]: updater(record),
      };
    });
  };

  const updateActiveDataset = (updater) => {
    updateActiveRecord((record) => ({
      ...record,
      dataset:
        typeof updater === 'function' ? updater(record.dataset) : updater,
    }));
  };

  const updateActiveDevState = (updater) => {
    updateActiveRecord((record) => ({
      ...record,
      devState:
        typeof updater === 'function' ? updater(record.devState) : updater,
    }));
  };

  const updateTeamName = (name) => {
    updateActiveDataset((current) => ({
      ...current,
      team: {
        ...current.team,
        name,
      },
    }));
  };

  const beginTeamEdit = () => {
    setEditSnapshot({
      teamId: activeTeamId,
      dataset: cloneEditState(editableTeamDna),
      devState: cloneEditState(devState),
    });
  };

  const commitTeamEdit = () => {
    setEditSnapshot(null);
  };

  const cancelTeamEdit = () => {
    if (!editSnapshot) return;

    setTeamRecords((current) => ({
      ...current,
      [editSnapshot.teamId]: {
        dataset: editSnapshot.dataset,
        devState: editSnapshot.devState,
      },
    }));
    setEditSnapshot(null);
  };

  // Porting seam: replace these local mutations with team rename/add/remove
  // API mutations, or remove edit mode if roster management lives elsewhere.
  const removeMember = (memberId) => {
    updateActiveDataset((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== memberId),
    }));
    updateActiveDevState((current) => {
      const { [memberId]: removedMember, ...memberStates } = current.memberStates;
      return {
        ...current,
        teamSize: Math.max(0, Math.min(current.teamSize, editableTeamDna.members.length - 1)),
        memberStates,
      };
    });
  };

  const addMember = () => {
    const insertIndex = Math.min(devState.teamSize, editableTeamDna.members.length);
    const member = createNewMember(activeTeamId, insertIndex + 1);

    updateActiveDataset((current) => ({
      ...current,
      members: [
        ...current.members.slice(0, insertIndex),
        member,
        ...current.members.slice(insertIndex),
      ],
    }));
    updateActiveDevState((current) => ({
      ...current,
      teamSize: current.teamSize + 1,
      memberStates: {
        ...current.memberStates,
        [member.id]: {
          hasAvatar: false,
          assessmentComplete: false,
        },
      },
    }));
  };

  const switchTeam = (teamId) => {
    if (!teamRecords[teamId]) return;

    setEditSnapshot(null);
    setActiveTeamId(teamId);
  };

  const trySampleTeam = () => {
    switchTeam(SAMPLE_TEAM_ID);
  };

  return (
    <>
      <MonolithTeamShell enabled={devState.showMonolithShell}>
        <main className="team-dna-page" aria-label="Team DNA">
          {isTrueEmptyState ? (
            <TeamDnaEmptyState
              showLayoutOutlines={showLayoutOutlines}
              onAddTeam={() => {}}
              onTrySample={trySampleTeam}
            />
          ) : (
            <TeamDnaExperience
              dataset={scenarioDataset}
              showLayoutOutlines={showLayoutOutlines}
              preserveInsightScroll={devState.preserveInsightScroll}
              teamOptions={teamOptions}
              selectedTeamId={activeTeamId}
              teamSwitcherTopOffset={devState.showMonolithShell ? 104 : 34}
              onAddMember={addMember}
              onBeginTeamEdit={beginTeamEdit}
              onCancelTeamEdit={cancelTeamEdit}
              onCommitTeamEdit={commitTeamEdit}
              onRemoveMember={removeMember}
              onTeamNameChange={updateTeamName}
              onTeamChange={switchTeam}
            />
          )}
        </main>
      </MonolithTeamShell>
      <TeamDnaDevPanel
        baseMembers={editableTeamDna.members}
        devState={devState}
        showLayoutOutlines={showLayoutOutlines}
        setShowLayoutOutlines={setShowLayoutOutlines}
        setDevState={updateActiveDevState}
      />
    </>
  );
}

function TeamDnaEmptyState({ showLayoutOutlines, onAddTeam, onTrySample }) {
  return (
    <section
      className="team-dna-empty-state"
      data-layout-debug={showLayoutOutlines || undefined}
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
      </div>
      <TeamDnaEmptyPreview />
    </section>
  );
}
