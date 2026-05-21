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

  // Porting seam: replace these local mutations with team rename/add/remove
  // API mutations, or remove edit mode if roster management lives elsewhere.
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
            preserveInsightScroll={devState.preserveInsightScroll}
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
