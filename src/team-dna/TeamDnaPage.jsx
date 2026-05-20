import React, { useMemo, useState } from 'react';
import { TeamDnaExperience } from './TeamDnaExperience.jsx';
import { getTeamDna } from './data/teamDnaAdapter.js';
import { MonolithTeamShell } from './dev/MonolithTeamShell.jsx';
import { TeamDnaDevPanel } from './dev/TeamDnaDevPanel.jsx';
import {
  applyTeamDnaDevState,
  createInitialDevState,
} from './dev/teamDnaDevState.js';

const teamDna = getTeamDna({ teamId: 'flighthouse' });

function cloneEditState(value) {
  return JSON.parse(JSON.stringify(value));
}

function createNewMember(index) {
  return {
    id: `new-member-${Date.now()}`,
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

export function TeamDnaPage() {
  const [editableTeamDna, setEditableTeamDna] = useState(() => teamDna);
  const [devState, setDevState] = useState(() =>
    createInitialDevState(teamDna.members)
  );
  const [editSnapshot, setEditSnapshot] = useState(null);
  const scenarioDataset = useMemo(
    () => applyTeamDnaDevState(editableTeamDna, devState),
    [editableTeamDna, devState]
  );

  const updateTeamName = (name) => {
    setEditableTeamDna((current) => ({
      ...current,
      team: {
        ...current.team,
        name,
      },
    }));
  };

  const beginTeamEdit = () => {
    setEditSnapshot({
      dataset: cloneEditState(editableTeamDna),
      devState: cloneEditState(devState),
    });
  };

  const commitTeamEdit = () => {
    setEditSnapshot(null);
  };

  const cancelTeamEdit = () => {
    if (!editSnapshot) return;

    setEditableTeamDna(editSnapshot.dataset);
    setDevState(editSnapshot.devState);
    setEditSnapshot(null);
  };

  // Monolith integration tip: these prototype mutations are the future API
  // seam. Port them to team rename/add/remove mutations rather than keeping
  // local client-only dataset edits.
  const removeMember = (memberId) => {
    setEditableTeamDna((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== memberId),
    }));
    setDevState((current) => {
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
    const member = createNewMember(insertIndex + 1);

    setEditableTeamDna((current) => ({
      ...current,
      members: [
        ...current.members.slice(0, insertIndex),
        member,
        ...current.members.slice(insertIndex),
      ],
    }));
    setDevState((current) => ({
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

  return (
    <>
      <MonolithTeamShell enabled={devState.showMonolithShell}>
        <main className="team-dna-page" aria-label="Team DNA">
          <TeamDnaExperience
            dataset={scenarioDataset}
            onAddMember={addMember}
            onBeginTeamEdit={beginTeamEdit}
            onCancelTeamEdit={cancelTeamEdit}
            onCommitTeamEdit={commitTeamEdit}
            onRemoveMember={removeMember}
            onTeamNameChange={updateTeamName}
          />
        </main>
      </MonolithTeamShell>
      <TeamDnaDevPanel
        baseMembers={editableTeamDna.members}
        devState={devState}
        setDevState={setDevState}
      />
    </>
  );
}
