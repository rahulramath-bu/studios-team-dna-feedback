import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TEAM_DNA_GENERATION_STATUSES } from '../data/teamDnaGenerationLifecycle.mock.js';

const GENERATION_STATUS_LABELS = {
  not_ready: 'waiting',
  pending: 'generating',
  ready: 'ready',
  failed: 'failed',
  stale: 'stale',
};

const GENERATION_STATUS_DESCRIPTIONS = {
  not_ready: {
    title: 'Waiting for enough assessment data',
    body: 'Mutates member assessment completion so the source data is actually incomplete. This is mainly for team pages, and defensive for person/duo routes because pending people are not normally selectable.',
  },
  pending: {
    title: 'AI generation is in progress',
    body: 'Enough assessment data exists, so the page shows the deterministic fallback while the backend writes the generated insight.',
  },
  ready: {
    title: 'Generated insight is ready',
    body: 'The AI-enriched copy matches the current source data, so the page shows the normal generated insight.',
  },
  failed: {
    title: 'AI generation failed',
    body: 'Enough assessment data still exists, so the page quietly shows deterministic fallback. This should usually be logged for engineering instead of announced to the user.',
  },
  stale: {
    title: 'Generated insight needs refresh',
    body: 'Old generated copy still exists, but new team or assessment data arrived. This is mainly useful for team/admin views where a refresh decision is visible.',
  },
};

/**
 * Dev-only scenario harness.
 *
 * What: hidden debug bar for stress-testing Team DNA states while designing.
 * How: toggles with backslash. Access, viewer identity, team size, avatar
 * availability, assessment completion, and generated-insight lifecycle controls
 * call back into canonical TeamDnaPage data so they match the real porting
 * contract.
 * Port: do not port this. The monolith should get these states from real data,
 * permissions, feature flags, and route context.
 */
export function TeamDnaDevPanel({
  activeGenerationTarget,
  baseMembers,
  canResizeTeam,
  devState,
  onSetGenerationStatus,
  onSetTeamSize,
  onToggleMemberAssessment,
  onToggleMemberAvatar,
  setDevState,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '\\') {
        setDevState((current) => ({ ...current, isOpen: !current.isOpen }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDevState]);

  const setTeamSize = (teamSize) => {
    onSetTeamSize?.(teamSize);
  };
  const teamSize = baseMembers.length;
  const viewerMemberId = devState.viewerMemberId ?? baseMembers[0]?.id ?? null;
  const selectedGenerationStatus =
    devState.generationStatusByTargetId?.[activeGenerationTarget?.id] ??
    activeGenerationTarget?.status;
  const generationDescription =
    GENERATION_STATUS_DESCRIPTIONS[selectedGenerationStatus] ??
    (activeGenerationTarget
      ? {
          title: 'Choose a lifecycle state',
          body: 'Click one state to simulate the backend generation lifecycle for this target.',
        }
      : null);

  return (
    <>
      <button
        type="button"
        className="team-dna-dev-tab"
        onClick={() =>
          setDevState((current) => ({ ...current, isOpen: !current.isOpen }))
        }
        aria-pressed={devState.isOpen}
      >
        Debug <span>\</span>
      </button>

      <AnimatePresence>
        {devState.isOpen && (
          <motion.aside
            className="team-dna-dev-panel"
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            aria-label="Team DNA debug panel"
          >
            <div className="team-dna-dev-panel-bg" />
            <div className="team-dna-dev-content">
              <header className="team-dna-dev-header">
                <h2>Debug</h2>
                <p>
                  Press <span>\</span> to toggle
                </p>
              </header>

              <DevSection title="Team size">
                <div className="team-dna-dev-stepper">
                  <button
                    type="button"
                    disabled={!canResizeTeam}
                    onClick={() => setTeamSize(Math.max(0, teamSize - 1))}
                  >
                    -
                  </button>
                  <span>{teamSize}</span>
                  <button
                    type="button"
                    disabled={!canResizeTeam}
                    onClick={() => setTeamSize(teamSize + 1)}
                  >
                    +
                  </button>
                </div>
              </DevSection>

              <DevSection title="Shell">
                <DevToggle
                  label="Monolith shell"
                  value={devState.showMonolithShell}
                  onChange={() =>
                    setDevState((current) => ({
                      ...current,
                      showMonolithShell: !current.showMonolithShell,
                    }))
                  }
                />
              </DevSection>

              <DevSection title="Access">
                <DevToggle
                  label="Manager/admin"
                  value={devState.canManageTeam !== false}
                  onChange={() =>
                    setDevState((current) => ({
                      ...current,
                      canManageTeam: current.canManageTeam === false,
                      viewerMemberId:
                        current.viewerMemberId ?? baseMembers[0]?.id ?? null,
                    }))
                  }
                />
              </DevSection>

              {devState.canManageTeam === false && baseMembers.length > 0 && (
                <DevSection title="Viewer" meta="signed-in member">
                  <div className="team-dna-dev-chip-row">
                    {baseMembers.map((member) => {
                      const isActive = viewerMemberId === member.id;

                      return (
                        <button
                          key={member.id}
                          type="button"
                          className="team-dna-dev-chip"
                          data-active={isActive || undefined}
                          onClick={() =>
                            setDevState((current) => ({
                              ...current,
                              viewerMemberId: member.id,
                            }))
                          }
                        >
                          {member.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </DevSection>
              )}

              {baseMembers.length > 0 && (
                <DevSection title="Member states">
                  <div className="team-dna-dev-member-list">
                    {baseMembers.map((member, index) => {
                      const hasAvatar = Boolean(member.avatarUrl);
                      const hasDna = member.assessmentComplete !== false;

                      return (
                        <div
                          key={member.id}
                          className="team-dna-dev-member-row"
                        >
                          <span className="team-dna-dev-member-index">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="team-dna-dev-member-name">
                            {member.name}
                          </span>
                          <DevToggle
                            label="Avatar"
                            value={hasAvatar}
                            onChange={() => onToggleMemberAvatar?.(member.id)}
                          />
                          <DevToggle
                            label="DNA"
                            value={hasDna}
                            onChange={() =>
                              onToggleMemberAssessment?.(member.id)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </DevSection>
              )}

              <DevSection
                title="AI lifecycle"
                meta={activeGenerationTarget?.id ?? 'none'}
              >
                <div className="team-dna-dev-chip-row">
                  {TEAM_DNA_GENERATION_STATUSES.map((status) => {
                    const isActive = selectedGenerationStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        className="team-dna-dev-chip"
                        disabled={!activeGenerationTarget}
                        data-active={isActive || undefined}
                        onClick={() =>
                          onSetGenerationStatus?.(
                            activeGenerationTarget,
                            status,
                            `debug:set:${status}`
                          )
                        }
                      >
                        {GENERATION_STATUS_LABELS[status]}
                      </button>
                    );
                  })}
                </div>
                {generationDescription && (
                  <div className="team-dna-dev-status-copy">
                    <h4>{generationDescription.title}</h4>
                    <p>{generationDescription.body}</p>
                  </div>
                )}
              </DevSection>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function DevSection({ title, meta, children }) {
  return (
    <section className="team-dna-dev-section">
      <div className="team-dna-dev-section-header">
        <h3>{title}</h3>
        {meta && <span>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function DevToggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      className="team-dna-dev-toggle"
      data-active={value || undefined}
      onClick={onChange}
      aria-pressed={value}
    >
      <span>{label}</span>
      <i />
    </button>
  );
}
