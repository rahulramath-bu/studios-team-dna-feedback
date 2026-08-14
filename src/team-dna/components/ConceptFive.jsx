import { useEffect, useRef, useState } from 'react';
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

/** Product row + centered page header. The crumb row answers "where am I":
 *  back to the Team home, which team is open (switchable), who's on it. */
export function ConceptFiveBar({
  lens,
  onSelect,
  teamName,
  members,
  selectedIds = [],
  viewerId,
  onFaceClick,
  teamOptions = [],
  selectedTeamId,
  canManageTeam = false,
  onTeamChange,
  onEditTeam,
  onExitToTeamHome,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const switchable = teamOptions.length > 1;

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
      {/* Chrome: back-nav only. */}
      <div className="fivex-chrome">
        <div className="fivex-crumbs">
          <button
            type="button"
            className="fivex-crumb"
            onClick={() => onExitToTeamHome?.()}
          >
            <BetterUpIcon name="ChevronLeft" size={14} strokeWidth={2} />
            Team
          </button>
        </div>
      </div>

      {/* Head row: product kicker + team name LEFT, switch/edit controls
          RIGHT. The roster and tabs below stay centered. */}
      <div className="fivex-head">
        <div className="fivex-head-copy">
          <p className="fivex-kicker">Team DNA</p>
          <h1 className="fivex-title">{teamName}</h1>
        </div>
        <div className="fivex-controls">
          {switchable ? (
            <div className="fivex-team" ref={menuRef}>
              <button
                type="button"
                className="fivex-team-btn"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                Switch team
                <BetterUpIcon name="ChevronDown" size={14} strokeWidth={2} />
              </button>
              {menuOpen ? (
                <div className="fivex-team-menu" role="menu">
                  {teamOptions.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={team.id === selectedTeamId}
                      className="fivex-team-item"
                      data-selected={team.id === selectedTeamId || undefined}
                      onClick={() => {
                        setMenuOpen(false);
                        if (team.id !== selectedTeamId) onTeamChange?.(team.id);
                      }}
                    >
                      <span>{team.name}</span>
                      {team.id === selectedTeamId ? (
                        <BetterUpIcon name="Check" size={14} strokeWidth={2} />
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {canManageTeam ? (
            <button
              type="button"
              className="fivex-edit-icon"
              aria-label="Edit team"
              title="Edit team"
              onClick={() => onEditTeam?.(selectedTeamId)}
            >
              <BetterUpIcon name="Edit" size={15} strokeWidth={1.8} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="onex-rail fivex-rail" role="group" aria-label="Team members">
        {members.map((member) => {
          const active = selectedIds.includes(member.id);
          return (
            <button
              key={member.id}
              type="button"
              className="onex-rail-face"
              data-active={active || undefined}
              title={member.name}
              aria-pressed={active}
              onClick={() => onFaceClick?.(member.id)}
            >
              <Face member={member} size={36} ringed={active} />
              {member.id === viewerId ? (
                <span className="onex-rail-you">you</span>
              ) : null}
            </button>
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
  isOwnProfile,
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
        isOwnProfile={isOwnProfile}
        onSelectPair={onSelectPair}
        onCoachPrompt={onCoachPrompt}
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

function CardFoot({ prompt, onCoachPrompt }) {
  return (
    <div className="fvc-foot">
      <CoachFootLink prompt={prompt} onCoachPrompt={onCoachPrompt} />
    </div>
  );
}

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
                          title={`${member.name} \u00b7 ${score}`}
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
          The team&rsquo;s own profile: what kind of team this is, the roles
          people naturally play, and where everyone lands on the five traits.
        </p>
        <div className="fivex-profile">
          <section className="fvc fvc--id">
            <p className="fvc-kicker">Team signature</p>
            {/* The signature is a generated name from the team's strongest
                lean, like the persona title on an individual profile. */}
            <div className="fvx-persona fvx-persona--lead">
              <p className="fvx-persona-title">
                {getTeamSignature(allSubjects) ?? teamName}
              </p>
              <p className="fvx-persona-body">{summaryText(insight)}</p>
            </div>
            <div className="fvx-fit">
              <p className="fvc-kicker fvc-kicker--tight">Archetype mix</p>
              <TeamShapeContributions
                contributions={contributions}
                onSelectMember={onSelectMember}
              />
            </div>
            <CardFoot
              prompt="Walk me through my team's profile: what kind of team we are and our archetype mix."
              onCoachPrompt={onCoachPrompt}
            />
          </section>
          <section className="fvc fvc--lands">
            <h2 className="fvc-title">Where everyone lands</h2>
            <p className="fvc-lead">{traitsLead}</p>
            <TraitRows
              strips={orderedStrips}
              reads={traitReads}
              viewerId={viewerId}
              onSelectMember={onSelectMember}
            />
            <CardFoot
              prompt="Walk me through where my team is clustered and where we're spread out on each trait."
              onCoachPrompt={onCoachPrompt}
            />
          </section>
        </div>
      </section>

      {/* 4 · What to lean on, what to watch. */}
      <section className="fvg" id="fvsec-growth">
        <p className="fvx-chapnum">02</p>
        <h2 className="fvc-title">Strengths &amp; growth areas</h2>
        <p className="fvc-lead">
          Drawn from the trait mix above: what this team is naturally set up
          to do well, and where the same tendencies can work against you.
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
          Ten everyday preferences across five areas: how people here would
          rather plan, decide, and share work. These are not personality;
          once they are said out loud, they are easy to renegotiate. Pick a
          topic to see where everyone stands.
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
  // Growth bullets: the concrete try-lines that ship with each watch-out,
  // closed with a pick-one prompt.
  const tryBullets = [
    ...growthItems.map((item) => item.tipLine).filter(Boolean),
    isOwn
      ? 'Pick one and try it this week; small beats perfect.'
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
          <CardFoot
            prompt={
              isOwn
                ? 'Walk me through my profile: what should I lean on, and what should I watch for?'
                : `Walk me through ${name}\u2019s profile: what do they bring, and how do I work well with them?`
            }
            onCoachPrompt={onCoachPrompt}
          />
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
          <CardFoot
            prompt={
              isOwn
                ? 'What does my Big Five snapshot against the team average mean for how I should work with this team?'
                : `What does ${name}'s Big Five snapshot against the team mean for how we should work together?`
            }
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      </div>

      <section className="fvg">
        <h2 className="fvc-title">
          {isOwn ? 'Your strengths & growth areas' : `${name}'s strengths & growth areas`}
        </h2>
        <p className="fvc-lead">
          Both sides come from {isOwn ? 'your' : `${name}\u2019s`} two
          strongest trait scores. Every strength has a flip side: the growth
          areas show where the same trait can overshoot.
        </p>
        <div className="fivex-two">
          <ListCard
            label="Strengths"
            tone="strength"
            items={strengthItems}
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

      <section className="fvc">
        <h2 className="fvc-title">
          How {isOwn ? 'you like' : `${name} likes`} to work
        </h2>
        <p className="fvc-lead">
          The same ten questions, with {isOwn ? 'you' : name} highlighted
          against the rest of the team. Where {isOwn ? 'you sit' : `${name} sits`}{' '}
          apart from most of the room, that preference is worth saying out
          loud.
        </p>
        <WorkingStylesStage
          subjects={allSubjects}
          focusIds={[person.id]}
          focusIsViewer={isOwn}
        />
        <CardFoot
          prompt={
            isOwn
              ? 'Where does my working style differ most from my team, and how do I make that difference work?'
              : `Where does ${name}'s working style differ most from the team, and how should we adjust?`
          }
          onCoachPrompt={onCoachPrompt}
        />
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

  return (
    <div className="fivex-stack" aria-label="Compare profiles">
      {/* Identity lives in the left rail (faces + "A x B"). The header stays
          OPEN like the picker and leads with the pair's generated persona
          ("The Readiness Loop"), not section chrome. */}
      <section className="fvx-pick">
        <h2 className="fvc-title fvx-duo-title">
          {synthesis?.title ?? meaning.short}
        </h2>
        <p className="fvc-lead">
          {synthesis?.summary ??
            `${firstSentence(meaning.line)}${strengths[0] ? ` ${firstSentence(strengths[0].body)}` : ''}`}
        </p>
        {synthesis ? (
          <>
            <p className="fvc-lead fvx-duo-line">
              <strong>Best for</strong>{' '}
              {synthesis.bestFor.charAt(0).toLowerCase() +
                synthesis.bestFor.slice(1)}
            </p>
            <p className="fvc-lead fvx-duo-line">
              <strong>Worth knowing:</strong> {synthesis.watchOut}
            </p>
          </>
        ) : null}
      </section>

      <section className="fvc">
        <h2 className="fvc-title">Where you match, and where you don&rsquo;t</h2>
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
        <CardFoot
          prompt={`Walk me through where ${firstName(a)} and ${firstName(b)} differ most on the Big Five and what to do with it.`}
          onCoachPrompt={onCoachPrompt}
        />
      </section>

      {/* Same section as the individual profile: same title, same labels. */}
      <section className="fvg">
        <h2 className="fvc-title">Strengths &amp; growth areas</h2>
        <p className="fvc-lead">
          What {firstName(a)} and {firstName(b)} can lean on together, and
          what to name before it rubs.
        </p>
        <div className="fivex-two fivex-two--stack">
          <ListCard
            label="Strengths"
            tone="strength"
            items={strengths}
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

      <section className="fvc">
        <h2 className="fvc-title">Working styles, side by side</h2>
        <p className="fvc-lead">
          Where {firstName(a)} and {firstName(b)} each land on the same ten
          questions. Where they land apart, an explicit agreement saves
          friction later.
        </p>
        <WorkingStylesStage subjects={pair} focusIds={[a.id, b.id]} />
        <CardFoot
          prompt={`Draft a working agreement for ${firstName(a)} and ${firstName(b)} based on their working-style splits.`}
          onCoachPrompt={onCoachPrompt}
        />
      </section>
    </div>
  );
}

/* ONE picker, whether zero or one face is chosen: same title, same
   instruction, same list. A chosen person only seeds the suggestions, so
   nothing jumps when you tap a face. Open layout: no card, just a divider
   between the instruction and the recommended pairs. */
function ComparePicker({ scope, subjects, allSubjects, onSelectPair, onCoachPrompt }) {
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

  return (
    <div className="fivex-stack" aria-label="Compare profiles">
      <section className="fvx-pick">
        <div className="fvx-pick-head">
          <div>
            <h2 className="fvc-title">Pick any two people.</h2>
            <p className="fvc-lead">
              Tap two faces in the left rail. You&rsquo;ll get one read on the
              pair: what you cover together, where it rubs, and the agreement
              worth making.
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
          <CardFoot
            prompt="Which pairings on my team should be more deliberate about how they work together, and why?"
            onCoachPrompt={onCoachPrompt}
          />
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
