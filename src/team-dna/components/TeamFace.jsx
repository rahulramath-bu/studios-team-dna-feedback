import React, { forwardRef, useState } from 'react';
import { motion } from 'motion/react';
import { TeamDnaTooltip } from './TeamDnaTooltip.jsx';
import { useTeamDnaPressable } from '../hooks/useTeamDnaPressable';

const PRESS_SCALE = 1.08;
const HOVER_SCALE = 1.05;

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
    nudge = { x: 0, y: 0 },
    onSelect,
  },
  ref
) {
  const { pressed, handlers } = useTeamDnaPressable();
  const [hovered, setHovered] = useState(false);
  const restingScale = isSelected ? 1.22 : isDimmed ? 0.68 : 1;
  const interactionScale =
    restingScale * (hovered ? HOVER_SCALE : 1) * (pressed ? PRESS_SCALE : 1);
  const isUnavailable = member.assessmentComplete === false;
  const tooltipText = isBlocked ? 'Needs Team DNA first' : member.name;

  // Monolith integration tip: keep this as a semantic button. The custom part
  // is the Team DNA-specific face-cluster motion, not the accessibility model.
  return (
    <TeamDnaTooltip text={tooltipText} open={isBlocked || undefined}>
      <motion.button
        ref={ref}
        type="button"
        layout
        className="team-face-button"
        data-selected={isSelected || undefined}
        data-duo-selected={isDuoSelected || undefined}
        data-dimmed={isDimmed || undefined}
        data-unavailable={isUnavailable || undefined}
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={
          isUnavailable
            ? `${member.name} needs Team DNA first`
            : `Explore ${member.name}`
        }
        {...handlers}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{
          opacity: isDimmed ? 0.26 : 1,
          scale: interactionScale,
          x: isBlocked
            ? [nudge.x, nudge.x - 8, nudge.x + 8, nudge.x - 6, nudge.x + 6, nudge.x]
            : nudge.x,
          y: nudge.y,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 360, damping: 31 },
          opacity: { duration: 0.18 },
          x: { type: 'spring', stiffness: 320, damping: 28 },
          y: { type: 'spring', stiffness: 320, damping: 28 },
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
      </motion.button>
    </TeamDnaTooltip>
  );
});
