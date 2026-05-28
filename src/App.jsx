import React, { useEffect, useMemo, useState } from 'react';
import { TeamDnaPage } from './team-dna/TeamDnaPage.jsx';
import { TeamDnaAssessmentPage } from './team-dna-assessment/TeamDnaAssessmentPage.jsx';
import { DemoFlowPage } from './demo-flow/DemoFlowPage.jsx';
import { DEMO_FLOW_PATH } from './demo-flow/demoFlowMoments.js';
import './app-shell/appHub.css';

const TEAM_DNA_PATH = '/team-dna';
const ASSESSMENT_PATH = '/assessment';

function getRoute(pathname) {
  if (pathname === TEAM_DNA_PATH) return 'team-dna';
  if (pathname === ASSESSMENT_PATH) return 'assessment';
  if (pathname === DEMO_FLOW_PATH) return 'flow-demo';
  if (pathname === '/') return 'hub';
  return 'unknown';
}

function useRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPath) => {
    if (window.location.pathname === nextPath) return;
    window.history.pushState({}, '', nextPath);
    setPathname(window.location.pathname);
  };

  return { pathname, route: getRoute(pathname), navigate };
}

function SurfaceIcon({ type }) {
  if (type === 'dna') {
    return (
      <svg
        className="team-dna-hub-card-icon team-dna-hub-card-icon--dna"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M7 3c7 3 7 15 0 18" />
        <path d="M17 3c-7 3-7 15 0 18" />
        <path d="M8.5 7h7" />
        <path d="M7.5 12h9" />
        <path d="M8.5 17h7" />
      </svg>
    );
  }

  return (
    <svg
      className="team-dna-hub-card-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="3" />
      <circle cx="6.5" cy="12" r="2.4" />
      <circle cx="17.5" cy="12" r="2.4" />
      <path d="M5 20c.8-3 3.1-4.6 7-4.6s6.2 1.6 7 4.6" />
      <path d="M2.8 18.5c.5-2 1.7-3.1 3.7-3.4" />
      <path d="M21.2 18.5c-.5-2-1.7-3.1-3.7-3.4" />
    </svg>
  );
}

function SurfaceLink({ eyebrow, title, body, href, icon, onNavigate }) {
  return (
    <a
      className="team-dna-hub-card"
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      <SurfaceIcon type={icon} />
      <span className="team-dna-hub-card-eyebrow">{eyebrow}</span>
      <strong>{title}</strong>
      <span>{body}</span>
    </a>
  );
}

function PrototypeHub({ onNavigate }) {
  const [showDemoIntro, setShowDemoIntro] = useState(false);

  return (
    <main className="team-dna-hub" aria-label="Team DNA prototype hub">
      <section className="team-dna-hub-inner">
        <div className="team-dna-hub-grid">
          <SurfaceLink
            eyebrow="Surface 1"
            title="The DNA Finder"
            body="Capture your work-style signals, Big Five shape, and context for the profile."
            href="/assessment"
            icon="dna"
            onNavigate={onNavigate}
          />
          <SurfaceLink
            eyebrow="Surface 2"
            title="Team Page"
            body="See those signals become team, person, and pair reads for working together."
            href={TEAM_DNA_PATH}
            icon="team"
            onNavigate={onNavigate}
          />
        </div>
        <a
          className="team-dna-hub-demo-link"
          href={DEMO_FLOW_PATH}
          onClick={(event) => {
            event.preventDefault();
            setShowDemoIntro(true);
          }}
        >
          Demo The Flow
        </a>
      </section>

      {showDemoIntro && (
        <section
          className="team-dna-hub-demo-intro"
          aria-label="Prototype framing"
        >
          <div className="team-dna-hub-demo-intro-copy">
            <h2>A concept prototype</h2>
            <p>
              This is a working preview, shaped to be changed with your team.
              As we walk through it, your feedback can directly shape what it
              becomes.
            </p>
            <div className="team-dna-hub-demo-intro-actions">
              <button
                type="button"
                onClick={() => onNavigate(`${DEMO_FLOW_PATH}?journey=user`)}
              >
                Start user journey
              </button>
              <button
                type="button"
                onClick={() => onNavigate(`${DEMO_FLOW_PATH}?journey=manager`)}
              >
                Start manager journey
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export function App() {
  const { pathname, route, navigate } = useRoute();
  const routeKey = useMemo(() => `${route}:${pathname}`, [pathname, route]);

  if (route === 'team-dna') {
    return <TeamDnaPage key={routeKey} />;
  }

  if (route === 'assessment') {
    return <TeamDnaAssessmentPage key={routeKey} onNavigate={navigate} />;
  }

  if (route === 'flow-demo') {
    return <DemoFlowPage key={routeKey} onNavigate={navigate} />;
  }

  return <PrototypeHub key={routeKey} onNavigate={navigate} />;
}
