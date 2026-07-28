import React, { useEffect, useRef, useState } from 'react';

const primaryLinks = [
  {
    label: 'Home',
    // Member homepage (UME cards + AI composer). target=_top so it breaks out
    // of the demo iframe into the full-page experience.
    href: '/home',
    icon: 'Home',
    top: true,
  },
  // Links without an href are visual stand-ins for surfaces this prototype
  // doesn't cover; they render as inert so clicks don't dump the viewer back
  // at the prototype chooser (only the BetterUp logo resets the demo).
  { label: 'Insights', href: null, icon: 'TrendingUp' },
  {
    label: 'AI Coaching',
    // Local prototype of the Lighthouse member chat (production:
    // /platform/lighthouse/chat?behavior=orchestration). target=_top so it
    // breaks out of the demo iframe into the full-page experience.
    href: '/ai-coaching',
    icon: 'Sparkles',
    top: true,
  },
  {
    label: 'Team',
    // Team tooling home (Team DNA landing). The BetterUp logo is what resets
    // back to the prototype hub (manager vs direct-report flows).
    href: '/team-dna',
    icon: 'Users',
    top: true,
  },
  { label: 'Discover', href: null, icon: 'Globe' },
  { label: 'Schedule', href: null, icon: 'Calendar' },
];

const utilityLinks = [
  { label: 'Saved', icon: 'Bookmark' },
  { label: 'Messages', icon: 'Messages', badge: '1' },
  { label: 'Help', icon: 'Help' },
];

/**
 * Debug-only monolith composition harness.
 *
 * What: local visual preview of the likely monolith Team shell.
 * How: duplicates only enough BetterUp member navbar chrome to judge the Team
 * DNA panel in context; none of these links are real product routes here.
 * Port: delete this wrapper. Mount TeamDnaExperience inside the real
 * MemberNavbar/Team route. Do not port the local CSS; use the real nav and
 * only carry Team DNA panel styles.
 */
export function MonolithTeamShell({
  children,
  enabled,
  toolbar = null,
  viewerPersona = 'manager',
  onSelectPersona = null,
}) {
  if (!enabled) {
    return (
      <>
        {toolbar}
        {children}
      </>
    );
  }

  return (
    <div className="monolith-shell-preview">
      <MonolithPrimaryNav
        viewerPersona={viewerPersona}
        onSelectPersona={onSelectPersona}
      />
      {toolbar}
      <main className="monolith-shell-main">
        <section className="monolith-shell-content" aria-label="Team shell preview">
          {children}
        </section>
      </main>
    </div>
  );
}

export function MonolithPrimaryNav({
  viewerPersona = 'manager',
  onSelectPersona = null,
  activeLabel = 'Team',
  endExtra = null,
}) {
  return (
    <header className="monolith-primary-nav" data-test-primary-nav>
      <div className="monolith-primary-nav-inner">
        <a
          className="monolith-primary-logo"
          href="/"
          target="_top"
          aria-label="BetterUp"
        >
          <img
            src="/team-dna/monolith/betterup-logotype-rebrand.svg"
            alt="BetterUp"
          />
        </a>
        <nav className="monolith-primary-links" aria-label="Primary">
          {primaryLinks.map((link) => (
            <a
              key={link.label}
              href={link.href ?? undefined}
              target={link.href && link.top ? '_top' : undefined}
              className={
                link.label === activeLabel
                  ? 'monolith-primary-link-active'
                  : undefined
              }
              aria-current={link.label === activeLabel ? 'page' : undefined}
              aria-disabled={link.href ? undefined : 'true'}
            >
              <MonolithNavIcon name={link.icon} />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className="monolith-primary-end">
          {endExtra}
          {onSelectPersona ? (
            <MonolithPersonaToggle
              viewerPersona={viewerPersona}
              onSelectPersona={onSelectPersona}
            />
          ) : null}
          <nav className="monolith-primary-actions" aria-label="Utilities">
            {utilityLinks.map((link) => (
              <a key={link.label} aria-disabled="true">
                <span className="monolith-primary-action-icon-wrap">
                  <MonolithNavIcon name={link.icon} />
                  {link.badge && (
                    <span className="monolith-primary-badge">{link.badge}</span>
                  )}
                </span>
                <span>{link.label}</span>
              </a>
            ))}
            <a
              className="monolith-primary-avatar-link"
              aria-label="Profile"
              aria-disabled="true"
            >
              <img
                className="monolith-primary-avatar"
                src="/team-dna/avatars/demo-indian-woman.png"
                alt=""
              />
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

// Demo-only chrome: lets a reviewer preview the hub as a manager (can create
// teams) vs. a direct report (View Team DNA states). Real product nav reflects
// the signed-in person's role, so this control would not ship.
const PERSONA_OPTIONS = [
  { id: 'manager', label: 'Manager' },
  { id: 'member', label: 'Direct report' },
];

function MonolithPersonaToggle({ viewerPersona, onSelectPersona }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const activeLabel =
    PERSONA_OPTIONS.find((option) => option.id === viewerPersona)?.label ??
    PERSONA_OPTIONS[0].label;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (id) => {
    onSelectPersona?.(id);
    setOpen(false);
  };

  return (
    <div className="monolith-persona-menu" ref={rootRef}>
      <button
        type="button"
        className="monolith-persona-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="monolith-persona-menu-eyebrow">View as</span>
        <span className="monolith-persona-menu-value">{activeLabel}</span>
        <svg
          className="monolith-persona-menu-caret"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M4 6.5 8 10l4-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div
          className="monolith-persona-menu-pop"
          role="menu"
          aria-label="Demo: view hub as"
        >
          {PERSONA_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={option.id === viewerPersona}
              className="monolith-persona-menu-item"
              data-active={option.id === viewerPersona || undefined}
              onClick={() => handleSelect(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MonolithNavIcon({ name }) {
  return (
    <svg
      className="monolith-primary-icon"
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
    >
      {name === 'Home' && (
        <>
          <path d="M3.5 10.5 12 3l8.5 7.5" />
          <path d="M5.5 9.5V20h13V9.5" />
          <path d="M9.5 20v-6h5v6" />
        </>
      )}
      {name === 'Note' && (
        <>
          <path d="M7 4h7l4 4v12H7z" />
          <path d="M14 4v5h5" />
          <path d="M9.5 13h5" />
          <path d="M9.5 16h5" />
        </>
      )}
      {name === 'TrendingUp' && (
        <>
          <path d="M4 17 10 11l4 4 6-8" />
          <path d="M15 7h5v5" />
        </>
      )}
      {name === 'Sparkles' && (
        <>
          <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
          <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
        </>
      )}
      {name === 'Users' && (
        <>
          <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M2.5 20c.7-3.8 3-6 6.5-6s5.8 2.2 6.5 6" />
          <path d="M16 11a3 3 0 1 0-1.2-5.75" />
          <path d="M16.5 14.3c2.8.6 4.4 2.5 5 5.7" />
        </>
      )}
      {name === 'Globe' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17" />
          <path d="M12 3.5c2.1 2.2 3.2 5 3.2 8.5s-1.1 6.3-3.2 8.5" />
          <path d="M12 3.5C9.9 5.7 8.8 8.5 8.8 12s1.1 6.3 3.2 8.5" />
        </>
      )}
      {name === 'Calendar' && (
        <>
          <path d="M6.5 4v3" />
          <path d="M17.5 4v3" />
          <path d="M4.5 8h15" />
          <rect x="4.5" y="5.5" width="15" height="14" rx="1.5" />
        </>
      )}
      {name === 'Bookmark' && (
        <>
          <path d="M7 4.5h10v15l-5-3.2-5 3.2z" />
        </>
      )}
      {name === 'Messages' && (
        <>
          <path d="M5 5h14v10H8.5L5 18.5z" />
        </>
      )}
      {name === 'Help' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.8 9a2.35 2.35 0 0 1 2.35-1.55c1.55 0 2.65.95 2.65 2.3 0 1.2-.7 1.8-1.7 2.45-.75.5-1.1.95-1.1 1.8" />
          <path d="M12 17h.01" />
        </>
      )}
    </svg>
  );
}
