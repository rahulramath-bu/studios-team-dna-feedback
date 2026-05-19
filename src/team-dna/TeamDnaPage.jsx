import React, { useMemo, useState } from 'react';
import { TeamDnaExperience } from './TeamDnaExperience.jsx';
import { TeamDnaTooltipProvider } from './components/TeamDnaTooltip.jsx';
import { getTeamDna } from './data/teamDnaAdapter.js';
import { TeamDnaDevPanel } from './dev/TeamDnaDevPanel.jsx';
import {
  applyTeamDnaDevState,
  createInitialDevState,
} from './dev/teamDnaDevState.js';

const teamDna = getTeamDna({ teamId: 'flighthouse' });

export function TeamDnaPage() {
  const [devState, setDevState] = useState(() =>
    createInitialDevState(teamDna.members)
  );
  const scenarioDataset = useMemo(
    () => applyTeamDnaDevState(teamDna, devState),
    [devState]
  );

  return (
    <TeamDnaTooltipProvider>
      <main className="team-dna-page" aria-label="Team DNA">
        <TeamDnaExperience dataset={scenarioDataset} />
      </main>
      <TeamDnaDevPanel
        baseMembers={teamDna.members}
        devState={devState}
        setDevState={setDevState}
      />
    </TeamDnaTooltipProvider>
  );
}
