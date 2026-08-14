import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  getArchetypeStats,
  getTopContrastPairs,
  getChemistryHighlights,
  getWorkingPreferenceLines,
} from '../data/teamReadModel.js';

/**
 * Chemistry report.
 *
 * What: the chemistry view as one self-contained, printable document — the
 * same pairings and reads as the page, organized with the page's own heading
 * hierarchy, plus the working-style detail behind them.
 * How: a document overlay; serif section headings, highlight stat boxes,
 * pairing rows with faces. "Save as PDF" uses the browser's print pipeline.
 * Port: this same composition can render server-side for a real PDF export.
 */
export function TeamDnaReportOverlay({
  insight,
  subjects,
  viewerId,
  teamName,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const stats = getArchetypeStats(subjects);
  const contrastPairs = getTopContrastPairs(subjects, 3);
  const highlights = getChemistryHighlights(subjects);
  const preferences = getWorkingPreferenceLines(subjects);
  const summaryText = (insight.summary ?? [])
    .map((segment) => segment.text)
    .join('');
  const reportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return createPortal(
    <div className="tdna-report-root" role="dialog" aria-label="Chemistry report">
      <button
        type="button"
        className="tdna-report-scrim"
        aria-label="Close report"
        onClick={onClose}
      />
      <article className="tdna-report">
        <header className="tdna-report-head">
          <div>
            <p className="tdna-report-eyebrow">Team DNA {'\u00b7'} Chemistry</p>
            <h1 className="tdna-report-title">{teamName ?? 'Your team'}</h1>
            <p className="tdna-report-meta">
              {subjects.length} teammates
              {' \u00b7 '}
              {reportDate}
            </p>
          </div>
          <div className="tdna-report-actions">
            <button
              type="button"
              className="bu-button bu-button--secondary"
              onClick={() => window.print()}
            >
              Save as PDF
            </button>
            <button
              type="button"
              className="tdna-report-close"
              aria-label="Close"
              onClick={onClose}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="tdna-report-body">
          <section className="tdna-report-section">
            <h2>Your team in one paragraph</h2>
            <p className="tdna-report-lede">
              {insight.title ? <strong>{insight.title}. </strong> : null}
              {summaryText}
            </p>
          </section>

          <section className="tdna-report-section">
            <h2>Highlights</h2>
            <div className="brief-widgets">
              <div className="brief-widget">
                <p className="brief-widget-label">Top strength</p>
                <p className="brief-widget-value">
                  {stats.topStrength.percentile}
                  <span className="brief-widget-unit">percentile</span>
                </p>
                <p className="brief-widget-trait">{stats.topStrength.title}</p>
              </div>
              <div className="brief-widget">
                <p className="brief-widget-label">Growth edge</p>
                <p className="brief-widget-trait brief-widget-trait--solo">
                  {stats.growthEdge.title}
                </p>
              </div>
              <div className="brief-widget">
                <p className="brief-widget-label">Where you stand out</p>
                <p className="brief-widget-value brief-widget-value--row">
                  {stats.distinction.label}
                  <span className="brief-widget-faces">
                    {stats.distinction.carriers.map((member) => (
                      <ReportFace key={member.id} member={member} size={24} />
                    ))}
                  </span>
                </p>
                <p className="brief-widget-trait">{stats.distinction.title}</p>
              </div>
            </div>
          </section>

          <section className="tdna-report-section">
            <h2>Pairings worth knowing</h2>
            <p className="tdna-report-note">
              The pairs with the most signal, from each pair&rsquo;s distance
              across the five Big Five traits.
            </p>
            <div className="chem-pairs-list tdna-report-pairs">
              {contrastPairs.map((pair) => (
                <div className="chem-pair-row" key={`${pair.a.id}-${pair.b.id}`}>
                  <span className="chem-pair-faces">
                    <ReportFace member={pair.a} size={30} />
                    <ReportFace member={pair.b} size={30} />
                  </span>
                  <span className="chem-pair-copy">
                    <strong>
                      {pair.a.name.split(' ')[0]} &amp;{' '}
                      {pair.b.name.split(' ')[0]}
                    </strong>
                    {pair.contrast.line}
                  </span>
                </div>
              ))}
              {highlights.mostSimilar ? (
                <div className="chem-pair-row">
                  <span className="chem-pair-faces">
                    <ReportFace member={highlights.mostSimilar.a} size={30} />
                    <ReportFace member={highlights.mostSimilar.b} size={30} />
                  </span>
                  <span className="chem-pair-copy">
                    <strong>
                      {highlights.mostSimilar.a.name.split(' ')[0]} &amp;{' '}
                      {highlights.mostSimilar.b.name.split(' ')[0]}
                    </strong>
                    Nearly the same defaults. Fast together, and likely to
                    share the same blind side.
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="tdna-report-section">
            <h2>The working styles behind it</h2>
            <p className="tdna-report-note">
              Where the team actually splits day to day: the raw material of
              the pairings above.
            </p>
            <ul className="guidance-section-bullets tdna-report-bullets">
              {preferences.map((preference) => (
                <li key={preference.key}>{preference.sentence}</li>
              ))}
            </ul>
          </section>

          <section className="tdna-report-section">
            <h2>Worth talking about</h2>
            <ul className="guidance-section-bullets tdna-report-bullets">
              <li>
                Which pairing above surprises you, and which one do you lean
                on most?
              </li>
              <li>
                Where has a wide gap between two people quietly cost the team
                time?
              </li>
              <li>
                What agreement would make your most different pair faster
                together?
              </li>
            </ul>
          </section>

          <p className="tdna-report-foot">
            Based on each teammate&rsquo;s Team DNA assessment. Personality
            describes tendencies, not limits; use it to understand each other,
            not to box anyone in.
          </p>
        </div>
      </article>
    </div>,
    document.body
  );
}

function ReportFace({ member, size = 30 }) {
  const initials = (member.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <span
      className="dxp-face"
      style={{ '--dxp-face-size': `${size}px` }}
      title={member.name}
    >
      {member.avatarUrl ? <img src={member.avatarUrl} alt="" /> : <span>{initials}</span>}
    </span>
  );
}
