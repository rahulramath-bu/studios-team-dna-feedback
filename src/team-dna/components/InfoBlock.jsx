import React from 'react';
import { BigFiveBloom } from './BigFiveBloom.jsx';
import { BigFiveSpectrumList } from './BigFiveSpectrumList.jsx';
import { WatchOutCard } from './WatchOutCard.jsx';
import { GuidanceCard } from './GuidanceCard.jsx';

const ICON_PATHS = {
  Eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  Star: (
    <polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2" />
  ),
  MessageCircle: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  ),
  Tool: (
    <>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z" />
    </>
  ),
};

function getInfoBlockIconName(card) {
  const label = card.label?.toLowerCase() ?? '';

  if (card.kind === 'bigFiveBloom' || card.kind === 'bigFiveSpectrumList') {
    return null;
  }

  if (card.kind === 'watchOut' || label.includes('look out')) {
    return 'Eye';
  }

  if (label.includes('shine')) {
    return 'Star';
  }

  return card.iconName ?? 'MessageCircle';
}

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
 * this component. If cards gain decorative icons, keep them behind a small
 * `InfoBlockIcon` seam; the monolith renderer should swap that to
 * `@betterup/icons/src/Icon` and keep icons aria-hidden/absolute so they do not
 * affect card layout.
 */
export function InfoBlock({ card, className = '', onSelectMember }) {
  // Monolith integration seam: supporting cards should enter through
  // `insight.cards`, not through fixture or backend imports inside the panel.
  // Decorative card icons, if added, should enter through the same card data and
  // render via one icon seam. In the monolith, use @betterup/icons/src/Icon
  // rather than a prototype-only icon dependency.
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
  const iconName = getInfoBlockIconName(card);

  return (
    <section
      className={blockClassName}
      aria-label={label}
    >
      <InfoBlockIcon name={iconName} />
      {shouldShowLabel && <p className="info-block-label">{label}</p>}
      <InfoBlockBody card={card} onSelectMember={onSelectMember} />
    </section>
  );
}

function InfoBlockIcon({ name }) {
  const iconPath = ICON_PATHS[name];

  if (!iconPath) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="info-block-bg-icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      {iconPath}
    </svg>
  );
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

  if (card.kind === 'watchOut') {
    return <WatchOutCard watchOut={card.data?.watchOut} />;
  }

  if (card.kind === 'guidance') {
    return <GuidanceCard guidance={card.data?.guidance} />;
  }

  return null;
}
