import React from 'react';
import { motion } from 'motion/react';
import { InsightPanel } from './InsightPanel.jsx';

/**
 * Post-assessment results page for the viewer.
 *
 * What: shown after the demo "Skip for demo" step, this is the same single
 * profile "You are the…" review (selfReview) as the assessment flow — reusing
 * the `.tdna-review--single` layout so width/spacing match exactly — but layered
 * over the team view and closing with a "Go back to team view" CTA.
 * How: reuses `InsightPanel` in `selfReview` mode against the viewer's own person
 * insight, with a top intro (kicker + Big Five bloom placeholder) so the read
 * isn't visually empty without the archetype image.
 * Port: replace with the real post-assessment results route.
 */
const EASE = [0.22, 1, 0.36, 1];

function getInitials(value) {
  if (!value) return 'You';
  return String(value)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AssessmentResultsOverlay({
  insight,
  members,
  teamName,
  currentViewerMemberId,
  viewerName,
  viewerAvatarUrl,
  viewerBigFive,
  onBackToTeam,
}) {
  const intro = <p className="self-results-kicker">Your Big Five results</p>;

  return (
    <motion.div
      className="self-results-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      role="dialog"
      aria-modal="true"
      aria-label="Your Team DNA results"
    >
      <section
        className="tdna-review tdna-review--single"
        data-reveal-stage="2"
      >
        <div
          className="tdna-review-avatar-control tdna-review-avatar-control--floating self-results-avatar"
          aria-hidden="true"
        >
          <span className="tdna-review-avatar">
            {viewerAvatarUrl ? (
              <img src={viewerAvatarUrl} alt="" />
            ) : (
              <span>{getInitials(viewerName)}</span>
            )}
          </span>
        </div>

        <div className="tdna-review-insight-wrap">
          <InsightPanel
            insight={insight}
            isHidden={false}
            canManageTeam={false}
            allowProfileEditing={false}
            selfReviewIntro={intro}
            currentViewerMemberId={currentViewerMemberId}
            members={members}
            teamName={teamName}
            revealMode="selfReview"
            preserveScroll
          />
        </div>

        <div className="tdna-review-control-dock">
          <button
            type="button"
            className="tdna-primary-action"
            onClick={onBackToTeam}
          >
            Go back to team view
          </button>
        </div>
      </section>
    </motion.div>
  );
}
