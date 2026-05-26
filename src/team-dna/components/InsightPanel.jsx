import React, { useRef } from 'react';
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
 * slots inside the right-side reading column.
 * How: keys each selected insight as a local read state, resets scroll by
 * default when the read changes, and uses one calm whole-page fade for each
 * transition. Lifecycle state controls the read: `not_ready` blocks when source
 * data is insufficient; `pending` shows a small generating strip over fallback;
 * `failed` quietly falls back; `ready` uses generated copy; team `stale` keeps
 * old generated copy visible with a refresh affordance.
 * Port: this can be swapped back to a contained scroll panel if monolith needs
 * that shell behavior, but keep the selected-read transition owned by Team DNA.
 */
export function InsightPanel({
  insight,
  isHidden,
  preserveScroll = false,
  onSelectMember,
  onLifecycleAction,
}) {
  const scrollRef = useRef(null);
  const resetScrollAfterExit = () => {
    if (preserveScroll) return;

    document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

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
          <div className="team-dna-insight-scroll" ref={scrollRef}>
            <div className="team-dna-insight-content">
              <AnimatePresence mode="wait" onExitComplete={resetScrollAfterExit}>
                {/* Monolith integration seam: the selected insight is keyed as a
                    local read state. The route should swap data; this panel owns
                    the narrative transition between team/person/duo reads. */}
                <InsightPage
                  key={insight.id}
                  insight={insight}
                  onSelectMember={onSelectMember}
                  onLifecycleAction={onLifecycleAction}
                />
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InsightPage({ insight, onSelectMember, onLifecycleAction }) {
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
        onSelectMember={onSelectMember}
        onLifecycleAction={onLifecycleAction}
      />
    </motion.article>
  );
}

function InsightPageContent({ insight, onSelectMember, onLifecycleAction }) {
  const lifecycle = insight.generationLifecycle;
  const isNotReady = lifecycle?.status === 'not_ready';

  return (
    <>
      <InsightLifecycleStatus
        lifecycle={lifecycle}
        onLifecycleAction={onLifecycleAction}
      />
      {isNotReady ? <InsightWaitingState lifecycle={lifecycle} /> : null}
      {isNotReady ? null : (
        <>
          <section className="insight-primary-read">
            <div className="insight-heading-group">
              <InsightHeading insight={insight} />
            </div>
            <InsightSummary insight={insight} />
          </section>
          <InsightBlocks insight={insight} onSelectMember={onSelectMember} />
        </>
      )}
    </>
  );
}

function getLifecycleCopy(lifecycle) {
  const status = lifecycle?.status;
  const target = lifecycle?.target;

  if (status === 'pending') {
    return {
      tone: 'working',
      label: 'AI insights generating',
      text: 'Showing the basic read for now.',
    };
  }

  if (status === 'stale') {
    if (target?.scope !== 'team') return null;

    return {
      tone: 'notice',
      label: 'Refresh available',
      text: 'New assessment data is available for this team read.',
      actionLabel: 'Refresh',
      actionType: 'teamDnaTeamInsightRefreshRequested',
    };
  }

  if (status === 'not_ready') {
    return {
      tone: 'quiet',
      label: 'Waiting',
      text: getNotReadyText(target),
      actionLabel: target?.canGenerateTeam ? 'Generate now' : undefined,
      actionType: target?.canGenerateTeam
        ? 'teamDnaInsightGenerationRequested'
        : undefined,
    };
  }

  return null;
}

function getNotReadyText(target) {
  if (target?.scope !== 'team') {
    return 'This read appears when the needed assessments are complete.';
  }

  if (target.completedCount < target.minimumCompletedCount) {
    return `${target.completedCount} of ${target.totalCount} assessments complete. Team insights need at least ${target.minimumCompletedCount} completed assessments.`;
  }

  if (target.completedCount === target.totalCount) {
    return `${target.completedCount} of ${target.totalCount} assessments complete. Generate now to create team insights.`;
  }

  return `${target.completedCount} of ${target.totalCount} assessments complete. Team insights will be ready when everyone finishes, or you can generate with current responses.`;
}

function InsightLifecycleStatus({ lifecycle, onLifecycleAction }) {
  const copy = getLifecycleCopy(lifecycle);

  if (!copy) return null;

  const handleAction = () => {
    if (!copy.actionType) return;
    onLifecycleAction?.({
      type: copy.actionType,
      target: lifecycle.target,
      status: lifecycle.status,
    });
  };

  return (
    <div
      className="insight-lifecycle-status"
      data-tone={copy.tone}
      role="status"
    >
      <div>
        <span>{copy.label}</span>
        <p>{copy.text}</p>
      </div>
      {copy.actionLabel && (
        <button type="button" onClick={handleAction}>
          {copy.actionLabel}
        </button>
      )}
    </div>
  );
}

function InsightWaitingState({ lifecycle }) {
  const target = lifecycle?.target;

  return (
    <section className="insight-waiting-state" aria-label="Insight waiting state">
      <p className="insight-waiting-kicker">Team DNA is still collecting signal.</p>
      <h2>Waiting on assessments</h2>
      <p>
        {getNotReadyText(target)} The basic roster can still be managed, but the
        team read should not pretend to know the team before there is enough
        completed assessment data.
      </p>
    </section>
  );
}

function InsightHeading({ insight }) {
  return (
    <div className="insight-title-row">
      <h1 className="insight-title" id={`insight-title-${insight.id}`}>
        {insight.title}
      </h1>
    </div>
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

function InsightBlocks({ insight, onSelectMember }) {
  return (
    <div className="info-block-stack" aria-label="Future insight blocks">
      {insight.cards.map((card) => (
        <InfoBlock
          key={card.id}
          card={card}
          onSelectMember={onSelectMember}
        />
      ))}
    </div>
  );
}
