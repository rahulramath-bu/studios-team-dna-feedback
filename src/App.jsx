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

function readLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

function useRoute() {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const handlePopState = () => setLocation(readLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPath) => {
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === nextPath) return;
    window.history.pushState({}, '', nextPath);
    setLocation(readLocation());
  };

  return {
    pathname: location.pathname,
    search: location.search,
    route: getRoute(location.pathname),
    navigate,
  };
}

function useDemoOnlyWireframeFlag() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isWireframe = params.get('view') === 'wireframe';

    if (isWireframe) {
      document.documentElement.setAttribute(
        'data-demo-only-wireframe',
        'true'
      );
    } else {
      document.documentElement.removeAttribute('data-demo-only-wireframe');
    }

    return () => {
      document.documentElement.removeAttribute('data-demo-only-wireframe');
    };
  });
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

  if (type === 'person') {
    return (
      <svg
        className="team-dna-hub-card-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.6" />
        <path d="M5.5 20c.6-4 3.2-6 6.5-6s5.9 2 6.5 6" />
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
  return (
    <main className="team-dna-hub" aria-label="Team DNA prototype hub">
      <section className="team-dna-hub-inner">
        <div className="team-dna-hub-grid">
          <SurfaceLink
            eyebrow="For the manager"
            title="Manager Flow"
            body="Start the manager journey — explore the team, person, and pair reads for working together."
            href={`${DEMO_FLOW_PATH}?journey=manager`}
            icon="team"
            onNavigate={onNavigate}
          />
          <SurfaceLink
            eyebrow="For the individual"
            title="Direct Report Flow"
            body="Start the user journey — sign up, take the assessment, and build a Team DNA profile."
            href={`${DEMO_FLOW_PATH}?journey=user`}
            icon="person"
            onNavigate={onNavigate}
          />
        </div>
      </section>
    </main>
  );
}

export function App() {
  const { pathname, search, route, navigate } = useRoute();
  const routeKey = useMemo(
    () => `${route}:${pathname}${search}`,
    [pathname, search, route]
  );
  useDemoOnlyWireframeFlag();

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
