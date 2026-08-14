import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  WORKING_STYLE_CATEGORIES,
  getWorkingBucket,
  getWorkingPosition,
  getWorkingReport,
  getFocusRead,
} from '../data/teamDnaWorkingStyles.js';
import { CoachFootLink, Face, renderEmphasis } from './conceptPrimitives.jsx';
import { BigFiveBloom } from './BigFiveBloom.jsx';

/**
 * Working styles, as an experience rather than a chart.
 *
 * What: a compact master-detail stage. The left rail lists the ten
 * questions in Scott's four areas; the only marker is a pink SPLIT tag on
 * the questions where the team genuinely divides, so the rail reads as a
 * to-do list, not a data dump. The stage shows one question at a time:
 * the question, the team's faces standing in the five buckets, and one
 * line saying what to do with it. Switching questions animates every face
 * to its new bucket, so the room visibly re-sorts itself.
 * How: one persistent D3 selection keyed by member id; positions
 * transition, faces never redraw. Focus (profile / compare) rings the
 * highlighted people and quiets the rest.
 * Port: buckets come from getWorkingBucket; swap in real answers there.
 */

const BUCKET_ORDER = [5, 4, 3, 2, 1];
const PINK = '#ce0058';
const INK = '#1e1a26';

const ALL_ITEMS = WORKING_STYLE_CATEGORIES.flatMap((category) =>
  category.items.map((item) => ({ ...item, category: category.label }))
);

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const isRealSplit = (row) => Math.min(row.aCount, row.bCount) >= 2;

let stageClipSequence = 0;

/* Positions are stored with pole A high; flip so pole A renders LEFT,
   matching every other spectrum on the page. */
const displayPos = (member, item) => 100 - getWorkingPosition(member, item);

/* Every question by key, shared by the compact variants. */
const ITEM_BY_KEY = new Map(
  WORKING_STYLE_CATEGORIES.flatMap((category) =>
    category.items.map((item) => [item.key, item])
  )
);

/* Five bloom axes, not four: communication and collaboration are genuinely
   different topics, and five petals read as a shape instead of an oval.
   Each axis carries a flagship question whose pole words are clean enough
   to label the team's lean. */
const WORK_AXES = [
  { key: 'pace', shortLabel: 'Pace', items: ['speed', 'decisions'], flag: 'speed' },
  { key: 'structure', shortLabel: 'Structure', items: ['clarity', 'checkins'], flag: 'clarity' },
  { key: 'communication', shortLabel: 'Communication', items: ['directness', 'conflict'], flag: 'directness' },
  { key: 'approach', shortLabel: 'Approach', items: ['focus', 'sharing'], flag: 'sharing' },
  { key: 'collaboration', shortLabel: 'Collaboration', items: ['closeness', 'ownership'], flag: 'closeness' },
];

const AXIS_BY_KEY = new Map(WORK_AXES.map((axis) => [axis.key, axis]));

function categoryScore(member, axisKey) {
  const axis = AXIS_BY_KEY.get(axisKey);
  return (
    axis.items.reduce(
      (sum, key) => sum + displayPos(member, ITEM_BY_KEY.get(key)),
      0
    ) / axis.items.length
  );
}

function joinList(parts) {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/* Whole-team synthesis: the culture this team falls into when nobody
   decides, plus the questions still genuinely open. */
function cultureRead(subjects) {
  const rows = WORKING_STYLE_CATEGORIES.flatMap((category) =>
    category.items.map((item) => {
      let aCount = 0;
      let bCount = 0;
      subjects.forEach((member) => {
        const bucket = getWorkingBucket(member, item);
        if (bucket >= 4) aCount += 1;
        else if (bucket <= 2) bCount += 1;
      });
      return { item, aCount, bCount, margin: Math.abs(aCount - bCount) };
    })
  );
  const decided = rows
    .filter((row) => row.margin > 1)
    .sort((x, y) => y.margin - x.margin);
  const splits = rows.filter((row) => row.margin <= 1);

  // "consensus decisions", but just "structured" when the pole word
  // already contains the topic word.
  const phrase = (row) => {
    const pole = (row.aCount > row.bCount
      ? row.item.aPole
      : row.item.bPole
    ).toLowerCase();
    const label = row.item.label.toLowerCase();
    return label.includes(pole) || pole.includes(label)
      ? `**${pole}**`
      : `**${pole}** ${label}`;
  };
  const lead = decided.length
    ? `Left to itself, this team runs on ${joinList(
        decided.slice(0, 3).map(phrase)
      )}. That is the culture that happens when nobody decides it.`
    : `This team has no strong defaults: almost every preference splits the room, so working agreements have to be explicit.`;
  const follow = splits.length
    ? `Still open: ${joinList(
        splits.map((row) => `**${row.item.label.toLowerCase()}**`)
      )} split${splits.length === 1 ? 's' : ''} the room. Agree per project which mode wins — or the defaults above decide for you.`
    : `Nothing splits the room. Comfortable — and unchallenged; worth inviting a dissenting voice on big bets.`;
  return { lead, follow };
}

/* Compact variant · BLOOM: the team bloom on five working-style axes.
   Each axis label carries the team's lean, so the shape itself says
   something before anyone reads a sentence. */
function WorkingBloom({ subjects }) {
  const { lead, follow } = cultureRead(subjects);
  const axes = useMemo(
    () =>
      WORK_AXES.map((axis) => {
        const item = ITEM_BY_KEY.get(axis.flag);
        const mean =
          subjects.reduce((sum, member) => sum + displayPos(member, item), 0) /
          subjects.length;
        const subLabel =
          mean < 45
            ? `leans ${item.aPole.toLowerCase()}`
            : mean > 55
              ? `leans ${item.bPole.toLowerCase()}`
              : 'mixed';
        return { key: axis.key, shortLabel: axis.shortLabel, subLabel };
      }),
    [subjects]
  );
  return (
    <div className="wsbloom">
      <div className="wsbloom-chart">
        <BigFiveBloom
          subjects={subjects}
          traits={axes}
          getScore={categoryScore}
        />
      </div>
      <div className="wsbloom-side">
        <p className="wstage-group-label">The default culture</p>
        <p className="wsb-read wsbloom-lead">{renderEmphasis(lead)}</p>
        <p className="wsb-read">{renderEmphasis(follow)}</p>
      </div>
    </div>
  );
}

/* Compact variant · MAP: two questions become a field. Distance between
   people is literally distance, so clusters and lone outliers appear
   without being explained. */
const MAP_PAIRS = [
  {
    id: 'ps',
    label: 'Pace \u00d7 Structure',
    x: 'speed',
    y: 'clarity',
    topic: 'pace and structure',
    // What living in each corner looks like day to day.
    scenes: {
      tl: 'sprint inside a plan: tight scopes, quick decisions, visible process',
      tr: 'plan first and execute: clear owners, fewer surprises, slower starts',
      bl: 'improvise: start now, sort the process out later',
      br: 'take their time without ceremony: quality over speed, minimal process',
    },
  },
  {
    id: 'ca',
    label: 'Comms \u00d7 Approach',
    x: 'closeness',
    y: 'sharing',
    topic: 'communication and approach',
    scenes: {
      tl: 'think out loud: calls over comments, rough drafts shared for reaction',
      tr: 'work in threads on their own clock, still showing work while it is rough',
      bl: 'collaborate in the room, but only show finished work',
      br: 'work heads-down: written updates, and work appears when it is ready',
    },
  },
  {
    id: 'pc',
    label: 'Pace \u00d7 Comms',
    x: 'speed',
    y: 'closeness',
    topic: 'pace and communication',
    scenes: {
      tl: 'move in real time: quick calls, decisions made in the room',
      tr: 'talk it through live, then decide carefully',
      bl: 'move fast in writing: threads that resolve within the hour',
      br: 'work quiet and thorough: written, considered, unhurried',
    },
  },
];

function WorkingMap({ subjects }) {
  const [pairId, setPairId] = useState('ps');
  const [hoverIds, setHoverIds] = useState(null);
  const pair = MAP_PAIRS.find((option) => option.id === pairId);
  const xItem = ITEM_BY_KEY.get(pair.x);
  const yItem = ITEM_BY_KEY.get(pair.y);
  const points = subjects.map((member) => ({
    member,
    x: displayPos(member, xItem),
    y: displayPos(member, yItem),
  }));

  const quadOf = ({ x, y }) => `${y < 50 ? 't' : 'b'}${x < 50 ? 'l' : 'r'}`;
  const quadCounts = { tl: 0, tr: 0, bl: 0, br: 0 };
  points.forEach((point) => {
    quadCounts[quadOf(point)] += 1;
  });
  // Plain-language name for a corner: "deliberate and structured".
  const quadPhrase = {
    tl: `${xItem.aPole} and ${yItem.aPole}`.toLowerCase(),
    tr: `${xItem.bPole} and ${yItem.aPole}`.toLowerCase(),
    bl: `${xItem.aPole} and ${yItem.bPole}`.toLowerCase(),
    br: `${xItem.bPole} and ${yItem.bPole}`.toLowerCase(),
  };
  const ranked = Object.entries(quadCounts).sort((m, n) => n[1] - m[1]);
  const [topQuad, topCount] = ranked[0];
  const firstName = (member) => member.name.split(' ')[0];
  const idsInQuad = (quad) =>
    points
      .filter((point) => quadOf(point) === quad)
      .map(({ member }) => member.id);

  // How contested each axis is, so the closing bullet can point at the
  // split that actually matters.
  const contest = (item) => {
    let a = 0;
    let b = 0;
    subjects.forEach((member) => {
      const bucket = getWorkingBucket(member, item);
      if (bucket >= 4) a += 1;
      else if (bucket <= 2) b += 1;
    });
    return Math.min(a, b);
  };
  const contestedItem = contest(xItem) >= contest(yItem) ? xItem : yItem;

  // Headline first: the composition of the team on this pairing. Then
  // bullets; hovering one lights its people up and draws the cluster.
  let headline;
  let notes;
  if (topCount >= Math.ceil(subjects.length / 2)) {
    const outliers = points.filter((point) => quadOf(point) !== topQuad);
    headline = `On ${pair.topic}, this is ${
      topCount === subjects.length ? 'one culture' : 'mostly one culture'
    }: **${quadPhrase[topQuad]}**.`;
    notes = [
      {
        ids: idsInQuad(topQuad),
        text: `**${topCount} of ${subjects.length}** ${pair.scenes[topQuad]}. Plans, reviews and rituals here quietly assume that rhythm.`,
      },
      outliers.length
        ? {
            ids: outliers.map(({ member }) => member.id),
            text: `**${outliers
              .map(({ member }) => firstName(member))
              .join(', ')}** ${
              outliers.length === 1 ? 'works' : 'work'
            } differently. Say whose mode wins on shared work, or ${
              outliers.length === 1 ? 'this person reads' : 'they read'
            } as "slow" or "sloppy" when they are neither.`,
          }
        : {
            ids: null,
            text: `Nobody sits outside it — smooth, but no one here ever argues for the other modes. Borrow a contrarian for big bets.`,
          },
      { ids: null, text: `Where it bites: ${contestedItem.stake}` },
    ];
  } else {
    const [first, second] = ranked;
    headline = `On ${pair.topic}, this team is two cultures living side by side: **${quadPhrase[first[0]]}** and **${quadPhrase[second[0]]}**.`;
    // If the camps share a pole, the disagreement is really one question.
    const sharesRow = first[0][0] === second[0][0];
    const sharesCol = first[0][1] === second[0][1];
    let closing;
    if (sharesRow || sharesCol) {
      const agreedItem = sharesRow ? yItem : xItem;
      const splitItem = sharesRow ? xItem : yItem;
      const agreedPole = sharesRow
        ? first[0][0] === 't'
          ? yItem.aPole
          : yItem.bPole
        : first[0][1] === 'l'
          ? xItem.aPole
          : xItem.bPole;
      closing = {
        ids: null,
        text: `The camps already agree on ${agreedItem.label.toLowerCase()} — nearly everyone leans **${agreedPole.toLowerCase()}**. The real split is ${splitItem.label.toLowerCase()}: ${splitItem.stake}`,
      };
    } else {
      closing = {
        ids: null,
        text: `The camps differ on both counts, so cross-camp pairs need ground rules twice over. Start with ${contestedItem.label.toLowerCase()}: ${contestedItem.stake}`,
      };
    }
    notes = [
      {
        ids: idsInQuad(first[0]),
        text: `**${first[1]} people** work **${quadPhrase[first[0]]}** — they ${pair.scenes[first[0]]}.`,
      },
      {
        ids: idsInQuad(second[0]),
        text: `**${second[1]}** work **${quadPhrase[second[0]]}** — they ${pair.scenes[second[0]]}.`,
      },
      closing,
    ];
  }

  // Soft blob around the hovered group's bounding box.
  let hull = null;
  if (hoverIds && hoverIds.length >= 2) {
    const grouped = points.filter(({ member }) => hoverIds.includes(member.id));
    const xs = grouped.map((point) => point.x);
    const ys = grouped.map((point) => point.y);
    hull = {
      left: Math.min(...xs),
      top: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  return (
    <div className="wsmap">
      <div
        className="wsmap-field"
        role="img"
        aria-label={`${xItem.label} by ${yItem.label}`}
      >
        <span className="wsmap-axis wsmap-axis--v" aria-hidden="true" />
        <span className="wsmap-axis wsmap-axis--h" aria-hidden="true" />
        {/* One pole word per axis end, sitting on the axis itself. */}
        <span className="wsmap-pole wsmap-pole--l">{xItem.aPole}</span>
        <span className="wsmap-pole wsmap-pole--r">{xItem.bPole}</span>
        <span className="wsmap-pole wsmap-pole--t">{yItem.aPole}</span>
        <span className="wsmap-pole wsmap-pole--b">{yItem.bPole}</span>
        {hull ? (
          <span
            className="wsmap-hull"
            style={{
              left: `calc(${hull.left}% - 34px)`,
              top: `calc(${hull.top}% - 34px)`,
              width: `calc(${hull.width}% + 68px)`,
              height: `calc(${hull.height}% + 68px)`,
            }}
          />
        ) : null}
        {points.map(({ member, x, y }) => (
          <span
            key={member.id}
            className="wsmap-face"
            data-dim={(hoverIds && !hoverIds.includes(member.id)) || undefined}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <Face member={member} size={26} />
          </span>
        ))}
      </div>
      <div className="wsmap-side">
        <p className="wstage-group-label">Axis pair</p>
        <div className="wsmap-pairs">
          {MAP_PAIRS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="wstage-row"
              data-active={option.id === pairId || undefined}
              onClick={() => {
                setPairId(option.id);
                setHoverIds(null);
              }}
            >
              <span className="wstage-row-label">{option.label}</span>
            </button>
          ))}
        </div>
        <p className="wstage-group-label wsmap-insight-label">Team insight</p>
        <p className="wsb-read wsmap-lead">{renderEmphasis(headline)}</p>
        <ul className="wsmap-notes">
          {notes.map((note, index) => (
            <li
              key={index}
              className="wsb-read"
              data-hot={note.ids ? '' : undefined}
              onMouseEnter={note.ids ? () => setHoverIds(note.ids) : undefined}
              onMouseLeave={note.ids ? () => setHoverIds(null) : undefined}
            >
              {renderEmphasis(note.text)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Compact variant · COMBS: the reporting spec drawn literally: a count at
   each of the five points for one flagship question per area. Shape reads
   instantly: single peak, two camps, or flat. */
const COMB_ITEM_KEYS = ['speed', 'clarity', 'closeness', 'sharing'];

function WorkingCombs({ subjects, onCoachPrompt }) {
  const readByKey = useMemo(
    () =>
      new Map(
        getWorkingReport(subjects).flatMap((category) =>
          category.items.map((item) => [item.key, item.read])
        )
      ),
    [subjects]
  );
  return (
    <div className="wscombs">
      {COMB_ITEM_KEYS.map((key) => {
        const item = ITEM_BY_KEY.get(key);
        const binMembers = [[], [], [], [], []];
        subjects.forEach((member) => {
          binMembers[5 - getWorkingBucket(member, item)].push(member);
        });
        const max = Math.max(...binMembers.map((bin) => bin.length), 1);
        return (
          <article className="wscomb" key={key}>
            <p className="wstage-group-label">{item.label}</p>
            <div className="wscomb-bars">
              {binMembers.map((bin, index) => {
                const height = Math.max((bin.length / max) * 100, 3);
                return (
                  <div className="wscomb-slot" key={index}>
                    {bin.length > 0 ? (
                      <span
                        className="wscomb-people"
                        style={{ bottom: `calc(${height}% + 22px)` }}
                      >
                        {bin.map((member) => (
                          <Face key={member.id} member={member} size={20} />
                        ))}
                      </span>
                    ) : null}
                    {/* Count sits right on top of its bar, not in the air. */}
                    {bin.length > 0 ? (
                      <span className="wscomb-count">{bin.length}</span>
                    ) : null}
                    <i
                      data-tone={index}
                      data-zero={bin.length === 0 || undefined}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="wscomb-poles">
              <span className="wsb-item-pole">{item.aPole}</span>
              <span className="wsb-item-pole wsb-item-pole--b">
                {item.bPole}
              </span>
            </div>
            <p className="wsb-read">{renderEmphasis(readByKey.get(key))}</p>
            <CoachFootLink
              label="Dive deeper with AI coach"
              prompt={`Our team splits on ${item.label.toLowerCase()}: some of us would rather ${item.aWord}, others would rather ${item.bWord}. How do we set a working agreement?`}
              onCoachPrompt={onCoachPrompt}
            />
          </article>
        );
      })}
    </div>
  );
}

export function WorkingStylesStage({
  subjects,
  focusIds = [],
  focusIsViewer = false,
  onCoachPrompt,
}) {
  const report = useMemo(() => getWorkingReport(subjects), [subjects]);
  const readByKey = useMemo(
    () =>
      new Map(
        report.flatMap((category) =>
          category.items.map((item) => [item.key, item])
        )
      ),
    [report]
  );
  // Land on the first real split: the question most worth talking about.
  const [activeKey, setActiveKey] = useState(
    () =>
      ALL_ITEMS.find((item) => isRealSplit(readByKey.get(item.key)))?.key ??
      ALL_ITEMS[0].key
  );
  const svgRef = useRef(null);
  const active = ALL_ITEMS.find((item) => item.key === activeKey) ?? ALL_ITEMS[0];
  // Team scope offers three densities: the stage, plus two compact reads.
  const [view, setView] = useState('stage');
  const showViews = subjects.length > 3 && focusIds.length === 0;
  const compactView = showViews && view !== 'stage' ? view : null;

  // Stable geometry: the tallest stack across every question fixes the
  // stage height so nothing jumps between questions.
  const geometry = useMemo(() => {
    const width = 720;
    const radius = 12;
    const gap = 5;
    let maxStack = 1;
    ALL_ITEMS.forEach((item) => {
      const counts = {};
      subjects.forEach((member) => {
        const bucket = getWorkingBucket(member, item);
        counts[bucket] = (counts[bucket] ?? 0) + 1;
      });
      maxStack = Math.max(maxStack, ...Object.values(counts));
    });
    const baseline = maxStack * (radius * 2 + gap) + 18;
    return {
      width,
      radius,
      gap,
      baseline,
      height: baseline + 40,
      x: d3.scalePoint().domain(BUCKET_ORDER).range([70, width - 70]),
    };
  }, [subjects]);

  // Draw once: baseline, slots, and one persistent group per member.
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, radius, baseline, x } = geometry;

    svg
      .append('line')
      .attr('x1', 24)
      .attr('x2', width - 24)
      .attr('y1', baseline)
      .attr('y2', baseline)
      .attr('stroke', 'rgba(30,26,38,0.1)');
    BUCKET_ORDER.forEach((bucket) => {
      svg
        .append('line')
        .attr('x1', x(bucket))
        .attr('x2', x(bucket))
        .attr('y1', baseline - 3)
        .attr('y2', baseline + 3)
        .attr('stroke', 'rgba(30,26,38,0.28)');
    });
    svg
      .append('text')
      .attr('class', 'wst-pole-a')
      .attr('x', 24)
      .attr('y', baseline + 32)
      .attr('text-anchor', 'start');
    svg
      .append('text')
      .attr('class', 'wst-pole-b')
      .attr('x', width - 24)
      .attr('y', baseline + 32)
      .attr('text-anchor', 'end');

    const focus = new Set(focusIds);
    const members = svg
      .append('g')
      .attr('class', 'wst-members')
      .selectAll('g.wst-member')
      .data(subjects, (member) => member.id)
      .join('g')
      .attr('class', 'wst-member');

    members.each(function draw(member) {
      const group = d3.select(this);
      const isFocus = focus.has(member.id);
      if (isFocus) {
        group
          .append('circle')
          .attr('r', radius + 2.5)
          .attr('fill', 'none')
          .attr('stroke', focusIds[0] === member.id ? PINK : INK)
          .attr('stroke-width', 2);
      }
      group.append('circle').attr('r', radius).attr('fill', '#fff');
      if (member.avatarUrl) {
        stageClipSequence += 1;
        const clipId = `wst-clip-${stageClipSequence}`;
        group
          .append('clipPath')
          .attr('id', clipId)
          .append('circle')
          .attr('r', radius);
        group
          .append('image')
          .attr('href', member.avatarUrl)
          .attr('x', -radius)
          .attr('y', -radius)
          .attr('width', radius * 2)
          .attr('height', radius * 2)
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .attr('clip-path', `url(#${clipId})`)
          .style(
            'filter',
            focus.size > 0 && !isFocus
              ? 'saturate(0.15) opacity(0.45)'
              : 'saturate(0.8)'
          );
      } else {
        group
          .append('circle')
          .attr('r', radius)
          .attr('fill', 'rgba(30,26,38,0.3)');
        group
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', radius * 0.85)
          .attr('fill', '#fff')
          .text(member.name?.[0] ?? '?');
      }
      group.append('title').text(member.name);
    });
    // Position for the first question without animation.
    positionMembers(svg, subjects, active, geometry, focusIds, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, geometry, focusIds]);

  // Re-sort the room whenever the question changes.
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    positionMembers(svg, subjects, active, geometry, focusIds, true);
  }, [active, subjects, geometry, focusIds, compactView]);

  const activeRead = readByKey.get(active.key);
  // Focused views read personally: one person against the room, or a pair
  // against each other. The team read is only for the team scope.
  const focusMembers = focusIds
    .map((id) => subjects.find((member) => member.id === id))
    .filter(Boolean);
  const readText = activeRead
    ? focusMembers.length > 0
      ? getFocusRead(activeRead, focusMembers, { isOwn: focusIsViewer })
      : activeRead.read
    : null;

  return (
    // With only a pair on stage the full-width chart reads empty, so it
    // renders compact instead.
    <div className="wstage" data-compact={subjects.length <= 3 || undefined}>
      {showViews ? (
        <div className="wstage-top">
          <div className="wstage-views" role="tablist" aria-label="Chart style">
            {[
              ['stage', 'Stage'],
              ['bloom', 'Bloom'],
              ['map', 'Map'],
              ['combs', 'Combs'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                className="wstage-view"
                data-active={view === id || undefined}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {compactView === 'bloom' ? (
        <WorkingBloom subjects={subjects} />
      ) : compactView === 'map' ? (
        <WorkingMap subjects={subjects} />
      ) : compactView === 'combs' ? (
        <WorkingCombs subjects={subjects} onCoachPrompt={onCoachPrompt} />
      ) : (
        <>
          {/* Questions grouped under the four HTP areas, so the taxonomy
              from the working-styles model is visible, not flattened away. */}
          <div className="wstage-groups" role="tablist" aria-label="Questions">
            {WORKING_STYLE_CATEGORIES.map((category) => (
              <div className="wstage-group" key={category.key}>
                <p className="wstage-group-label" title={category.sub}>
                  {category.label}
                </p>
                <div className="wstage-group-chips">
                  {category.items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={activeKey === item.key}
                      className="wstage-row"
                      data-active={activeKey === item.key || undefined}
                      title={`${capitalize(item.aWord)}, or ${item.bWord}?`}
                      onClick={() => setActiveKey(item.key)}
                    >
                      <span className="wstage-row-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="wstage-stage">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              className="wstage-svg"
              role="img"
              aria-label={`${active.label} distribution`}
            />
            {/* The takeaway sits under the visual it summarizes. */}
            {readText ? (
              <p className="wstage-read">{renderEmphasis(readText)}</p>
            ) : null}
            {readText && onCoachPrompt ? (
              <CoachFootLink
                label="Dive deeper with AI coach"
                prompt={`On "${active.label}", ${String(readText).replace(/\*\*/g, '')} How do we turn this into a working agreement?`}
                onCoachPrompt={onCoachPrompt}
              />
            ) : null}
          </div>
        </>
      )}
      {/* Section-level coach foot, only on views without their own
          per-item "Dive deeper" links. */}
      {onCoachPrompt && (compactView === 'bloom' || compactView === 'map') ? (
        <div className="fvc-foot">
          <CoachFootLink
            prompt="Which of my team's working-style splits most need an explicit norm, and what should the norm say?"
            onCoachPrompt={onCoachPrompt}
          />
        </div>
      ) : null}
    </div>
  );
}

/* Compute every member's slot for one question and move them there. */
function positionMembers(svg, subjects, item, geometry, focusIds, animate) {
  const { radius, gap, baseline, x } = geometry;
  const focus = new Set(focusIds);
  const stacks = {};
  const placements = new Map();

  [...subjects]
    .sort((a, b) => {
      // Focused people land on top of their stacks.
      const aFocus = focus.has(a.id) ? 1 : 0;
      const bFocus = focus.has(b.id) ? 1 : 0;
      if (aFocus !== bFocus) return aFocus - bFocus;
      return a.name.localeCompare(b.name);
    })
    .forEach((member) => {
      const bucket = getWorkingBucket(member, item);
      const index = stacks[bucket] ?? 0;
      stacks[bucket] = index + 1;
      placements.set(member.id, {
        x: x(bucket),
        y: baseline - radius - 2 - index * (radius * 2 + gap),
      });
    });

  const selection = svg
    .selectAll('g.wst-member')
    .data(subjects, (member) => member.id);
  const moved = animate
    ? selection.transition().duration(560).ease(d3.easeCubicInOut)
    : selection;
  moved.attr('transform', (member) => {
    const spot = placements.get(member.id);
    return `translate(${spot.x}, ${spot.y})`;
  });

  svg.select('.wst-pole-a').text(item.aPole.toUpperCase());
  svg.select('.wst-pole-b').text(item.bPole.toUpperCase());
}
