import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

export function InsightPanel({ insight, isHidden, selectionCount }) {
  const scrollRef = useRef(null);
  const previousSelectionCount = useRef(selectionCount);
  const activeFrameRef = useRef(0);
  const [activeSnapIndex, setActiveSnapIndex] = useState(0);
  const isReturningToSolo =
    previousSelectionCount.current === 2 && selectionCount === 1;
  const isBaselineReveal = insight.id === 'team' || isReturningToSolo;

  const updateActiveSnapIndex = useCallback(() => {
    const scrollNode = scrollRef.current;
    if (!scrollNode) return;

    const snapSections = Array.from(
      scrollNode.querySelectorAll('.insight-snap-section')
    );
    if (snapSections.length === 0) return;

    const scrollRect = scrollNode.getBoundingClientRect();
    const activationY = scrollRect.top + scrollRect.height * 0.38;
    const closest = snapSections.reduce(
      (current, section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionFocusY = rect.top + rect.height / 2;
        const distance = Math.abs(sectionFocusY - activationY);

        return distance < current.distance ? { index, distance } : current;
      },
      { index: 0, distance: Infinity }
    );

    setActiveSnapIndex((current) =>
      current === closest.index ? current : closest.index
    );
  }, []);

  const handleInsightScroll = useCallback(() => {
    window.cancelAnimationFrame(activeFrameRef.current);
    activeFrameRef.current = window.requestAnimationFrame(updateActiveSnapIndex);
  }, [updateActiveSnapIndex]);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setActiveSnapIndex(0);
    window.cancelAnimationFrame(activeFrameRef.current);
    activeFrameRef.current = window.requestAnimationFrame(updateActiveSnapIndex);
  }, [insight.id, updateActiveSnapIndex]);

  useEffect(() => {
    previousSelectionCount.current = selectionCount;
  }, [selectionCount]);

  useEffect(
    () => () => {
      window.cancelAnimationFrame(activeFrameRef.current);
    },
    []
  );

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
          {/* Monolith integration tip: this mirrors the Human Session lobby
              pattern where the scroll container owns vertical snap and each
              readable card/blurb opts in as a snap point. */}
          <div
            className="team-dna-insight-scroll"
            ref={scrollRef}
            onScroll={handleInsightScroll}
          >
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
                  activeSnapIndex={activeSnapIndex}
                />
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InsightPage({ insight, isBaselineReveal, activeSnapIndex }) {
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
        <InsightPageContent
          insight={insight}
          activeSnapIndex={activeSnapIndex}
        />
      ) : (
        <>
          <section
            className="insight-primary-read insight-snap-section"
            data-snap-active={activeSnapIndex === 0 || undefined}
          >
            <motion.div
              {...getPageSectionMotion(0)}
              className="insight-heading-group"
            >
              <InsightHeading insight={insight} />
            </motion.div>
            <motion.div {...getPageSectionMotion(0.3)}>
              <InsightSummary insight={insight} />
            </motion.div>
          </section>
          <motion.div {...getPageSectionMotion(0.58)}>
            <InsightBlocks insight={insight} activeSnapIndex={activeSnapIndex} />
          </motion.div>
        </>
      )}
    </motion.article>
  );
}

function InsightPageContent({ insight, activeSnapIndex }) {
  return (
    <>
      <section
        className="insight-primary-read insight-snap-section"
        data-snap-active={activeSnapIndex === 0 || undefined}
      >
        <div className="insight-heading-group">
          <InsightHeading insight={insight} />
        </div>
        <InsightSummary insight={insight} />
      </section>
      <InsightBlocks insight={insight} activeSnapIndex={activeSnapIndex} />
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

function InsightBlocks({ insight, activeSnapIndex }) {
  return (
    <div className="info-block-stack" aria-label="Future insight blocks">
      {insight.cards.map((card, index) => (
        <InfoBlock
          key={card.id}
          label={card.label}
          className="insight-snap-section"
          isActive={activeSnapIndex === index + 1}
        />
      ))}
    </div>
  );
}
