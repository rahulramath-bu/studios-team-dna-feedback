import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';

const PLACEHOLDER_INTERVAL_MS = 3600;
const PLACEHOLDERS = {
  team: [
    '"Who should lead the messy first pass?"',
    '"Where will this team lose momentum?"',
    '"What should we make explicit before kickoff?"',
    '"What kind of project fits this team best?"',
    '"Write a manager brief for this team."',
  ],
  person: [
    '"How should I give them hard feedback?"',
    '"What work will drain them fastest?"',
    '"Where are they likely to be underestimated?"',
    '"What should their manager know before assigning work?"',
    '"Write a working-with-me guide for this person."',
  ],
  duo: [
    '"How should they split the work?"',
    '"Where will this handoff break?"',
    '"What conversation will save them a week?"',
    '"What should this pair decide before they start?"',
    '"Write a pair briefing for their manager."',
  ],
};

const DOCK_TRANSITION = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1],
};

/**
 * Prototype bridge for the monolith ChatInputSection/InputBox pattern.
 *
 * What: mirrors the BetterUp home/Grow ask box as a bottom-center Team DNA
 * signifier while the real AI question layer is not wired yet. This component
 * is not a new design-system primitive.
 * How: Team DNA owns fixed placement and rotating prompts; the input itself
 * stays shaped like the monolith's `ChatInputSection` -> Lighthouse `InputBox`.
 * The dock portals to `document.body` so it stays viewport-fixed even when the
 * Team DNA composition uses transforms for optical alignment. Submit emits an
 * intent payload only; this prototype does not call Lighthouse directly.
 * Port: delete this bridge and render
 * `MemberHome/components/shared/ChatInputSection` or Lighthouse `InputBox` in
 * the same dock position. Both already accept a `placeholder` prop, so rotating
 * prompt state can remain in the Team DNA route without changing the shared
 * component. Wire submit to `setLocation('lighthouse.chat', { searchParams })`
 * with `initial_user_message`, `custom_instructions`, and
 * `skip_initial_messages=true`; do not add a Team DNA-only AI endpoint unless
 * product chooses a separate contextual AI surface.
 */
export function TeamDnaChatInputBridge({
  scope = 'team',
  isHidden = false,
  onSubmitPrompt,
}) {
  const prompts = PLACEHOLDERS[scope] ?? PLACEHOLDERS.team;
  const [message, setMessage] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const prompt = prompts[promptIndex % prompts.length];

  useEffect(() => {
    setPromptIndex(0);
  }, [scope]);

  useEffect(() => {
    if (message.trim()) return undefined;

    const interval = window.setInterval(() => {
      setPromptIndex((current) => (current + 1) % prompts.length);
    }, PLACEHOLDER_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [message, prompts.length]);

  const canSubmit = message.trim().length > 0;
  const ariaLabel = useMemo(() => {
    if (scope === 'duo') return 'Ask AI about this pair';
    if (scope === 'person') return 'Ask AI about this person';
    return 'Ask AI about this team';
  }, [scope]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    onSubmitPrompt?.({
      message: trimmedMessage,
      scope,
      submittedAt: new Date().toISOString(),
    });
    setMessage('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleSubmit(event);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          className="team-dna-ai-question-dock"
          initial={{ opacity: 0, x: '-50%', y: 18 }}
          animate={{ opacity: 1, x: '-50%', y: 0 }}
          exit={{ opacity: 0, x: '-50%', y: 16 }}
          transition={DOCK_TRANSITION}
        >
          <form
            aria-label={ariaLabel}
            className="team-dna-ai-question-box"
            onSubmit={handleSubmit}
          >
            <div className="team-dna-ai-question-input-wrap">
              {!message && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${scope}-${promptIndex}`}
                    className="team-dna-ai-question-placeholder"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {prompt}
                  </motion.span>
                </AnimatePresence>
              )}
              <textarea
                aria-label={ariaLabel}
                className="team-dna-ai-question-input"
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                value={message}
              />
            </div>
            <button
              aria-label="Ask"
              className="team-dna-ai-question-submit"
              data-active={canSubmit || undefined}
              type="submit"
            >
              <BetterUpIcon name="ArrowUp" size={17} strokeWidth={2.2} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
