import React, { useState } from 'react';
import {
  Face,
  CoachFootLink,
  firstName,
  summaryText,
} from './conceptPrimitives.jsx';
import { TeamShapeContributions } from './TeamShapeContributions.jsx';
import { getPairDistance } from '../data/teamReadModel.js';
import {
  getTraitStrips,
  getStripCallouts,
  getChemistryModel,
  getProfileModel,
  getComparePairSuggestions,
} from '../data/conceptReadModel.js';
import {
  buildTeamShapeContributions,
  getMemberArchetypes,
} from '../data/teamDnaTeamShape.js';
import {
  getWorkingReport,
  getMemberWorkingProfile,
  getWorkingPosition,
} from '../data/teamDnaWorkingStyles.js';

/**
 * Concept 4 · "One system" — Four tabs, evolved.
 *
 * What: three lenses over one page, roster always on top. Every section
 * opens with one insight line, and depth is an accordion away: the Big Five
 * never shows all five spectrums at once (the most varied one starts open),
 * and working styles collapse to four habit areas with a "needs a norm"
 * verdict each. The hero keeps the original archetype block (×6 Innovators
 * with faces). Profile working styles reuse the same track + marker visual
 * as the Big Five rows, so the whole system speaks one language.
 * How: serif is reserved for large headings; numbers and labels are mono;
 * everything else is sans. Compare keeps the classic left-nav interaction;
 * a full pair renders the original pair page.
 * Port: working-style positions derive from Big Five until Scott's real
 * item answers land (swap getWorkingPosition in teamDnaWorkingStyles.js).
 */

export const ONE_TABS = [
  { id: 'overview', title: 'Team overview', sub: 'Everyone at once' },
  { id: 'profile', title: 'My profile', sub: 'You, and any teammate' },
  { id: 'compare', title: 'Compare', sub: 'Two people, side by side' },
];

/** Page-level bar: team name, the roster, and the three lenses. Always on. */
export function ConceptOneBar({
  lens,
  onSelect,
  teamName,
  members,
  selectedIds = [],
  viewerId,
  onFaceClick,
}) {
  return (
    <div className="lensx-bar-row" data-with-header>
      <header className="lensx-head">
        <p className="lensx-eyebrow">Team {'\u00b7'} Team DNA</p>
        <h1 className="lensx-title">{teamName}</h1>
      </header>
      <div className="onex-rail" role="group" aria-label="Team members">
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
              <Face member={member} size={38} ringed={active} />
              {member.id === viewerId ? (
                <span className="onex-rail-you">you</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="tabx-bar onex-tabs" role="tablist" aria-label="Lenses">
        {ONE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={lens === tab.id}
            className="tabx-tab"
            data-active={lens === tab.id || undefined}
            onClick={() => onSelect(tab.id)}
          >
            <span className="tabx-tab-title">{tab.title}</span>
            <span className="tabx-tab-sub">{tab.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConceptOne({
  scope,
  lens = 'overview',
  subjects,
  allSubjects,
  viewerId,
  isOwnProfile,
  insight,
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
      onCoachPrompt={onCoachPrompt}
      onSelectMember={onSelectMember}
    />
  );
}

/* ── Lens 1 · Team overview ──────────────────────────────────────────────── */

const isRealSplit = (item) => Math.min(item.aCount, item.bCount) >= 2;

function OverviewView({
  insight,
  allSubjects,
  viewerId,
  onCoachPrompt,
  onSelectMember,
}) {
  const callouts = getStripCallouts(allSubjects);
  const strips = getTraitStrips(allSubjects);
  const chem = getChemistryModel(allSubjects);
  const contributions = buildTeamShapeContributions(allSubjects);
  const report = getWorkingReport(allSubjects);

  // The most varied spectrum starts open; the rest are one tap away.
  const defaultTrait =
    strips.find((strip) => strip.label === callouts.varied.label)?.trait.key ??
    strips[0]?.trait.key;
  const [openTrait, setOpenTrait] = useState(defaultTrait);

  const totalItems = report.reduce((sum, category) => sum + category.items.length, 0);
  const splitItems = report.flatMap((category) =>
    category.items.filter(isRealSplit)
  );
  const sharpestCat = [...report].sort(
    (a, b) =>
      b.items.filter(isRealSplit).length - a.items.filter(isRealSplit).length
  )[0];
  const [openCat, setOpenCat] = useState(sharpestCat?.key ?? report[0]?.key);
  const workingHeadline =
    splitItems.length > 0
      ? `${splitItems.length} of ${totalItems} habits split this team down the middle. The sharpest are in ${sharpestCat.label.toLowerCase()}: start the norms conversation there.`
      : 'This team\u2019s habits mostly run one way; nothing here needs a formal norm.';

  const gapLine =
    chem.open.length > 0
      ? `Nobody defaults to ${chem.open.map((role) => role.singular.toLowerCase()).join(', ')}: work that needs them has no natural owner.`
      : null;

  return (
    <div className="onex" aria-label="Team overview">
      {/* The hook: signature + the original archetype block. */}
      <section className="info-block info-block--editorial info-block--lens">
        <div className="onex-hero-grid">
          <div>
            <p className="onex-eyebrow">Team signature</p>
            <h2 className="info-block-label">{insight.title}</h2>
            <p className="onex-body">{summaryText(insight)}</p>
          </div>
          <div className="onex-hero-side">
            <TeamShapeContributions
              contributions={contributions}
              onSelectMember={onSelectMember}
            />
            {gapLine ? <p className="onex-quiet">{gapLine}</p> : null}
          </div>
        </div>
        <CoachFootLink
          prompt="Walk me through my team's shape: the archetypes we have, what nobody covers, and what to do about it."
          onCoachPrompt={onCoachPrompt}
        />
      </section>

      {/* Big Five: one insight, one spectrum open at a time. */}
      <section className="info-block info-block--editorial info-block--lens">
        <p className="onex-eyebrow">
          Big Five {'\u00b7'} {allSubjects.length} people
        </p>
        <h2 className="info-block-label">Where everyone lands</h2>
        <p className="onex-read">{callouts.headline}</p>
        <div className="bfx-rows">
          {strips.map((strip) => {
            const open = openTrait === strip.trait.key;
            return (
              <div className="bfx-row" data-open={open || undefined} key={strip.trait.key}>
                <button
                  type="button"
                  className="bfx-head"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenTrait(open ? null : strip.trait.key)
                  }
                >
                  <span className="bfx-name">{strip.label}</span>
                  {!open ? (
                    <span className="bfx-mini" aria-hidden="true">
                      {strip.members.map(({ member, score }) => (
                        <i key={member.id} style={{ left: `${score}%` }} />
                      ))}
                    </span>
                  ) : (
                    <span className="bfx-mini bfx-mini--blank" aria-hidden="true" />
                  )}
                  <span className="tabx-strip-state" data-state={strip.state}>
                    {strip.state}
                  </span>
                  <span className="bfx-avg">avg {strip.average}</span>
                  <svg className="bfx-chev" viewBox="0 0 16 16" aria-hidden="true">
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
                {open ? (
                  <div className="bfx-body">
                    <div className="tabx-strip-track">
                      <span
                        className="tabx-strip-tick"
                        style={{ left: `${strip.average}%` }}
                        aria-hidden="true"
                      />
                      {strip.members.map(({ member, score }) => (
                        <button
                          key={member.id}
                          type="button"
                          className="tabx-strip-face"
                          style={{ left: `${score}%` }}
                          title={`${member.name} \u00b7 ${score}`}
                          aria-label={`Open ${member.name}'s profile`}
                          onClick={() =>
                            onSelectMember?.(member.id, { mode: 'solo' })
                          }
                        >
                          <Face
                            member={member}
                            size={20}
                            ringed={member.id === viewerId}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="tabx-strip-poles" aria-hidden="true">
                      <span>{strip.trait.lowLabel}</span>
                      <span>{strip.trait.highLabel}</span>
                    </div>
                    <p className="onex-quiet">{strip.insight}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <CoachFootLink
          prompt="Walk me through where my team lands on the five spectrums: where we're aligned, where we're spread, and what to do with the difference."
          onCoachPrompt={onCoachPrompt}
        />
      </section>

      <div className="lensx-grid lensx-grid--half">
        <section className="info-block info-block--editorial info-block--lens">
          <h2 className="info-block-label">Team strengths</h2>
          <div className="lensx-items">
            {chem.strengths.map((item) => (
              <div className="lensx-item" key={`${item.traitKey}-${item.type}`}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="info-block info-block--editorial info-block--lens">
          <h2 className="info-block-label">Team growth opportunities</h2>
          <div className="lensx-items">
            {chem.watchOuts.map((item) => (
              <div className="lensx-item" key={`${item.traitKey}-${item.type}`}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
          <CoachFootLink
            prompt="Given my team's strengths and growth areas, what should we work on first, and how?"
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      </div>

      {/* Working styles: four habit areas, a verdict each, bars on demand. */}
      <section className="info-block info-block--editorial info-block--lens">
        <p className="onex-eyebrow">
          Working styles {'\u00b7'} habits, not personality
        </p>
        <h2 className="info-block-label">How this team works</h2>
        <p className="onex-read">{workingHeadline}</p>
        <div className="bfx-rows">
          {report.map((category) => {
            const open = openCat === category.key;
            const splits = category.items.filter(isRealSplit);
            const sharpest =
              splits[0] ??
              [...category.items].sort(
                (a, b) =>
                  Math.abs(b.aCount - b.bCount) - Math.abs(a.aCount - a.bCount)
              )[0];
            return (
              <div className="bfx-row" data-open={open || undefined} key={category.key}>
                <button
                  type="button"
                  className="bfx-head"
                  aria-expanded={open}
                  onClick={() => setOpenCat(open ? null : category.key)}
                >
                  <span className="bfx-name">{category.label}</span>
                  <span className="bfx-mini bfx-mini--blank" aria-hidden="true" />
                  <span
                    className="tabx-strip-state"
                    data-state={splits.length > 0 ? 'varied' : 'aligned'}
                  >
                    {splits.length > 0
                      ? `${splits.length} split${splits.length === 1 ? '' : 's'}`
                      : 'one mode'}
                  </span>
                  <svg className="bfx-chev" viewBox="0 0 16 16" aria-hidden="true">
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
                {open ? (
                  <div className="bfx-body">
                    <div className="wsd-rows">
                      {category.items.map((item) => (
                        <DivergingRow key={item.key} item={item} />
                      ))}
                    </div>
                    {sharpest ? (
                      <p className="onex-quiet">{sharpest.read}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <CoachFootLink
          prompt="Which of my team's working-style splits most need an explicit norm, and what should the norm say?"
          onCoachPrompt={onCoachPrompt}
        />
      </section>
    </div>
  );
}

/* One working-style item: pole + count each side, shares in between. */
function DivergingRow({ item }) {
  const total = Math.max(item.aCount + item.midCount + item.bCount, 1);
  return (
    <div className="wsd-row">
      <span className="wsd-pole">
        {item.aPole}
        <b>{item.aCount}</b>
      </span>
      <span className="wsd-bar" aria-hidden="true">
        <span
          className="wsd-seg wsd-seg--a"
          style={{ width: `${(item.aCount / total) * 100}%` }}
        />
        <span
          className="wsd-seg wsd-seg--mid"
          style={{ width: `${(item.midCount / total) * 100}%` }}
        />
        <span
          className="wsd-seg wsd-seg--b"
          style={{ width: `${(item.bCount / total) * 100}%` }}
        />
      </span>
      <span className="wsd-pole wsd-pole--right">
        <b>{item.bCount}</b>
        {item.bPole}
      </span>
    </div>
  );
}

/* ── Lens 2 · Profile ────────────────────────────────────────────────────── */

const STANCE_SHORT = {
  5: (item) => `strongly ${item.aPole.toLowerCase()}`,
  4: (item) => `leans ${item.aPole.toLowerCase()}`,
  3: () => 'flexes',
  2: (item) => `leans ${item.bPole.toLowerCase()}`,
  1: (item) => `strongly ${item.bPole.toLowerCase()}`,
};

function ProfileView({ person, allSubjects, isOwn, onCoachPrompt }) {
  if (!person) return null;
  const archetypes = getMemberArchetypes(person, 2);
  const model = getProfileModel(person, allSubjects);
  const workingProfile = getMemberWorkingProfile(person, allSubjects);
  const name = firstName(person);
  const possessive = isOwn ? 'Your' : `${name}\u2019s`;

  return (
    <div className="onex" aria-label={isOwn ? 'My profile' : `${person.name}'s profile`}>
      <div className="lensx-grid lensx-grid--profile">
        <div className="lensx-col">
          <section className="info-block info-block--editorial info-block--lens">
            <p className="onex-eyebrow">{isOwn ? 'My profile' : 'Profile'}</p>
            <div className="lensx-id">
              <Face member={person} size={56} ringed={isOwn} />
              <div className="lensx-id-copy">
                <strong>{person.name}</strong>
                {archetypes.length > 0 ? (
                  <span className="onex-arch-line">
                    Primary {'\u00b7'} <strong>{archetypes[0].singular}</strong>
                    {archetypes[1] ? (
                      <>
                        {' '}
                        {'\u00b7'} Secondary {'\u00b7'}{' '}
                        <strong>{archetypes[1].singular}</strong>
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span>Balanced profile</span>
                )}
              </div>
            </div>
            {model.superpower ? (
              <div className="lensx-super">
                <p className="onex-eyebrow">Superpower</p>
                <p className="onex-super-title">{model.superpower.title}</p>
                <p className="onex-quiet">{model.superpower.body}</p>
              </div>
            ) : null}
            <div className="onex-lean">
              <p className="onex-eyebrow">Lean into</p>
              <p className="onex-quiet">
                <strong>{model.leanInto.friendly}.</strong>{' '}
                {model.leanInto.line}
              </p>
            </div>
          </section>
        </div>

        <section className="info-block info-block--editorial info-block--lens">
          <p className="onex-eyebrow">
            Big Five {'\u00b7'} the face is the score, the tick is the team
            average
          </p>
          <h2 className="info-block-label">
            {possessive} Big Five, next to the team
          </h2>
          <div className="tabx-prows">
            {model.rows.map((row) => (
              <div className="tabx-prow" key={row.trait.key}>
                <span className="tabx-prow-word">{row.label}</span>
                <span className="tabx-prow-pole">{row.poleLabel}</span>
                <span className="tabx-prow-track" aria-hidden="true">
                  <span
                    className="tabx-prow-tick"
                    style={{ left: `${row.average}%` }}
                  />
                  <span
                    className="tabx-prow-me"
                    style={{ left: `${row.score}%` }}
                  >
                    <Face member={person} size={22} />
                  </span>
                </span>
                <span
                  className="tabx-prow-delta"
                  data-negative={row.delta < 0 || undefined}
                >
                  {row.delta >= 0 ? `+${row.delta}` : row.delta} vs team
                </span>
              </div>
            ))}
          </div>
          <CoachFootLink
            prompt={
              isOwn
                ? 'What does my Big Five snapshot against the team average mean for how I should work with this team?'
                : `What does ${name}'s Big Five snapshot against the team mean for how we should work together?`
            }
            onCoachPrompt={onCoachPrompt}
          />
        </section>

        {/* Working styles: the same track + marker language as the rows above. */}
        <section className="info-block info-block--editorial info-block--lens lensx-span">
          <p className="onex-eyebrow">
            Working styles {'\u00b7'} the face is {isOwn ? 'you' : name}, the
            tick is the team average
          </p>
          <h2 className="info-block-label">
            How {isOwn ? 'you like' : `${name} likes`} to work
          </h2>
          <div className="wpx-grid">
            {workingProfile.map((category) => (
              <div className="wpx-cat" key={category.key}>
                <p className="wpx-cat-title">{category.label}</p>
                {category.items.map((item) => {
                  const position = getWorkingPosition(person, item);
                  const teamAverage = Math.round(
                    allSubjects.reduce(
                      (sum, member) => sum + getWorkingPosition(member, item),
                      0
                    ) / Math.max(allSubjects.length, 1)
                  );
                  return (
                    <div className="wpx-row" key={item.key}>
                      <span className="wpx-track" aria-hidden="true">
                        <span
                          className="tabx-prow-tick"
                          style={{ left: `${100 - teamAverage}%` }}
                        />
                        <span
                          className="tabx-prow-me"
                          style={{ left: `${100 - position}%` }}
                        >
                          <Face member={person} size={20} />
                        </span>
                      </span>
                      <span className="wpx-poles" aria-hidden="true">
                        <span>{item.aPole}</span>
                        <span>{item.bPole}</span>
                      </span>
                      <span className="wpx-stance">
                        {STANCE_SHORT[item.bucket](item)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <CoachFootLink
            prompt={
              isOwn
                ? 'Where does my working style differ most from my team, and how do I make that difference work?'
                : `Where does ${name}'s working style differ most from the team, and how should we adjust?`
            }
            onCoachPrompt={onCoachPrompt}
          />
        </section>

        <div className="lensx-grid lensx-grid--half lensx-span">
          <section className="info-block info-block--editorial info-block--lens">
            <h2 className="info-block-label">{possessive} strengths</h2>
            <div className="lensx-items">
              {model.strengths.map((item) => (
                <div className="lensx-item" key={`${item.traitKey}-${item.type}`}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="info-block info-block--editorial info-block--lens">
            <h2 className="info-block-label">
              {possessive} growth opportunities
            </h2>
            <div className="lensx-items">
              {model.watchOuts.map((item) => (
                <div className="lensx-item" key={`${item.traitKey}-${item.type}`}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  {item.tipLine ? (
                    <p className="lensx-item-tip">
                      <span>Try</span> {item.tipLine}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <CoachFootLink
              prompt={
                isOwn
                  ? 'Coach me on my top growth opportunity from this profile.'
                  : `How can the team support ${name} on these growth areas?`
              }
              onCoachPrompt={onCoachPrompt}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Lens 3 · Compare (left-nav interaction; pair renders original page) ── */

function ComparePicker({
  scope,
  subjects,
  allSubjects,
  isOwnProfile,
  onSelectPair,
  onCoachPrompt,
}) {
  if (scope === 'person' && subjects[0]) {
    const member = subjects[0];
    const others = allSubjects.filter((other) => other.id !== member.id);
    let closest = null;
    let contrast = null;
    others.forEach((other) => {
      const distance = getPairDistance(member, other);
      if (!closest || distance < closest.distance) closest = { member: other, distance };
      if (!contrast || distance > contrast.distance) contrast = { member: other, distance };
    });
    const name = isOwnProfile ? 'You' : firstName(member);
    return (
      <div className="dxp dxp--tabs" aria-label="Compare: pick one more">
        <section className="info-block info-block--editorial">
          <p className="info-block-label">Compare</p>
          <div className="tabx-person">
            <Face member={member} size={44} />
            <div className="tabx-person-copy">
              <strong>
                {name} {isOwnProfile ? 'are' : 'is'} in
              </strong>
              <span>Tap one more face on the left to compare.</span>
            </div>
          </div>
          {closest && contrast ? (
            <div className="mapx-pairings onex-pairings">
              <PairRow
                a={member}
                b={closest.member}
                tag="Closest match"
                line="Nearly the same defaults: fast together, with a shared blind side."
                onSelectPair={onSelectPair}
              />
              <PairRow
                a={member}
                b={contrast.member}
                tag="Sharpest contrast"
                line="The most different defaults: slower, and the widest coverage."
                onSelectPair={onSelectPair}
              />
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="dxp dxp--tabs" aria-label="Compare picker">
      <section className="info-block info-block--editorial">
        <p className="info-block-label">Compare</p>
        <p className="dxp-copy dxp-copy--flush">
          <strong>Tap two faces on the left</strong> to see how two people
          fit, or start from a pairing worth knowing.
        </p>
        <div className="mapx-pairings onex-pairings">
          {getComparePairSuggestions(allSubjects, 3).map((pair) => (
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
        <CoachFootLink
          prompt="Which pairings on my team should be more deliberate about how they work together, and why?"
          onCoachPrompt={onCoachPrompt}
        />
      </section>
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
