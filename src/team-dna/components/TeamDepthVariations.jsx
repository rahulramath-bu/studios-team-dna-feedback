import React, { useEffect, useRef, useState } from 'react';
import {
  Face,
  CoachFootLink,
  firstName,
  summaryText,
  renderEmphasis,
} from './conceptPrimitives.jsx';
import { getAgreementDetails } from '../data/teamReadModel.js';
import {
  getMapViews,
  buildMapModel,
  getMapBullets,
  getMapFit,
  getPersonCoordinates,
  getPairGapRows,
  getPairMeaning,
  getPairAxisLine,
} from '../data/conceptReadModel.js';
import { ConceptTabs } from './ConceptTabs.jsx';
import { ConceptOne } from './ConceptOne.jsx';
import { ConceptFive } from './ConceptFive.jsx';

/**
 * Page concepts. Each entry is a whole experience, not a single idea: the
 * same concept renders a team read (distribution), a person read (snapshot),
 * and a pair read (comparison) with one structure — that is the scalability
 * contract behind the menu.
 *
 * original  - the page as designed. The baseline everything is measured
 *             against.
 * expanded  - the original, expanded: a three-widget "what you can learn
 *             here" row under the hero, and a per-section Dive deeper modal
 *             (why these strengths / why these growth areas / working styles
 *             / the Big Five explained). Wired inside InsightPanel so the
 *             original layout stays intact.
 * map       - a spatial read of the same data: everyone placed on two traits
 *             at a time, with clusters, open ground, and where you fit. The
 *             reads live inside the map card as quick bullets.
 * tabs      - one dashboard, four lenses: Team overview / My profile /
 *             1:1 Compare / Chemistry. Compare uses the page's existing
 *             face-selection interaction; the other lenses use the space.
 */

export const PAGE_VARIATIONS = [
  { id: 'original', menuLabel: 'Original' },
  { id: 'expanded', menuLabel: '1 \u00b7 Expanded' },
  { id: 'map', menuLabel: '2 \u00b7 The Map' },
  { id: 'tabs', menuLabel: '3 \u00b7 Four tabs' },
  { id: 'one', menuLabel: '4 \u00b7 One system' },
  { id: 'five', menuLabel: '5 \u00b7 V5' },
];

/* Concepts that fully replace the read (every scope). 'expanded' augments
   the original layout instead, so it is wired inside InsightPanel. */
export const DEPTH_PAGE_IDS = ['map', 'tabs', 'one', 'five'];

export function PageVariationMenu({ variationId, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active =
    PAGE_VARIATIONS.find((variation) => variation.id === variationId) ??
    PAGE_VARIATIONS[0];

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

  return (
    <div className="monolith-persona-menu" ref={rootRef}>
      <button
        type="button"
        className="monolith-persona-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="monolith-persona-menu-eyebrow">Page</span>
        <span className="monolith-persona-menu-value">{active.menuLabel}</span>
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
          aria-label="Demo: page concept"
        >
          {PAGE_VARIATIONS.map((variation) => (
            <button
              key={variation.id}
              type="button"
              role="menuitemradio"
              aria-checked={variation.id === variationId}
              className="monolith-persona-menu-item"
              data-active={variation.id === variationId || undefined}
              onClick={() => {
                onSelect(variation.id);
                setOpen(false);
              }}
            >
              {variation.menuLabel}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* Shared pieces (Face, CoachFootLink, text helpers) live in
   conceptPrimitives.jsx so every concept file can use them without cycles. */

/* ── Concept 2 · The Map ────────────────────────────────────────────────────
   One spatial system for all scopes: the canvas places everyone by two
   traits at a time (switchable), then the cards answer the scope's job —
   team: clusters / divide / open water; person: where you sit and your
   pairings; pair: the distance between two people and how to bridge it. */

function MapCanvas({
  model,
  scope,
  viewerId,
  focusIds,
  onSelectMember,
  onSelectPair,
}) {
  const { view, points, clusters, openQuadrants } = model;
  const showContext = scope === 'team';
  const focusSet = new Set(focusIds);
  const pairPoints =
    scope === 'duo'
      ? points.filter((point) => focusSet.has(point.member.id))
      : [];

  const handlePointClick = (point) => {
    if (scope === 'team') {
      onSelectMember?.(point.member.id, { mode: 'solo' });
      return;
    }
    if (scope === 'person' && !point.isFocus) {
      const focusId = focusIds[0];
      if (focusId) onSelectPair?.(focusId, point.member.id);
    }
  };

  return (
    <div className="mapx-canvas" data-scope={scope}>
      <span className="mapx-grid mapx-grid--h" aria-hidden="true" />
      <span className="mapx-grid mapx-grid--v" aria-hidden="true" />
      <span className="mapx-pole mapx-pole--top">{view.yTrait.highLabel}</span>
      <span className="mapx-pole mapx-pole--bottom">{view.yTrait.lowLabel}</span>
      <span className="mapx-pole mapx-pole--left">{view.xTrait.lowLabel}</span>
      <span className="mapx-pole mapx-pole--right">{view.xTrait.highLabel}</span>

      {showContext
        ? clusters.map((cluster, index) => (
            <span
              key={`cluster-${index}`}
              className="mapx-cluster"
              style={{
                left: `${cluster.centerX - cluster.radiusX}%`,
                top: `${cluster.centerY - cluster.radiusY}%`,
                width: `${cluster.radiusX * 2}%`,
                height: `${cluster.radiusY * 2}%`,
              }}
              aria-hidden="true"
            >
              <span className="mapx-cluster-tag">
                cluster {'\u00b7'} {cluster.members.length}
              </span>
            </span>
          ))
        : null}

      {showContext
        ? openQuadrants.map((quadrant) => (
            <span
              key={quadrant.quadrant}
              className="mapx-open"
              style={{ left: `${quadrant.x}%`, top: `${quadrant.y}%` }}
            >
              No one: {quadrant.label.toLowerCase()}
            </span>
          ))
        : null}

      {pairPoints.length === 2 ? (
        <svg className="mapx-connector" aria-hidden="true">
          <line
            x1={`${pairPoints[0].x}%`}
            y1={`${pairPoints[0].y}%`}
            x2={`${pairPoints[1].x}%`}
            y2={`${pairPoints[1].y}%`}
          />
        </svg>
      ) : null}

      {points.map((point) => {
        const isFocus = scope === 'team' ? false : point.isFocus;
        const isDim = scope !== 'team' && !point.isFocus;
        const clickable =
          scope === 'team' || (scope === 'person' && !point.isFocus);
        return (
          <button
            key={point.member.id}
            type="button"
            className="mapx-point"
            data-focus={isFocus || undefined}
            data-dim={isDim || undefined}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            title={point.member.name}
            aria-label={
              scope === 'person' && !point.isFocus
                ? `Compare with ${point.member.name}`
                : point.member.name
            }
            tabIndex={clickable ? 0 : -1}
            onClick={clickable ? () => handlePointClick(point) : undefined}
          >
            <Face
              member={point.member}
              size={isFocus ? 40 : scope === 'team' ? 34 : 28}
              ringed={point.member.id === viewerId}
            />
          </button>
        );
      })}
    </div>
  );
}

function MapViewChips({ views, activeIndex, onSelect }) {
  return (
    <div className="mapx-views" role="tablist" aria-label="Map lenses">
      {views.map((view, index) => (
        <button
          key={view.id}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          className="mapx-view-chip"
          data-active={index === activeIndex || undefined}
          onClick={() => onSelect(index)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

function PairingRow({ label, member, line, onClick }) {
  return (
    <button type="button" className="mapx-pairing" onClick={onClick}>
      <Face member={member} size={30} />
      <span className="mapx-pairing-copy">
        <strong>
          {label} {'\u00b7'} {firstName(member)}
        </strong>
        {line}
      </span>
      <svg className="mapx-pairing-arrow" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M6 4l4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function ConceptMap({
  scope,
  insight,
  subjects,
  allSubjects,
  viewerId,
  isOwnProfile,
  onCoachPrompt,
  onSelectMember,
  onSelectPair,
}) {
  const views = getMapViews(allSubjects);
  const [viewIndex, setViewIndex] = useState(0);
  const view = views[Math.min(viewIndex, views.length - 1)];
  const focusIds = scope === 'team' ? [] : subjects.map((member) => member.id);
  const model = buildMapModel({ allSubjects, view, focusIds });

  const heroNote =
    scope === 'team'
      ? 'This lens turns the same five signals into a map: who works alike, who balances whom, and which ground nobody covers. Switch the axes to change the view; tap a face to open a profile.'
      : scope === 'duo'
        ? 'This lens places the two of you on the team\u2019s map: how far apart your defaults sit, trait by trait, and how to use the distance.'
        : isOwnProfile
          ? 'This lens places you on the team\u2019s map: where you sit, who works most like you, and who balances you.'
          : 'This lens places one person on the team\u2019s map: where they sit, who works most like them, and who balances them.';

  return (
    <div className="dxp dxp--map" aria-label="The map">
      <section className="info-block info-block--editorial">
        <p className="info-block-label">{insight.title}</p>
        <p className="dxp-copy">{summaryText(insight)}</p>
        <p className="dxp-copy dxp-copy--note">{heroNote}</p>
      </section>

      <section className="info-block info-block--editorial">
        <p className="info-block-label">
          {scope === 'team'
            ? 'The map'
            : scope === 'duo'
              ? 'You two on the map'
              : isOwnProfile
                ? 'Where you sit'
                : `Where ${firstName(subjects[0])} sits`}
        </p>
        <MapViewChips
          views={views}
          activeIndex={viewIndex}
          onSelect={setViewIndex}
        />
        <MapCanvas
          model={model}
          scope={scope}
          viewerId={viewerId}
          focusIds={focusIds}
          onSelectMember={onSelectMember}
          onSelectPair={onSelectPair}
        />
        {scope === 'team' ? (
          /* The reads live with the picture: three quick bullets, no jargon. */
          <ul className="mapx-bullets">
            {getMapBullets({ model, allSubjects }).map((bullet) => (
              <li key={bullet.key}>
                <strong>{bullet.strong}</strong> {bullet.tail}
              </li>
            ))}
          </ul>
        ) : null}
        {scope === 'duo' ? (
          <div className="mapx-meaning">
            <p className="mapx-meaning-lead">
              {getPairMeaning(subjects[0], subjects[1]).line}
            </p>
            <p className="mapx-meaning-sub">
              {getPairAxisLine(subjects[0], subjects[1], view)}
            </p>
          </div>
        ) : null}
        {scope === 'person' ? (
          <p className="mapx-meaning-sub">
            {isOwnProfile ? 'You sit' : `${firstName(subjects[0])} sits`} at{' '}
            <strong>
              {getMapFit({ member: subjects[0], allSubjects, view })?.quadrantLabel}
            </strong>{' '}
            on this view. Faded faces are the rest of the team — tap one to
            compare.
          </p>
        ) : null}
        {scope === 'team' ? (
          <CoachFootLink
            prompt={`Walk me through my team's map on ${view.label.toLowerCase()}: our clusters, our widest split, and the ground nobody covers.`}
            onCoachPrompt={onCoachPrompt}
          />
        ) : null}
      </section>

      {scope === 'team' ? (
        <MapFitCard
          allSubjects={allSubjects}
          viewerId={viewerId}
          view={view}
          onCoachPrompt={onCoachPrompt}
          onSelectPair={onSelectPair}
        />
      ) : null}
      {scope === 'person' ? (
        <MapPersonCards
          member={subjects[0]}
          allSubjects={allSubjects}
          view={view}
          isOwnProfile={isOwnProfile}
          onCoachPrompt={onCoachPrompt}
          onSelectPair={onSelectPair}
        />
      ) : null}
      {scope === 'duo' ? (
        <MapPairCards
          subjects={subjects}
          onCoachPrompt={onCoachPrompt}
        />
      ) : null}
    </div>
  );
}

function MapFitCard({ allSubjects, viewerId, view, onCoachPrompt, onSelectPair }) {
  const viewer = allSubjects.find((member) => member.id === viewerId);
  const fit = viewer ? getMapFit({ member: viewer, allSubjects, view }) : null;
  if (!fit) return null;

  return (
    <section className="info-block info-block--editorial">
      <p className="info-block-label">Where you fit</p>
      <p className="dxp-copy dxp-copy--flush">
        On this view you sit at <strong>{fit.quadrantLabel}</strong>. Two
        pairings worth knowing:
      </p>
      <div className="mapx-pairings">
        <PairingRow
          label="Closest match"
          member={fit.neighbor.member}
          line="Your fastest pairing — and your shared blind side."
          onClick={() => onSelectPair?.(viewerId, fit.neighbor.member.id)}
        />
        <PairingRow
          label="Sharpest contrast"
          member={fit.contrast.member}
          line="Slower together, and the widest coverage on the team."
          onClick={() => onSelectPair?.(viewerId, fit.contrast.member.id)}
        />
      </div>
      <CoachFootLink
        prompt="Given where I sit on my team's map, how should I use my closest match and my sharpest contrast this quarter?"
        onCoachPrompt={onCoachPrompt}
      />
    </section>
  );
}

function MapPersonCards({
  member,
  allSubjects,
  view,
  isOwnProfile,
  onCoachPrompt,
  onSelectPair,
}) {
  const coordinates = getPersonCoordinates(member, allSubjects);
  const fit = getMapFit({ member, allSubjects, view });
  const you = isOwnProfile ? 'You' : firstName(member);
  const your = isOwnProfile ? 'your' : `${firstName(member)}'s`;

  return (
    <>
      <section className="info-block info-block--editorial">
        <p className="info-block-label">{isOwnProfile ? 'Your coordinates' : `${firstName(member)}'s coordinates`}</p>
        <div className="mapx-coords">
          {coordinates.map((coordinate) => (
            <div className="mapx-coord" key={coordinate.trait.key}>
              <span className="mapx-coord-word">{coordinate.friendly}</span>
              <span className="mapx-coord-pole">{coordinate.poleLabel}</span>
              <span className="mapx-coord-line">{coordinate.positionLine}</span>
            </div>
          ))}
        </div>
        <CoachFootLink
          prompt={
            isOwnProfile
              ? 'What do my five coordinates mean for how I should work with this team?'
              : `What do ${firstName(member)}'s five coordinates mean for how the team should work with them?`
          }
          onCoachPrompt={onCoachPrompt}
        />
      </section>

      {fit ? (
        <section className="info-block info-block--editorial">
          <p className="info-block-label">{isOwnProfile ? 'Your pairings' : 'Pairings'}</p>
          <p className="dxp-copy dxp-copy--flush">
            {you} sit{isOwnProfile ? '' : 's'} at <strong>{fit.quadrantLabel}</strong> on this view. The two ends of {your} range:
          </p>
          <div className="mapx-pairings">
            <PairingRow
              label="Closest match"
              member={fit.neighbor.member}
              line="Nearly the same defaults — the fastest pairing, with a shared blind side."
              onClick={() => onSelectPair?.(member.id, fit.neighbor.member.id)}
            />
            <PairingRow
              label="Sharpest contrast"
              member={fit.contrast.member}
              line="The most different defaults — slower together, and the widest coverage."
              onClick={() => onSelectPair?.(member.id, fit.contrast.member.id)}
            />
          </div>
          <CoachFootLink
            prompt={
              isOwnProfile
                ? 'How should I use my closest match and sharpest contrast on this team?'
                : `How should ${firstName(member)} use their closest match and sharpest contrast on this team?`
            }
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      ) : null}
    </>
  );
}

function MapPairCards({ subjects, onCoachPrompt }) {
  const [a, b] = subjects;
  const rows = getPairGapRows(a, b);
  const widest = rows[0];
  const agreement = getAgreementDetails(subjects, 1)[0];
  const gap = Math.abs(widest.a - widest.b);
  const band = gap >= 30 ? 'wide' : gap >= 16 ? 'offset' : widest.a + widest.b >= 120 ? 'highAligned' : widest.a + widest.b <= 80 ? 'lowAligned' : 'middleAligned';
  const bridgeText = widest.trait.duoRead?.[band] ?? '';

  return (
    <>
      <section className="info-block info-block--editorial">
        <p className="info-block-label">Side by side</p>
        <p className="dxp-copy dxp-copy--flush">
          Every working default compared, widest gap first. Wide gaps are where
          you translate for each other; narrow ones run on autopilot.
        </p>
        <div className="mapx-gaps">
          {rows.map((row) => (
            <div className="mapx-gap" key={row.trait.key}>
              <span className="mapx-gap-word">{row.friendly}</span>
              <span className="mapx-gap-track" aria-hidden="true">
                <span className="mapx-gap-span" style={{
                  left: `${Math.min(row.a, row.b)}%`,
                  width: `${Math.max(2, Math.abs(row.a - row.b))}%`,
                }} />
                <span className="mapx-gap-dot mapx-gap-dot--a" style={{ left: `${row.a}%` }} title={`${firstName(a)}: ${row.a}`} />
                <span className="mapx-gap-dot mapx-gap-dot--b" style={{ left: `${row.b}%` }} title={`${firstName(b)}: ${row.b}`} />
              </span>
              <span className="mapx-gap-count">{row.gap} pts</span>
            </div>
          ))}
        </div>
        <p className="mapx-legend">
          <span className="mapx-gap-dot mapx-gap-dot--a" /> {firstName(a)}
          <span className="mapx-gap-dot mapx-gap-dot--b" /> {firstName(b)}
        </p>
        <CoachFootLink
          prompt={`Walk ${firstName(a)} and ${firstName(b)} through their five gaps, widest first, and what each one means day to day.`}
          onCoachPrompt={onCoachPrompt}
        />
      </section>

      <section className="info-block info-block--editorial">
        <p className="info-block-label">Bridge the widest gap</p>
        {bridgeText ? (
          <p className="dxp-copy">{renderEmphasis(bridgeText)}</p>
        ) : null}
        {agreement ? (
          <div className="dxp-move">
            <span className="dxp-move-label">Agree this</span>
            <p>{agreement.proposal}</p>
          </div>
        ) : null}
        <CoachFootLink
          prompt={`Help ${firstName(a)} and ${firstName(b)} write one working agreement that bridges their widest gap (${widest.friendly.toLowerCase()}).`}
          onCoachPrompt={onCoachPrompt}
        />
      </section>
    </>
  );
}

/* ── Entry ──────────────────────────────────────────────────────────────── */

export function TeamDepthPage({
  variation,
  lens = 'overview',
  scope,
  insight,
  subjects,
  allSubjects,
  viewerId,
  isOwnProfile = false,
  teamName,
  onCoachPrompt,
  onSelectMember,
  onSelectPair,
}) {
  if (!subjects.length) return null;

  if (variation === 'map') {
    return (
      <ConceptMap
        scope={scope}
        insight={insight}
        subjects={subjects}
        allSubjects={allSubjects}
        viewerId={viewerId}
        isOwnProfile={isOwnProfile}
        onCoachPrompt={onCoachPrompt}
        onSelectMember={onSelectMember}
        onSelectPair={onSelectPair}
      />
    );
  }

  if (variation === 'tabs') {
    return (
      <ConceptTabs
        scope={scope}
        lens={lens}
        insight={insight}
        subjects={subjects}
        allSubjects={allSubjects}
        viewerId={viewerId}
        isOwnProfile={isOwnProfile}
        teamName={teamName}
        onCoachPrompt={onCoachPrompt}
        onSelectMember={onSelectMember}
        onSelectPair={onSelectPair}
      />
    );
  }

  if (variation === 'one') {
    return (
      <ConceptOne
        scope={scope}
        lens={lens}
        subjects={subjects}
        allSubjects={allSubjects}
        viewerId={viewerId}
        isOwnProfile={isOwnProfile}
        insight={insight}
        onCoachPrompt={onCoachPrompt}
        onSelectMember={onSelectMember}
        onSelectPair={onSelectPair}
      />
    );
  }

  if (variation === 'five') {
    return (
      <ConceptFive
        scope={scope}
        lens={lens}
        subjects={subjects}
        allSubjects={allSubjects}
        viewerId={viewerId}
        isOwnProfile={isOwnProfile}
        insight={insight}
        teamName={teamName}
        onCoachPrompt={onCoachPrompt}
        onSelectMember={onSelectMember}
        onSelectPair={onSelectPair}
      />
    );
  }

  return null;
}
