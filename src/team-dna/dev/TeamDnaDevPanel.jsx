import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TEAM_SIZE_PRESETS } from './teamDnaDevState.js';
import { TEAM_DNA_GENERATION_STATUSES } from '../data/teamDnaGenerationLifecycle.mock.js';

/**
 * Dev-only scenario harness.
 *
 * What: hidden debug bar for stress-testing Team DNA states while designing.
 * How: toggles with backslash. Shell/behavior controls are local debug flags;
 * team size, avatar availability, and DNA completion call back into canonical
 * TeamDnaPage data so they match the real porting contract.
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
  showLayoutOutlines,
  setShowLayoutOutlines,
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
                <div className="team-dna-dev-chip-row">
                  {TEAM_SIZE_PRESETS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="team-dna-dev-chip"
                      disabled={!canResizeTeam}
                      data-active={teamSize === size || undefined}
                      onClick={() => setTeamSize(size)}
                    >
                      {size}
                    </button>
                  ))}
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

              <DevSection title="Behavior">
                <DevToggle
                  label="Layout outlines"
                  value={showLayoutOutlines}
                  onChange={() => setShowLayoutOutlines((current) => !current)}
                />
                <DevToggle
                  label="Keep insight scroll"
                  value={devState.preserveInsightScroll}
                  onChange={() =>
                    setDevState((current) => ({
                      ...current,
                      preserveInsightScroll: !current.preserveInsightScroll,
                    }))
                  }
                />
              </DevSection>

              <DevSection title="AI lifecycle">
                <div className="team-dna-dev-target">
                  <span>Target</span>
                  <strong>{activeGenerationTarget?.id ?? 'none'}</strong>
                </div>
                <div className="team-dna-dev-chip-row">
                  {TEAM_DNA_GENERATION_STATUSES.map((status) => {
                    const isActive =
                      devState.generationStatusByTargetId?.[
                        activeGenerationTarget?.id
                      ] === status;

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
                        {status}
                      </button>
                    );
                  })}
                </div>
                <div className="team-dna-dev-action-grid">
                  <DevAction
                    label="Request"
                    disabled={!activeGenerationTarget}
                    onClick={() =>
                      onSetGenerationStatus?.(
                        activeGenerationTarget,
                        'pending',
                        'teamDnaInsightGenerationRequested'
                      )
                    }
                  />
                  <DevAction
                    label="Succeed"
                    disabled={!activeGenerationTarget}
                    onClick={() =>
                      onSetGenerationStatus?.(
                        activeGenerationTarget,
                        'ready',
                        'teamDnaInsightGenerationSucceeded'
                      )
                    }
                  />
                  <DevAction
                    label="Fail"
                    disabled={!activeGenerationTarget}
                    onClick={() =>
                      onSetGenerationStatus?.(
                        activeGenerationTarget,
                        'failed',
                        'teamDnaInsightGenerationFailed'
                      )
                    }
                  />
                  <DevAction
                    label="Mark stale"
                    disabled={!activeGenerationTarget}
                    onClick={() =>
                      onSetGenerationStatus?.(
                        activeGenerationTarget,
                        'stale',
                        'teamDnaTeamInsightMarkedStale'
                      )
                    }
                  />
                </div>
                {devState.lastGenerationEvent && (
                  <p className="team-dna-dev-event">
                    {devState.lastGenerationEvent.type}
                  </p>
                )}
              </DevSection>

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
                        <span className="team-dna-dev-member-name">{member.name}</span>
                        <DevToggle
                          label="Avatar"
                          value={hasAvatar}
                          onChange={() => onToggleMemberAvatar?.(member.id)}
                        />
                        <DevToggle
                          label="DNA"
                          value={hasDna}
                          onChange={() => onToggleMemberAssessment?.(member.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </DevSection>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function DevSection({ title, children }) {
  return (
    <section className="team-dna-dev-section">
      <h3>{title}</h3>
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

function DevAction({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      className="team-dna-dev-action"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
