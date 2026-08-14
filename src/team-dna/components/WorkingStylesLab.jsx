import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  WORKING_STYLE_CATEGORIES,
  getWorkingBucket,
} from '../data/teamDnaWorkingStyles.js';

/**
 * Working styles lab: five D3 renderings of the same categorical data.
 *
 * What: Scott's single-item questions are 5-point categorical answers, so
 * every variant places people (or counts) in five discrete buckets between
 * the item's two poles. The variants trade off different reads:
 *   buckets  Valence-style: every face in its bucket (who is where)
 *   likert   diverging stacked bars from neutral (how split, at a glance)
 *   heatmap  items x buckets intensity grid (the team's fingerprint)
 *   bubbles  count-sized dots per bucket (minimal ink, fast scan)
 *   people   person x item matrix (who patterns with whom)
 * How: each variant renders into an SVG via d3 joins; all share one
 * diverging color scale (ink = first pole, pink = second pole).
 * Port: buckets come from getWorkingBucket; swap in real answers there.
 */

const BUCKET_ORDER = [5, 4, 3, 2, 1]; // pole A -> pole B, left to right
const BUCKET_LABELS = ['Strong', 'Lean', 'Neutral', 'Lean', 'Strong'];
const INK = '#21242c';
const PINK = '#ce0058';

const bucketColor = (bucket) =>
  ({
    5: 'rgba(33, 36, 44, 0.78)',
    4: 'rgba(33, 36, 44, 0.42)',
    3: 'rgba(33, 36, 44, 0.14)',
    2: 'rgba(206, 0, 88, 0.32)',
    1: 'rgba(206, 0, 88, 0.66)',
  })[bucket];

export const LAB_VARIANTS = [
  { id: 'buckets', label: 'Buckets' },
  { id: 'likert', label: 'Likert' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'bubbles', label: 'Bubbles' },
  { id: 'people', label: 'People' },
];

let clipSequence = 0;

function drawFace(parent, member, radius, { dim = false, ring = null } = {}) {
  const group = parent.append('g');
  if (ring) {
    group
      .append('circle')
      .attr('r', radius + 2.5)
      .attr('fill', 'none')
      .attr('stroke', ring)
      .attr('stroke-width', 2);
  }
  group.append('circle').attr('r', radius).attr('fill', '#fff');
  if (member.avatarUrl) {
    clipSequence += 1;
    const clipId = `wlab-clip-${clipSequence}`;
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
      .style('filter', dim ? 'saturate(0.15) opacity(0.5)' : 'saturate(0.8)');
  } else {
    group
      .append('circle')
      .attr('r', radius)
      .attr('fill', dim ? 'rgba(33,36,44,0.15)' : 'rgba(33,36,44,0.35)');
    group
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', radius * 0.8)
      .attr('fill', '#fff')
      .text(member.name?.[0] ?? '?');
  }
  group.append('title').text(member.name);
  return group;
}

function poleLabel(svg, x, y, text, anchor) {
  svg
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', anchor)
    .attr('class', 'wlab-pole')
    .text(text.toUpperCase());
}

/* Rows of items with category headers, shared by item-per-row variants. */
function useItems(subjects) {
  return useMemo(
    () =>
      WORKING_STYLE_CATEGORIES.flatMap((category) =>
        category.items.map((item, index) => ({
          ...item,
          category: category.label,
          categoryStart: index === 0,
          buckets: subjects.map((member) => ({
            member,
            bucket: getWorkingBucket(member, item),
          })),
        }))
      ),
    [subjects]
  );
}

/* ── V1 · Buckets: every face in its slot (the Valence pattern) ──────────── */

function BucketsChart({ items, focusIds }) {
  const ref = useRef(null);
  const focus = useMemo(() => new Set(focusIds), [focusIds]);

  useEffect(() => {
    const root = d3.select(ref.current);
    root.selectAll('*').remove();
    const width = 640;
    const radius = 10;
    const slotGap = 24;
    const hasFocus = focus.size > 0;

    items.forEach((item) => {
      const byBucket = d3.group(item.buckets, (entry) => entry.bucket);
      const maxStack = d3.max(BUCKET_ORDER, (b) => byBucket.get(b)?.length ?? 0) ?? 1;
      const stackHeight = maxStack * (radius * 2 + 4);
      const height = stackHeight + 46;
      const baseline = stackHeight + 14;

      const block = root.append('div').attr('class', 'wlab-item');
      if (item.categoryStart) {
        block.append('p').attr('class', 'wlab-cat').text(item.category);
      }
      block.append('p').attr('class', 'wlab-item-label').text(item.label);
      const svg = block
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('class', 'wlab-svg');

      const x = d3
        .scalePoint()
        .domain(BUCKET_ORDER)
        .range([70, width - 70]);

      svg
        .append('line')
        .attr('x1', 34)
        .attr('x2', width - 34)
        .attr('y1', baseline)
        .attr('y2', baseline)
        .attr('stroke', 'rgba(33,36,44,0.12)');

      BUCKET_ORDER.forEach((bucket) => {
        svg
          .append('line')
          .attr('x1', x(bucket))
          .attr('x2', x(bucket))
          .attr('y1', baseline - 3)
          .attr('y2', baseline + 3)
          .attr('stroke', 'rgba(33,36,44,0.3)');
        const stack = (byBucket.get(bucket) ?? []).slice().sort((a, b) =>
          focus.has(a.member.id) === focus.has(b.member.id)
            ? 0
            : focus.has(a.member.id)
              ? 1
              : -1
        );
        stack.forEach((entry, index) => {
          const isFocus = focus.has(entry.member.id);
          const face = drawFace(svg, entry.member, radius, {
            dim: hasFocus && !isFocus,
            ring: isFocus
              ? focusIds[0] === entry.member.id
                ? PINK
                : INK
              : null,
          });
          face.attr(
            'transform',
            `translate(${x(bucket)}, ${baseline - radius - 2 - index * (radius * 2 + 4)})`
          );
        });
      });

      poleLabel(svg, 34, baseline + 18, item.aPole, 'start');
      poleLabel(svg, width - 34, baseline + 18, item.bPole, 'end');
    });
  }, [items, focus, focusIds]);

  return <div ref={ref} className="wlab-grid wlab-grid--two" />;
}

/* ── V2 · Likert: diverging stacked bars around neutral ──────────────────── */

function LikertChart({ items }) {
  const ref = useRef(null);

  useEffect(() => {
    const svgRoot = d3.select(ref.current);
    svgRoot.selectAll('*').remove();
    const width = 680;
    const rowHeight = 30;
    const labelWidth = 128;
    const center = labelWidth + (width - labelWidth - 20) / 2;
    const perPerson = 17;

    let y = 8;
    const rows = [];
    items.forEach((item) => {
      if (item.categoryStart) {
        rows.push({ type: 'cat', label: item.category, y });
        y += 24;
      }
      rows.push({ type: 'item', item, y });
      y += rowHeight;
    });
    const height = y + 18;
    const svg = svgRoot
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'wlab-svg');

    svg
      .append('line')
      .attr('x1', center)
      .attr('x2', center)
      .attr('y1', 2)
      .attr('y2', height - 14)
      .attr('stroke', 'rgba(33,36,44,0.22)')
      .attr('stroke-dasharray', '2 3');

    rows.forEach((row) => {
      if (row.type === 'cat') {
        svg
          .append('text')
          .attr('x', 0)
          .attr('y', row.y + 14)
          .attr('class', 'wlab-cat-svg')
          .text(row.label);
        return;
      }
      const { item } = row;
      const counts = Object.fromEntries(
        BUCKET_ORDER.map((bucket) => [
          bucket,
          item.buckets.filter((entry) => entry.bucket === bucket).length,
        ])
      );
      const rowY = row.y + 4;
      const barHeight = 15;

      svg
        .append('text')
        .attr('x', 0)
        .attr('y', rowY + barHeight - 3)
        .attr('class', 'wlab-row-label')
        .text(item.label);

      // Neutral straddles the axis; strong ends grow outward.
      let leftEdge = center - (counts[5] + counts[4] + counts[3] / 2) * perPerson;
      BUCKET_ORDER.forEach((bucket) => {
        const bucketWidth = counts[bucket] * perPerson;
        if (bucketWidth > 0) {
          svg
            .append('rect')
            .attr('x', leftEdge)
            .attr('y', rowY)
            .attr('width', bucketWidth - 1.5)
            .attr('height', barHeight)
            .attr('rx', 3)
            .attr('fill', bucketColor(bucket));
          if (counts[bucket] > 0) {
            svg
              .append('text')
              .attr('x', leftEdge + bucketWidth / 2 - 0.75)
              .attr('y', rowY + barHeight / 2 + 3)
              .attr('text-anchor', 'middle')
              .attr('class', 'wlab-count')
              .attr('fill', bucket === 3 ? 'rgba(33,36,44,0.7)' : '#fff')
              .text(counts[bucket]);
          }
        }
        leftEdge += bucketWidth;
      });

      poleLabel(svg, labelWidth + 4, rowY + barHeight - 3, item.aPole, 'start');
      poleLabel(svg, width - 4, rowY + barHeight - 3, item.bPole, 'end');
    });
  }, [items]);

  return <div ref={ref} className="wlab-single" />;
}

/* ── V3 · Heatmap: the team's fingerprint, items x buckets ───────────────── */

function HeatmapChart({ items }) {
  const ref = useRef(null);

  useEffect(() => {
    const svgRoot = d3.select(ref.current);
    svgRoot.selectAll('*').remove();
    const width = 680;
    const cellWidth = 62;
    const cellHeight = 26;
    const gridLeft = 210;
    const maxCount = d3.max(items, (item) =>
      d3.max(BUCKET_ORDER, (bucket) =>
        item.buckets.filter((entry) => entry.bucket === bucket).length
      )
    );

    let y = 30;
    const rows = [];
    items.forEach((item) => {
      if (item.categoryStart) {
        rows.push({ type: 'cat', label: item.category, y });
        y += 24;
      }
      rows.push({ type: 'item', item, y });
      y += cellHeight + 5;
    });
    const height = y + 10;
    const svg = svgRoot
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'wlab-svg');

    BUCKET_ORDER.forEach((bucket, index) => {
      svg
        .append('text')
        .attr('x', gridLeft + index * (cellWidth + 4) + cellWidth / 2)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('class', 'wlab-pole')
        .text(BUCKET_LABELS[index].toUpperCase());
    });

    rows.forEach((row) => {
      if (row.type === 'cat') {
        svg
          .append('text')
          .attr('x', 0)
          .attr('y', row.y + 14)
          .attr('class', 'wlab-cat-svg')
          .text(row.label);
        return;
      }
      const { item } = row;
      svg
        .append('text')
        .attr('x', 0)
        .attr('y', row.y + cellHeight / 2 + 4)
        .attr('class', 'wlab-row-label')
        .text(item.label);
      poleLabel(
        svg,
        gridLeft - 8,
        row.y + cellHeight / 2 + 3,
        item.aPole,
        'end'
      );
      poleLabel(
        svg,
        gridLeft + 5 * (cellWidth + 4) + 6,
        row.y + cellHeight / 2 + 3,
        item.bPole,
        'start'
      );

      BUCKET_ORDER.forEach((bucket, index) => {
        const count = item.buckets.filter(
          (entry) => entry.bucket === bucket
        ).length;
        const cellX = gridLeft + index * (cellWidth + 4);
        const base = d3.color(bucketColor(bucket));
        base.opacity = count === 0 ? 0.05 : 0.2 + 0.75 * (count / maxCount);
        svg
          .append('rect')
          .attr('x', cellX)
          .attr('y', row.y)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('rx', 6)
          .attr('fill', base.formatRgb());
        if (count > 0) {
          svg
            .append('text')
            .attr('x', cellX + cellWidth / 2)
            .attr('y', row.y + cellHeight / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('class', 'wlab-count')
            .attr(
              'fill',
              count / maxCount > 0.55 && bucket !== 3
                ? '#fff'
                : 'rgba(33,36,44,0.75)'
            )
            .text(count);
        }
      });
    });
  }, [items]);

  return <div ref={ref} className="wlab-single" />;
}

/* ── V4 · Bubbles: count-sized dots, minimal ink ─────────────────────────── */

function BubblesChart({ items }) {
  const ref = useRef(null);

  useEffect(() => {
    const svgRoot = d3.select(ref.current);
    svgRoot.selectAll('*').remove();
    const width = 680;
    const rowHeight = 44;
    const gridLeft = 210;
    const gridRight = width - 92;
    const maxCount = d3.max(items, (item) =>
      d3.max(BUCKET_ORDER, (bucket) =>
        item.buckets.filter((entry) => entry.bucket === bucket).length
      )
    );
    const radius = d3.scaleSqrt().domain([0, maxCount]).range([0, 15]);

    let y = 8;
    const rows = [];
    items.forEach((item) => {
      if (item.categoryStart) {
        rows.push({ type: 'cat', label: item.category, y });
        y += 24;
      }
      rows.push({ type: 'item', item, y });
      y += rowHeight;
    });
    const height = y + 8;
    const svg = svgRoot
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'wlab-svg');

    const x = d3.scalePoint().domain(BUCKET_ORDER).range([gridLeft, gridRight]);

    rows.forEach((row) => {
      if (row.type === 'cat') {
        svg
          .append('text')
          .attr('x', 0)
          .attr('y', row.y + 14)
          .attr('class', 'wlab-cat-svg')
          .text(row.label);
        return;
      }
      const { item } = row;
      const centerY = row.y + rowHeight / 2 - 4;
      svg
        .append('text')
        .attr('x', 0)
        .attr('y', centerY + 4)
        .attr('class', 'wlab-row-label')
        .text(item.label);
      svg
        .append('line')
        .attr('x1', gridLeft - 14)
        .attr('x2', gridRight + 14)
        .attr('y1', centerY)
        .attr('y2', centerY)
        .attr('stroke', 'rgba(33,36,44,0.1)')
        .attr('stroke-dasharray', '1 4');
      poleLabel(svg, gridLeft - 22, centerY + 3, item.aPole, 'end');
      poleLabel(svg, gridRight + 22, centerY + 3, item.bPole, 'start');

      BUCKET_ORDER.forEach((bucket) => {
        const count = item.buckets.filter(
          (entry) => entry.bucket === bucket
        ).length;
        if (count === 0) {
          svg
            .append('circle')
            .attr('cx', x(bucket))
            .attr('cy', centerY)
            .attr('r', 2)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(33,36,44,0.2)');
          return;
        }
        svg
          .append('circle')
          .attr('cx', x(bucket))
          .attr('cy', centerY)
          .attr('r', radius(count))
          .attr('fill', bucketColor(bucket));
        svg
          .append('text')
          .attr('x', x(bucket))
          .attr('y', radius(count) > 8 ? centerY + 3.5 : centerY - radius(count) - 5)
          .attr('text-anchor', 'middle')
          .attr('class', 'wlab-count')
          .attr(
            'fill',
            radius(count) > 8 && bucket !== 3 ? '#fff' : 'rgba(33,36,44,0.7)'
          )
          .text(count);
      });
    });
  }, [items]);

  return <div ref={ref} className="wlab-single" />;
}

/* ── V5 · People: person x item matrix (who patterns with whom) ──────────── */

function PeopleChart({ items, subjects, focusIds }) {
  const ref = useRef(null);
  const focus = useMemo(() => new Set(focusIds), [focusIds]);

  useEffect(() => {
    const svgRoot = d3.select(ref.current);
    svgRoot.selectAll('*').remove();
    const nameWidth = 118;
    const cellWidth = 42;
    const cellHeight = 22;
    const headerHeight = 74;
    const width = nameWidth + items.length * (cellWidth + 3) + 8;

    // Sort people so similar profiles sit together (mean bucket).
    const ordered = [...subjects].sort(
      (a, b) =>
        d3.mean(items, (item) => getWorkingBucket(b, item)) -
        d3.mean(items, (item) => getWorkingBucket(a, item))
    );
    const height = headerHeight + ordered.length * (cellHeight + 4) + 6;
    const svg = svgRoot
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'wlab-svg');

    items.forEach((item, columnIndex) => {
      const x = nameWidth + columnIndex * (cellWidth + 3) + cellWidth / 2;
      svg
        .append('text')
        .attr('transform', `translate(${x}, ${headerHeight - 10}) rotate(-38)`)
        .attr('class', 'wlab-pole')
        .text(item.label.toUpperCase());
    });

    ordered.forEach((member, rowIndex) => {
      const rowY = headerHeight + rowIndex * (cellHeight + 4);
      const isFocus = focus.has(member.id);
      const face = drawFace(svg, member, 9, {
        dim: focus.size > 0 && !isFocus,
        ring: isFocus ? (focusIds[0] === member.id ? PINK : INK) : null,
      });
      face.attr('transform', `translate(12, ${rowY + cellHeight / 2})`);
      svg
        .append('text')
        .attr('x', 28)
        .attr('y', rowY + cellHeight / 2 + 3.5)
        .attr('class', 'wlab-row-label')
        .attr(
          'opacity',
          focus.size > 0 && !isFocus ? 0.45 : 1
        )
        .text(member.name.split(' ')[0]);

      items.forEach((item, columnIndex) => {
        const bucket = getWorkingBucket(member, item);
        svg
          .append('rect')
          .attr('x', nameWidth + columnIndex * (cellWidth + 3))
          .attr('y', rowY)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('rx', 5)
          .attr('fill', bucketColor(bucket))
          .attr('opacity', focus.size > 0 && !isFocus ? 0.25 : 1)
          .append('title')
          .text(`${member.name} \u00b7 ${item.label}: ${bucket >= 4 ? item.aPole : bucket <= 2 ? item.bPole : 'neutral'}`);
      });
    });
  }, [items, subjects, focus, focusIds]);

  return <div ref={ref} className="wlab-single wlab-single--scroll" />;
}

/* ── The lab shell: variant pills + legend + the active chart ────────────── */

export function WorkingStylesLab({
  subjects,
  focusIds = [],
  initialVariant = 'buckets',
  showPills = true,
}) {
  const [variant, setVariant] = useState(initialVariant);
  const items = useItems(subjects);

  return (
    <div className="wlab">
      <div className="wlab-bar">
        {showPills ? (
          <div className="wlab-pills" role="tablist" aria-label="Visualization">
            {LAB_VARIANTS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={variant === entry.id}
                className="wlab-pill"
                data-active={variant === entry.id || undefined}
                onClick={() => setVariant(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="wlab-legend" aria-hidden="true">
          <i style={{ background: bucketColor(5) }} />
          <span>first pole</span>
          <i style={{ background: bucketColor(3) }} />
          <span>neutral</span>
          <i style={{ background: bucketColor(1) }} />
          <span>second pole</span>
        </div>
      </div>
      {variant === 'buckets' ? (
        <BucketsChart items={items} focusIds={focusIds} />
      ) : null}
      {variant === 'likert' ? <LikertChart items={items} /> : null}
      {variant === 'heatmap' ? <HeatmapChart items={items} /> : null}
      {variant === 'bubbles' ? <BubblesChart items={items} /> : null}
      {variant === 'people' ? (
        <PeopleChart items={items} subjects={subjects} focusIds={focusIds} />
      ) : null}
    </div>
  );
}
