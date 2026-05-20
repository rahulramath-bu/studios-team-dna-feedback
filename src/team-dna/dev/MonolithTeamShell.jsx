import React from 'react';

const tabs = ['Overview', 'Team Pulse', 'Team DNA', 'Team Coaching'];

const primaryLinks = [
  { label: 'Home', href: '/platform/member/home', icon: 'Home' },
  { label: 'Plans', href: '/platform/member/plans', icon: 'Note' },
  { label: 'Insights', href: '/frontend/grow/insights/me', icon: 'TrendingUp' },
  {
    label: 'AI Coaching',
    href: '/platform/lighthouse/chat?behavior=orchestration',
    icon: 'Sparkles',
  },
  {
    label: 'Team',
    href: '/platform/member/team-tooling',
    icon: 'Users',
    active: true,
  },
];

/**
 * Debug-only monolith composition harness.
 *
 * What: local visual preview of the likely monolith Team shell.
 * How: duplicates only enough navbar/tab chrome to judge the Team DNA panel in
 * context; none of these links or tabs are real product routes here.
 * Port: delete this wrapper. Mount TeamDnaExperience inside the real
 * MemberNavbar/Team route/PageTabs or route-driven subtab layout. Do not add
 * product content above the tabs; the team name/superpower belongs inside the
 * Team DNA tab panel unless Product changes the IA.
 */
export function MonolithTeamShell({ children, enabled }) {
  if (!enabled) {
    return children;
  }

  return (
    <div className="monolith-shell-preview">
      <MonolithPrimaryNav />
      <main className="monolith-shell-main">
        <section className="monolith-shell-content" aria-label="Team shell preview">
          <div className="monolith-page-tabs" role="tablist" aria-label="Team subtabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className="monolith-page-tab"
                data-active={tab === 'Team DNA' || undefined}
                role="tab"
                aria-selected={tab === 'Team DNA'}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="monolith-tab-panel" role="tabpanel">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

function MonolithPrimaryNav() {
  return (
    <header className="monolith-primary-nav" data-test-primary-nav>
      <div className="monolith-primary-nav-inner">
        <a className="monolith-primary-logo" href="/frontend/" aria-label="BetterUp">
          <img
            src="/team-dna/monolith/betterup-logotype-rebrand.svg"
            alt="BetterUp"
          />
        </a>
        <nav className="monolith-primary-links" aria-label="Primary">
          {primaryLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={link.active ? 'monolith-primary-link-active' : undefined}
              aria-current={link.active ? 'page' : undefined}
            >
              <MonolithNavIcon name={link.icon} />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className="monolith-primary-actions" aria-hidden="true">
          <span className="monolith-primary-action-link">Help</span>
          <span className="monolith-primary-avatar">P</span>
        </div>
      </div>
    </header>
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
    </svg>
  );
}
