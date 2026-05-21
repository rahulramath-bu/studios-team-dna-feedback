import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TEAM_SIZE_PRESETS } from './teamDnaDevState.js';

/**
 * Dev-only scenario harness.
 *
 * What: hidden debug bar for stress-testing Team DNA states while designing.
 * How: toggles with backslash and mutates a separate dev overlay for team size,
 * missing avatars, incomplete assessments, shell preview, and transition flags.
 * Port: do not port this. The monolith should get these states from real data,
 * permissions, feature flags, and route context.
 */
export function TeamDnaDevPanel({ baseMembers, devState, setDevState }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '\\') {
        setDevState((current) => ({ ...current, isOpen: !current.isOpen }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDevState]);

  const updateMember = (memberId, patch) => {
    setDevState((current) => ({
      ...current,
      memberStates: {
        ...current.memberStates,
        [memberId]: {
          ...current.memberStates[memberId],
          ...patch,
        },
      },
    }));
  };

  const setTeamSize = (teamSize) => {
    setDevState((current) => ({ ...current, teamSize }));
  };

  const visibleMemberIds = new Set(
    baseMembers.slice(0, devState.teamSize).map((member) => member.id)
  );

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
                    onClick={() => setTeamSize(Math.max(0, devState.teamSize - 1))}
                  >
                    -
                  </button>
                  <span>{devState.teamSize}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTeamSize(Math.min(baseMembers.length, devState.teamSize + 1))
                    }
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
                      data-active={devState.teamSize === size || undefined}
                      onClick={() => setTeamSize(Math.min(size, baseMembers.length))}
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

              <DevSection title="Member states">
                <div className="team-dna-dev-member-list">
                  {baseMembers.map((member, index) => {
                    const state = devState.memberStates[member.id];
                    const isVisible = visibleMemberIds.has(member.id);

                    return (
                      <div
                        key={member.id}
                        className="team-dna-dev-member-row"
                        data-muted={!isVisible || undefined}
                      >
                        <span className="team-dna-dev-member-index">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="team-dna-dev-member-name">{member.name}</span>
                        <DevToggle
                          label="Avatar"
                          value={state.hasAvatar}
                          onChange={() =>
                            updateMember(member.id, { hasAvatar: !state.hasAvatar })
                          }
                        />
                        <DevToggle
                          label="DNA"
                          value={state.assessmentComplete}
                          onChange={() =>
                            updateMember(member.id, {
                              assessmentComplete: !state.assessmentComplete,
                            })
                          }
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
