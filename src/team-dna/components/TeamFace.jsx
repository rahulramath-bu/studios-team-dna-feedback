import React, { forwardRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useTeamDnaPressable } from '../hooks/useTeamDnaPressable';

const PRESS_SCALE = 1.08;
const HOVER_SCALE = 1.08;
const SELECTION_NUDGE_TRANSITION = { duration: 0.32, ease: 'easeInOut' };
const FACE_PRESENCE_TRANSITION = {
  opacity: { duration: 0.16 },
  scale: { type: 'spring', stiffness: 420, damping: 28, mass: 0.72 },
  layout: { type: 'spring', stiffness: 260, damping: 30 },
};
const FIRST_NAME_DEFAULT_SCALE = 0.21;
const FIRST_NAME_SHRINK_AFTER = 7;
const FIRST_NAME_SHRINK_STEP = 0.025;
const FIRST_NAME_MIN_SCALE = 0.13;

function getFirstName(name) {
  const normalizedName = String(name ?? '').trim();

  return normalizedName.split(/\s+/)[0] || 'Team';
}

function getFirstNameSizeScale(firstName) {
  const length = Array.from(firstName).length;

  if (length <= FIRST_NAME_SHRINK_AFTER) {
    return FIRST_NAME_DEFAULT_SCALE;
  }

  return Math.max(
    FIRST_NAME_MIN_SCALE,
    FIRST_NAME_DEFAULT_SCALE -
      (length - FIRST_NAME_SHRINK_AFTER) * FIRST_NAME_SHRINK_STEP
  );
}

/**
 * Single teammate pressable.
 *
 * What: semantic face button for one team member, including avatar/first-name
 * fallback, selected ring, dimming, hover label, unavailable shake, selected
 * pulse, and press feedback.
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
    isViewer = false,
    isSelected,
    isDuoSelected,
    isDimmed,
    isBlocked,
    blockedLabel,
    introDelay = 0,
    showTapHint = false,
    tapHintCycle = 0,
    blockedAttempt = 0,
    nudge = { x: 0, y: 0 },
    nudgeMotion = 'idle',
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
  const fallbackFirstName = getFirstName(member.name);
  const restingScale = isSelected ? 1.22 : isDimmed ? 0.68 : 1;
  const interactionScale =
    restingScale * (hovered ? HOVER_SCALE : 1) * (pressed ? PRESS_SCALE : 1);
  const visualScale = showTapHint
    ? [
        interactionScale,
        interactionScale * 1.2,
        interactionScale * 1.04,
        interactionScale * 1.18,
        interactionScale * 1.02,
        interactionScale * 1.15,
        interactionScale,
      ]
    : interactionScale;
  const isUnavailable = member.assessmentComplete === false;
  const hoverLabel = isSelected
    ? 'Deselect'
    : isBlocked
      ? blockedLabel ?? 'Unavailable'
      : member.name;
  const showHoverLabel = hovered || isBlocked;
  const dimmedOpacity = isPreviewObscured ? 0.1 : 0.26;
  const nudgeTransition =
    nudgeMotion === 'selection'
      ? SELECTION_NUDGE_TRANSITION
      : { duration: 0.32, ease: 'easeInOut' };
  const presenceTransition = introDelay
    ? {
        ...FACE_PRESENCE_TRANSITION,
        opacity: { duration: 0.95, delay: introDelay, ease: 'easeInOut' },
        scale: {
          duration: 1.05,
          ease: [0.4, 0, 0.2, 1],
          delay: introDelay,
        },
      }
    : FACE_PRESENCE_TRANSITION;
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
        scale: visualScale,
        x: nudge.x,
        y: nudge.y,
      }}
      transition={{
        scale: showTapHint
          ? {
              duration: 2.8,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.12, 0.26, 0.42, 0.58, 0.76, 1],
            }
          : { type: 'spring', stiffness: 360, damping: 31 },
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
            <span
              className="team-face-name-fallback"
              style={{
                '--team-face-name-scale': getFirstNameSizeScale(fallbackFirstName),
              }}
              aria-hidden="true"
            >
              {fallbackFirstName}
            </span>
          )}
          {isUnavailable && !isViewer && (
            <span className="team-face-pending-pill" aria-hidden="true">
              Pending
            </span>
          )}
          {isViewer && (
            <span className="team-face-viewer-pill" aria-hidden="true">
              You
            </span>
          )}
          {showTapHint && (
            <span
              key={`tap-hint-${tapHintCycle}`}
              className="team-face-pending-pill team-face-tap-hint"
              aria-hidden="true"
            >
              Tap me
            </span>
          )}
        </motion.span>
      </motion.span>
    </motion.span>
  );

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={presenceTransition}
      type="button"
      className="team-face-button"
      data-selected={isSelected || undefined}
      data-duo-selected={isDuoSelected || undefined}
      data-dimmed={isDimmed || undefined}
      data-unavailable={isUnavailable || undefined}
      data-viewer={isViewer || undefined}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={
        isViewer
          ? isUnavailable
            ? 'Your face - assessment not started'
            : 'Your profile'
          : isBlocked && blockedLabel
          ? `${member.name}: ${blockedLabel}`
          : isUnavailable
            ? `${member.name} assessment incomplete`
          : `Explore ${member.name}`
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
