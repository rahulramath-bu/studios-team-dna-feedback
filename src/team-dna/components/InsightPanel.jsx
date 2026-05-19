import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { InfoBlock } from './InfoBlock.jsx';

const PAGE_EASE = [0.22, 1, 0.36, 1];
const SECTION_REVEAL_EASE = [0.4, 0, 0.2, 1];
const PAGE_SECTION_TRANSITION = {
  duration: 0.75,
  ease: SECTION_REVEAL_EASE,
};
const BASELINE_REVEAL_TRANSITION = {
  duration: 1.35,
  ease: PAGE_EASE,
};

function getPageSectionMotion(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        ...PAGE_SECTION_TRANSITION,
        delay,
      },
    },
  };
}

export function InsightPanel({ insight, selectionCount }) {
  const scrollRef = useRef(null);
  const previousSelectionCount = useRef(selectionCount);
  const isReturningToSolo = previousSelectionCount.current === 2 && selectionCount === 1;
  const isBaselineReveal = insight.id === 'team' || isReturningToSolo;

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [insight.id]);

  useEffect(() => {
    previousSelectionCount.current = selectionCount;
  }, [selectionCount]);

  return (
    <div className="team-dna-insight-pane">
      <div className="team-dna-scroll-fade top" aria-hidden="true" />
      <div className="team-dna-scroll-fade bottom" aria-hidden="true" />
      <div className="team-dna-insight-scroll" ref={scrollRef}>
        <div className="team-dna-insight-content">
          <AnimatePresence mode="wait">
            {/* Monolith integration tip: the whole right-side read is keyed as
                one local "page" so the blurb and supporting block slots move
                together. The components are reusable; the selected insight
                gets its own mounted instance for clearer narrative motion. */}
            <InsightPage
              key={insight.id}
              insight={insight}
              isBaselineReveal={isBaselineReveal}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InsightPage({ insight, isBaselineReveal }) {
  const isTeamInsight = insight.id === 'team';
  const shouldUseWholePageReveal = isTeamInsight || isBaselineReveal;

  return (
    <motion.article
      className="team-dna-insight-page"
      initial={{ opacity: shouldUseWholePageReveal ? 0 : 1 }}
      animate={{
        opacity: 1,
        transition: {
          duration: shouldUseWholePageReveal
            ? BASELINE_REVEAL_TRANSITION.duration
            : 0.45,
          ease: PAGE_EASE,
        },
      }}
      exit={{
        opacity: 0,
        y: -8,
        transition: { duration: 0.45, ease: PAGE_EASE },
      }}
      aria-labelledby={`insight-title-${insight.id}`}
    >
      {shouldUseWholePageReveal ? (
        <InsightPageContent insight={insight} />
      ) : (
        <>
          <motion.div
            {...getPageSectionMotion(0)}
            className="insight-heading-group"
          >
            <InsightHeading insight={insight} />
          </motion.div>
          <motion.div {...getPageSectionMotion(0.3)}>
            <InsightSummary insight={insight} />
          </motion.div>
          <motion.div {...getPageSectionMotion(0.58)}>
            <InsightBlocks insight={insight} />
          </motion.div>
        </>
      )}
    </motion.article>
  );
}

function InsightPageContent({ insight }) {
  return (
    <>
      <div className="insight-heading-group">
        <InsightHeading insight={insight} />
      </div>
      <InsightSummary insight={insight} />
      <InsightBlocks insight={insight} />
    </>
  );
}

function InsightHeading({ insight }) {
  return (
    <>
      <div className="insight-eyebrow">{insight.eyebrow}</div>
      <div className="insight-title-row">
        <h1 className="insight-title" id={`insight-title-${insight.id}`}>
          {insight.title}
        </h1>
        {insight.isEditable && (
          <button
            type="button"
            className="insight-edit-button"
            aria-label={`Edit ${insight.title}`}
          >
            <BetterUpIcon name="Edit" size={22} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </>
  );
}

function InsightSummary({ insight }) {
  return (
    <p className="insight-summary">
      {insight.summary.map((segment, index) => (
        <React.Fragment key={`${insight.id}-${index}`}>
          {segment.emphasis ? <strong>{segment.text}</strong> : segment.text}
        </React.Fragment>
      ))}
    </p>
  );
}

function InsightBlocks({ insight }) {
  return (
    <div className="info-block-stack" aria-label="Future insight blocks">
      {insight.cards.map((card) => (
        <InfoBlock key={card.id} label={card.label} />
      ))}
    </div>
  );
}
