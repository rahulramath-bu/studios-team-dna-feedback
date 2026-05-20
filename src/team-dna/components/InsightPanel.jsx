import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { InfoBlock } from './InfoBlock.jsx';

const PAGE_EASE = [0.22, 1, 0.36, 1];
const BASELINE_REVEAL_TRANSITION = {
  duration: 1.35,
  ease: PAGE_EASE,
};

/**
 * Right-side insight read.
 *
 * What: renders the current team/person/duo narrative plus supporting card
 * slots inside a self-contained scrollable panel.
 * How: keys each selected insight as a local read state, preserves scroll
 * depth across person/duo comparisons, and uses one calm whole-page fade for
 * every read transition.
 * Port: keep internal scroll, fades, and read transitions inside Team DNA. The
 * monolith shell should provide available height, not become the scroll
 * container for these sections.
 */
export function InsightPanel({ insight, isHidden }) {
  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          className="team-dna-insight-pane"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.48, ease: PAGE_EASE }}
        >
          <div className="team-dna-scroll-fade top" aria-hidden="true" />
          <div className="team-dna-scroll-fade bottom" aria-hidden="true" />
          <div className="team-dna-insight-scroll">
            <div className="team-dna-insight-content">
              <AnimatePresence mode="wait">
                {/* Monolith integration seam: the selected insight is keyed as a
                    local read state. The route should swap data; this panel owns
                    the narrative transition between team/person/duo reads. */}
                <InsightPage
                  key={insight.id}
                  insight={insight}
                />
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InsightPage({ insight }) {
  return (
    <motion.article
      className="team-dna-insight-page"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: {
          duration: BASELINE_REVEAL_TRANSITION.duration,
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
      <InsightPageContent
        insight={insight}
      />
    </motion.article>
  );
}

function InsightPageContent({ insight }) {
  return (
    <>
      <section className="insight-primary-read">
        <div className="insight-heading-group">
          <InsightHeading insight={insight} />
        </div>
        <InsightSummary insight={insight} />
      </section>
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
        <InfoBlock
          key={card.id}
          card={card}
        />
      ))}
    </div>
  );
}
