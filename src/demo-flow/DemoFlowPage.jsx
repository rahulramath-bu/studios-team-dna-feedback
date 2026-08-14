import React, { useEffect, useMemo, useState } from 'react';
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

function parseMomentSurface(surfaceUrl) {
  const [, query = ''] = (surfaceUrl ?? '').split('?');
  const params = new URLSearchParams(query);
  const rawQ = params.get('q');
  return {
    demo: params.get('demo') ?? '',
    q: rawQ === null ? null : Number(rawQ),
  };
}

// Maps a progress report coming from a surface (e.g. the assessment running in
// the iframe) to the closest demo moment, so the control panel can follow along
// as the user clicks through the real surface instead of the demo's controls.
function findMomentIndexForProgress(moments, { demo, q }) {
  if (!demo) return -1;

  if (demo === 'questions') {
    let bestIndex = -1;
    let bestStep = -Infinity;
    moments.forEach((moment, index) => {
      const parsed = parseMomentSurface(moment.surfaceUrl);
      if (parsed.demo !== 'questions') return;
      const step = Number.isFinite(parsed.q) ? parsed.q : 0;
      if (step <= q && step >= bestStep) {
        bestStep = step;
        bestIndex = index;
      }
    });
    if (bestIndex !== -1) return bestIndex;
  }

  return moments.findIndex(
    (moment) => parseMomentSurface(moment.surfaceUrl).demo === demo
  );
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
  const journey = getDemoFlowJourney(getDemoJourneyId());
  const viewMode = useMemo(() => getDemoViewMode(), []);
  const demoFlowMoments = journey.moments;
  // `activeIndex` drives the control panel (kicker, title, dots, progress).
  // `surfaceIndex` drives which surface the iframe loads. They move together on
  // demo controls, but only `activeIndex` follows the iframe's own navigation so
  // we never force a disruptive reload while the user clicks through a surface.
  const [activeIndex, setActiveIndex] = useState(0);
  const [surfaceIndex, setSurfaceIndex] = useState(0);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  // Closing removes the whole remote (handle included) until reload, so a
  // customer session can watch the surface without demo chrome.
  const [isDismissed, setIsDismissed] = useState(false);
  const activeMoment = demoFlowMoments[activeIndex];
  const surfaceMoment = demoFlowMoments[surfaceIndex];
  const activeSurfaceUrl = useMemo(
    () => addDemoOnlyViewMode(surfaceMoment.surfaceUrl, viewMode),
    [surfaceMoment.surfaceUrl, viewMode]
  );
  const progress = useMemo(
    () => ((activeIndex + 1) / demoFlowMoments.length) * 100,
    [activeIndex, demoFlowMoments.length]
  );

  const goToMoment = (index) => {
    const clamped = clampIndex(index, demoFlowMoments.length);
    setActiveIndex(clamped);
    setSurfaceIndex(clamped);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== 'team-dna-demo-progress') return;
      const nextIndex = findMomentIndexForProgress(demoFlowMoments, {
        demo: data.demo,
        q: Number(data.q),
      });
      if (nextIndex >= 0) setActiveIndex(nextIndex);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [demoFlowMoments]);

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
          key={surfaceMoment.id}
          className="team-dna-demo-flow-frame"
          src={activeSurfaceUrl}
          title={surfaceMoment.title}
        />
      </section>

      {isDismissed ? null : (
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
            <span className="team-dna-demo-flow-kicker">
              <b>{journey.label}</b>
              <i aria-hidden="true">·</i>
              {activeMoment.phase}
            </span>
            <span className="team-dna-demo-flow-topbtns">
              <button
                type="button"
                className="team-dna-demo-flow-home"
                onClick={goHome}
                aria-label="Back to hub"
                title="Back to hub"
              >
                <BetterUpIcon name="Home" size={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="team-dna-demo-flow-home"
                onClick={() => setIsDismissed(true)}
                aria-label="Close this demo flow"
                title="Close this demo flow"
              >
                <BetterUpIcon name="X" size={15} strokeWidth={2} />
              </button>
            </span>
          </p>
          <h1>{activeMoment.title}</h1>
          <span>
            Step {activeIndex + 1} of {demoFlowMoments.length} — {activeMoment.note}
          </span>
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
      )}
    </main>
  );
}
