import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { InfoBlock } from './InfoBlock.jsx';

export function InsightPanel({ insight }) {
  return (
    <div className="team-dna-insight-pane">
      <div className="team-dna-scroll-fade top" aria-hidden="true" />
      <div className="team-dna-scroll-fade bottom" aria-hidden="true" />
      <div className="team-dna-insight-scroll">
        <div className="team-dna-insight-content">
          <AnimatePresence mode="wait">
            {/* Monolith integration tip: `mode="wait"` protects the intended
                exit-before-enter copy transition. Do not swap this for a
                crossfade unless the interaction direction changes. */}
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="insight-eyebrow">{insight.eyebrow}</div>
              <div className="insight-title-row">
                <h1 className="insight-title">{insight.title}</h1>
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
              <p className="insight-summary">
                {insight.summary.map((segment, index) => (
                  <React.Fragment key={`${insight.id}-${index}`}>
                    {segment.emphasis ? (
                      <strong>{segment.text}</strong>
                    ) : (
                      segment.text
                    )}
                  </React.Fragment>
                ))}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="info-block-stack" aria-label="Future insight blocks">
            {insight.cards.map((card) => (
              <InfoBlock key={card.id} label={card.label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
