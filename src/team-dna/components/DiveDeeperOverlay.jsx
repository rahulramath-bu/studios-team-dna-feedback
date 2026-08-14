import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { getBigFiveScore } from '../data/bigFiveTraits.js';
import {
  getWorkingPreferenceLines,
  getPersonalWorkingReads,
  getPairWorkingReads,
} from '../data/teamReadModel.js';
import {
  getSectionBasis,
  getTraitExplainers,
  getSpectrumPositionLine,
  getPairMeaning,
} from '../data/conceptReadModel.js';

/**
 * "Dive deeper" modal (Expanded concept) — one section at a time.
 *
 * What: opening Dive deeper from Strengths explains only the strengths;
 * from Growth opportunities, only the growth areas; from Collaboration
 * Tips, the working styles underneath; from Big Five, what each spectrum
 * means. Never the same content twice.
 * How: each claim is traced on one spectrum strip: a track with both pole
 * labels, one dot per person at their actual position, and the leaning half
 * tinted with a count. One short "why" line closes each claim. A trust line
 * and the AI-coach handoff close the modal.
 * Port: a standard Modal; all content derives from the same subjects that
 * feed the page. AI copy can replace the authored "why" lines slot-for-slot.
 */

const SECTION_META = {
  strengths: {
    title: 'Why these strengths',
    sub: 'Where each strength comes from, and who carries it.',
  },
  growth: {
    title: 'Why these growth areas',
    sub: 'A growth area is a strength overextended. Here is the lean behind each one.',
  },
  working: {
    title: 'The working styles underneath',
    sub: null, // scope-specific, set below
  },
  spectrums: {
    title: 'The Big Five, explained',
    sub: 'What each spectrum means in plain work terms, and where people land.',
  },
};

export function DiveDeeperOverlay({
  section,
  scope,
  subjects,
  allSubjects,
  entityTitle,
  isOwnProfile = false,
  onClose,
  onCoachPrompt,
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

  const meta = SECTION_META[section] ?? SECTION_META.strengths;
  const workingSub =
    scope === 'team'
      ? 'How the room divides on planning, time, voice, decisions, and feedback.'
      : scope === 'duo'
        ? 'Where the two of you land on the five everyday splits.'
        : 'The five everyday stances behind this profile.';

  const trustLine =
    scope === 'team'
      ? `Computed from ${subjects.length} completed assessments. These are tendencies, not scores. Neither end of any spectrum is the better one.`
      : scope === 'duo'
        ? 'Computed from both assessments. These are tendencies, not scores. A wide gap becomes coverage once it is named.'
        : 'Computed from this assessment, placed against the whole team. A lean is a default, not a limit.';

  const coachPrompt =
    section === 'strengths'
      ? `Go deeper on the strengths in this Team DNA read: what drives them, and how do we build on them?`
      : section === 'growth'
        ? `Go deeper on the growth areas in this Team DNA read: when do they show up, and what should we do?`
        : section === 'working'
          ? `Walk me through the working-style splits behind this read and which ones need an agreement.`
          : `Help me understand what these Big Five spectrums mean for how we work.`;

  return createPortal(
    <div className="ddp-root" role="dialog" aria-label={meta.title}>
      <button
        type="button"
        className="ddp-scrim"
        aria-label="Close"
        onClick={onClose}
      />
      <article className="ddp-panel">
        <header className="ddp-head">
          <div>
            <p className="ddp-eyebrow">
              Dive deeper {'\u00b7'} {entityTitle}
            </p>
            <h2 className="ddp-title">{meta.title}</h2>
            <p className="ddp-sub">{section === 'working' ? workingSub : meta.sub}</p>
          </div>
          <button
            type="button"
            className="ddp-close"
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
        </header>

        <div className="ddp-body">
          {section === 'strengths' || section === 'growth' ? (
            <BasisSection
              section={section}
              scope={scope}
              subjects={subjects}
              allSubjects={allSubjects}
              isOwnProfile={isOwnProfile}
            />
          ) : null}
          {section === 'working' ? (
            <WorkingSection
              scope={scope}
              subjects={subjects}
              isOwnProfile={isOwnProfile}
            />
          ) : null}
          {section === 'spectrums' ? (
            <SpectrumsSection
              scope={scope}
              subjects={subjects}
              allSubjects={allSubjects}
            />
          ) : null}
          <p className="ddp-trust">{trustLine}</p>
        </div>

        <footer className="ddp-foot">
          <button
            className="info-block-coach-link"
            type="button"
            onClick={() => onCoachPrompt?.(coachPrompt)}
          >
            <span>Discuss with AI coach</span>
            <BetterUpIcon name="ArrowUpRight" size={13} strokeWidth={2} />
          </button>
        </footer>
      </article>
    </div>,
    document.body
  );
}

/* ── Spectrum strip: the drill-down's visualization ───────────────────────
   One track, both pole labels, a dot per person at their real position, the
   leaning half tinted, and plain counts above the poles. */

function DdxStrip({ split, focusIds = [] }) {
  const focus = new Set(focusIds);
  const members = [...split.low, ...split.mid, ...split.high];

  return (
    <div className="ddx-strip">
      <div className="ddx-strip-counts">
        <span
          className="ddx-strip-count"
          data-lean={split.leanSide === 'low' || undefined}
        >
          {split.low.length} {split.trait.lowLabel.toLowerCase()}
        </span>
        {split.mid.length > 0 ? (
          <span className="ddx-strip-count ddx-strip-count--mid">
            {split.mid.length} near the middle
          </span>
        ) : null}
        <span
          className="ddx-strip-count"
          data-lean={split.leanSide === 'high' || undefined}
        >
          {split.high.length} {split.trait.highLabel.toLowerCase()}
        </span>
      </div>
      <div className="ddx-strip-track">
        <span
          className="ddx-strip-half"
          data-side={split.leanSide}
          aria-hidden="true"
        />
        <span className="ddx-strip-center" aria-hidden="true" />
        {members.map((member) => {
          const score = getBigFiveScore(member, split.trait.key);
          return (
            <span
              key={member.id}
              className="ddx-strip-dot"
              data-focus={focus.has(member.id) || undefined}
              style={{ left: `${score}%` }}
              title={`${member.name} \u00b7 ${score}`}
            />
          );
        })}
      </div>
      <div className="ddx-strip-poles" aria-hidden="true">
        <span>{split.trait.lowLabel}</span>
        <span>{split.trait.highLabel}</span>
      </div>
    </div>
  );
}

/* ── Strengths / growth: claim -> strip -> why ───────────────────────────── */

function BasisSection({ section, scope, subjects, allSubjects, isOwnProfile }) {
  const entries = getSectionBasis({
    section,
    scope,
    subjects,
    allSubjects,
    isOwnProfile,
  });

  return (
    <div className="ddp-groups">
      {entries.map(({ item, split, lead, why, focusIds }) => (
        <section className="ddp-item" key={`${item.traitKey}-${item.type}`}>
          <h3 className="ddp-item-title">{item.title}</h3>
          <p className="ddp-item-lead">{lead}</p>
          <DdxStrip split={split} focusIds={focusIds} />
          <p className="ddp-item-line ddp-item-line--why">{why}</p>
        </section>
      ))}
    </div>
  );
}

/* ── Working styles ──────────────────────────────────────────────────────── */

function WorkingSection({ scope, subjects, isOwnProfile }) {
  const reads =
    scope === 'team'
      ? getWorkingPreferenceLines(subjects).map((line) => ({
          key: line.key,
          topic: null,
          sentence: line.sentence,
        }))
      : scope === 'duo'
        ? getPairWorkingReads(subjects[0], subjects[1])
        : getPersonalWorkingReads(subjects[0], { secondPerson: isOwnProfile });

  return (
    <ul className="ddp-working-list">
      {reads.map((read) => (
        <li key={read.key}>
          {read.topic ? <strong>{read.topic}.</strong> : null} {read.sentence}
        </li>
      ))}
    </ul>
  );
}

/* ── The Big Five, explained ─────────────────────────────────────────────── */

function SpectrumsSection({ scope, subjects, allSubjects }) {
  const explainers = getTraitExplainers(allSubjects);
  const focusIds = scope === 'team' ? [] : subjects.map((member) => member.id);

  return (
    <div className="ddp-groups">
      {explainers.map((explainer) => (
        <section className="ddp-item" key={explainer.trait.key}>
          <div className="ddx-trait-head">
            <h3 className="ddp-item-title">{explainer.friendly}</h3>
            <span className="ddx-trait-state">{explainer.patternLabel}</span>
          </div>
          <p className="ddp-item-line">
            <strong>{explainer.trait.lowLabel}</strong> {explainer.lowMeaning}
            {' \u00b7 '}
            <strong>{explainer.trait.highLabel}</strong> {explainer.highMeaning}.
          </p>
          <DdxStrip split={explainer.split} focusIds={focusIds} />
          {scope === 'person' ? (
            <p className="ddp-item-line ddp-item-line--sub">
              {getSpectrumPositionLine(subjects[0], explainer.trait, allSubjects)}
            </p>
          ) : null}
          {scope === 'duo' ? (
            <p className="ddp-item-line ddp-item-line--sub">
              {getPairMeaning(subjects[0], subjects[1]).short}
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
