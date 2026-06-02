import React from 'react';

const GUIDANCE_MARQUEE_PIXELS_PER_SECOND = 38;
const GUIDANCE_MARQUEE_MANUAL_PAUSE_MS = 3500;

/**
 * Guidance card.
 *
 * What: renders synthesized guidance that can come from deterministic fallback,
 * backend-authored copy, or future AI output with the same shape.
 * How: the shared InfoBlock label owns the card headline ("How to work with
 * him", "Where they shine", etc.). Multi-section guidance renders as short
 * horizontal note cards.
 * Port: keep this renderer generic. AI-generated guidance should be mapped into
 * `guidance.sections`; the component should not know who authored the text.
 */
export function GuidanceCard({ guidance }) {
  const scrollRef = React.useRef(null);
  const pauseUntilRef = React.useRef(0);
  const sections = guidance?.sections?.length
    ? guidance.sections
    : guidance?.body
      ? [{ body: guidance.body }]
      : [];
  // A single section that carries a `bullets` array renders as a quiet list
  // rather than the multi-section marquee. `layout: 'stacked'` opts a
  // multi-section card out of the marquee so it renders as labeled groups
  // (e.g. collaboration tips + discussion questions).
  const isStacked = guidance?.layout === 'stacked';
  const isCarousel = sections.length > 1 && !isStacked;

  React.useEffect(() => {
    if (!isCarousel || !scrollRef.current) {
      return undefined;
    }

    const carousel = scrollRef.current;
    let frameId;
    let previousTime = performance.now();
    let virtualScrollLeft = carousel.scrollLeft;

    const tick = (currentTime) => {
      const elapsed = currentTime - previousTime;
      previousTime = currentTime;

      if (currentTime >= pauseUntilRef.current) {
        const firstCard = carousel.querySelector('.guidance-section');
        const loopStart = carousel.querySelector('[data-guidance-loop-start]');
        const loopWidth = loopStart && firstCard
          ? loopStart.offsetLeft - firstCard.offsetLeft
          : carousel.scrollWidth / 2;

        virtualScrollLeft +=
          (elapsed / 1000) * GUIDANCE_MARQUEE_PIXELS_PER_SECOND;

        if (loopWidth > 0 && virtualScrollLeft >= loopWidth) {
          virtualScrollLeft -= loopWidth;
        }

        carousel.scrollLeft = virtualScrollLeft;
      } else {
        virtualScrollLeft = carousel.scrollLeft;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [isCarousel, sections.length]);

  const pauseMarquee = React.useCallback(() => {
    pauseUntilRef.current =
      performance.now() + GUIDANCE_MARQUEE_MANUAL_PAUSE_MS;
  }, []);

  const renderSection = (section, index, isClone = false) => (
    <section
      aria-hidden={isClone || undefined}
      className="guidance-section"
      data-guidance-loop-start={isClone && index === 0 ? true : undefined}
      key={`${section.label ?? 'guidance'}-${isClone ? 'clone' : 'card'}-${index}`}
    >
      {!isCarousel && section.label && (
        <p className="guidance-section-label">{section.label}</p>
      )}
      {section.bullets?.length ? (
        <ul className="guidance-section-bullets">
          {section.bullets.map((bullet, bulletIndex) => (
            <li key={bulletIndex}>{bullet}</li>
          ))}
        </ul>
      ) : (
        <p className="guidance-section-body">{section.body}</p>
      )}
    </section>
  );

  const discussion = guidance?.discussion;

  if (sections.length === 0 && !discussion) {
    return null;
  }

  return (
    <>
      {sections.length > 0 ? (
        <div
          className={[
            'guidance-card',
            isCarousel ? 'guidance-card--carousel' : '',
          ].filter(Boolean).join(' ')}
          onPointerDown={isCarousel ? pauseMarquee : undefined}
          onWheel={isCarousel ? pauseMarquee : undefined}
          ref={isCarousel ? scrollRef : null}
        >
          {sections.map((section, index) => renderSection(section, index))}
          {isCarousel &&
            sections.map((section, index) => renderSection(section, index, true))}
        </div>
      ) : null}
      {discussion ? (
        <div className="guidance-discussion">
          {discussion.label ? (
            <p className="guidance-discussion-label">{discussion.label}</p>
          ) : null}
          {discussion.bullets?.length ? (
            <ul className="guidance-section-bullets">
              {discussion.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
