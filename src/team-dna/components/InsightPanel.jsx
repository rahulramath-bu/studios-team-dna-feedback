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
 * data is insufficient; `pending` shows a small unframed generating cue;
 * `failed` quietly falls back; `ready` uses generated copy; team `stale` keeps
 * old generated copy visible. `canManageTeam` gates manager-only refresh and
 * generate-anyway affordances.
 * Port: this can be swapped back to a contained scroll panel if monolith needs
 * that shell behavior, but keep the selected-read transition owned by Team DNA.
 */
export function InsightPanel({
  insight,
  isHidden,
  preserveScroll = false,
  canManageTeam = true,
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
                  canManageTeam={canManageTeam}
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

function InsightPage({
  insight,
  canManageTeam,
  onSelectMember,
  onLifecycleAction,
}) {
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
        canManageTeam={canManageTeam}
        onSelectMember={onSelectMember}
        onLifecycleAction={onLifecycleAction}
      />
    </motion.article>
  );
}

function InsightPageContent({
  insight,
  canManageTeam,
  onSelectMember,
  onLifecycleAction,
}) {
  const lifecycle = insight.generationLifecycle;
  const isHardNotReady =
    lifecycle?.status === 'not_ready' && !lifecycle?.target?.canGenerateTeam;

  return (
    <>
      <InsightLifecycleStatus
        lifecycle={lifecycle}
        canManageTeam={canManageTeam}
        onLifecycleAction={onLifecycleAction}
      />
      {isHardNotReady ? (
        <InsightWaitingState
          lifecycle={lifecycle}
          onLifecycleAction={onLifecycleAction}
        />
      ) : null}
      {isHardNotReady ? null : (
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

function getLifecycleCopy(lifecycle, canManageTeam) {
  const status = lifecycle?.status;
  const target = lifecycle?.target;

  if (status === 'pending') {
    return {
      tone: 'working',
      label: 'AI insights generating',
    };
  }

  if (status === 'stale') {
    if (!canManageTeam) return null;
    if (target?.scope !== 'team') return null;

    return {
      tone: 'notice',
      text: 'New assessment data is available for this team summary.',
      actionLabel: 'Refresh',
      actionType: 'teamDnaTeamInsightRefreshRequested',
    };
  }

  if (status === 'not_ready' && target?.canGenerateTeam) {
    if (!canManageTeam) return null;

    return {
      tone: 'notice',
      text: `${target.completedCount} of ${target.totalCount} responses are in. Waiting for everyone is recommended, but you can move forward with what you have.`,
      actionLabel: 'Generate anyway',
      actionType: 'teamDnaInsightGenerationRequested',
    };
  }

  if (status === 'not_ready') return null;

  return null;
}

function getWaitingStateCopy(target) {
  if (!target) {
    return {
      eyebrow: 'More responses needed',
      title: 'Almost there',
      text: 'This summary will appear after the needed assessments are complete.',
    };
  }

  if (target?.scope === 'person') {
    return {
      eyebrow: 'Assessment needed',
      title: 'Not ready yet',
      text: 'This profile will appear after this person completes their assessment.',
    };
  }

  if (target?.scope === 'duo') {
    return {
      eyebrow: 'Assessment needed',
      title: 'Not ready yet',
      text: 'This comparison will appear after both people complete their assessments.',
    };
  }

  if (target.completedCount < target.minimumCompletedCount) {
    return {
      eyebrow: 'More responses needed',
      title: 'Almost there',
      text: `${target.completedCount} of ${target.totalCount} assessments are complete. Team summaries need at least ${target.minimumCompletedCount} responses.`,
    };
  }

  if (target.completedCount === target.totalCount) {
    return {
      eyebrow: 'Ready',
      title: 'Ready to generate',
      text: 'Everyone has completed their assessment. You can generate the team summary now.',
      actionLabel: 'Generate now',
    };
  }

  return {
    eyebrow: 'Enough to start',
    title: 'Ready when you are',
    text: `${target.completedCount} of ${target.totalCount} assessments are complete. You can wait for everyone, or generate a first team summary now.`,
    actionLabel: 'Generate anyway',
  };
}

function InsightLifecycleStatus({
  lifecycle,
  canManageTeam,
  onLifecycleAction,
}) {
  const copy = getLifecycleCopy(lifecycle, canManageTeam);

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
        {copy.label ? <span>{copy.label}</span> : null}
        {copy.text ? <p>{copy.text}</p> : null}
      </div>
      {copy.actionLabel && (
        <button type="button" onClick={handleAction}>
          {copy.actionLabel}
        </button>
      )}
    </div>
  );
}

function InsightWaitingState({ lifecycle, onLifecycleAction }) {
  const target = lifecycle?.target;
  const canGenerateTeam = target?.scope === 'team' && target.canGenerateTeam;
  const copy = getWaitingStateCopy(target);

  const handleGenerate = () => {
    if (!canGenerateTeam) return;

    onLifecycleAction?.({
      type: 'teamDnaInsightGenerationRequested',
      target,
      status: lifecycle.status,
    });
  };

  return (
    <section className="insight-waiting-state" aria-label="Assessment waiting state">
      <p className="insight-waiting-kicker">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p>{copy.text}</p>
      {canGenerateTeam ? (
        <button
          className="insight-waiting-action"
          type="button"
          onClick={handleGenerate}
        >
          {copy.actionLabel ?? 'Generate now'}
        </button>
      ) : null}
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
