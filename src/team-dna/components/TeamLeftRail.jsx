import React, { useEffect, useId, useRef, useState } from 'react';

/**
 * Team-scoped left nav (UME-inspired drawer).
 *
 * What: replaces the top-right team switcher with a quiet drawer on the left.
 * The drawer leads with the *team* (clickable to switch / edit / add) and then
 * lists per-team surfaces. No card chrome — just a vertical hairline against
 * the page, hairline dividers between sections, hover-to-expand labels.
 *
 * Port: when this lands in the monolith, swap `<button>` chrome for the
 * `partner-left-nav` web component and reuse the `useTeamContextSwitcher`
 * hook that backs the global team picker.
 */

const ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'dna', label: 'Team DNA' },
  { id: 'pulse', label: 'Team Pulse' },
  { id: 'coaching', label: 'Team Coaching' },
];

function RailIcon({ id }) {
  if (id === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 10.5 12 3l8.5 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }
  if (id === 'dna') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3c7 3 7 15 0 18" />
        <path d="M17 3c-7 3-7 15 0 18" />
        <path d="M8.5 7h7" />
        <path d="M7.5 12h9" />
        <path d="M8.5 17h7" />
      </svg>
    );
  }
  if (id === 'pulse') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    );
  }
  // coaching
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5 20c1-3.6 3.4-5.4 7-5.4S18 16.4 19 20" />
      <path d="M16.5 5.5l1.6-1.6" />
      <path d="M19.5 7.5h2.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10l5 5 5-5" />
    </svg>
  );
}

export function TeamLeftRail({
  activeId,
  onSelect,
  teamName,
  teamType,
  teamOptions = [],
  selectedTeamId,
  canManageTeam = false,
  onAddTeam,
  onEditTeam,
  onTeamChange,
}) {
  const [isHover, setHover] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const railRef = useRef(null);
  const menuId = useId();

  const otherTeams = teamOptions.filter((team) => team.id !== selectedTeamId);
  const canSwitchTeams = teamOptions.length > 0;
  const showSwitcherCaret = canSwitchTeams || canManageTeam;

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (railRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

  const handleTeamSwitcherClick = () => {
    if (!showSwitcherCaret) return;
    setMenuOpen((open) => !open);
    setHover(true);
  };

  const handleSelectTeam = (teamId) => {
    onTeamChange?.(teamId);
    setMenuOpen(false);
  };

  const handleEdit = () => {
    onEditTeam?.(selectedTeamId);
    setMenuOpen(false);
  };

  const handleAdd = () => {
    onAddTeam?.();
    setMenuOpen(false);
  };

  return (
    <aside
      ref={railRef}
      className="team-left-nav"
      data-hover={isHover || undefined}
      data-menu-open={isMenuOpen || undefined}
      aria-label="Team navigation"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        if (!isMenuOpen) setHover(false);
      }}
      onFocus={() => setHover(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !isMenuOpen) {
          setHover(false);
        }
      }}
    >
      <div className="team-left-nav-team">
        <button
          type="button"
          className="team-left-nav-team-trigger"
          aria-haspopup={showSwitcherCaret ? 'menu' : undefined}
          aria-expanded={showSwitcherCaret ? isMenuOpen : undefined}
          aria-controls={showSwitcherCaret ? menuId : undefined}
          onClick={handleTeamSwitcherClick}
        >
          <span className="team-left-nav-team-mark" aria-hidden="true">
            {teamName?.trim().charAt(0).toUpperCase() || 'T'}
          </span>
          <span className="team-left-nav-team-copy">
            <span className="team-left-nav-team-eyebrow">Team</span>
            <span className="team-left-nav-team-name" title={teamName}>
              {teamName || 'Untitled team'}
            </span>
            {teamType ? (
              <span className="team-left-nav-team-type">{teamType}</span>
            ) : null}
          </span>
          {showSwitcherCaret ? (
            <span className="team-left-nav-team-caret" aria-hidden="true">
              <ChevronIcon />
            </span>
          ) : null}
        </button>

        {showSwitcherCaret ? (
          <div
            id={menuId}
            className="team-left-nav-menu"
            role="menu"
            data-open={isMenuOpen || undefined}
            aria-hidden={!isMenuOpen}
          >
            {otherTeams.length > 0 ? (
              <div className="team-left-nav-menu-section">
                <span className="team-left-nav-menu-eyebrow">Switch team</span>
                {otherTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="team-left-nav-menu-item"
                    role="menuitemradio"
                    aria-checked={team.id === selectedTeamId}
                    tabIndex={isMenuOpen ? 0 : -1}
                    onClick={() => handleSelectTeam(team.id)}
                  >
                    <span
                      className="team-left-nav-menu-item-mark"
                      aria-hidden="true"
                    >
                      {team.name?.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="team-left-nav-menu-item-copy">
                      <span className="team-left-nav-menu-item-name">
                        {team.name}
                      </span>
                      {team.teamType ? (
                        <span className="team-left-nav-menu-item-type">
                          {team.teamType}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {canManageTeam ? (
              <div className="team-left-nav-menu-section">
                <button
                  type="button"
                  className="team-left-nav-menu-action"
                  role="menuitem"
                  tabIndex={isMenuOpen ? 0 : -1}
                  onClick={handleEdit}
                  disabled={!selectedTeamId}
                >
                  Manage members
                </button>
                <button
                  type="button"
                  className="team-left-nav-menu-action"
                  role="menuitem"
                  tabIndex={isMenuOpen ? 0 : -1}
                  onClick={handleAdd}
                >
                  + Create team
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <nav className="team-left-nav-items" aria-label="Team surfaces">
        {ITEMS.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className="team-left-nav-item"
              data-active={isActive || undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect?.(item.id)}
            >
              <span className="team-left-nav-item-icon" aria-hidden="true">
                <RailIcon id={item.id} />
              </span>
              <span className="team-left-nav-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
