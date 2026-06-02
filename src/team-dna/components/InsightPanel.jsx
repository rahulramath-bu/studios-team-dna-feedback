import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { InfoBlock } from './InfoBlock.jsx';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { BigFiveBloom } from './BigFiveBloom.jsx';
import { TeamShapeContributions } from './TeamShapeContributions.jsx';

const PAGE_EASE = [0.22, 1, 0.36, 1];
const BASELINE_REVEAL_TRANSITION = {
  duration: 1.35,
  ease: PAGE_EASE,
};

// When someone views their OWN profile, the copy should address them directly
// ("you") instead of in the third person. The generated/authored copy is written
// about a named person, so we convert the prominent reads (overview, Big Five
// reads, strengths) to second person at render time. Work-with notes are already
// written in first person ("Bring me…") and are left untouched.
const SECOND_PERSON_IRREGULAR = {
  is: 'are',
  was: 'were',
  has: 'have',
  does: 'do',
  goes: 'go',
};
const SECOND_PERSON_ES_VERBS = {
  focuses: 'focus',
  pushes: 'push',
  catches: 'catch',
  watches: 'watch',
  fixes: 'fix',
  misses: 'miss',
  passes: 'pass',
  reaches: 'reach',
};

function toBaseVerb(verb) {
  const lower = verb.toLowerCase();
  if (SECOND_PERSON_IRREGULAR[lower]) return SECOND_PERSON_IRREGULAR[lower];
  if (SECOND_PERSON_ES_VERBS[lower]) return SECOND_PERSON_ES_VERBS[lower];
  if (lower.endsWith('s')) return lower.slice(0, -1);
  return lower;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalizeFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toSecondPersonText(text, firstName, pronouns = {}) {
  if (!text || !firstName) return text;
  const fn = escapeRegExp(firstName);
  let out = text;
  // Possessive name: "Jordan's" -> "your"
  out = out.replace(new RegExp(`\\b${fn}'s\\b`, 'g'), 'your');
  out = out.replace(new RegExp(`\\b${fn}’s\\b`, 'g'), 'your');
  // Name as subject + verb: "Jordan helps" -> "You help", "Jordan is" -> "You are"
  out = out.replace(
    new RegExp(`\\b${fn}\\s+([A-Za-z]+)`, 'g'),
    (match, verb) => `You ${toBaseVerb(verb)}`
  );
  // Any remaining bare name -> "you"
  out = out.replace(new RegExp(`\\b${fn}\\b`, 'g'), 'you');
  // Subject pronoun + verb: "She is" -> "You are"
  const subject = pronouns.subject;
  if (subject) {
    out = out.replace(
      new RegExp(`\\b${capitalizeFirst(subject)}\\s+([A-Za-z]+)`, 'g'),
      (match, verb) => `You ${toBaseVerb(verb)}`
    );
    out = out.replace(
      new RegExp(`\\b${subject}\\s+([A-Za-z]+)`, 'g'),
      (match, verb) => `you ${toBaseVerb(verb)}`
    );
  }
  // Possessive pronoun -> "your". "her" is ambiguous (possessive vs object), so
  // use adjacency: "her idea" -> "your idea", a bare/object "her" -> "you".
  const possessive = pronouns.possessive;
  if (possessive === 'her') {
    out = out.replace(/\bher\b(\s+[a-z])/g, 'your$1');
    out = out.replace(/\bHer\b(\s+[a-z])/g, 'Your$1');
    out = out.replace(/\bher\b/g, 'you');
    out = out.replace(/\bHer\b/g, 'You');
  } else if (possessive) {
    out = out.replace(new RegExp(`\\b${possessive}\\b`, 'g'), 'your');
    out = out.replace(
      new RegExp(`\\b${capitalizeFirst(possessive)}\\b`, 'g'),
      'Your'
    );
  }
  // Object pronoun (him/them) -> "you".
  const object = pronouns.object;
  if (object && object !== possessive) {
    out = out.replace(new RegExp(`\\b${object}\\b`, 'g'), 'you');
    out = out.replace(new RegExp(`\\b${capitalizeFirst(object)}\\b`, 'g'), 'You');
  }
  // Re-capitalize at sentence starts.
  out = out.replace(/(^|[.!?]\s+)you\b/g, (match, lead) => `${lead}You`);
  out = out.replace(/(^|[.!?]\s+)your\b/g, (match, lead) => `${lead}Your`);
  return out;
}

// The "how to work with" and "where they shine" cards are written as advice to a
// teammate ("Use Jordan when…", "She helps…"), so on your own profile they read
// most naturally in the first person ("Use me when…", "I help…") rather than the
// second person used for the descriptive sections.
const FIRST_PERSON_IRREGULAR = {
  is: 'am',
  are: 'am',
  was: 'was',
  were: 'was',
  has: 'have',
  does: 'do',
  goes: 'go',
};

function toFirstPersonVerb(verb) {
  const lower = verb.toLowerCase();
  if (FIRST_PERSON_IRREGULAR[lower]) return FIRST_PERSON_IRREGULAR[lower];
  if (SECOND_PERSON_ES_VERBS[lower]) return SECOND_PERSON_ES_VERBS[lower];
  if (lower.endsWith('s')) return lower.slice(0, -1);
  return lower;
}

function toFirstPersonText(text, firstName, pronouns = {}) {
  if (!text) return text;
  let out = text;
  if (firstName) {
    const fn = escapeRegExp(firstName);
    out = out.replace(new RegExp(`\\b${fn}['’]s\\b`, 'g'), 'my');
    out = out.replace(new RegExp(`\\b${fn}\\b`, 'g'), 'me');
  }
  const subject = pronouns.subject;
  if (subject) {
    out = out.replace(
      new RegExp(`\\b${subject}\\s+([A-Za-z]+)`, 'gi'),
      (match, verb) => `I ${toFirstPersonVerb(verb)}`
    );
  }
  const possessive = pronouns.possessive;
  const object = pronouns.object;
  if (possessive === 'her' || object === 'her') {
    out = out.replace(/\bher\b(\s+[a-z])/gi, 'my$1');
    out = out.replace(/\bher\b/gi, 'me');
  } else {
    if (possessive) {
      out = out.replace(new RegExp(`\\b${possessive}\\b`, 'gi'), 'my');
    }
    if (object && object !== possessive) {
      out = out.replace(new RegExp(`\\b${object}\\b`, 'gi'), 'me');
    }
  }
  out = out.replace(
    /(^|[.!?]\s+)(me|my|i)\b/g,
    (match, lead, word) => `${lead}${word === 'i' ? 'I' : capitalizeFirst(word)}`
  );
  return out;
}

function buildOwnProfileInsight(insight, viewerMember) {
  if (!insight || !viewerMember) return insight;
  const firstName = (insight.entityTitle ?? viewerMember.name ?? '').split(' ')[0];
  if (!firstName) return insight;
  const pronouns = viewerMember.pronouns ?? {};
  const transform = (text) => toSecondPersonText(text, firstName, pronouns);
  const transformAdvice = (text) => toFirstPersonText(text, firstName, pronouns);

  return {
    ...insight,
    summary: insight.summary?.map((segment) => ({
      ...segment,
      text: transform(segment.text),
    })),
    cards: insight.cards?.map((card) => {
      if (card.kind === 'strengthsList') {
        return {
          ...card,
          data: {
            ...card.data,
            strengths: {
              ...card.data?.strengths,
              items: card.data?.strengths?.items?.map((item) => ({
                ...item,
                body: transform(item.body),
              })),
            },
          },
        };
      }

      if (card.kind === 'bigFiveSpectrumList' && card.data?.reads) {
        return {
          ...card,
          data: {
            ...card.data,
            reads: Object.fromEntries(
              Object.entries(card.data.reads).map(([key, value]) => [
                key,
                transform(value),
              ])
            ),
          },
        };
      }

      // "How to work with" / "Where they shine" guidance reads as teammate-facing
      // advice, so render it in the first person on your own profile.
      if (card.kind === 'guidance' && card.data?.guidance) {
        const guidance = card.data.guidance;
        return {
          ...card,
          ...(card.label ? { label: transformAdvice(card.label) } : {}),
          data: {
            ...card.data,
            guidance: {
              ...guidance,
              sections: guidance.sections?.map((section) => ({
                ...section,
                ...(section.body ? { body: transformAdvice(section.body) } : {}),
                ...(section.bullets
                  ? { bullets: section.bullets.map(transformAdvice) }
                  : {}),
              })),
              ...(guidance.discussion?.bullets
                ? {
                    discussion: {
                      ...guidance.discussion,
                      bullets: guidance.discussion.bullets.map(transformAdvice),
                    },
                  }
                : {}),
            },
          },
        };
      }

      return card;
    }),
  };
}

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
  allowProfileEditing = true,
  selfReviewIntro = null,
  selfReviewAside = null,
  currentViewerMemberId,
  members = [],
  teamName,
  coachScope = 'team',
  onSelectMember,
  onCoachPrompt,
  onLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
  onDemoAdvance,
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
                  allowProfileEditing={allowProfileEditing}
                  selfReviewIntro={selfReviewIntro}
                  selfReviewAside={selfReviewAside}
                  currentViewerMemberId={currentViewerMemberId}
                  members={members}
                  teamName={teamName}
                  coachScope={coachScope}
                  onSelectMember={onSelectMember}
                  onCoachPrompt={onCoachPrompt}
                  onLifecycleAction={onLifecycleAction}
                  onProfileCopySave={onProfileCopySave}
                  onStartAssessment={onStartAssessment}
                  onDemoAdvance={onDemoAdvance}
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
  allowProfileEditing,
  selfReviewIntro,
  selfReviewAside,
  currentViewerMemberId,
  members,
  teamName,
  coachScope,
  onSelectMember,
  onCoachPrompt,
  onLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
  onDemoAdvance,
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
      allowProfileEditing={allowProfileEditing}
      selfReviewIntro={selfReviewIntro}
      selfReviewAside={selfReviewAside}
      currentViewerMemberId={currentViewerMemberId}
      members={members}
      teamName={teamName}
      coachScope={coachScope}
      onSelectMember={onSelectMember}
      onCoachPrompt={onCoachPrompt}
      onLifecycleAction={onLifecycleAction}
      onProfileCopySave={onProfileCopySave}
      onStartAssessment={onStartAssessment}
      onDemoAdvance={onDemoAdvance}
      revealMode={revealMode}
    />
    </motion.article>
  );
}

function InsightPageContent({
  insight,
  canManageTeam,
  allowProfileEditing = true,
  selfReviewIntro = null,
  selfReviewAside = null,
  currentViewerMemberId,
  members,
  teamName,
  coachScope = 'team',
  onSelectMember,
  onCoachPrompt,
  onLifecycleAction,
  onProfileCopySave,
  onStartAssessment,
  onDemoAdvance,
  revealMode,
}) {
  const lifecycle = insight.generationLifecycle;
  const editableMemberId =
    lifecycle?.target?.scope === 'person'
      ? lifecycle.target.memberIds?.[0]
      : null;
  const canEditOwnProfile =
    allowProfileEditing &&
    !canManageTeam &&
    editableMemberId &&
    editableMemberId === currentViewerMemberId;
  // Address the reader directly when they're looking at their own profile,
  // regardless of whether they can edit it (managers can't edit, but should
  // still read "you").
  const isOwnProfile =
    Boolean(editableMemberId) && editableMemberId === currentViewerMemberId;
  const ownProfileViewer = isOwnProfile
    ? members.find((member) => member.id === currentViewerMemberId)
    : null;
  const displayInsight = isOwnProfile
    ? buildOwnProfileInsight(insight, ownProfileViewer)
    : insight;
  const imageCard = displayInsight.cards.find((card) => card.kind === 'archetypeImage');
  const bloomHeroCard = displayInsight.cards.find((card) => card.kind === 'bloomHero');
  // The hero aside is the small Big Five bloom: the self-review page supplies its
  // own; individual profiles get one from the `bloomHero` card the adapter adds.
  const heroAside =
    revealMode === 'selfReview' && selfReviewAside
      ? selfReviewAside
      : bloomHeroCard
        ? (
            <div className="self-results-bloom" aria-hidden="true">
              <BigFiveBloom subjects={bloomHeroCard.data?.subjects ?? []} />
            </div>
          )
        : null;
  // The team view folds its bloom + role distribution into the big hero box, so
  // it is pulled out of the supporting stack and rendered inside the hero.
  const teamCompositionCard = displayInsight.cards.find(
    (card) => card.kind === 'teamShapeContributions'
  );
  const coachSubject = insight.entityTitle ?? insight.title ?? teamName;
  const supportingCards = orderSupportingCards(
    displayInsight.cards.filter(
      (card) =>
        card.kind !== 'archetypeImage' &&
        card.kind !== 'bloomHero' &&
        card.kind !== 'teamShapeContributions'
    )
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
  // While generating, show a clean loading veil instead of the deterministic
  // fallback copy. That keeps generating → ready reading off the same data, so
  // the content never visibly swaps mid-demo.
  const isGenerating = lifecycle?.status === 'pending';
  // Demo fast-forward sits just below the waiting card, in the "you're done,
  // waiting on the team" moment (viewer complete, teammates still pending).
  const viewerMember = members.find(
    (member) => member.id === currentViewerMemberId
  );
  const viewerDone = viewerMember && viewerMember.assessmentComplete !== false;
  const othersPending = members.some(
    (member) =>
      member.id !== currentViewerMemberId && member.assessmentComplete === false
  );
  const showDemoAdvance =
    Boolean(onDemoAdvance) &&
    isHardNotReady &&
    lifecycle?.target?.scope === 'team' &&
    viewerDone &&
    othersPending;

  return (
    <>
      {isGenerating ? null : (
        <InsightLifecycleStatus
          lifecycle={lifecycle}
          canManageTeam={canManageTeam}
          onLifecycleAction={onLifecycleAction}
        />
      )}
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
      {showDemoAdvance ? (
        <button
          type="button"
          className="insight-demo-advance"
          onClick={() => onDemoAdvance()}
          title="Demo only: skip ahead as if everyone has finished"
        >
          <span className="insight-demo-advance-tag">Demo</span>
          Skip to next state
          <span aria-hidden="true">&rarr;</span>
        </button>
      ) : null}
      {isGenerating ? (
        <InsightGeneratingState lifecycle={lifecycle} teamName={teamName} />
      ) : null}
      {isHardNotReady || isGenerating ? null : (
        <>
          {revealMode === 'selfReview' && selfReviewIntro ? (
            <motion.div
              className="insight-self-review-intro"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: PAGE_EASE }}
            >
              {selfReviewIntro}
            </motion.div>
          ) : null}
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
              heroAside ? 'insight-primary-read--with-aside' : '',
              teamCompositionCard ? 'insight-primary-read--team-box' : '',
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
                <InsightHeading insight={displayInsight} />
              </div>
              {editingTarget === 'overview' ? (
                <InlineTextEditor
                  ariaLabel="Edit main overview"
                  value={getSummaryText(insight)}
                  onCancel={() => setEditingTarget(null)}
                  onSave={(overview) => saveProfileCopyPatch({ overview })}
                />
              ) : (
                <>
                  <InsightSummary insight={displayInsight} />
                  <InsightRoleRead
                    roles={displayInsight.roleRead}
                    name={displayInsight.entityTitle}
                    isOwnProfile={isOwnProfile}
                  />
                </>
              )}
              {teamCompositionCard ? (
                <div className="insight-team-composition">
                  <TeamShapeContributions
                    contributions={teamCompositionCard.data?.contributions ?? []}
                    subjects={teamCompositionCard.data?.subjects ?? []}
                    hideLegend
                    onSelectMember={onSelectMember}
                  />
                </div>
              ) : null}
            </div>
            {heroAside ? (
              <div className="insight-primary-aside">{heroAside}</div>
            ) : null}
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
            coachScope={coachScope}
            coachSubject={coachSubject}
            onCancelEdit={() => setEditingTarget(null)}
            onEditTarget={setEditingTarget}
            onCoachPrompt={onCoachPrompt}
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
    if (card.kind === 'strengthsList') return 20;
    if (card.kind === 'watchOut') return 30;
    if (card.kind === 'guidance' && card.id.endsWith('-work-best')) return 40;
    if (card.kind === 'guidance' && card.id.endsWith('-work-with')) return 50;
    if (card.kind === 'guidance' && card.id.endsWith('-pairing-manual')) return 50;
    if (card.kind === 'bigFiveSpectrumList') return 90;
    return 70;
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
      title: 'Building your team DNA',
      text: 'Once enough teammates share their DNA, your team summary appears here.',
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
              You haven&rsquo;t shared your DNA yet &mdash; your read is the
              missing piece.
            </p>
          </div>
          <button
            className="bu-button bu-button--primary insight-waiting-callout-cta"
            type="button"
            onClick={() => onStartAssessment?.()}
          >
            Start assessment
            <span aria-hidden="true">&rarr;</span>
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

function InsightGeneratingState({ lifecycle, teamName }) {
  const target = lifecycle?.target;
  const isTeamScope = target?.scope === 'team';
  const total = target?.totalCount ?? 0;
  const eyebrow = isTeamScope ? teamName || 'Team DNA' : 'Team DNA';

  return (
    <section
      className="insight-generating-state"
      aria-live="polite"
      aria-busy="true"
      aria-label="Generating insight"
    >
      <header className="insight-waiting-header">
        <div className="insight-waiting-header-text">
          <span className="insight-waiting-eyebrow">{eyebrow}</span>
          <h2>Generating your Team DNA</h2>
        </div>
        <span className="insight-waiting-tag" data-tone="working">
          Generating
        </span>
      </header>

      <p className="insight-waiting-body">
        Synthesizing{' '}
        {total > 0 ? (
          <strong>
            {total} assessment{total === 1 ? '' : 's'}
          </strong>
        ) : (
          'the team’s assessments'
        )}{' '}
        into your team’s shape. This only takes a moment.
      </p>

      <div className="insight-generating-bar" aria-hidden="true">
        <div className="insight-generating-bar-fill" />
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

function InsightRoleRead({ roles, name, isOwnProfile = false }) {
  if (!roles?.primary || !roles?.secondary) {
    return null;
  }

  const firstName = name ? name.split(' ')[0] : 'They';
  const lead = isOwnProfile
    ? 'In team meetings, your primary role is the '
    : `In team meetings, ${firstName}'s primary role is the `;

  return (
    <p className="insight-summary insight-role-read">
      {lead}
      <strong className="insight-role-name--primary">
        {roles.primary.name}
      </strong>
      {`, who ${roles.primary.blurb}, and ${
        isOwnProfile ? 'your' : 'the'
      } secondary role is the `}
      <strong className="insight-role-name--secondary">
        {roles.secondary.name}
      </strong>
      {`, who ${roles.secondary.blurb}.`}
    </p>
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
  coachScope,
  coachSubject,
  onCancelEdit,
  onEditTarget,
  onCoachPrompt,
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
            onCoachPrompt={onCoachPrompt}
            coachScope={coachScope}
            coachSubject={coachSubject}
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
