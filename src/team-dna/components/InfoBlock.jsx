import React from 'react';
import { BigFiveBloom } from './BigFiveBloom.jsx';
import { BigFiveSpectrumList } from './BigFiveSpectrumList.jsx';
import { WatchOutCard } from './WatchOutCard.jsx';
import { GuidanceCard } from './GuidanceCard.jsx';
import { ArchetypeImageCard } from './ArchetypeImageCard.jsx';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { TeamShapeContributions } from './TeamShapeContributions.jsx';

/**
 * Supporting insight card slot.
 *
 * What: shared frame and renderer switch for visualization or supporting
 * insight cards in the right-side insight panel.
 * How: accepts a card object from the insight adapter and renders the matching
 * body by `kind`. Card labels are available for accessibility and can be
 * hidden visually with `showLabel: false` when the visualization is self-evident.
 * `bodyOverride` is used for inline edit mode so the existing card body is
 * replaced in place instead of duplicated below the card.
 * Port: add future card renderers behind `insight.cards[].kind` and
 * `insight.cards[].data`. Do not import fixture or backend data directly into
 * this component. Replace `BetterUpIcon` with
 * `@betterup/icons/src/Icon`. The `info-block-action` button maps to a quiet
 * icon action, not decorative card art; keep it as a real button with an
 * accessible label.
 */
export function InfoBlock({
  card,
  className = '',
  bodyOverride,
  onAction,
  onSelectMember,
  actionLabel,
}) {
  // Monolith integration seam: supporting cards should enter through
  // `insight.cards`, not through fixture or backend imports inside the panel.
  const blockClassName = [
    'info-block',
    ['bigFiveSpectrumList', 'guidance', 'watchOut', 'meetingBehavior', 'teamShapeContributions'].includes(card.kind)
      ? 'info-block--editorial'
      : '',
    card.kind === 'bigFiveSpectrumList' ? 'info-block--spectrum' : '',
    card.kind === 'teamShapeContributions' ? 'info-block--team-shape' : '',
    card.kind === 'archetypeImage' ? 'info-block--archetype-image' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const label = getDisplayLabel(card);
  const shouldShowLabel = card.showLabel !== false;

  return (
    <section
      className={blockClassName}
      aria-label={label}
    >
      {onAction ? (
        <button
          className="info-block-action"
          type="button"
          aria-label={actionLabel ?? `Edit ${label}`}
          onClick={onAction}
        >
          <BetterUpIcon name="Edit" size={17} strokeWidth={1.8} />
        </button>
      ) : null}
      {shouldShowLabel && <p className="info-block-label">{label}</p>}
      {bodyOverride ?? (
        <InfoBlockBody card={card} onSelectMember={onSelectMember} />
      )}
    </section>
  );
}

function getDisplayLabel(card) {
  if (card.kind === 'watchOut') return 'Potential blind spots';
  if (card.kind === 'guidance' && card.id.endsWith('-where-shines')) {
    return 'Strengths';
  }
  if (card.kind === 'guidance' && card.id === 'team-work-with') {
    return 'Collaboration Tips';
  }

  return card.label;
}

function InfoBlockBody({ card, onSelectMember }) {
  if (card.kind === 'bigFiveBloom') {
    return (
      <BigFiveBloom
        onSelectMember={onSelectMember}
        subjects={card.data?.subjects ?? []}
        traits={card.data?.traits}
      />
    );
  }

  if (card.kind === 'bigFiveSpectrumList') {
    return (
      <BigFiveSpectrumList
        subjects={card.data?.subjects ?? []}
        traits={card.data?.traits}
        reads={card.data?.reads}
      />
    );
  }

  if (card.kind === 'archetypeImage') {
    return <ArchetypeImageCard image={card.data?.image} />;
  }

  if (card.kind === 'teamShapeContributions') {
    return (
      <TeamShapeContributions
        contributions={card.data?.contributions ?? []}
        onSelectMember={onSelectMember}
      />
    );
  }

  if (card.kind === 'watchOut') {
    return <WatchOutCard watchOut={card.data?.watchOut} />;
  }

  if (card.kind === 'meetingBehavior') {
    return <WatchOutCard watchOut={card.data?.meetingBehavior} />;
  }

  if (card.kind === 'guidance') {
    return <GuidanceCard guidance={card.data?.guidance} />;
  }

  return null;
}
