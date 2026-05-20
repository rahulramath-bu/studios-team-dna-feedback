import React from 'react';
import { BigFiveBloom } from './BigFiveBloom.jsx';
import { BigFiveSpectrumList } from './BigFiveSpectrumList.jsx';
import { WatchOutCard } from './WatchOutCard.jsx';
import { GuidanceCard } from './GuidanceCard.jsx';

/**
 * Supporting insight card slot.
 *
 * What: shared frame and renderer switch for visualization or supporting
 * insight cards in the right-side insight panel.
 * How: accepts a card object from the insight adapter and renders the matching
 * body by `kind`. Card labels are available for accessibility and can be
 * hidden visually with `showLabel: false` when the visualization is self-evident.
 * Port: add future card renderers behind `insight.cards[].kind` and
 * `insight.cards[].data`. Do not import fixture or backend data directly into
 * this component.
 */
export function InfoBlock({ card, className = '' }) {
  // Monolith integration seam: supporting cards should enter through
  // `insight.cards`, not through fixture or backend imports inside the panel.
  const blockClassName = [
    'info-block',
    ['bigFiveSpectrumList', 'guidance', 'watchOut'].includes(card.kind)
      ? 'info-block--editorial'
      : '',
    card.kind === 'bigFiveSpectrumList' ? 'info-block--spectrum' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const label = card.label;
  const shouldShowLabel = card.showLabel !== false;

  return (
    <section
      className={blockClassName}
      aria-label={label}
    >
      {shouldShowLabel && <p className="info-block-label">{label}</p>}
      <InfoBlockBody card={card} />
    </section>
  );
}

function InfoBlockBody({ card }) {
  if (card.kind === 'bigFiveBloom') {
    return (
      <BigFiveBloom
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

  if (card.kind === 'watchOut') {
    return <WatchOutCard watchOut={card.data?.watchOut} />;
  }

  if (card.kind === 'guidance') {
    return <GuidanceCard guidance={card.data?.guidance} />;
  }

  return null;
}
