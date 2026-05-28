import React, { useMemo, useState } from 'react';
import { BetterUpIcon } from '../team-dna/components/BetterUpIcon.jsx';
import { getDemoFlowJourney } from './demoFlowMoments.js';
import './demoFlow.css';
import './demoOnlyWireframeMode.css';

function getDemoJourneyId() {
  if (typeof window === 'undefined') return 'user';

  const params = new URLSearchParams(window.location.search);
  return params.get('journey') ?? 'user';
}

function getDemoViewMode() {
  if (typeof window === 'undefined') return 'full';

  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'wireframe' ? 'wireframe' : 'full';
}

function clampIndex(index, total) {
  return Math.max(0, Math.min(index, total - 1));
}

function addDemoOnlyViewMode(url, viewMode) {
  if (viewMode !== 'wireframe') return url;

  const [path, hash = ''] = url.split('#');
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('view', 'wireframe');

  return `${base}?${params.toString()}${hash ? `#${hash}` : ''}`;
}

export function DemoFlowPage({ onNavigate }) {
  const journey = useMemo(() => getDemoFlowJourney(getDemoJourneyId()), []);
  const viewMode = useMemo(() => getDemoViewMode(), []);
  const demoFlowMoments = journey.moments;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const activeMoment = demoFlowMoments[activeIndex];
  const activeSurfaceUrl = useMemo(
    () => addDemoOnlyViewMode(activeMoment.surfaceUrl, viewMode),
    [activeMoment.surfaceUrl, viewMode]
  );
  const progress = useMemo(
    () => ((activeIndex + 1) / demoFlowMoments.length) * 100,
    [activeIndex]
  );

  const goToMoment = (index) => {
    setActiveIndex(clampIndex(index, demoFlowMoments.length));
  };

  const goHome = () => {
    onNavigate?.('/');
  };

  return (
    <main
      className="team-dna-demo-flow"
      data-demo-only-view={viewMode}
      aria-label="Team DNA flow demo"
    >
      <section className="team-dna-demo-flow-stage">
        <iframe
          key={activeMoment.id}
          className="team-dna-demo-flow-frame"
          src={activeSurfaceUrl}
          title={activeMoment.title}
        />
      </section>

      <aside
        className="team-dna-demo-flow-remote"
        data-expanded={isPinnedOpen || undefined}
        aria-label="Demo controls"
      >
        <button
          type="button"
          className="team-dna-demo-flow-handle"
          onClick={() => setIsPinnedOpen((current) => !current)}
          aria-label={isPinnedOpen ? 'Hide demo controls' : 'Show demo controls'}
          aria-pressed={isPinnedOpen}
        >
          Demo Flow
        </button>

        <div
          className="team-dna-demo-flow-progress"
          aria-hidden="true"
        >
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="team-dna-demo-flow-copy">
          <p>
            {activeMoment.phase}
            <button
              type="button"
              className="team-dna-demo-flow-home"
              onClick={goHome}
              aria-label="Back to hub"
            >
              <BetterUpIcon name="Home" size={15} strokeWidth={2} />
            </button>
          </p>
          <h1>{activeMoment.title}</h1>
          <span>{activeMoment.note}</span>
        </div>

        <ol className="team-dna-demo-flow-dots" aria-label="Demo moments">
          {demoFlowMoments.map((moment, index) => (
            <li key={moment.id}>
              <button
                type="button"
                className="team-dna-demo-flow-dot"
                data-active={index === activeIndex || undefined}
                data-phase={moment.phase === activeMoment.phase || undefined}
                onClick={() => goToMoment(index)}
                aria-label={`Go to ${moment.label}`}
                title={moment.label}
              >
                <span>{index + 1}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="team-dna-demo-flow-actions">
          <button
            type="button"
            aria-label="Previous demo moment"
            onClick={() => goToMoment(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            <BetterUpIcon name="ChevronLeft" size={18} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="team-dna-demo-flow-primary"
            aria-label="Next demo moment"
            onClick={() => goToMoment(activeIndex + 1)}
            disabled={activeIndex === demoFlowMoments.length - 1}
          >
            <BetterUpIcon name="ChevronRight" size={18} strokeWidth={2.2} />
          </button>
        </div>
      </aside>
    </main>
  );
}
