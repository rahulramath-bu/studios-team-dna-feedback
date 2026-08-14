import React from 'react';
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
  onCoachPrompt,
  onOpenDepth,
  coachScope,
  coachSubject,
  coachIsSelf = false,
  actionLabel,
}) {
  // Monolith integration seam: supporting cards should enter through
  // `insight.cards`, not through fixture or backend imports inside the panel.
  const blockClassName = [
    'info-block',
    ['bigFiveSpectrumList', 'guidance', 'watchOut', 'strengthsList', 'meetingBehavior', 'teamShapeContributions'].includes(card.kind)
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
  const coachCta = onCoachPrompt
    ? getCoachCta(card, {
        scope: coachScope,
        subject: coachSubject,
        isSelf: coachIsSelf,
      })
    : null;

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
      {onOpenDepth ? (
        <button
          className="info-block-deeper"
          data-offset={onAction ? 'true' : undefined}
          type="button"
          aria-label={`Dive deeper into ${label}`}
          onClick={() => onOpenDepth(card)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 4v10.5M12 14.5l-4.5-4.5M12 14.5l4.5-4.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 19.5h14"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <span>Dive deeper</span>
        </button>
      ) : null}
      {shouldShowLabel && <p className="info-block-label">{label}</p>}
      {bodyOverride ?? (
        <InfoBlockBody card={card} onSelectMember={onSelectMember} />
      )}
      {coachCta ? (
        <div className="info-block-links">
          <CoachLink cta={coachCta} onCoachPrompt={onCoachPrompt} />
        </div>
      ) : null}
    </section>
  );
}

/**
 * Subtle, design-system tertiary text link that hands off the section's context
 * to the AI coach with a pre-selected prompt. One per section box, never per
 * point — it sits quietly at the foot of the box.
 */
export function CoachLink({ cta, onCoachPrompt }) {
  if (!cta) return null;

  return (
    <button
      className="info-block-coach-link"
      type="button"
      onClick={() => onCoachPrompt?.(cta.prompt)}
    >
      <span>{cta.label}</span>
      <BetterUpIcon name="ArrowUpRight" size={13} strokeWidth={2} />
    </button>
  );
}

/**
 * Maps a section box to a quiet AI-coach CTA: a consistent "…with the AI coach"
 * label plus a context-aware starter prompt keyed off the section and the
 * current scope (person / duo / team).
 */
export function getCoachCta(card, { scope = 'team', subject, isSelf = false } = {}) {
  const who =
    subject && scope === 'person'
      ? subject.split(' ')[0]
      : subject || 'this team';
  const pair = scope === 'duo';
  // When the member is reading their own profile the prompt speaks as them
  // ("How can I…"), never about them in the third person.
  const self = scope === 'person' && isSelf;
  const person = scope === 'person' && !isSelf;

  if (card.kind === 'strengthsList') {
    return {
      label: 'Discuss with AI coach',
      prompt: self
        ? 'How can I put these strengths to work?'
        : person
          ? `How can ${who} put these strengths to work?`
          : pair
            ? `How can ${who} make the most of their combined strengths?`
            : `How can this team build on these strengths?`,
    };
  }

  if (card.kind === 'watchOut') {
    return {
      label: 'Discuss with AI coach',
      prompt: self
        ? 'How can I make the most of these growth opportunities?'
        : person
          ? `How can ${who} make the most of these growth opportunities?`
          : pair
            ? `How can this pair make the most of these growth opportunities?`
            : `How can this team make the most of these growth opportunities?`,
    };
  }

  if (card.kind === 'guidance' && isCollaborationCard(card)) {
    return {
      label: 'Discuss with AI coach',
      prompt: self
        ? 'How can I use this to work better with my teammates?'
        : person
          ? `How should I put this into practice when working with ${who}?`
          : pair
            ? `How can ${who} work best together day to day?`
            : `How can this team work better together?`,
    };
  }

  if (card.kind === 'bigFiveSpectrumList') {
    return {
      label: 'Discuss with AI coach',
      prompt: self
        ? 'What do my Big Five results mean for how I work?'
        : person
          ? `What do ${who}'s Big Five results mean for how they work?`
          : pair
            ? `What do these Big Five differences mean for how ${who} work together?`
            : `What do these Big Five results mean for how this team works?`,
    };
  }

  if (card.kind === 'teamShapeContributions') {
    return {
      label: 'Discuss with AI coach',
      prompt: `What does this team's shape and role mix mean for how we work together?`,
    };
  }

  return null;
}

function isCollaborationCard(card) {
  return (
    card.id.endsWith('-work-with') ||
    card.id.endsWith('-work-best') ||
    card.id.endsWith('-pairing-manual')
  );
}

function getDisplayLabel(card) {
  if (card.kind === 'watchOut') return 'Growth opportunities';
  if (card.kind === 'guidance' && card.id.endsWith('-where-shines')) {
    return 'Strengths';
  }
  if (card.kind === 'guidance' && card.id === 'team-work-with') {
    return 'Collaboration Tips';
  }

  return card.label;
}

function InfoBlockBody({ card, onSelectMember }) {
  if (card.kind === 'bigFiveSpectrumList') {
    return (
      <BigFiveSpectrumList
        subjects={card.data?.subjects ?? []}
        traits={card.data?.traits}
        reads={card.data?.reads}
        meaningNote={card.data?.meaningNote}
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

  if (card.kind === 'strengthsList') {
    return <WatchOutCard watchOut={card.data?.strengths} />;
  }

  if (card.kind === 'meetingBehavior') {
    return <WatchOutCard watchOut={card.data?.meetingBehavior} />;
  }

  if (card.kind === 'guidance') {
    return <GuidanceCard guidance={card.data?.guidance} />;
  }

  return null;
}
