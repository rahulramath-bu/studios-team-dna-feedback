import React, { forwardRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTeamDnaPressable } from '../hooks/useTeamDnaPressable';

const PRESS_SCALE = 1.08;
const HOVER_SCALE = 1.08;
const SELECTION_NUDGE_TRANSITION = { duration: 0.32, ease: 'easeInOut' };

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export const TeamFace = forwardRef(function TeamFace(
  {
    member,
    isSelected,
    isDuoSelected,
    isDimmed,
    isBlocked,
    blockedAttempt = 0,
    nudge = { x: 0, y: 0 },
    nudgeMotion = 'idle',
    onSelect,
    onHoverChange,
    visualRef,
  },
  ref
) {
  const { pressed, handlers } = useTeamDnaPressable();
  const [hovered, setHovered] = useState(false);
  const restingScale = isSelected ? 1.22 : isDimmed ? 0.68 : 1;
  const interactionScale =
    restingScale * (hovered ? HOVER_SCALE : 1) * (pressed ? PRESS_SCALE : 1);
  const isUnavailable = member.assessmentComplete === false;
  const hoverLabel = isBlocked ? 'Needs Team DNA first' : member.name;
  const showHoverLabel = (hovered && !isSelected) || isBlocked;
  const nudgeTransition =
    nudgeMotion === 'selection'
      ? SELECTION_NUDGE_TRANSITION
      : { duration: 0.32, ease: 'easeInOut' };

  // Monolith integration tip: keep this as a semantic button. The custom part
  // is the Team DNA-specific face-cluster motion, not the accessibility model.
  // Hover restores dimmed faces to full opacity so people remain inspectable.
  // The inner layers own selected pulse and unavailable shake so those effects
  // never fight the outer visual layer's hover, press, and nudge transforms.
  return (
    <motion.button
      ref={ref}
      type="button"
      className="team-face-button"
      data-selected={isSelected || undefined}
      data-duo-selected={isDuoSelected || undefined}
      data-dimmed={isDimmed || undefined}
      data-unavailable={isUnavailable || undefined}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={
        isUnavailable ? `${member.name} needs Team DNA first` : `Explore ${member.name}`
      }
      {...handlers}
      onHoverStart={() => {
        setHovered(true);
        onHoverChange?.(true);
      }}
      onHoverEnd={() => {
        setHovered(false);
        onHoverChange?.(false);
      }}
    >
      <motion.span
        ref={visualRef}
        layout
        className="team-face-visual-layer"
        animate={{
          opacity: isDimmed && !hovered ? 0.26 : 1,
          scale: interactionScale,
          x: nudge.x,
          y: nudge.y,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 360, damping: 31 },
          opacity: { duration: 0.18 },
          x: nudgeTransition,
          y: nudgeTransition,
        }}
      >
        <motion.span
          key={isBlocked ? `blocked-${blockedAttempt}` : 'available'}
          className="team-face-shake-layer"
          initial={{ x: 0 }}
          animate={{ x: isBlocked ? [0, -8, 8, -6, 6, 0] : 0 }}
          transition={{ duration: 0.34, ease: 'easeInOut' }}
        >
          <motion.span
            className="team-face-pulse-layer"
            animate={{ scale: isSelected ? [1, 1.018, 1] : 1 }}
            transition={{
              duration: 2.2,
              ease: 'easeInOut',
              repeat: isSelected ? Infinity : 0,
            }}
          >
            <span className="team-face-ring" aria-hidden="true" />
            {member.avatarUrl ? (
              <img className="team-face-image" src={member.avatarUrl} alt="" />
            ) : (
              <span className="team-face-initials" aria-hidden="true">
                {getInitials(member.name)}
              </span>
            )}
          </motion.span>
        </motion.span>
        <motion.span
          className="team-face-hover-label"
          initial={false}
          animate={{ opacity: showHoverLabel ? 1 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          aria-hidden="true"
        >
          {hoverLabel}
        </motion.span>
      </motion.span>
    </motion.button>
  );
});
