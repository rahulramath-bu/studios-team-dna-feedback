import React from 'react';

/**
 * Plain-language watch-out card.
 *
 * What: shows one simple caution generated from the current team/person/duo
 * scores.
 * How: receives already-written copy from the adapter so this component stays
 * focused on layout, not Big Five rules.
 * Port: backend-approved watch-out copy can replace deterministic copy without
 * changing this component's props.
 */
export function WatchOutCard({ watchOut }) {
  if (!watchOut) {
    return null;
  }

  const items = watchOut.items ?? [watchOut];

  return (
    <div className="watch-out-card">
      {items.map((item) => (
        <section className="watch-out-item" key={`${item.traitKey}-${item.type}`}>
          <p className="guidance-section-label">{item.title}</p>
          <p className="guidance-section-body">
            {item.body}
            {item.tip ? ` So ${item.tip}` : ''}
          </p>
        </section>
      ))}
    </div>
  );
}
