import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BetterUpIcon } from './BetterUpIcon.jsx';

/**
 * Portable team-context control.
 *
 * What: small Team DNA-local switcher for choosing the currently viewed team
 * and opening per-team settings from the same menu.
 * Port: replace `teamOptions` with the universal team context source later.
 * Keep the component shape: selected team id, switch callback, edit callback.
 */
export function TeamContextSwitcher({
  teamOptions,
  selectedTeamId,
  selectedTeamName,
  disabled = false,
  introHidden = false,
  topOffset = 18,
  onAddTeam,
  onEditTeam,
  onTeamChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);
  const menuId = useId();
  const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId);
  const otherTeamOptions = teamOptions.filter((team) => team.id !== selectedTeamId);
  const displayName = selectedTeam?.name ?? selectedTeamName ?? 'Select team';
  const getTeamInitial = (teamName) =>
    teamName?.trim().charAt(0).toUpperCase() || '?';
  const hasMemberCount = (count) => typeof count === 'number';

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (switcherRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTeamSelect = (teamId) => {
    onTeamChange?.(teamId);
    setIsOpen(false);
  };

  const handleAddTeam = () => {
    onAddTeam?.();
    setIsOpen(false);
  };

  const handleEditTeam = () => {
    onEditTeam?.(selectedTeamId);
    setIsOpen(false);
  };

  const switcher = (
    <div
      ref={switcherRef}
      className="team-context-switcher"
      data-intro-hidden={introHidden || undefined}
      style={{ '--team-context-top': `${topOffset}px` }}
      aria-label="Currently viewed team"
    >
      <div className="team-context-select-group">
        <div className="team-context-menu-wrap" data-open={isOpen || undefined}>
          <div className="team-context-menu-trigger-row">
            <button
              type="button"
              id="team-context-select"
              className="team-context-menu-trigger"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
              disabled={disabled}
              onClick={() => setIsOpen((current) => !current)}
            >
              <span className="team-context-trigger-copy">
                <span className="team-context-label">Team</span>
                <span className="team-context-current-team">{displayName}</span>
              </span>
              <span className="team-context-select-chevron" aria-hidden="true">
                <BetterUpIcon name="ChevronDown" size={20} strokeWidth={1.9} />
              </span>
            </button>
          </div>
          <div className="team-context-menu-shell" data-open={isOpen || undefined}>
            <div
              id={menuId}
              className="team-context-menu"
              role="menu"
              aria-label="Switch team"
              aria-hidden={!isOpen}
            >
              {otherTeamOptions.map((team) => (
                <div
                  key={team.id}
                  className="team-context-menu-item"
                  data-selected={team.id === selectedTeamId || undefined}
                  role="none"
                >
                  <button
                    type="button"
                    className="team-context-team-button"
                    role="menuitemradio"
                    aria-checked={team.id === selectedTeamId}
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => handleTeamSelect(team.id)}
                  >
                    <span className="team-context-team-mark" aria-hidden="true">
                      {getTeamInitial(team.name)}
                    </span>
                    <span className="team-context-team-copy">
                      <span className="team-context-team-name">{team.name}</span>
                      {team.teamType ? (
                        <span className="team-context-team-type">
                          {team.teamType}
                        </span>
                      ) : null}
                    </span>
                    {hasMemberCount(team.memberCount) && (
                      <span
                        className="team-context-team-count"
                        aria-label={`${team.memberCount} ${
                          team.memberCount === 1 ? 'member' : 'members'
                        }`}
                      >
                        <BetterUpIcon name="Users" size={13} strokeWidth={1.9} />
                        <span>{team.memberCount}</span>
                      </span>
                    )}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="team-context-menu-item team-context-menu-item--add"
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
                onClick={handleAddTeam}
              >
                <span className="team-context-team-button team-context-team-button--add">
                  <span className="team-context-team-mark team-context-team-mark--add" aria-hidden="true">
                    <BetterUpIcon name="Plus" size={15} strokeWidth={2.1} />
                  </span>
                  <span className="team-context-team-copy">
                    <span className="team-context-team-name">Add team</span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="team-context-edit-button"
        onClick={handleEditTeam}
        disabled={disabled || !selectedTeamId}
        aria-label={`Edit ${displayName}`}
      >
        <BetterUpIcon name="Edit" size={18} strokeWidth={1.8} />
      </button>
    </div>
  );

  if (typeof document === 'undefined') {
    return switcher;
  }

  return createPortal(switcher, document.body);
}
