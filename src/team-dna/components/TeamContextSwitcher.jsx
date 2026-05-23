import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BetterUpIcon } from './BetterUpIcon.jsx';

/**
 * Portable team-context control.
 *
 * What: small Team DNA-local switcher for choosing the currently viewed team
 * and opening team settings.
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
  onEditTeam,
  onTeamChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);
  const menuId = useId();
  const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId);
  const displayName = selectedTeam?.name ?? selectedTeamName ?? 'Select team';

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
        <label className="team-context-label" htmlFor="team-context-select">
          Currently viewing
        </label>
        <div className="team-context-menu-wrap">
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
            <span className="team-context-current-team">{displayName}</span>
            <span className="team-context-select-chevron" aria-hidden="true">
              <BetterUpIcon name="ChevronDown" size={20} strokeWidth={1.9} />
            </span>
          </button>
          {isOpen && (
            <div
              id={menuId}
              className="team-context-menu"
              role="menu"
              aria-label="Switch team"
            >
              {teamOptions.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className="team-context-menu-item"
                  data-selected={team.id === selectedTeamId || undefined}
                  role="menuitemradio"
                  aria-checked={team.id === selectedTeamId}
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <span>{team.name}</span>
                  {team.id === selectedTeamId && (
                    <BetterUpIcon name="Check" size={15} strokeWidth={2.2} />
                  )}
                </button>
              ))}
              <div className="team-context-menu-separator" aria-hidden="true" />
              <button
                type="button"
                className="team-context-menu-item team-context-menu-item--add"
                role="menuitem"
                onClick={handleAddTeam}
              >
                <BetterUpIcon name="Plus" size={15} strokeWidth={2.1} />
                <span>Add new team</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="team-context-edit-button"
        onClick={onEditTeam}
        disabled={disabled}
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
