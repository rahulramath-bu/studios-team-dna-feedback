import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [showEngineerIntro, setShowEngineerIntro] = useState(false);
  const [isEngineerIntroClosing, setIsEngineerIntroClosing] = useState(false);
  const [demoView, setDemoView] = useState('full');
  const engineerVideoRef = useRef(null);
  const engineerCloseTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (engineerCloseTimeoutRef.current) {
        window.clearTimeout(engineerCloseTimeoutRef.current);
      }
    },
    []
  );

  const openEngineerIntro = () => {
    if (engineerCloseTimeoutRef.current) {
      window.clearTimeout(engineerCloseTimeoutRef.current);
      engineerCloseTimeoutRef.current = null;
    }

    setIsEngineerIntroClosing(false);
    setShowEngineerIntro(true);
  };

  const closeEngineerIntro = () => {
    setIsEngineerIntroClosing(true);
    engineerCloseTimeoutRef.current = window.setTimeout(() => {
      setShowEngineerIntro(false);
      setIsEngineerIntroClosing(false);
      engineerCloseTimeoutRef.current = null;
    }, 360);
  };

  useEffect(() => {
    const video = engineerVideoRef.current;

    if (!showEngineerIntro || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.play?.().catch(() => {});
  }, [showEngineerIntro]);

  const startDemoFlow = (journey) => {
    const params = new URLSearchParams({ journey });
    if (demoView === 'wireframe') {
      params.set('view', 'wireframe');
    }

    onNavigate(`${DEMO_FLOW_PATH}?${params.toString()}`);
  };

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
        <div className="team-dna-hub-secondary-actions">
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
          <button
            type="button"
            className="team-dna-hub-demo-link"
            onClick={openEngineerIntro}
          >
            Hey There Engineers
          </button>
        </div>
      </section>

      {showDemoIntro && (
        <section
          className="team-dna-hub-demo-intro"
          aria-label="Prototype framing"
        >
          <button
            type="button"
            className="team-dna-hub-overlay-close"
            onClick={() => setShowDemoIntro(false)}
            aria-label="Close demo intro"
          >
            ×
          </button>
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
                onClick={() => startDemoFlow('user')}
              >
                Start user journey
              </button>
              <button
                type="button"
                onClick={() => startDemoFlow('manager')}
              >
                Start manager journey
              </button>
            </div>
            <div className="team-dna-hub-demo-wireframe-row">
              <span>Wireframe view</span>
              <button
                type="button"
                className="team-dna-hub-demo-wireframe-switch"
                role="switch"
                aria-label="Wireframe view"
                aria-checked={demoView === 'wireframe'}
                data-active={demoView === 'wireframe' || undefined}
                onClick={() =>
                  setDemoView((current) =>
                    current === 'wireframe' ? 'full' : 'wireframe'
                  )
                }
              >
                <i />
              </button>
            </div>
          </div>
        </section>
      )}

      {showEngineerIntro && (
        <section
          className="team-dna-hub-demo-intro"
          data-exiting={isEngineerIntroClosing || undefined}
          aria-label="Engineering handoff"
        >
          <button
            type="button"
            className="team-dna-hub-overlay-close"
            onClick={closeEngineerIntro}
            aria-label="Close engineering note"
          >
            ×
          </button>
          <div
            className="team-dna-hub-engineer-video"
            aria-label="Preetoshi video note"
          >
            <video
              ref={engineerVideoRef}
              autoPlay
              loop
              muted
              defaultMuted
              playsInline
              preload="auto"
              onLoadedMetadata={(event) => {
                event.currentTarget.muted = true;
                event.currentTarget.defaultMuted = true;
                event.currentTarget.volume = 0;
              }}
            >
              <source src="/preetoshi.webm" type="video/webm" />
            </video>
          </div>
          <div className="team-dna-hub-demo-intro-copy team-dna-hub-engineer-copy">
            <h2>Hope this makes your life easier</h2>
            <p>
              This prototype was built to be portable at the seams, but it is
              not a perfect drop-in. The real work will be stitching the
              assessment, Team DNA data, AI generation, profile photo,
              permissions, routing, responsiveness, and design-system seams
              into the monolith.
            </p>
            <p>
              There will likely be refactoring too, especially as you decide
              what should become shared production components versus what
              should be rebuilt or replaced. At the very least, I hope this
              repo gives you something useful to pull from piece by piece:
              keep what helps, replace what needs to change, and build what
              the monolith actually needs.
            </p>
            <p className="team-dna-hub-engineer-readme-note">
              The README is the map. Please have Claude read the README first
              and cross-reference it with the code, because it explains what
              should port cleanly, what is prototype-only, and where the
              remaining seams are.
            </p>
            <a
              className="team-dna-hub-engineer-cta"
              href="https://github.com/betterup/studios-team-dna"
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub README
            </a>
          </div>
        </section>
      )}
    </main>
  );
}

export function App() {
  const { pathname, route, navigate } = useRoute();
  const routeKey = useMemo(() => `${route}:${pathname}`, [pathname, route]);
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
