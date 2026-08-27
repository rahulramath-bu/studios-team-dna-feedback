import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Face,
  CoachFootLink,
  firstName,
  summaryText,
  renderEmphasis,
  FieldWave,
} from './conceptPrimitives.jsx';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { TeamShapeContributions } from './TeamShapeContributions.jsx';
import { BIG_FIVE_TRAITS, getBigFiveScore } from '../data/bigFiveTraits.js';
import { getPairDistance } from '../data/teamReadModel.js';
import {
  getTraitStrips,
  getChemistryModel,
  getProfileModel,
  getComparePairSuggestions,
  getPairMeaning,
  POLE_MEANING,
} from '../data/conceptReadModel.js';
import {
  buildTeamShapeContributions,
  getTeamSignature,
} from '../data/teamDnaTeamShape.js';
import { WorkingStylesStage } from './WorkingStylesStage.jsx';
import { getStrengthForSubjects } from '../data/teamDnaStrengths.js';
import { getWatchOutForSubjects } from '../data/teamDnaWatchOuts.js';
import {
  getPersonSynthesis,
  getPairSynthesisByIds,
} from '../data/teamDnaGeneratedInsights.mock.js';
import { getMemberRoles } from '../data/teamDnaRoles.js';
import { toSecondPersonText } from './InsightPanel.jsx';

/**
 * Concept 5 · "V5" — the Terra rebuild, told as a story.
 *
 * Every page walks the same arc: who this is, where they're alike, where
 * they differ, what to lean on and watch, and how they like to work.
 * Type discipline (from Vasil's Terra pages): serif is ONLY the page
 * title and short section titles (nouns, never sentences); the insight
 * lives in a one-to-two line sans lead under each title; mono is only
 * badges, poles, and small evidence lines. Strengths and growth areas are
 * ONE card each, and every claim carries a quiet evidence line — a count,
 * a score, or a gap over the team wave — instead of a billboard number.
 */

export const FIVE_TABS = [
  { id: 'overview', title: 'Team profile' },
  { id: 'profile', title: 'Individual profiles' },
  { id: 'compare', title: 'Compare profiles' },
];

/* Plain-words behavior per pole, base verb form ("you/some people ...").
   POLE_MEANING (imported) carries the third-person-singular versions. */
const POLE_MEANING_BASE = {
  openness: {
    low: 'stay close to what has worked',
    high: 'reach for new angles first',
  },
  conscientiousness: {
    low: 'start moving and adjust',
    high: 'work from a plan',
  },
  extraversion: {
    low: 'process before speaking',
    high: 'think out loud',
  },
  agreeableness: {
    low: 'question and challenge first',
    high: 'trust and cooperate first',
  },
  neuroticism: {
    low: 'stay level under pressure',
    high: 'sense risk early',
  },
};

/* ── Page chrome ─────────────────────────────────────────────────────────── */

/** Product row + centered page header. One crumb line answers "where am I"
 *  (back to Team home, inside Team DNA); the team name itself is the
 *  switcher — other teams, edit, and new team all live in its menu. */
export function ConceptFiveBar({
  lens,
  onSelect,
  teamName,
  teamType,
  memberCount,
  members,
  selectedIds = [],
  viewerId,
  onFaceClick,
  teamOptions = [],
  selectedTeamId,
  canManageTeam = false,
  onTeamChange,
  onAddTeam,
  onExitToTeamHome,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const otherTeams = teamOptions.filter((team) => team.id !== selectedTeamId);
  const hasMenu = otherTeams.length > 0 || canManageTeam;
  // The rail is the one selector: display-only on the team tab, pick-one on
  // Individual, pick-two on Compare.
  const railInteractive = lens === 'profile' || lens === 'compare';
  const [touchedLenses, setTouchedLenses] = useState({});
  const markTouched = () =>
    setTouchedLenses((current) =>
      current[lens] ? current : { ...current, [lens]: true }
    );
  // Education lives ON the faces, exactly like the original field: every few
  // seconds one candidate gets a "Tap me" pill and a playful pulse. On
  // Individual it runs until the first tap; on Compare it keeps nudging
  // whoever can still complete the pair.
  const [tapHint, setTapHint] = useState({ cycle: 0, memberId: null });
  const hintableKey = (
    lens === 'profile' && !touchedLenses.profile
      ? members.map((member) => member.id)
      : lens === 'compare' && selectedIds.length < 2
        ? members
            .filter((member) => !selectedIds.includes(member.id))
            .map((member) => member.id)
        : []
  ).join(':');
  useEffect(() => {
    const ids = hintableKey ? hintableKey.split(':') : [];
    if (ids.length === 0) {
      setTapHint({ cycle: 0, memberId: null });
      return undefined;
    }
    let cancelled = false;
    let cycle = 0;
    let previous = null;
    const timeouts = [];
    const later = (fn, ms) => timeouts.push(window.setTimeout(fn, ms));
    const queue = (delay) => {
      later(() => {
        if (cancelled) return;
        const pool = ids.length > 1 ? ids.filter((id) => id !== previous) : ids;
        const memberId = pool[Math.floor(Math.random() * pool.length)];
        previous = memberId;
        cycle += 1;
        setTapHint({ cycle, memberId });
        later(() => {
          if (cancelled) return;
          setTapHint({ cycle, memberId: null });
          queue(2400);
        }, 3300);
      }, delay);
    };
    queue(1200);
    return () => {
      cancelled = true;
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      setTapHint({ cycle: 0, memberId: null });
    };
  }, [hintableKey]);
  // Pair complete: the two glide together in the middle on a marching
  // dotted tie, scale up a touch, and everyone else steps back.
  const pairComplete = lens === 'compare' && selectedIds.length === 2;
  let railItems = members.map((member) => ({ type: 'face', member }));
  if (pairComplete) {
    const picked = members
      .filter((member) => selectedIds.includes(member.id))
      .sort(
        (m, n) => selectedIds.indexOf(m.id) - selectedIds.indexOf(n.id)
      );
    const others = members.filter(
      (member) => !selectedIds.includes(member.id)
    );
    const half = Math.ceil(others.length / 2);
    railItems = [
      ...others.slice(0, half).map((member) => ({ type: 'face', member })),
      { type: 'face', member: picked[0] },
      { type: 'tie' },
      { type: 'face', member: picked[1] },
      ...others.slice(half).map((member) => ({ type: 'face', member })),
    ];
  }

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="lensx-bar-row fivex-bar" data-with-header>
      {/* One wayfinding line, mono like the original: TEAM / TEAM DNA. */}
      <div className="fivex-chrome">
        <div className="fivex-crumbs">
          <button
            type="button"
            className="fivex-crumb"
            onClick={() => onExitToTeamHome?.()}
          >
            Team
          </button>
          <span className="fivex-crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="fivex-crumb-here">Team DNA</span>
        </div>
      </div>

      {/* The team name IS the switcher: other teams, edit, and new team
          share its menu. Roster and tabs below stay centered. */}
      <div className="fivex-head">
        <div className="fivex-team" ref={menuRef}>
          {hasMenu ? (
            <button
              type="button"
              className="fivex-title-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <h1 className="fivex-title">{teamName}</h1>
              <span className="fivex-title-caret" aria-hidden="true">
                <BetterUpIcon name="ChevronDown" size={18} strokeWidth={1.9} />
              </span>
            </button>
          ) : (
            <h1 className="fivex-title">{teamName}</h1>
          )}
          {menuOpen ? (
            <div className="fivex-team-menu" role="menu">
              {otherTeams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  role="menuitem"
                  className="fivex-team-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onTeamChange?.(team.id);
                  }}
                >
                  <span className="fivex-team-mark" aria-hidden="true">
                    {team.name?.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="fivex-team-item-name">{team.name}</span>
                  {typeof team.memberCount === 'number' ? (
                    <span className="fivex-team-count">
                      {team.memberCount}
                    </span>
                  ) : null}
                </button>
              ))}
              {otherTeams.length > 0 && canManageTeam ? (
                <div className="fivex-menu-sep" role="separator" />
              ) : null}
              {/* No team editing in this build: the menu is teams + new. */}
              {canManageTeam ? (
                <button
                  type="button"
                  role="menuitem"
                  className="fivex-team-item fivex-team-item--action"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddTeam?.();
                  }}
                >
                  <span
                    className="fivex-team-mark fivex-team-mark--action"
                    aria-hidden="true"
                  >
                    <BetterUpIcon name="Plus" size={14} strokeWidth={2} />
                  </span>
                  <span className="fivex-team-item-name">New team</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {teamType || memberCount ? (
          <p className="fivex-meta">
            {[teamType, memberCount ? `${memberCount} members` : null]
              .filter(Boolean)
              .join(' \u00b7 ')}
          </p>
        ) : null}
      </div>

      <div
        className="onex-rail fivex-rail"
        role="group"
        aria-label="Team members"
      >
        {railItems.map((item) => {
          if (item.type === 'tie') {
            return (
              <motion.span
                key="pair-tie"
                layout
                className="fivex-rail-tie"
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: 1,
                  width: 26,
                  transition: { delay: 0.08, duration: 0.32 },
                }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 26 4" preserveAspectRatio="none">
                  <line x1="2" y1="2" x2="24" y2="2" />
                </svg>
              </motion.span>
            );
          }
          const { member } = item;
          const active = railInteractive && selectedIds.includes(member.id);
          const hinted = tapHint.memberId === member.id;
          if (!railInteractive) {
            // Team tab: the rail just shows who's on the team.
            return (
              <span
                key={member.id}
                className="onex-rail-face"
                data-static
                title={member.name}
              >
                <Face member={member} size={36} ringed={false} />
                {member.id === viewerId ? (
                  <span className="onex-rail-you">you</span>
                ) : null}
              </span>
            );
          }
          return (
            <motion.button
              key={member.id}
              layout
              animate={{ scale: pairComplete && active ? 1.18 : 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              type="button"
              className="onex-rail-face"
              data-active={active || undefined}
              data-dim={(pairComplete && !active) || undefined}
              title={member.name}
              aria-pressed={active}
              onClick={() => {
                markTouched();
                onFaceClick?.(member.id);
              }}
            >
              {/* CSS animations live on this inner layer so they never
                  fight the motion transforms on the button itself. */}
              <span
                className="fivex-rail-inner"
                data-taphint={hinted || undefined}
              >
                <Face member={member} size={36} ringed={active} />
                {member.id === viewerId && !hinted ? (
                  <span className="onex-rail-you">you</span>
                ) : null}
                {hinted ? (
                  <span
                    key={`tapme-${tapHint.cycle}`}
                    className="fivex-rail-tapme"
                    aria-hidden="true"
                  >
                    Tap me
                  </span>
                ) : null}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="fivex-tabbar" role="tablist" aria-label="Views">
        {FIVE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={lens === tab.id}
            className="fivex-tab"
            data-active={lens === tab.id || undefined}
            onClick={() => onSelect(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConceptFive({
  scope,
  lens = 'overview',
  subjects,
  allSubjects,
  viewerId,
  insight,
  teamName,
  onCoachPrompt,
  onSelectMember,
  onSelectPair,
}) {
  if (lens === 'profile') {
    const person =
      (scope === 'person' ? subjects[0] : null) ??
      allSubjects.find((member) => member.id === viewerId) ??
      allSubjects[0];
    return (
      <ProfileView
        person={person}
        allSubjects={allSubjects}
        isOwn={person?.id === viewerId}
        onCoachPrompt={onCoachPrompt}
      />
    );
  }

  if (lens === 'compare') {
    if (scope === 'duo' && subjects.length === 2) {
      return (
        <CompareDuo
          pair={subjects}
          allSubjects={allSubjects}
          onCoachPrompt={onCoachPrompt}
        />
      );
    }
    return (
      <ComparePicker
        scope={scope}
        subjects={subjects}
        allSubjects={allSubjects}
        viewerId={viewerId}
        onSelectPair={onSelectPair}
      />
    );
  }

  return (
    <OverviewView
      insight={insight}
      allSubjects={allSubjects}
      viewerId={viewerId}
      teamName={teamName}
      onCoachPrompt={onCoachPrompt}
      onSelectMember={onSelectMember}
    />
  );
}

/* ── Shared pieces ───────────────────────────────────────────────────────── */

function firstSentence(text = '') {
  return text.match(/^.*?\./)?.[0] ?? text;
}

/** The hover read: what this score MEANS against the room, in plain
 *  qualitative words, not a math recap. */
function hoverRead(row, isOwn, name) {
  const gap = Math.abs(row.delta);
  const pole = (
    row.delta >= 0 ? row.trait.highLabel : row.trait.lowLabel
  ).toLowerCase();
  if (gap <= 4) {
    return `${isOwn ? 'You\u2019re' : `${name} is`} right with the team on this one.`;
  }
  if (gap <= 14) {
    return `A bit more ${pole} than the team overall.`;
  }
  if (gap <= 24) {
    return `Clearly more ${pole} than the team: part of what ${
      isOwn ? 'you bring' : `${name} brings`
    } to the room.`;
  }
  return `Way more ${pole} than the rest of the team: one of ${
    isOwn ? 'your' : `${name}\u2019s`
  } defining traits.`;
}

/** Claim descriptions aim for the same visual weight (~2 lines): long
 *  sentences get trimmed at a clause seam, short ones pull in the next
 *  sentence while the total stays under two lines. */
function claimLine(text = '') {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text];
  const [first, second] = sentences;
  let line = first ?? text;
  if (line.length > 118) {
    const seams = [' and ', ', even when ', ', even if ', ' so that '];
    let cut = -1;
    seams.forEach((seam) => {
      const index = line.lastIndexOf(seam);
      if (index > 60 && index < 118 && index > cut) cut = index;
    });
    if (cut > 0) {
      line = `${line.slice(0, cut).replace(/[,;\s]+$/, '')}.`;
    }
  }
  if (second && line.length < 90 && line.length + second.length < 150) {
    return `${line} ${second}`;
  }
  return line;
}

/* The team wave (range band + cluster glow + mean tick) now lives in
   conceptPrimitives so the working-style variants share it. */

/**
 * Trait accordion, drawn like the ORIGINAL spectrum: a capped line (small
 * tick at each end), the green density showing where the room sits, and
 * the mean tick. Collapsed rows carry no people at all. "See insight"
 * opens the row: the avatars land ON the same line, in the same column,
 * and the insight sits directly under that column so everything between
 * the two poles stays aligned.
 */
function TraitRows({
  strips,
  reads,
  viewerId,
  onSelectMember,
  defaultOpenKey = null,
}) {
  // Per-row accordion: the insight opens directly under its own trait, and
  // the chevron doubles as the collapse control. Row height is fixed, so
  // opening only reveals the insight line below the strip.
  const [openKey, setOpenKey] = useState(defaultOpenKey);
  return (
    <div className="fva-rows">
        {strips.map((strip) => {
          const open = openKey === strip.trait.key;
          const scores = strip.members.map(({ score }) => score);
          const toggle = () => setOpenKey(open ? null : strip.trait.key);
          return (
            <div
              className="fva"
              data-open={open || undefined}
              key={strip.trait.key}
            >
              <div className="fva-row" onClick={toggle}>
                <span className="fva-name">{strip.label}</span>
                <span className="fva-pole">{strip.trait.lowLabel}</span>
                <span className="fva-mini">
                  <span className="fva-cap" aria-hidden="true" />
                  <span className="fva-cap fva-cap--end" aria-hidden="true" />
                  <FieldWave scores={scores} />
                  {open
                    ? strip.members.map(({ member, score }) => (
                        <button
                          key={member.id}
                          type="button"
                          className="fvr-face"
                          style={{ left: `${score}%` }}
                          aria-label={`Open ${member.name}'s profile`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectMember?.(member.id, { mode: 'solo' });
                          }}
                        >
                          <Face
                            member={member}
                            size={22}
                            ringed={member.id === viewerId}
                          />
                          {/* Same hover treatment as the original spectrum:
                              face grows, dark pill names the person + score. */}
                          <span className="fvr-tip" role="tooltip">
                            <strong>{member.name}</strong>
                            <span>
                              {strip.label}: {score}/100
                            </span>
                          </span>
                        </button>
                      ))
                    : null}
                </span>
                <span className="fva-pole fva-pole--right">
                  {strip.trait.highLabel}
                </span>
                <button
                  type="button"
                  className="fva-more"
                  aria-expanded={open}
                  aria-label={open ? 'Hide insight' : 'See insight'}
                  title={open ? 'Hide insight' : 'See insight'}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle();
                  }}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      d="M4 6.5 8 10.5 12 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {open ? (
                <div className="fva-detail">
                  {/* One paragraph, one style: the trait defined in brief,
                      then what this team's distribution means. */}
                  <p className="fva-insight">
                    {renderEmphasis(
                      [
                        strip.trait.definition,
                        reads?.[strip.trait.key] ?? strip.insight,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}

/* What to DO with a team strength, keyed by trait pole. Written as moves a
   manager or member could take this week: one line each, same rhythm as the
   discussion questions. */
/* One conversation-starter per strength pattern: strengths should prompt
   discussion too, not just usage tips. */
const STRENGTH_QUESTIONS = {
  'openness:high':
    'Which current problem deserves a genuinely new approach from us?',
  'openness:low':
    'Which proven playbook of ours should we double down on right now?',
  'conscientiousness:high':
    'Which commitment matters most to protect this quarter?',
  'conscientiousness:low':
    'Where has our flexibility saved a project recently, and how do we repeat it?',
  'extraversion:high':
    'Which stalled question should we just talk out live this week?',
  'extraversion:low':
    'Which decision deserves a written round of thinking before we meet?',
  'agreeableness:high':
    'Where would early buy-in change the outcome of our current work?',
  'agreeableness:low':
    'Which plan needs our toughest pre-ship critique next?',
  'neuroticism:high':
    'What risk have we spotted that nobody has written down yet?',
  'neuroticism:low':
    'Which high-pressure moment ahead should we volunteer for?',
};

/* One discussion question per growth pattern, for the team to answer
   together. */
const GROWTH_QUESTIONS = {
  'openness:high': 'What forces us to stop exploring and commit to one option?',
  'openness:low':
    'When did we last try an approach nobody here had used before?',
  'openness:wide': 'When do we explore, and when do we run the playbook?',
  'conscientiousness:high':
    'Which plan are we still protecting after the situation outgrew it?',
  'conscientiousness:low':
    'Where does \u201cdone\u201d need a harder definition than it has today?',
  'conscientiousness:wide':
    'Who defines \u201cdone\u201d on our current work, and does everyone agree?',
  'extraversion:high': 'Who writes the decision down once the discussion ends?',
  'extraversion:low':
    'Where do decisions stall because nobody pushes them out loud?',
  'extraversion:wide':
    'Who hasn\u2019t spoken by mid-meeting, and who invites them in?',
  'agreeableness:high': 'Where are we being polite instead of honest right now?',
  'agreeableness:low': 'Which recent pushback landed as friction instead of help?',
  'agreeableness:wide':
    'How do we want disagreement raised: in the room, or one-on-one?',
  'neuroticism:high':
    'Which current worry deserves a named owner instead of a vague hope?',
  'neuroticism:low': 'What early-warning signal would we notice too late right now?',
  'neuroticism:wide':
    'When someone flags a risk, what happens next: owned, logged, or lost?',
};

const itemKey = (item) => `${item.traitKey}:${item.type}`;

/** ONE card for strengths, ONE for growth. Two claims (title + one line),
 *  then one bullet list: what to do about them, in the original page's
 *  collaboration-tips style. */
function ListCard({ label, tone, items, actions, coachPrompt, onCoachPrompt }) {
  return (
    <article className="fvl">
      <p className="fvs-badge" data-tone={tone}>
        {label}
      </p>
      {items.map((item) => (
        <div className="fvl-item" key={itemKey(item)}>
          <p className="fvl-title">{item.title.replace(/\.\s*$/, '')}</p>
          <p className="fvl-line">{claimLine(item.body)}</p>
        </div>
      ))}
      {[]
        .concat(actions ?? [])
        .filter((group) => group?.bullets?.length)
        .map((group) => (
          <div className="fvl-actions" key={group.label}>
            <p className="fvl-actions-label">{group.label}</p>
            <ul className="fvl-bullets">
              {group.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      {coachPrompt ? (
        <div className="fvl-foot">
          <CoachFootLink prompt={coachPrompt} onCoachPrompt={onCoachPrompt} />
        </div>
      ) : null}
    </article>
  );
}

/* ── Lens 1 · Team profile ───────────────────────────────────────────────── */

function OverviewView({
  insight,
  allSubjects,
  viewerId,
  teamName,
  onCoachPrompt,
  onSelectMember,
}) {
  const strips = getTraitStrips(allSubjects);
  const chem = getChemistryModel(allSubjects);
  const contributions = buildTeamShapeContributions(allSubjects);

  // One section, all five traits, tightest first. Each row carries ONE
  // distribution-shaped read (clustered / two camps / full range / lean).
  const orderedStrips = [...strips].sort(
    (a, b) => stripShape(a).spread - stripShape(b).spread
  );
  const traitReads = Object.fromEntries(
    strips.map((strip) => [
      strip.trait.key,
      shapeRead(strip, allSubjects.length),
    ])
  );
  const traitsLead = getTraitsLead(strips);

  // Two claims per card, then ONE group of three questions each: both
  // cards prompt conversation the same way, only the heading differs.
  const strengthQuestions = [
    ...chem.strengths
      .map((item) => STRENGTH_QUESTIONS[itemKey(item)])
      .filter(Boolean),
    'Which current project would benefit most from these strengths?',
  ].slice(0, 3);
  const growthQuestions = [
    ...chem.watchOuts.map((item) => GROWTH_QUESTIONS[itemKey(item)]).filter(Boolean),
    'Which of these would bite first on the current work?',
  ].slice(0, 3);

  return (
    <div className="fivex-stack" aria-label="Team profile">
      {/* 1 · Who you are together. Header outside the cards (same as every
          section), then the individual profile's exact structure: the
          team's identity card on the left, spectrum card on the right. */}
      <section className="fvg" id="fvsec-hero">
        <p className="fvx-chapnum">01</p>
        <h2 className="fvc-title">Who you are together</h2>
        <p className="fvc-lead">
          What kind of team this is: the personality you add up to together,
          who naturally plays which role, and where each person sits on the
          five traits.
        </p>
        <div className="fivex-profile">
          {/* Two cards, same structure as the individual profile. V4's text
              treatment lives INSIDE this layout: a real serif signature
              name, comfortable body spacing. */}
          {/* Both cards share one type system: kicker, serif title, lead —
              same sizes, same gaps. */}
          <section className="fvc fvc--id">
            <p className="fvc-kicker">Team signature</p>
            <h3 className="fvc-title">
              {getTeamSignature(allSubjects) ?? teamName}
            </h3>
            <p className="fvc-lead">{summaryText(insight)}</p>
            <div className="fvx-fit">
              <p className="fvc-kicker fvc-kicker--tight">Archetype mix</p>
              <TeamShapeContributions
                contributions={contributions}
                onSelectMember={onSelectMember}
              />
            </div>
          </section>
          <section className="fvc fvc--lands">
            <p className="fvc-kicker">Big Five breakdown</p>
            <h2 className="fvc-title">Where everyone lands</h2>
            <p className="fvc-lead">{traitsLead}</p>
            <TraitRows
              strips={orderedStrips}
              reads={traitReads}
              viewerId={viewerId}
              onSelectMember={onSelectMember}
            />
          </section>
        </div>
      </section>

      {/* 4 · What to lean on, what to watch. */}
      <section className="fvg" id="fvsec-growth">
        <p className="fvx-chapnum">02</p>
        <h2 className="fvc-title">Strengths &amp; growth areas</h2>
        <p className="fvc-lead">
          What this mix makes the team naturally good at, and where the same
          habits can work against you. Each side comes with questions worth
          talking through together.
        </p>
        <div className="fivex-two">
          <ListCard
            label="Team strengths"
            tone="strength"
            items={chem.strengths}
            actions={{
              label: 'How will you use these strengths?',
              bullets: strengthQuestions,
            }}
            coachPrompt="How do we put my team's strengths to work on our current projects?"
            onCoachPrompt={onCoachPrompt}
          />
          <ListCard
            label="Growth areas"
            tone="growth"
            items={chem.watchOuts}
            actions={{
              label: 'How will you tackle these growth areas?',
              bullets: growthQuestions,
            }}
            coachPrompt="Help me run a team conversation about our growth areas, starting from these discussion questions."
            onCoachPrompt={onCoachPrompt}
          />
        </div>
      </section>

      {/* 5 · How you like to work: header outside, stage in its own card. */}
      <section className="fvg" id="fvsec-work">
        <p className="fvx-chapnum">03</p>
        <h2 className="fvc-title">How you like to work</h2>
        <p className="fvc-lead">
          How this team actually prefers to work: pace, structure,
          collaboration, communication, and approach. Pick a topic to see
          where everyone stands &mdash; and where the room splits, agree on a
          default.
        </p>
        <section className="fvc">
          {/* The section coach foot lives inside the stage: it only shows
              on views without their own per-item "Dive deeper" links. */}
          <WorkingStylesStage
            subjects={allSubjects}
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      </section>
    </div>
  );
}

/* The distribution shape of one trait: total spread, plus the largest
   empty stretch with at least two people on each side (a real gap, not an
   outlier). */
function stripShape(strip) {
  const scores = strip.members.map(({ score }) => score);
  const spread = Math.round(Math.max(...scores) - Math.min(...scores));
  let gap = null;
  for (let i = 1; i < scores.length; i += 1) {
    const size = scores[i] - scores[i - 1];
    const lowCount = i;
    const highCount = scores.length - i;
    if (
      size >= 28 &&
      lowCount >= 2 &&
      highCount >= 2 &&
      (!gap || size > gap.size)
    ) {
      gap = { size: Math.round(size), lowCount, highCount };
    }
  }
  return { spread, gap };
}

/* ONE read per trait, and it varies with the distribution: clustered, two
   camps with a gap, full range, or a lean. Neutral about all of them: a
   gap is a handoff to manage, not a flaw. */
function shapeRead(strip, total) {
  const { spread, gap } = stripShape(strip);
  const lowPole = strip.trait.lowLabel.toLowerCase();
  const highPole = strip.trait.highLabel.toLowerCase();
  const side = strip.average >= 50 ? 'high' : 'low';
  const pole = side === 'high' ? highPole : lowPole;
  const otherPole = side === 'high' ? lowPole : highPole;
  const does = POLE_MEANING_BASE[strip.trait.key][side];

  // Reads describe the distribution and stop there: counts, spread, and
  // what the majority mode looks like. No advice, no judgment — that
  // lives in Strengths & growth areas.
  if (gap) {
    return `Two camps here: ${gap.lowCount} **${lowPole}**, ${gap.highCount} **${highPole}**, and nobody in between.`;
  }
  if (spread <= 26) {
    return `Everyone lands within ${spread} points on the **${pole}** side: as a group you ${does}.`;
  }
  if (spread > 45) {
    const lowCount = strip.members.filter(({ score }) => score < 50).length;
    const highCount = total - lowCount;
    const minorCount = Math.min(lowCount, highCount);
    if (minorCount >= Math.ceil(total / 3)) {
      return `A genuine split: ${lowCount} lean **${lowPole}**, ${highCount} lean **${highPole}**, with people all along the line.`;
    }
    const majorIsHigh = highCount >= lowCount;
    const majorPole = majorIsHigh ? highPole : lowPole;
    const minorPole = majorIsHigh ? lowPole : highPole;
    const majorCount = Math.max(lowCount, highCount);
    return `Wide range with a lean: ${majorCount} of ${total} sit **${majorPole}**, while ${minorCount} hold${minorCount === 1 ? 's' : ''} the **${minorPole}** end.`;
  }
  const majorCount = strip.members.filter(({ score }) =>
    side === 'high' ? score >= 50 : score < 50
  ).length;
  if (majorCount === total) {
    return `All ${total} of you sit on the **${pole}** side, some barely, some strongly: as a group you ${does}.`;
  }
  return `Most of the team (${majorCount} of ${total}) sits on the **${pole}** side: as a group you ${does}. The other ${total - majorCount} sit${total - majorCount === 1 ? 's' : ''} **${otherPole}**.`;
}

/* The section lead: tightest trait, widest trait, and any real gap. */
function getTraitsLead(strips) {
  const withShape = strips.map((strip) => ({ strip, shape: stripShape(strip) }));
  const tightest = [...withShape].sort((a, b) => a.shape.spread - b.shape.spread)[0];
  const widest = [...withShape].sort((a, b) => b.shape.spread - a.shape.spread)[0];
  const gapped = withShape.find((entry) => entry.shape.gap);
  const gapNote = gapped
    ? ` On ${gapped.strip.trait.label.toLowerCase()}, the team splits into two camps with nobody in between.`
    : '';
  return `Most alike on ${tightest.strip.trait.label.toLowerCase()}, most spread out on ${widest.strip.trait.label.toLowerCase()}.${gapNote} Open a row to see who sits where.`;
}

/* ── Lens 2 · Individual profiles ────────────────────────────────────────── */

function ProfileView({ person, allSubjects, isOwn, onCoachPrompt }) {
  if (!person) return null;
  const model = getProfileModel(person, allSubjects);
  const name = firstName(person);
  const top = model.rows[0];
  const topSide = top.delta >= 0 ? 'high' : 'low';
  const topPole = topSide === 'high' ? top.trait.highLabel : top.trait.lowLabel;
  const traitWord = top.trait.label.toLowerCase();
  const bigFiveLead = isOwn
    ? `Your clearest difference from the group is ${traitWord}: ${Math.abs(top.delta)} points more ${topPole.toLowerCase()} than the team average. The tick on each line marks that average.`
    : `${name}'s clearest difference from the group is ${traitWord}: ${Math.abs(top.delta)} points more ${topPole.toLowerCase()} than the team average. The tick on each line marks that average.`;

  // The original persona: title, description, and the two meeting roles.
  const synthesis = getPersonSynthesis(person.id);
  const roles = getMemberRoles(person);
  const personaBody =
    synthesis && isOwn
      ? toSecondPersonText(synthesis.summary, name, person.pronouns ?? {})
      : synthesis?.summary;

  // Where you fit: one score-ranked superlative, one "the team leans on
  // you when..." line derived from the synthesis.
  const rankSide = top.delta >= 0 ? 'high' : 'low';
  const rankPole = (
    rankSide === 'high' ? top.trait.highLabel : top.trait.lowLabel
  ).toLowerCase();
  const aheadCount = allSubjects.filter((member) => {
    const score = getBigFiveScore(member, top.trait.key);
    return rankSide === 'high' ? score > top.score : score < top.score;
  }).length;
  const ordinal =
    aheadCount === 0
      ? 'most'
      : aheadCount === 1
        ? 'second-most'
        : aheadCount === 2
          ? 'third-most'
          : null;
  const bestForRest = synthesis?.bestFor
    ? firstSentence(synthesis.bestFor).replace(/^Use\s+\S+\s+/, '')
    : null;
  const leanLine =
    bestForRest && /^(when|for|to)\b/i.test(bestForRest)
      ? `The team leans on ${isOwn ? 'you' : name} ${bestForRest.replace(/\.?$/, '.')}`
      : null;

  const strengthItems = model.strengths.slice(0, 2);
  const growthItems = model.watchOuts.slice(0, 2);
  // Strengths get moves too, not just the growth side: one brief line per
  // strength plus a closer. Kept short so no bullet wraps.
  const useBullets = [
    ...strengthItems.map((item) => item.use).filter(Boolean),
    isOwn
      ? 'Volunteer for one of these this week.'
      : `Route this kind of work ${name}\u2019s way.`,
  ];
  // Growth bullets: the concrete try-lines that ship with each watch-out,
  // closed with a pick-one prompt.
  const tryBullets = [
    ...growthItems.map((item) => item.tipLine).filter(Boolean),
    isOwn
      ? 'Pick one to try this week.'
      : `Pick one to raise in ${name}\u2019s next 1:1.`,
  ].slice(0, 3);

  return (
    <div
      className="fivex-stack"
      aria-label={isOwn ? 'My profile' : `${person.name}'s profile`}
    >
      <div className="fivex-profile">
        <section className="fvc fvc--id">
          <p className="fvc-kicker">{isOwn ? 'My profile' : 'Profile'}</p>
          <div className="fvx-idrow">
            <Face member={person} size={52} ringed={isOwn} />
            <div className="fvx-idcopy">
              <strong>{person.name}</strong>
            </div>
          </div>
          {synthesis ? (
            <div className="fvx-persona">
              <p className="fvx-persona-title">{synthesis.title}</p>
              <p className="fvx-persona-body">{firstSentence(personaBody)}</p>
              {roles ? (
                <p className="fvx-persona-body">
                  In team meetings, {isOwn ? 'your' : `${name}\u2019s`} primary
                  role is the{' '}
                  <strong className="fvx-role--primary">
                    {roles.primary.name}
                  </strong>
                  ; {isOwn ? 'your' : 'the'} secondary, the{' '}
                  <strong className="fvx-role--secondary">
                    {roles.secondary.name}
                  </strong>
                  .
                </p>
              ) : null}
            </div>
          ) : null}
          {/* Separate section, same type system: mono kicker + sans body. */}
          <div className="fvx-fit">
            <p className="fvc-kicker fvc-kicker--tight">
              Where {isOwn ? 'you fit' : `${name} fits`}
            </p>
            <p className="fvx-persona-body fvx-persona-body--flush">
              {ordinal ? (
                <>
                  {isOwn ? 'You\u2019re' : `${name} is`} the{' '}
                  <strong>
                    {ordinal} {rankPole}
                  </strong>{' '}
                  person on this team.
                </>
              ) : (
                <>
                  {isOwn ? 'You\u2019re' : `${name} is`} among the more{' '}
                  <strong>{rankPole}</strong> people on this team.
                </>
              )}
            </p>
            {leanLine ? <p className="fvx-persona-body">{leanLine}</p> : null}
          </div>
        </section>

        <section className="fvc">
          <h2 className="fvc-title">
            {isOwn ? 'You, next to the team' : `${name}, next to the team`}
          </h2>
          <p className="fvc-lead">{bigFiveLead}</p>
          <div className="fva-rows">
            {model.rows.map((row) => (
              <div className="fvp-row" key={row.trait.key}>
                <span className="fva-name">{row.label}</span>
                <span className="fva-pole">{row.trait.lowLabel}</span>
                <span className="fva-mini fvp-mini">
                  <span className="fva-cap" aria-hidden="true" />
                  <span className="fva-cap fva-cap--end" aria-hidden="true" />
                  <span
                    className="fvp-tick"
                    style={{ left: `${row.average}%` }}
                    aria-hidden="true"
                  />
                  <span className="fvp-me" style={{ left: `${row.score}%` }}>
                    <Face
                      member={person}
                      size={22}
                      ringed={isOwn}
                      titled={false}
                    />
                    <span className="fvp-tip" role="tooltip">
                      <strong>
                        {row.label} {'\u00b7'} {row.score} of 100
                      </strong>
                      <span>{hoverRead(row, isOwn, name)}</span>
                    </span>
                  </span>
                </span>
                <span className="fva-pole fva-pole--right">
                  {row.trait.highLabel}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="fvg">
        <h2 className="fvc-title">
          {isOwn ? 'Your strengths & growth areas' : `${name}'s strengths & growth areas`}
        </h2>
        <p className="fvc-lead">
          What {isOwn ? 'you\u2019re' : `${name} is`} naturally set up to do
          well, and where the same habits can overshoot. Both come from{' '}
          {isOwn ? 'your' : 'their'} strongest traits.
        </p>
        <div className="fivex-two">
          <ListCard
            label="Strengths"
            tone="strength"
            items={strengthItems}
            actions={{ label: 'Put them to work', bullets: useBullets }}
            coachPrompt={
              isOwn
                ? 'Where should I lean on my strengths this week?'
                : `How do we make the most of ${name}'s strengths?`
            }
            onCoachPrompt={onCoachPrompt}
          />
          <ListCard
            label="Growth areas"
            tone="growth"
            items={growthItems}
            actions={{ label: 'Worth trying', bullets: tryBullets }}
            coachPrompt={
              isOwn
                ? 'Coach me through my growth areas and help me pick one thing to try this week.'
                : `How do we support ${name}'s growth areas without blunting their strengths?`
            }
            onCoachPrompt={onCoachPrompt}
          />
        </div>
      </section>

      {/* Same pattern as every other section: heading and lead outside,
          the card holds only the visualization. */}
      <section className="fvg">
        <h2 className="fvc-title">
          How {isOwn ? 'you like' : `${name} likes`} to work
        </h2>
        <p className="fvc-lead">
          How {isOwn ? 'you prefer' : `${name} prefers`} to get work done,
          highlighted against the rest of the team. Where{' '}
          {isOwn ? 'you sit' : `${name} sits`} apart from the room, saying it
          out loud turns friction into an easy agreement.
        </p>
        <section className="fvc">
          {/* The coach link lives inside the stage panel, under the
              insight, as "Dive deeper" — same as the team view. */}
          <WorkingStylesStage
            subjects={allSubjects}
            focusIds={[person.id]}
            focusIsViewer={isOwn}
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      </section>
    </div>
  );
}

/* ── Lens 3 · Compare profiles ───────────────────────────────────────────── */

function CompareDuo({ pair, allSubjects, onCoachPrompt }) {
  const [a, b] = pair;
  const meaning = getPairMeaning(a, b);
  const synthesis = getPairSynthesisByIds(a.id, b.id);
  const strengths = (getStrengthForSubjects(pair)?.items ?? []).slice(0, 2);
  const watchOuts = (getWatchOutForSubjects(pair)?.items ?? []).slice(0, 2);

  const rows = BIG_FIVE_TRAITS.map((trait) => {
    const aScore = getBigFiveScore(a, trait.key);
    const bScore = getBigFiveScore(b, trait.key);
    return { trait, aScore, bScore, gap: Math.abs(aScore - bScore) };
  }).sort((x, y) => y.gap - x.gap);
  const widest = rows[0];
  const closest = rows[rows.length - 1];

  // The insight, not the mechanics: what the widest gap MEANS.
  const highPerson = widest.aScore >= widest.bScore ? a : b;
  const lowPerson = widest.aScore >= widest.bScore ? b : a;
  const bigFiveLead = `Closest on ${closest.trait.label.toLowerCase()}; furthest on ${widest.trait.label.toLowerCase()}, where ${firstName(highPerson)} ${POLE_MEANING[widest.trait.key].high} and ${firstName(lowPerson)} ${POLE_MEANING[widest.trait.key].low}.`;

  // For the pair, the growth questions double as 1:1 conversation starters.
  const pairQuestions = watchOuts
    .map((item) => GROWTH_QUESTIONS[itemKey(item)])
    .filter(Boolean)
    .slice(0, 3);
  // Strengths carry moves too, mirroring the individual card.
  const pairUseBullets = [
    ...strengths.map((item) => item.use).filter(Boolean),
    'Pick one to lean on together this week.',
  ].slice(0, 3);

  return (
    <div className="fivex-stack" aria-label="Compare profiles">
      {/* Same skeleton as the individual profile: identity card on the
          left, the against-each-other rows on the right. */}
      <div className="fivex-profile">
        <section className="fvc fvc--id">
          <p className="fvc-kicker">Pair profile</p>
          <div className="fvx-idrow">
            <span className="fvx-idfaces">
              <Face member={a} size={44} titled={false} />
              <Face member={b} size={44} titled={false} />
            </span>
            <div className="fvx-idcopy">
              <strong>
                {firstName(a)} &amp; {firstName(b)}
              </strong>
            </div>
          </div>
          <div className="fvx-persona">
            <p className="fvx-persona-title">
              {synthesis?.title ?? meaning.short}
            </p>
            <p className="fvx-persona-body">
              {synthesis?.summary ??
                `${firstSentence(meaning.line)}${strengths[0] ? ` ${firstSentence(strengths[0].body)}` : ''}`}
            </p>
            {synthesis ? (
              <p className="fvx-persona-body">
                <strong>Best for</strong>{' '}
                {synthesis.bestFor.charAt(0).toLowerCase() +
                  synthesis.bestFor.slice(1)}
              </p>
            ) : null}
          </div>
          {synthesis ? (
            <div className="fvx-fit">
              <p className="fvc-kicker fvc-kicker--tight">Worth knowing</p>
              <p className="fvx-persona-body fvx-persona-body--flush">
                {synthesis.watchOut}
              </p>
            </div>
          ) : null}
        </section>
        <section className="fvc">
          <h2 className="fvc-title">
            Where you match, and where you don&rsquo;t
          </h2>
          <p className="fvc-lead">{bigFiveLead}</p>
          {/* Same component grammar as the individual profile rows: poles,
              capped line, faces: the gap detail lives in a hover tip on the
              middle of the connection, not in a numbers column. */}
          <div className="fva-rows">
          {rows.map((row) => {
            const high = row.aScore >= row.bScore ? a : b;
            const low = high === a ? b : a;
            const read =
              row.gap >= 25
                ? `${firstName(high)} ${POLE_MEANING[row.trait.key].high}; ${firstName(low)} ${POLE_MEANING[row.trait.key].low}.`
                : row.gap >= 10
                  ? `Same neighborhood: ${firstName(high)} leans a bit more ${row.trait.highLabel.toLowerCase()}.`
                  : 'Nearly identical defaults here.';
            return (
              <div className="fvp-row" key={row.trait.key}>
                <span className="fva-name">{row.trait.label}</span>
                <span className="fva-pole">{row.trait.lowLabel}</span>
                <span className="fva-mini fvp-mini">
                  <span className="fva-cap" aria-hidden="true" />
                  <span className="fva-cap fva-cap--end" aria-hidden="true" />
                  <span
                    className="fvp-band"
                    style={{
                      left: `${Math.min(row.aScore, row.bScore)}%`,
                      width: `${row.gap}%`,
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className="fvp-me fvp-me--pair"
                    style={{ left: `${row.aScore}%`, zIndex: 3 }}
                  >
                    <Face member={a} size={22} ringed titled={false} />
                  </span>
                  <span
                    className="fvp-me fvp-me--pair"
                    style={{ left: `${row.bScore}%` }}
                  >
                    <Face member={b} size={22} titled={false} />
                  </span>
                  <span
                    className="fvp-mid"
                    style={{
                      left: `${(row.aScore + row.bScore) / 2}%`,
                      width: `max(${row.gap}%, 44px)`,
                    }}
                  >
                    <span className="fvp-tip" role="tooltip">
                      <strong>
                        {row.trait.label} {'\u00b7'} {row.gap} apart
                      </strong>
                      <span>{read}</span>
                    </span>
                  </span>
                </span>
                <span className="fva-pole fva-pole--right">
                  {row.trait.highLabel}
                </span>
              </div>
            );
          })}
          </div>
        </section>
      </div>

      {/* Same section as the individual profile: same title, same labels,
          same side-by-side cards with an action box each. */}
      <section className="fvg">
        <h2 className="fvc-title">Strengths &amp; growth areas</h2>
        <p className="fvc-lead">
          What {firstName(a)} and {firstName(b)} can lean on together, and
          what to name before it rubs.
        </p>
        <div className="fivex-two">
          <ListCard
            label="Strengths"
            tone="strength"
            items={strengths}
            actions={{ label: 'Put them to work', bullets: pairUseBullets }}
            coachPrompt={`Where should ${firstName(a)} and ${firstName(b)} lean on what they share?`}
            onCoachPrompt={onCoachPrompt}
          />
          <ListCard
            label="Growth areas"
            tone="growth"
            items={watchOuts}
            actions={{ label: 'Discussion questions', bullets: pairQuestions }}
            coachPrompt={`Help ${firstName(a)} and ${firstName(b)} talk through their friction points in their next 1:1.`}
            onCoachPrompt={onCoachPrompt}
          />
        </div>
      </section>

      <section className="fvg">
        <h2 className="fvc-title">Working styles, side by side</h2>
        <p className="fvc-lead">
          How {firstName(a)} and {firstName(b)} each prefer to get work done.
          Where they differ, a quick agreement now saves friction later.
        </p>
        <section className="fvc">
          {/* Whole team on stage, the pair highlighted — same plot as the
              individual view, per the Aug 25 read-out. */}
          <WorkingStylesStage
            subjects={allSubjects}
            focusIds={[a.id, b.id]}
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      </section>
    </div>
  );
}

/* ONE picker, whether zero or one face is chosen: instruction up top
   (selection lives in the avatar rail), suggested pairs below. A chosen
   person seeds the suggestions, so nothing jumps when you tap a face. */
function ComparePicker({ scope, subjects, allSubjects, viewerId, onSelectPair }) {
  const anchor = scope === 'person' ? subjects[0] : null;
  let pairs = [];
  if (anchor) {
    const others = allSubjects.filter((other) => other.id !== anchor.id);
    let closest = null;
    let contrast = null;
    others.forEach((other) => {
      const distance = getPairDistance(anchor, other);
      if (!closest || distance < closest.distance)
        closest = { member: other, distance };
      if (!contrast || distance > contrast.distance)
        contrast = { member: other, distance };
    });
    if (contrast) {
      pairs.push({
        a: anchor,
        b: contrast.member,
        tag: 'Sharpest contrast',
        line: 'The most different defaults: slower, and the widest coverage.',
      });
    }
    if (closest) {
      pairs.push({
        a: anchor,
        b: closest.member,
        tag: 'Closest match',
        line: 'Nearly the same defaults: fast together, with a shared blind side.',
      });
    }
  } else {
    pairs = getComparePairSuggestions(allSubjects, 3);
  }
  const anchorName = anchor
    ? anchor.id === viewerId
      ? 'You\u2019re'
      : `${firstName(anchor)} is`
    : null;

  return (
    <div className="fivex-stack" aria-label="Compare profiles">
      <section className="fvx-pick fvx-pick--page">
        <div className="fvx-pick-head">
          <div>
            <h2 className="fvc-title">Pick any two people.</h2>
            <p className="fvc-lead">
              {anchor ? (
                <>
                  {anchorName} in &mdash; tap one more face above, or jump
                  into a suggested pair.
                </>
              ) : (
                <>
                  Tap two faces in the bar above. You&rsquo;ll get one read
                  on the pair: what they cover together, where it rubs, and
                  the agreement worth making.
                </>
              )}
            </p>
          </div>
          <PairHintVisual members={pickHintMembers(allSubjects)} />
        </div>
        <div className="fvx-pick-list">
          <p className="fvc-kicker">Pairs worth a look</p>
          <div className="mapx-pairings onex-pairings">
            {pairs.map((pair) => (
              <PairRow
                key={`${pair.a.id}-${pair.b.id}`}
                a={pair.a}
                b={pair.b}
                tag={pair.tag}
                line={pair.line}
                onSelectPair={onSelectPair}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* Miniature of the home-page pair animation: three faces, a cursor that
   walks between them, the dashed thread, and an abstract insight card. The
   third face dims while a pair is "selected", exactly like home. */
const HINT_NAMES = ['Darshan', 'Sam', 'Jordan'];
const HINT_PAIRS = [
  [0, 1],
  [1, 2],
  [2, 0],
];
const HINT_FACE = 34;
const HINT_POS = [
  { x: 14, y: 8 },
  { x: 118, y: 42 },
  { x: 44, y: 70 },
];
const HINT_STEP_MS = 3600;

function pickHintMembers(allSubjects) {
  const picked = HINT_NAMES.map((name) =>
    allSubjects.find((member) => firstName(member) === name)
  ).filter(Boolean);
  const rest = allSubjects.filter(
    (member) => !picked.includes(member) && firstName(member) !== 'Justin'
  );
  while (picked.length < 3 && rest.length) picked.push(rest.shift());
  return picked.slice(0, 3);
}

function PairHintVisual({ members }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const interval = window.setInterval(
      () => setStep((value) => value + 1),
      HINT_STEP_MS
    );
    return () => window.clearInterval(interval);
  }, []);

  if (members.length < 3) return null;

  const pair = HINT_PAIRS[step % HINT_PAIRS.length];
  const center = (index) => ({
    x: HINT_POS[index].x + HINT_FACE / 2,
    y: HINT_POS[index].y + HINT_FACE / 2,
  });
  const from = center(pair[0]);
  const to = center(pair[1]);
  const mid = { x: (from.x + to.x) / 2 + 7, y: (from.y + to.y) / 2 + 7 };

  return (
    <div className="fvx-hint" aria-hidden="true">
      <span className="fvx-hint-card" key={`card-${step}`}>
        <span className="fvx-hint-metric">2{'\u00d7'} impact</span>
        <i />
        <i />
      </span>
      <svg className="fvx-hint-line" viewBox="0 0 170 110">
        <path
          key={`line-${step}`}
          d={`M${from.x} ${from.y} Q ${mid.x} ${mid.y} ${to.x} ${to.y}`}
        />
      </svg>
      {members.map((member, index) => (
        <span
          key={member.id}
          className="fvx-hint-face"
          data-dim={!pair.includes(index) || undefined}
          style={{ top: `${HINT_POS[index].y}px`, left: `${HINT_POS[index].x}px` }}
        >
          <Face
            member={member}
            size={HINT_FACE}
            ringed={pair.includes(index)}
            titled={false}
          />
        </span>
      ))}
      <span
        className="fvx-hint-cursor"
        style={{ transform: `translate(${to.x + 3}px, ${to.y + 3}px)` }}
      >
        <i key={`click-${step}`} />
      </span>
    </div>
  );
}

function PairRow({ a, b, tag, line, onSelectPair }) {
  return (
    <button
      type="button"
      className="mapx-pairing"
      onClick={() => onSelectPair?.(a.id, b.id)}
    >
      <span className="tabx-pair-faces">
        <Face member={a} size={30} />
        <Face member={b} size={30} />
      </span>
      <span className="mapx-pairing-copy">
        <strong>
          {tag} {'\u00b7'} {firstName(a)} &amp; {firstName(b)}
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
