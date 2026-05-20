import React, { forwardRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { useTeamDnaPressable } from '../hooks/useTeamDnaPressable';

const PRESS_SCALE = 1.08;
const HOVER_SCALE = 1.08;
const SELECTION_NUDGE_TRANSITION = { duration: 0.32, ease: 'easeInOut' };
const FACE_PRESENCE_TRANSITION = {
  opacity: { duration: 0.16 },
  scale: { type: 'spring', stiffness: 420, damping: 28, mass: 0.72 },
  layout: { type: 'spring', stiffness: 260, damping: 30 },
};

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Single teammate pressable.
 *
 * What: semantic face button for one team member, including avatar/initials,
 * selected ring, dimming, hover label, edit remove control, unavailable shake,
 * selected pulse, and press feedback.
 * How: separates transforms across nested motion layers so hover, press,
 * selected scale, duo nudge, pulse, and blocked shake can compose without
 * fighting over one CSS transform.
 * Port: keep the layered motion local to Team DNA, but feed it real profile
 * avatar data. Prefer the monolith avatar primitive if it can support these
 * visual layers; replace BetterUpIcon with @betterup/icons.
 */
export const TeamFace = forwardRef(function TeamFace(
  {
    member,
    isSelected,
    isDuoSelected,
    isDimmed,
    isBlocked,
    isEditingTeam,
    blockedAttempt = 0,
    nudge = { x: 0, y: 0 },
    nudgeMotion = 'idle',
    onRemove,
    onSelect,
    onHoverChange,
    isPreviewObscured,
    visualRef,
  },
  ref
) {
  const { pressed, handlers } = useTeamDnaPressable();
  const [hovered, setHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const restingScale = isSelected ? 1.22 : isDimmed ? 0.68 : 1;
  const interactionScale =
    restingScale * (hovered ? HOVER_SCALE : 1) * (pressed ? PRESS_SCALE : 1);
  const isUnavailable = member.assessmentComplete === false;
  const hoverLabel = isBlocked ? 'Needs Team DNA first' : member.name;
  const showHoverLabel = !isEditingTeam && ((hovered && !isSelected) || isBlocked);
  const dimmedOpacity = isPreviewObscured ? 0.1 : 0.26;
  const nudgeTransition =
    nudgeMotion === 'selection'
      ? SELECTION_NUDGE_TRANSITION
      : { duration: 0.32, ease: 'easeInOut' };
  const updateTooltipPosition = (event) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };
  const hoverTooltip =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <motion.span
            className="team-face-hover-label"
            initial={false}
            animate={{ opacity: showHoverLabel ? 1 : 0 }}
            transition={{ duration: 0 }}
            style={{
              '--team-face-tooltip-x': `${tooltipPosition.x}px`,
              '--team-face-tooltip-y': `${tooltipPosition.y}px`,
            }}
            aria-hidden="true"
          >
            {hoverLabel}
          </motion.span>,
          document.body
        );

  // Keep this as a semantic button. The custom part is Team DNA-specific face
  // motion, not the accessibility model.
  // Hover restores dimmed faces to full opacity so people remain inspectable.
  // The inner layers own selected pulse and unavailable shake so those effects
  // never fight the outer visual layer's hover, press, and nudge transforms.
  const faceVisual = (
    <motion.span
      ref={visualRef}
      layout
      className="team-face-visual-layer"
      animate={{
        opacity: isDimmed && !hovered ? dimmedOpacity : 1,
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
    </motion.span>
  );

  if (isEditingTeam) {
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={FACE_PRESENCE_TRANSITION}
        className="team-face-button"
        data-editing={isEditingTeam || undefined}
        data-unavailable={isUnavailable || undefined}
        onPointerMove={updateTooltipPosition}
        onHoverStart={(event) => {
          updateTooltipPosition(event);
          setHovered(true);
        }}
        onHoverEnd={() => setHovered(false)}
      >
        {faceVisual}
        {hoverTooltip}
        <button
          type="button"
          className="team-face-remove-button"
          onClick={onRemove}
          aria-label={`Remove ${member.name}`}
        >
          <BetterUpIcon name="X" size={13} strokeWidth={2.3} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={FACE_PRESENCE_TRANSITION}
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
      onPointerMove={updateTooltipPosition}
      onPointerLeave={(event) => {
        handlers.onPointerLeave?.(event);
        setHovered(false);
        onHoverChange?.(false);
      }}
      onHoverStart={(event) => {
        updateTooltipPosition(event);
        setHovered(true);
        onHoverChange?.(true);
      }}
      onHoverEnd={() => {
        setHovered(false);
        onHoverChange?.(false);
      }}
    >
      {faceVisual}
      {hoverTooltip}
    </motion.button>
  );
});
