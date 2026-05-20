import React from 'react';

/**
 * Guidance card.
 *
 * What: renders synthesized guidance that can come from deterministic fallback,
 * backend-authored copy, or future AI output with the same shape.
 * How: the shared InfoBlock label owns the card headline ("How to work with
 * him", "Where they shine", etc.). Optional section labels use the small mono
 * treatment inside the card body.
 * Port: keep this renderer generic. AI-generated guidance should be mapped into
 * `guidance.sections`; the component should not know who authored the text.
 */
export function GuidanceCard({ guidance }) {
  const sections = guidance?.sections?.length
    ? guidance.sections
    : guidance?.body
      ? [{ body: guidance.body }]
      : [];

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="guidance-card">
      {sections.map((section, index) => (
        <section className="guidance-section" key={`${section.label ?? 'guidance'}-${index}`}>
          {section.label && <p className="guidance-section-label">{section.label}</p>}
          <p className="guidance-section-body">{section.body}</p>
        </section>
      ))}
    </div>
  );
}
