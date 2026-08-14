import React from 'react';
import {
  Face,
  CoachFootLink,
  firstName,
  summaryText,
} from './conceptPrimitives.jsx';
import { getPairDistance } from '../data/teamReadModel.js';
import {
  getTraitStrips,
  getStripCallouts,
  getProfileModel,
  getComparePairSuggestions,
  getChemistryModel,
  getPairMeaning,
} from '../data/conceptReadModel.js';

/**
 * Concept 3 · "Four tabs" — a page-level dashboard.
 *
 * What: four lenses on the same Big Five data, owning the whole page:
 *   Team overview  signature + where everyone lands (full width, no left nav)
 *   My profile     who you are: role, Big Five vs team, strengths, growth
 *   1:1 Compare    the ONLY lens with the classic left-nav interaction. One
 *                  person selected shows a "pick one more" step; a full pair
 *                  renders the original pair page.
 *   Chemistry      the team's archetype mix, cohesion, and your 1:1s
 * How: the lens bar renders at the page level (inside TeamDnaExperience) and
 * spans the full width; on non-compare lenses the people pane is hidden and
 * the content column widens. Tapping any face or suggested pairing anywhere
 * jumps to the Compare lens with that selection.
 * Port: lens state lives in the page shell; content derives from the same
 * subjects the page already has. Strips, bars, and rows only. No radar.
 */

export const LENS_TABS = [
  { id: 'overview', title: 'Team overview', sub: 'Everyone at a glance' },
  { id: 'profile', title: 'My profile', sub: 'Your personal DNA' },
  { id: 'compare', title: '1:1 Compare', sub: 'Two people, side by side' },
  { id: 'chemistry', title: 'Chemistry', sub: 'The mix, and your 1:1s' },
];

/**
 * Page-level lens bar. On full-width lenses it carries the page header too
 * (the people pane, which normally holds the team name, is hidden there).
 */
export function ConceptLensBar({ lens, onSelect, teamName, showHeader }) {
  return (
    <div className="lensx-bar-row" data-with-header={showHeader || undefined}>
      {showHeader ? (
        <header className="lensx-head">
          <p className="lensx-eyebrow">
            Team {'\u00b7'} Team DNA
          </p>
          <h1 className="lensx-title">{teamName}</h1>
          <p className="lensx-intro">
            One assessment, four views: the whole team, your own profile, any
            two people, and the team&rsquo;s mix.
          </p>
        </header>
      ) : null}
      <div className="tabx-bar" role="tablist" aria-label="Dashboard lenses">
        {LENS_TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={lens === entry.id}
            className="tabx-tab"
            data-active={lens === entry.id || undefined}
            onClick={() => onSelect(entry.id)}
          >
            <span className="tabx-tab-title">{entry.title}</span>
            <span className="tabx-tab-sub">{entry.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Closest match and sharpest contrast for one person, by full-profile
   distance. Powers "pick one more" and the Chemistry "your 1:1s". */
function getPairingsFor(member, allSubjects) {
  const others = allSubjects.filter((other) => other.id !== member.id);
  if (others.length === 0) return null;
  let closest = null;
  let contrast = null;
  others.forEach((other) => {
    const distance = getPairDistance(member, other);
    if (!closest || distance < closest.distance) closest = { member: other, distance };
    if (!contrast || distance > contrast.distance) contrast = { member: other, distance };
  });
  return { closest, contrast };
}

export function ConceptTabs({
  scope,
  lens = 'overview',
  insight,
  subjects,
  allSubjects,
  viewerId,
  isOwnProfile,
  teamName,
  onCoachPrompt,
  onSelectMember,
  onSelectPair,
}) {
  const viewer = allSubjects.find((member) => member.id === viewerId) ?? null;

  // One person selected on the Compare lens: a light "pick one more" step,
  // not a duplicate profile. (A full pair renders the original pair page.)
  if (scope === 'person') {
    const member = subjects[0];
    const pairings = getPairingsFor(member, allSubjects);
    const name = isOwnProfile ? 'You' : firstName(member);

    return (
      <div className="dxp dxp--tabs" aria-label="Compare: pick one more">
        <section className="info-block info-block--editorial">
          <p className="info-block-label">1:1 Compare</p>
          <div className="tabx-person">
            <Face member={member} size={44} />
            <div className="tabx-person-copy">
              <strong>
                {name} {isOwnProfile ? 'are' : 'is'} in
              </strong>
              <span>Tap one more face on the left to compare.</span>
            </div>
          </div>
          {pairings ? (
            <div className="tabx-group">
              <p className="tabx-group-label">
                Pairings worth opening for {isOwnProfile ? 'you' : firstName(member)}
              </p>
              <div className="mapx-pairings">
                <PairRow
                  a={member}
                  b={pairings.closest.member}
                  tag="Closest match"
                  line="Nearly the same defaults: fast together, with a shared blind side."
                  onSelectPair={onSelectPair}
                />
                <PairRow
                  a={member}
                  b={pairings.contrast.member}
                  tag="Sharpest contrast"
                  line="The most different defaults: slower, and the widest coverage."
                  onSelectPair={onSelectPair}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  if (lens === 'overview') {
    return (
      <OverviewLens
        insight={insight}
        allSubjects={allSubjects}
        viewerId={viewerId}
        onSelectMember={onSelectMember}
        onCoachPrompt={onCoachPrompt}
      />
    );
  }

  if (lens === 'profile') {
    if (!viewer) {
      return (
        <div className="lensx" aria-label="My profile">
          <section className="info-block info-block--editorial info-block--lens">
            <p className="info-block-label">My profile</p>
            <p className="dxp-copy dxp-copy--flush">
              Your assessment isn&rsquo;t part of this team yet, so there is no
              snapshot to show here.
            </p>
          </section>
        </div>
      );
    }
    return (
      <ProfileLens
        member={viewer}
        allSubjects={allSubjects}
        onCoachPrompt={onCoachPrompt}
      />
    );
  }

  if (lens === 'chemistry') {
    return (
      <ChemistryLens
        allSubjects={allSubjects}
        viewer={viewer}
        teamName={teamName}
        onSelectMember={onSelectMember}
        onSelectPair={onSelectPair}
        onCoachPrompt={onCoachPrompt}
      />
    );
  }

  // Compare lens, nothing selected yet.
  return (
    <div className="dxp dxp--tabs" aria-label="Compare picker">
      <section className="info-block info-block--editorial">
        <p className="info-block-label">1:1 Compare</p>
        <p className="dxp-copy dxp-copy--flush">
          Compare any two people side by side:{' '}
          <strong>tap two faces on the left</strong>, or start from a pairing
          worth knowing.
        </p>
        <div className="mapx-pairings">
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

/* ── Lens 1 · Team overview ──────────────────────────────────────────────── */

/* Aligned-on / most-varied row: trait name, a small range bar (how much of
   the 0–100 scale the team spans on it), and the one-line consequence. */
function SignatureCallout({ kicker, entry }) {
  return (
    <div className="lensx-sig">
      <div className="lensx-sig-top">
        <span className="lensx-kicker">{kicker}</span>
        <span className="lensx-sig-spread">{entry.spread} pt range</span>
      </div>
      <p className="lensx-sig-word">{entry.label}</p>
      <span className="lensx-sig-track" aria-hidden="true">
        <span
          className="lensx-sig-bar"
          style={{ width: `${Math.max(6, entry.spread)}%` }}
        />
      </span>
      <p className="lensx-sig-line">{entry.line}</p>
    </div>
  );
}

function OverviewLens({
  insight,
  allSubjects,
  viewerId,
  onSelectMember,
  onCoachPrompt,
}) {
  const strips = getTraitStrips(allSubjects);
  const callouts = getStripCallouts(allSubjects);

  return (
    <div className="lensx" aria-label="Team overview">
      <div className="lensx-grid lensx-grid--overview">
        <section className="info-block info-block--editorial info-block--lens">
          <p className="lensx-kicker">Team signature</p>
          <h2 className="lensx-serif">{insight.title}</h2>
          <p className="lensx-copy">{summaryText(insight)}</p>

          <div className="lensx-avgs">
            <p className="lensx-avgs-cap">Big Five averages {'\u00b7'} 0{'\u2013'}100</p>
            <div className="lensx-avgs-row">
              {strips.map((strip) => (
                <div className="lensx-avg" key={strip.trait.key}>
                  <span className="lensx-avg-num">{strip.average}</span>
                  <span className="lensx-avg-word">{strip.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lensx-sigs">
            <SignatureCallout kicker="Aligned on" entry={callouts.aligned} />
            <SignatureCallout kicker="Most varied" entry={callouts.varied} />
          </div>
        </section>

        <section className="info-block info-block--editorial info-block--lens">
          <div className="lensx-card-head">
            <p className="info-block-label">Where everyone lands</p>
            <span className="lensx-meta">{allSubjects.length} people</span>
          </div>
          <p className="lensx-read">{callouts.headline}</p>
          <div className="tabx-strips">
            {strips.map((strip) => (
              <div className="tabx-strip" key={strip.trait.key}>
                <div className="tabx-strip-head">
                  <span className="tabx-strip-word">{strip.label}</span>
                  <span className="tabx-strip-state" data-state={strip.state}>
                    {strip.state}
                  </span>
                  <span className="tabx-strip-avg">avg {strip.average}</span>
                </div>
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
                      data-you={member.id === viewerId || undefined}
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
                <p className="tabx-strip-read">{strip.insight}</p>
              </div>
            ))}
          </div>
          <CoachFootLink
            prompt="Walk me through where my team lands on the five spectrums: where we're aligned, where we're spread, and what to do with the difference."
            onCoachPrompt={onCoachPrompt}
          />
        </section>
      </div>
    </div>
  );
}

/* ── Lens 2 · My profile ─────────────────────────────────────────────────── */

function ProfileLens({ member, allSubjects, onCoachPrompt }) {
  const model = getProfileModel(member, allSubjects);

  return (
    <div className="lensx" aria-label="My profile">
      <div className="lensx-grid lensx-grid--profile">
        <div className="lensx-col">
          <section className="info-block info-block--editorial info-block--lens">
            <p className="lensx-kicker">My profile</p>
            <div className="lensx-id">
              <Face member={member} size={56} />
              <div className="lensx-id-copy">
                <strong>{member.name}</strong>
                {model.role ? (
                  <span>
                    {model.role.singular} {'\u00b7'} {model.role.description}
                  </span>
                ) : (
                  <span>Balanced profile</span>
                )}
              </div>
            </div>
            {model.superpower ? (
              <div className="lensx-super">
                <p className="lensx-kicker">Superpower</p>
                <p className="tabx-callout-word">{model.superpower.title}</p>
                <p className="tabx-callout-line">{model.superpower.body}</p>
              </div>
            ) : null}
            <div className="lensx-sig lensx-sig--solo">
              <span className="lensx-kicker">Lean into</span>
              <p>
                <strong>{model.leanInto.friendly}.</strong>{' '}
                {model.leanInto.line}
              </p>
            </div>
          </section>
        </div>

        <section className="info-block info-block--editorial info-block--lens">
          <div className="lensx-card-head">
            <p className="info-block-label">Your Big Five, next to the team</p>
            <span className="lensx-meta">sorted by distance</span>
          </div>
          <p className="lensx-hint">
            Your face is your score; the tick is the team average.
          </p>
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
                    <Face member={member} size={22} />
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
            prompt="What does my Big Five snapshot against the team average mean for how I should work with this team?"
            onCoachPrompt={onCoachPrompt}
          />
        </section>

        <div className="lensx-grid lensx-grid--half lensx-span">
          <section className="info-block info-block--editorial info-block--lens">
            <p className="info-block-label">Your strengths</p>
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
            <p className="info-block-label">Your growth opportunities</p>
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
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Lens 4 · Chemistry ──────────────────────────────────────────────────── */

function ChemistryLens({
  allSubjects,
  viewer,
  teamName,
  onSelectMember,
  onSelectPair,
  onCoachPrompt,
}) {
  const model = getChemistryModel(allSubjects);
  const thin = model.present.filter((role) => role.members.length === 1);
  const viewerPairings = viewer ? getPairingsFor(viewer, allSubjects) : null;

  return (
    <div className="lensx" aria-label="Team chemistry">
      <div className="lensx-grid lensx-grid--chem">
        <section className="info-block info-block--editorial info-block--lens">
          <div className="lensx-card-head">
            <p className="info-block-label">The archetype mix</p>
            <span className="lensx-meta">defaults, not job descriptions</span>
          </div>
          <p className="lensx-read">{model.mixInsight}</p>
          <div className="tabx-roles">
            {model.present.map((role) => (
              <div className="tabx-role" key={role.key}>
                <div className="tabx-role-head">
                  <strong>{role.label}</strong>
                  <span className="tabx-role-count">
                    {'\u00d7'}
                    {role.members.length}
                  </span>
                </div>
                <span className="tabx-role-desc">{role.description}</span>
                <span className="tabx-role-faces">
                  {role.members.slice(0, 4).map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="tabx-strip-face tabx-strip-face--static"
                      title={member.name}
                      aria-label={`Open ${member.name}'s profile`}
                      onClick={() =>
                        onSelectMember?.(member.id, { mode: 'solo' })
                      }
                    >
                      <Face member={member} size={22} />
                    </button>
                  ))}
                </span>
              </div>
            ))}
            {model.open.map((role) => (
              <div className="tabx-role" data-open key={role.key}>
                <div className="tabx-role-head">
                  <strong>{role.label}</strong>
                  <span className="tabx-role-count tabx-role-count--zero">
                    {'\u00d7'}0
                  </span>
                </div>
                <span className="tabx-role-desc">{role.description}</span>
                <span className="tabx-role-none">No one defaults here.</span>
              </div>
            ))}
          </div>
          {thin.length > 0 ? (
            <p className="tabx-open-line">
              <strong>Carried by one person:</strong>{' '}
              {thin.map((role) => role.singular.toLowerCase()).join(', ')}.
              When they are out, it goes quiet.
            </p>
          ) : null}
        </section>

        <div className="lensx-col">
          {viewerPairings ? (
            <section className="info-block info-block--editorial info-block--lens">
              <p className="info-block-label">Your 1:1s</p>
              <p className="lensx-hint">
                Who to talk to, based on your own profile.
              </p>
              <div className="mapx-pairings">
                <PairRow
                  a={viewer}
                  b={viewerPairings.closest.member}
                  tag="Your closest match"
                  line="Nearly your defaults: fast together, with a shared blind side."
                  onSelectPair={onSelectPair}
                />
                <PairRow
                  a={viewer}
                  b={viewerPairings.contrast.member}
                  tag="Your sharpest contrast"
                  line="Covers what you don't. The pairing that stretches you most."
                  onSelectPair={onSelectPair}
                />
              </div>
            </section>
          ) : null}

          <section className="info-block info-block--editorial info-block--lens">
            <p className="info-block-label">Aligned vs. varied</p>
            <div className="tabx-cohesion">
              {model.cohesion.map((entry) => (
                <div className="tabx-cohesion-row" key={entry.trait.key}>
                  <span className="tabx-cohesion-word">{entry.label}</span>
                  <span className="tabx-cohesion-track" aria-hidden="true">
                    <span
                      className="tabx-cohesion-bar"
                      style={{ width: `${Math.max(6, entry.spread)}%` }}
                    />
                  </span>
                  <span
                    className="tabx-cohesion-state"
                    data-state={entry.state}
                  >
                    {entry.state}
                  </span>
                </div>
              ))}
            </div>
            <p className="lensx-hint">
              Short bars: the team defaults alike. Long bars: real range.
            </p>
          </section>
        </div>

        <div className="lensx-grid lensx-grid--half lensx-span">
          <section className="info-block info-block--editorial info-block--lens">
            <p className="info-block-label">Team strengths</p>
            <div className="lensx-items">
              {model.strengths.map((item) => (
                <div
                  className="lensx-item"
                  key={`${item.traitKey}-${item.type}`}
                >
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="info-block info-block--editorial info-block--lens">
            <p className="info-block-label">Team growth opportunities</p>
            <div className="lensx-items">
              {model.watchOuts.map((item) => (
                <div
                  className="lensx-item"
                  key={`${item.traitKey}-${item.type}`}
                >
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <CoachFootLink
              prompt={`Given ${teamName ?? 'my team'}'s archetype mix, where we're aligned and varied, and our growth areas, what should we work on first?`}
              onCoachPrompt={onCoachPrompt}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
