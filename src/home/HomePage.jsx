import React, { useEffect, useRef, useState } from 'react';
import { MonolithPrimaryNav } from '../team-dna/dev/MonolithTeamShell.jsx';
import './homePage.css';

/**
 * Member homepage ("Home" tab).
 *
 * Mirrors the production UME home (monolith MemberHome ListContent with
 * chatPosition='above'): centered greeting with the coach orb, the AI coach
 * chat input directly beneath it, then the recommendation card stack
 * (ListCard pattern: badge, title, optional subtitle meta, body, square thumb,
 * right-aligned CTA), and the AI disclaimer at the end.
 * Copy comes from the production home feed; greeting/placeholder strings come
 * from the monolith translations (member.home.welcomeBackGreeting, ume chatBox
 * placeholder).
 * Port: replace card data with real UME presentation blocks from the API.
 */

const VIEWER_FIRST_NAME = 'Jordan';

function IconInsights({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 16l5-5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 7h5v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSparkle({ className }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 1.5l1.2 3.3L12.5 6 9.2 7.2 8 10.5 6.8 7.2 3.5 6l3.3-1.2L8 1.5z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPractice({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconExercise({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 6.5v11l9-5.5-9-5.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMic({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="9.15"
        y="3.15"
        width="5.7"
        height="10.7"
        rx="2.85"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconVoiceMode({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 10v4M10 7v10M14 9v6M18 11v2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Stand-in for the ACME demo-org logo used on org-pushed cards in production. */
function AcmeLogoTile() {
  return (
    <span className="home-acme" aria-hidden="true">
      <svg viewBox="0 0 48 40" className="home-acme-mark" fill="currentColor">
        <path d="M24 2 45 38H3L24 2zm0 12.5L13.5 32.5h21L24 14.5z" />
      </svg>
      <span className="home-acme-word">ACME</span>
    </span>
  );
}

function Badge({ icon, variant, children }) {
  return (
    <span className={variant === 'new' ? 'home-badge home-badge--new' : 'home-badge'}>
      {icon}
      {children}
    </span>
  );
}

/* Mirrors the UME ListCard/ListCardShell structure: badge, title, optional
   subtitle meta with icon, 2-line body, square thumb tile, right CTA. */
function HomeCard({ badge, title, subtitle, subtitleIcon, body, thumb, cta }) {
  return (
    <article className="home-card">
      <div className="home-card-thumb">{thumb}</div>
      <div className="home-card-content">
        <header className="home-card-badges">{badge}</header>
        <h3 className="home-card-title">{title}</h3>
        {subtitle ? (
          <p className="home-card-subtitle">
            {subtitleIcon}
            {subtitle}
          </p>
        ) : null}
        {body ? <p className="home-card-body">{body}</p> : null}
      </div>
      <div className="home-card-cta">{cta}</div>
    </article>
  );
}

function OrbThumb() {
  return (
    <img
      src="/home/home-sun.png"
      alt=""
      aria-hidden="true"
      className="home-card-thumb-contain"
    />
  );
}

/* ── Team DNA card thumbs (placeholder art, final illustration TBD) ─────── */

/* Mini pair view (viewer prominent, teammate behind, dashed connector) —
   same visual language as the Team DNA experience tile in AI Coaching. */
function PairThumb() {
  return (
    <span className="home-thumb-pair" aria-hidden="true">
      <span className="home-thumb-pair-line" />
      <img
        className="home-thumb-pair-face home-thumb-pair-face--teammate"
        src="/team-dna/avatars/darshan-bhatt.png"
        alt=""
      />
      <img
        className="home-thumb-pair-face home-thumb-pair-face--viewer"
        src="/team-dna/avatars/demo-indian-woman.png"
        alt=""
      />
    </span>
  );
}

/* ── Team DNA UME card scenarios (Rahul x Sam, Jul 14) ──────────────────────
   Sam: "there may be states — one is for the manager to kick off Team DNA,
   and then for all the direct reports to either complete the assessment or
   see team results… Priority is the manager." Plus the PLG locked state
   ("ask your manager… kind of like a PLG motion") and the two team-tooling
   awareness configs (all three tools vs. Team DNA added to Pulse+Coaching).
   The nav dropdown swaps which card leads the feed so each state can be
   reviewed in context. */

const goTo = (path) => () => window.location.assign(path);

const TEAM_DNA_SCENARIOS = [
  {
    id: 'baseline',
    group: 'Baseline',
    menuLabel: 'No Team DNA card',
    card: null,
  },
  {
    id: 'manager-kickoff',
    group: 'Manager',
    menuLabel: 'Kick off Team DNA',
    card: {
      badgeLabel: 'Team DNA',
      isNew: true,
      title: 'Get to know how your team works',
      body: 'Invite your team to share their Team DNA. As results come in, you\u2019ll see each person\u2019s strengths and how your team fits together.',
      thumb: 'tooling',
      ctaLabel: 'Set up your team',
      ctaVariant: 'primary',
      onCta: goTo('/team-dna'),
    },
  },
  {
    id: 'manager-results',
    group: 'Manager',
    menuLabel: 'Team results are in',
    card: {
      badgeLabel: 'Team DNA',
      title: 'Your team\u2019s results are in',
      body: 'Everyone on your team has shared their Team DNA. See the team\u2019s strengths, growth opportunities, and how you work together.',
      thumb: 'pair',
      ctaLabel: 'See team results',
      ctaVariant: 'primary',
      onCta: goTo('/team-dna'),
    },
  },
  {
    id: 'dr-assessment',
    group: 'Direct report',
    menuLabel: 'Complete your assessment',
    card: {
      badgeLabel: 'Team DNA',
      title: 'Sam Ryu invited you to join Flighthouse',
      subtitle: 'Assessment \u2022 10 mins',
      body: 'You\u2019ve been added to a team. Answer a few quick questions to unlock how you and your teammates work best together.',
      thumb: 'bigfive',
      ctaLabel: 'Start assessment',
      ctaVariant: 'primary',
      onCta: goTo('/assessment'),
    },
  },
  {
    id: 'dr-results',
    group: 'Direct report',
    menuLabel: 'Team results are ready',
    card: {
      badgeLabel: 'Team DNA',
      title: 'Your team\u2019s DNA is ready',
      body: 'Everyone on Flighthouse has shared their results. See your team\u2019s strengths and how you work together.',
      thumb: 'pair',
      ctaLabel: 'View Team DNA',
      ctaVariant: 'primary',
      onCta: goTo('/team-dna'),
    },
  },
  {
    id: 'dr-locked',
    group: 'Direct report',
    menuLabel: 'No Team DNA yet',
    card: {
      badgeLabel: 'Team DNA',
      title: 'Get to know your teammates better',
      body: 'Team DNA shows everyone\u2019s strengths and work styles, and it starts with your manager. Let Sam know you\u2019d like to try it with your team.',
      thumb: 'tooling',
      ctaLabel: 'Ask your manager',
      ctaVariant: 'secondary',
      onCta: null,
    },
  },
  {
    id: 'awareness-all',
    group: 'Awareness',
    menuLabel: 'All team tools (new org)',
    card: {
      badgeLabel: 'Team Tooling',
      isNew: true,
      title: 'Great news! Team Tooling is now available',
      body: 'Check in on how your team is doing, spark meaningful conversations, and see how you work together with Team Pulse, team coaching, and Team DNA.',
      thumb: 'tooling',
      ctaLabel: 'Explore tools',
      ctaVariant: 'primary',
      onCta: goTo('/team-dna'),
    },
  },
  {
    id: 'awareness-dna',
    group: 'Awareness',
    menuLabel: 'Team DNA added (has Pulse + Coaching)',
    card: {
      badgeLabel: 'Team Tooling',
      isNew: true,
      title: 'Great news! Team DNA is now available',
      body: 'See each person\u2019s strengths and work styles, and how your team fits together. It works right alongside Team Pulse and team coaching.',
      thumb: 'pair',
      ctaLabel: 'Try Team DNA',
      ctaVariant: 'primary',
      onCta: goTo('/team-dna'),
    },
  },
];

function IconUsersBadge({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 19a5.5 5.5 0 0111 0M15.5 5.8a3 3 0 010 5.4M16.5 14.5a5.5 5.5 0 014 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function renderScenarioThumb(kind) {
  switch (kind) {
    case 'pair':
      return <PairThumb />;
    case 'bigfive':
      return (
        <img
          src="/team-dna/big-five-intro.png"
          alt=""
          aria-hidden="true"
          className="home-card-thumb-contain"
        />
      );
    case 'tooling':
      return (
        <img
          src="/home/team-tooling.png"
          alt=""
          aria-hidden="true"
          className="home-card-thumb-contain"
        />
      );
    default:
      return null;
  }
}

function TeamDnaScenarioCard({ card }) {
  if (!card) return null;
  return (
    <HomeCard
      badge={
        <>
          {/* Production launch-card pattern: filled "New" pill leads, then the
              outlined category badge. */}
          {card.isNew ? <Badge variant="new">New</Badge> : null}
          <Badge icon={<IconUsersBadge className="home-badge-icon" />}>
            {card.badgeLabel}
          </Badge>
        </>
      }
      title={card.title}
      subtitle={card.subtitle}
      body={card.body}
      thumb={renderScenarioThumb(card.thumb)}
      cta={
        <button
          type="button"
          className={`home-cta home-cta--${card.ctaVariant}`}
          onClick={card.onCta ?? undefined}
        >
          {card.ctaLabel}
        </button>
      }
    />
  );
}

/* Demo-only nav control (mirrors the Team page's "View as" dropdown): picks
   which Team DNA UME card state leads the home feed. Would not ship — in
   production the feed decides this from team + assessment status. */
function HomeScenarioMenu({ scenarioId, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active =
    TEAM_DNA_SCENARIOS.find((scenario) => scenario.id === scenarioId) ??
    TEAM_DNA_SCENARIOS[0];

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

  const groups = [];
  TEAM_DNA_SCENARIOS.forEach((scenario) => {
    let group = groups.find((entry) => entry.label === scenario.group);
    if (!group) {
      group = { label: scenario.group, items: [] };
      groups.push(group);
    }
    group.items.push(scenario);
  });

  return (
    <div className="monolith-persona-menu home-scenario-menu" ref={rootRef}>
      <button
        type="button"
        className="monolith-persona-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="monolith-persona-menu-eyebrow">UME card</span>
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
          className="monolith-persona-menu-pop home-scenario-menu-pop"
          role="menu"
          aria-label="Demo: Team DNA card state"
        >
          {groups.map((group) => (
            <div key={group.label} className="home-scenario-menu-group">
              <p className="home-scenario-menu-group-label">{group.label}</p>
              {group.items.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={scenario.id === scenarioId}
                  className="monolith-persona-menu-item"
                  data-active={scenario.id === scenarioId || undefined}
                  onClick={() => {
                    onSelect(scenario.id);
                    setOpen(false);
                  }}
                >
                  {scenario.menuLabel}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HomePage() {
  // Sam's stated priority is the manager awareness card, so it leads by default.
  const [scenarioId, setScenarioId] = useState('manager-kickoff');
  const activeScenario =
    TEAM_DNA_SCENARIOS.find((scenario) => scenario.id === scenarioId) ??
    TEAM_DNA_SCENARIOS[0];

  const goToAiCoaching = () => {
    window.location.assign('/ai-coaching');
  };

  const exerciseIcon = <IconExercise className="home-card-subtitle-icon" />;

  // One primary CTA per feed: when the Team DNA card leads with a filled
  // button, the Insights card steps down to the outline style.
  const insightsCtaVariant =
    activeScenario.card?.ctaVariant === 'primary' ? 'secondary' : 'primary';

  return (
    <div className="home-shell">
      <MonolithPrimaryNav
        activeLabel="Home"
        endExtra={
          <HomeScenarioMenu scenarioId={scenarioId} onSelect={setScenarioId} />
        }
      />
      <div className="home-scroll">
        <div className="home-content">
          {/* Production greeting: coach orb + "Welcome, {name} 👋", centered,
              no subheading when the chat input sits above the cards. */}
          <div className="home-greeting">
            <img
              src="/home/home-sun.png"
              alt=""
              aria-hidden="true"
              className="home-greeting-orb"
            />
            <h1>
              Welcome, {VIEWER_FIRST_NAME} <span aria-hidden="true">&#128075;</span>
            </h1>
          </div>

          <div className="home-composer">
            <button
              type="button"
              className="home-composer-bar"
              onClick={goToAiCoaching}
            >
              <span className="home-composer-placeholder">
                Chat with your AI coach about navigating feedback or other
                challenges
              </span>
              <span className="home-composer-actions">
                <span className="home-composer-mic" aria-hidden="true">
                  <IconMic className="home-composer-icon" />
                </span>
                <span
                  className="home-composer-voice"
                  aria-hidden="true"
                  title="Start voice conversation"
                >
                  <IconVoiceMode className="home-composer-icon" />
                </span>
              </span>
            </button>
          </div>

          <div className="home-cards">
            <TeamDnaScenarioCard card={activeScenario.card} />
            <HomeCard
              badge={
                <Badge icon={<IconInsights className="home-badge-icon" />}>
                  Insights
                </Badge>
              }
              title="See where you stand across your focus areas"
              subtitle="Assessment"
              body="Get a baseline across the skills you care about, plus a snapshot of your top strengths to kick off your coaching."
              thumb={
                <img
                  src="/home/home-leadership.png"
                  alt=""
                  aria-hidden="true"
                  className="home-card-thumb-contain"
                />
              }
              cta={
                <button
                  type="button"
                  className={`home-cta home-cta--${insightsCtaVariant}`}
                >
                  Start now
                </button>
              }
            />
            <HomeCard
              badge={
                <Badge icon={<IconSparkle className="home-badge-icon" />}>
                  AI Coaching
                </Badge>
              }
              title="Continue your AI coaching journey"
              body="Let's talk about your role and what you're working through, so I can learn how to support you."
              thumb={<OrbThumb />}
              cta={
                <button
                  type="button"
                  className="home-cta home-cta--secondary"
                  onClick={goToAiCoaching}
                >
                  Resume
                </button>
              }
            />
            <HomeCard
              badge={<Badge>From ACME</Badge>}
              title="The Manager Review Conversation"
              subtitle={'Exercise \u2022 5 mins'}
              subtitleIcon={exerciseIcon}
              body="You're about to have your performance review conversation with your manager. They'll share feedback across Impact, Velocity, and Growth. Practice navigating the conversation with openness and strategic thinking."
              thumb={<AcmeLogoTile />}
              cta={
                <button type="button" className="home-cta home-cta--secondary">
                  Start now
                </button>
              }
            />
            <HomeCard
              badge={
                <Badge icon={<IconSparkle className="home-badge-icon" />}>
                  AI Coaching
                </Badge>
              }
              title="Today's AI coaching topic, picked for you"
              body={
                '\u201CI\u2019m looking to boost my productivity by managing my energy levels more effectively throughout the day. I notice my focus and motivation dip at certain times. Help me think through strategies for this.\u201D'
              }
              thumb={<OrbThumb />}
              cta={
                <button
                  type="button"
                  className="home-cta home-cta--secondary"
                  onClick={goToAiCoaching}
                >
                  Start now
                </button>
              }
            />
            <HomeCard
              badge={
                <Badge icon={<IconPractice className="home-badge-icon" />}>
                  Practice
                </Badge>
              }
              title="Work smarter with the 80/20 rule"
              subtitle={'Exercise \u2022 10 mins'}
              subtitleIcon={exerciseIcon}
              body="Identify high-impact tasks so you can focus your time where it matters most."
              thumb={
                <img
                  src="/home/coaching-circles.png"
                  alt=""
                  aria-hidden="true"
                  className="home-card-thumb-contain"
                />
              }
              cta={
                <button type="button" className="home-cta home-cta--secondary">
                  Start now
                </button>
              }
            />
          </div>

          <p className="home-disclaimer">
            <strong>
              Your AI coaching chats are private and we don&rsquo;t share them
              with your employer
            </strong>
            . AI isn&rsquo;t perfect, so please use your best judgment.{' '}
            <button type="button" className="home-disclaimer-link">
              Learn about your privacy.
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
