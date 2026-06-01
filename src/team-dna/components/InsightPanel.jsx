import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { InfoBlock } from './InfoBlock.jsx';
import { BetterUpIcon } from './BetterUpIcon.jsx';

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
 * Inline profile edits should use component-library `Textarea` and `Button`
 * (`variant="default"` for save, `variant="text"` or `tertiary` for cancel).
 * The main-card edit affordance can map to `CircularIconButton` because it sits
 * over imagery; supporting-card edit affordances can stay quiet icon buttons.
 */
export function InsightPanel({
  insight,
  isHidden,
  preserveScroll = false,
  resetScrollTop = 0,
  revealMode = 'standard',
  canManageTeam = true,
  currentViewerMemberId,
  members = [],
  teamName,
  onSelectMember,
  onLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
}) {
  const scrollRef = useRef(null);
  const resetScrollAfterExit = () => {
    if (preserveScroll) return;

    document.scrollingElement?.scrollTo({
      top: resetScrollTop,
      left: 0,
      behavior: 'instant',
    });
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
                  currentViewerMemberId={currentViewerMemberId}
                  members={members}
                  teamName={teamName}
                  onSelectMember={onSelectMember}
                  onLifecycleAction={onLifecycleAction}
                  onProfileCopySave={onProfileCopySave}
                  onStartAssessment={onStartAssessment}
                  revealMode={revealMode}
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
  currentViewerMemberId,
  members,
  teamName,
  onSelectMember,
  onLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
  revealMode,
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
      currentViewerMemberId={currentViewerMemberId}
      members={members}
      teamName={teamName}
      onSelectMember={onSelectMember}
      onLifecycleAction={onLifecycleAction}
      onProfileCopySave={onProfileCopySave}
      onStartAssessment={onStartAssessment}
      revealMode={revealMode}
    />
    </motion.article>
  );
}

function InsightPageContent({
  insight,
  canManageTeam,
  currentViewerMemberId,
  members,
  teamName,
  onSelectMember,
  onLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
  revealMode,
}) {
  const lifecycle = insight.generationLifecycle;
  const editableMemberId =
    lifecycle?.target?.scope === 'person'
      ? lifecycle.target.memberIds?.[0]
      : null;
  const canEditOwnProfile =
    !canManageTeam &&
    editableMemberId &&
    editableMemberId === currentViewerMemberId;
  const imageCard = insight.cards.find((card) => card.kind === 'archetypeImage');
  const supportingCards = orderSupportingCards(
    insight.cards.filter((card) => card.kind !== 'archetypeImage')
  );
  const [editingTarget, setEditingTarget] = React.useState(null);
  React.useEffect(() => {
    setEditingTarget(null);
  }, [insight.id]);
  const saveProfileCopyPatch = (patch) => {
    const currentDraft = getProfileCopyDraft(insight);

    onProfileCopySave?.({
      memberId: editableMemberId,
      ...currentDraft,
      ...patch,
    });
    setEditingTarget(null);
  };
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
          members={members}
          currentViewerMemberId={currentViewerMemberId}
          teamName={teamName}
          onLifecycleAction={onLifecycleAction}
          onStartAssessment={onStartAssessment}
        />
      ) : null}
      {isHardNotReady ? null : (
        <>
          {revealMode === 'selfReview' ? (
            <motion.p
              className="insight-self-review-line"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: PAGE_EASE }}
            >
              You are the...
            </motion.p>
          ) : null}
          <motion.section
            className={[
              'insight-primary-read',
              imageCard ? 'insight-primary-read--with-image' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            initial={
              revealMode === 'selfReview'
                ? { opacity: 0, y: 28 }
                : undefined
            }
            animate={
              revealMode === 'selfReview'
                ? { opacity: 1, y: 0 }
                : undefined
            }
            transition={
              revealMode === 'selfReview'
                ? { duration: 1.15, delay: 0.22, ease: PAGE_EASE }
                : undefined
            }
          >
            {imageCard ? (
              <InfoBlock
                card={imageCard}
                onSelectMember={onSelectMember}
              />
            ) : null}
            <div className="insight-primary-copy">
              <div className="insight-heading-group">
                <InsightHeading insight={insight} />
              </div>
              {editingTarget === 'overview' ? (
                <InlineTextEditor
                  ariaLabel="Edit main overview"
                  value={getSummaryText(insight)}
                  onCancel={() => setEditingTarget(null)}
                  onSave={(overview) => saveProfileCopyPatch({ overview })}
                />
              ) : (
                <InsightSummary insight={insight} />
              )}
            </div>
            {canEditOwnProfile ? (
              editingTarget ? null : (
                <button
                  className="profile-copy-edit-trigger"
                  type="button"
                  aria-label="Edit your profile copy"
                  onClick={() => setEditingTarget('overview')}
                >
                  <BetterUpIcon name="Edit" size={18} strokeWidth={1.8} />
                </button>
              )
            ) : null}
          </motion.section>
          <InsightBlocks
            cards={
              canEditOwnProfile
                ? getSelfProfileCardLabels(supportingCards)
                : supportingCards
            }
            canEditOwnProfile={canEditOwnProfile}
            editingTarget={editingTarget}
            onCancelEdit={() => setEditingTarget(null)}
            onEditTarget={setEditingTarget}
            onSaveProfileCopyPatch={saveProfileCopyPatch}
            onSelectMember={onSelectMember}
            revealMode={revealMode}
          />
        </>
      )}
    </>
  );
}

function orderSupportingCards(cards) {
  const getCardOrder = (card) => {
    if (card.kind === 'teamShapeContributions') return 10;
    if (card.kind === 'guidance' && card.id.endsWith('-where-shines')) return 20;
    if (card.kind === 'guidance' && card.id.endsWith('-work-with')) return 30;
    if (card.kind === 'guidance' && card.id.endsWith('-pairing-manual')) return 30;
    if (card.kind === 'meetingBehavior') return 35;
    if (card.kind === 'watchOut') return 40;
    if (card.kind === 'bigFiveSpectrumList') return 90;
    return 50;
  };

  return [...cards].sort((first, second) => getCardOrder(first) - getCardOrder(second));
}

function getSelfProfileCardLabels(cards) {
  return cards.map((card) => {
    if (card.kind !== 'guidance') {
      return card;
    }

    if (card.id.endsWith('-work-with')) {
      return {
        ...card,
        label: 'How to work with me',
      };
    }

    if (card.id.endsWith('-where-shines')) {
      return {
        ...card,
        label: 'Strengths',
      };
    }

    return card;
  });
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

function InsightWaitingState({
  lifecycle,
  members = [],
  currentViewerMemberId,
  teamName,
  onLifecycleAction,
  onStartAssessment,
}) {
  const target = lifecycle?.target;
  const canGenerateTeam = target?.scope === 'team' && target.canGenerateTeam;
  const copy = getWaitingStateCopy(target);
  const viewer = members.find((member) => member.id === currentViewerMemberId);
  const viewerNeedsAssessment = viewer && viewer.assessmentComplete === false;
  const completed = target?.completedCount ?? 0;
  const total = target?.totalCount ?? 0;
  const minimum = target?.minimumCompletedCount ?? 0;
  // Count teammates other than the viewer so the "lots of people are pending"
  // context can show alongside the viewer's own "Your turn" call to action,
  // instead of the two being mutually exclusive.
  const otherPendingCount = members.filter(
    (member) =>
      member.assessmentComplete === false && member.id !== currentViewerMemberId
  ).length;
  const progressPct =
    total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const isTeamScope = target?.scope === 'team';
  const tagLabel = isTeamScope
    ? `${completed} of ${total} assessments`
    : copy.eyebrow;
  const headerLabel = isTeamScope ? teamName || copy.eyebrow : copy.eyebrow;

  const handleGenerate = () => {
    if (!canGenerateTeam) return;

    onLifecycleAction?.({
      type: 'teamDnaInsightGenerationRequested',
      target,
      status: lifecycle.status,
    });
  };

  return (
    <section
      className="insight-waiting-state"
      data-scope={target?.scope ?? 'team'}
      aria-label="Assessment waiting state"
    >
      <header className="insight-waiting-header">
        <div className="insight-waiting-header-text">
          <span className="insight-waiting-eyebrow">{headerLabel}</span>
          <h2>{copy.title}</h2>
        </div>
        <span className="insight-waiting-tag" data-tone="waiting">
          {tagLabel}
        </span>
      </header>

      <p className="insight-waiting-body">{copy.text}</p>

      {isTeamScope && total > 0 ? (
        <div className="insight-waiting-progress" aria-hidden="true">
          <div className="insight-waiting-progress-track">
            <div
              className="insight-waiting-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="insight-waiting-progress-meta">
            <span>Unlocks at {minimum}/{total}</span>
            <span>{completed}/{total} done</span>
          </div>
        </div>
      ) : null}

      {viewerNeedsAssessment ? (
        <div className="insight-waiting-callout">
          <div className="insight-waiting-callout-text">
            <span className="insight-waiting-callout-eyebrow">Your turn</span>
            <p>
              You have not shared your DNA yet. Your read is the missing piece
              for {teamName ? <strong>{teamName}</strong> : 'this team'}.
            </p>
          </div>
          <button
            className="bu-button bu-button--primary"
            type="button"
            onClick={() => onStartAssessment?.()}
          >
            Start your assessment
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      ) : null}

      <div className="insight-waiting-footer">
        {otherPendingCount > 0 && isTeamScope ? (
          <span className="insight-waiting-footer-note">
            {viewerNeedsAssessment ? 'And waiting on ' : 'Waiting on '}
            <strong>
              {otherPendingCount}{' '}
              {viewerNeedsAssessment ? 'other ' : ''}
              {otherPendingCount === 1 ? 'teammate' : 'teammates'}
            </strong>{' '}
            to finish.
          </span>
        ) : null}
        {canGenerateTeam ? (
          <button
            className="bu-button bu-button--secondary"
            type="button"
            onClick={handleGenerate}
          >
            {copy.actionLabel ?? 'Generate now'}
          </button>
        ) : null}
      </div>
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

function getSummaryText(insight) {
  return insight.summary.map((segment) => segment.text).join('');
}

function getGuidanceSectionsByCardSuffix(insight, suffix) {
  return (
    insight.cards
      .find((card) => card.kind === 'guidance' && card.id.endsWith(suffix))
      ?.data?.guidance?.sections?.map((section) => section.body) ?? []
  );
}

function getWatchOutSections(insight) {
  return (
    insight.cards
      .find((card) => card.kind === 'watchOut')
      ?.data?.watchOut?.items?.map((item) => item.body) ?? []
  );
}

function getMeetingBehaviorSections(insight) {
  return (
    insight.cards
      .find((card) => card.kind === 'meetingBehavior')
      ?.data?.meetingBehavior?.items?.map((item) => item.body) ?? []
  );
}

function getProfileCopyDraft(insight) {
  return {
    overview: getSummaryText(insight),
    workWithSections: getGuidanceSectionsByCardSuffix(insight, '-work-with'),
    whereShines:
      getGuidanceSectionsByCardSuffix(insight, '-where-shines')[0] ?? '',
    watchOutSections: getWatchOutSections(insight),
    meetingBehaviorSections: getMeetingBehaviorSections(insight),
  };
}

/**
 * Prototype-local mirror of component-library Textarea + Button.
 *
 * Port: replace textarea nodes with
 * `@betterup/component-library/src/components/ui/textarea` and replace the
 * action buttons with `@betterup/component-library/src/components/ui/button`.
 * Keep the behavior: edit replaces the viewed copy in place and saves back
 * through the profile override seam.
 */
function InlineTextEditor({ ariaLabel, value, onCancel, onSave }) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="inline-copy-editor" aria-label={ariaLabel}>
      <textarea
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <InlineEditorActions
        onCancel={onCancel}
        onSave={() => onSave(draft.trim())}
      />
    </div>
  );
}

function InlineListEditor({ ariaLabel, values, onCancel, onSave }) {
  const [draft, setDraft] = React.useState(values);

  React.useEffect(() => {
    setDraft(values);
  }, [values]);

  const updateDraft = (index, value) => {
    setDraft((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  };

  return (
    <div className="inline-copy-editor" aria-label={ariaLabel}>
      {draft.map((value, index) => (
        <textarea
          autoFocus={index === 0}
          key={`${ariaLabel}-${index}`}
          value={value}
          onChange={(event) => updateDraft(index, event.target.value)}
        />
      ))}
      <InlineEditorActions
        onCancel={onCancel}
        onSave={() =>
          onSave(draft.map((value) => value.trim()).filter(Boolean))
        }
      />
    </div>
  );
}

function InlineEditorActions({ onCancel, onSave }) {
  return (
    <div className="inline-copy-editor-actions">
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="button" onClick={onSave}>
        Save
      </button>
    </div>
  );
}

function isEditableProfileCard(card) {
  if (card.kind === 'meetingBehavior') return true;
  if (card.kind === 'watchOut') return true;
  if (card.kind !== 'guidance') return false;

  return (
    card.id.endsWith('-where-shines') ||
    card.id.endsWith('-work-with')
  );
}

function getEditableTargetForCard(card) {
  if (card.kind === 'meetingBehavior') return 'meetingBehaviorSections';
  if (card.kind === 'watchOut') return 'watchOutSections';
  if (card.kind !== 'guidance') return null;
  if (card.id.endsWith('-where-shines')) return 'whereShines';
  if (card.id.endsWith('-work-with')) return 'workWithSections';

  return null;
}

function getEditableBodyForCard({
  card,
  editingTarget,
  onCancelEdit,
  onSaveProfileCopyPatch,
}) {
  const target = getEditableTargetForCard(card);

  if (!target || editingTarget !== target) return null;

  if (target === 'whereShines') {
    return (
      <InlineTextEditor
        ariaLabel="Edit where I shine"
        value={card.data?.guidance?.sections?.[0]?.body ?? ''}
        onCancel={onCancelEdit}
        onSave={(whereShines) => onSaveProfileCopyPatch({ whereShines })}
      />
    );
  }

  if (target === 'workWithSections') {
    return (
      <InlineListEditor
        ariaLabel="Edit how to work with me"
        values={
          card.data?.guidance?.sections?.map((section) => section.body) ?? []
        }
        onCancel={onCancelEdit}
        onSave={(workWithSections) =>
          onSaveProfileCopyPatch({ workWithSections })
        }
      />
    );
  }

  if (target === 'meetingBehaviorSections') {
    return (
      <InlineListEditor
        ariaLabel="Edit in meetings"
        values={
          card.data?.meetingBehavior?.items?.map((item) => item.body) ?? []
        }
        onCancel={onCancelEdit}
        onSave={(meetingBehaviorSections) =>
          onSaveProfileCopyPatch({ meetingBehaviorSections })
        }
      />
    );
  }

  return (
    <InlineListEditor
      ariaLabel="Edit look out for"
      values={card.data?.watchOut?.items?.map((item) => item.body) ?? []}
      onCancel={onCancelEdit}
      onSave={(watchOutSections) =>
        onSaveProfileCopyPatch({ watchOutSections })
      }
    />
  );
}

function InsightBlocks({
  cards,
  canEditOwnProfile,
  editingTarget,
  onCancelEdit,
  onEditTarget,
  onSaveProfileCopyPatch,
  onSelectMember,
  revealMode,
}) {
  if (!cards.length) {
    return null;
  }

  return (
    <div className="info-block-stack" aria-label="Future insight blocks">
      {cards.map((card, index) => {
        const target = getEditableTargetForCard(card);
        const isEditingCard = target && editingTarget === target;
        const block = (
          <InfoBlock
            card={card}
            actionLabel={isEditableProfileCard(card) ? `Edit ${card.label}` : undefined}
            bodyOverride={getEditableBodyForCard({
              card,
              editingTarget,
              onCancelEdit,
              onSaveProfileCopyPatch,
            })}
            onAction={
              canEditOwnProfile && target && !isEditingCard
                ? () => onEditTarget(target)
                : undefined
            }
            onSelectMember={onSelectMember}
          />
        );

        if (revealMode !== 'selfReview') {
          return React.cloneElement(block, { key: card.id });
        }

        return (
          <motion.div
            key={card.id}
            className="info-block-reveal-wrap"
            initial={
              revealMode === 'selfReview'
                ? { opacity: 0, y: 26 }
                : undefined
            }
            animate={
              revealMode === 'selfReview'
                ? { opacity: 1, y: 0 }
                : undefined
            }
            transition={
              revealMode === 'selfReview'
                ? {
                    duration: 0.9,
                    delay: 1.05 + index * 0.28,
                    ease: PAGE_EASE,
                  }
                : undefined
            }
          >
            {block}
          </motion.div>
        );
      })}
    </div>
  );
}
