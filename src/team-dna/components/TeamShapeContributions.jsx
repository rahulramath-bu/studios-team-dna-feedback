import React from 'react';
import { createPortal } from 'react-dom';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function TeamShapeFaceCarousel({ members, onSelectMember }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  const names = members.map((member) => member.name).join(', ');
  const updateTooltipPosition = (event) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };
  const tooltip =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <span
            className="team-face-hover-label"
            style={{
              '--team-face-tooltip-x': `${tooltipPosition.x}px`,
              '--team-face-tooltip-y': `${tooltipPosition.y}px`,
              opacity: isHovered ? 1 : 0,
            }}
            aria-hidden="true"
          >
            {names}
          </span>,
          document.body
        );
  const canOpenMember = members.length === 1;

  return (
    <button
      className="team-shape-face-carousel"
      type="button"
      aria-label={
        canOpenMember
          ? `View ${members[0].name}`
          : `${members.length} people: ${names}`
      }
      onClick={() => {
        if (canOpenMember) {
          onSelectMember?.(members[0].id, { mode: 'solo' });
        }
      }}
      onPointerMove={updateTooltipPosition}
      onPointerEnter={(event) => {
        updateTooltipPosition(event);
        setIsHovered(true);
      }}
      onPointerLeave={() => setIsHovered(false)}
      data-clickable={canOpenMember || undefined}
    >
      {members.map((member, index) => (
        <span
          className="team-shape-face-carousel-layer"
          data-layer={index}
          key={member.id}
          style={{
            '--team-shape-layer-index': index,
            '--team-shape-layer-count': members.length,
          }}
        >
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" />
          ) : (
            <span>{getInitials(member.name)}</span>
          )}
        </span>
      ))}
      {members.length > 1 ? (
        <span className="team-shape-face-count" aria-hidden="true">
          {members.length}
        </span>
      ) : null}
      {tooltip}
    </button>
  );
}

/**
 * Team Shape contribution tags.
 *
 * What: compact Scott-style role distribution inside the team hero read.
 * How: receives precomputed primary role groups and renders one tiny face
 * carousel next to each contribution label.
 * Port: keep the data shape coming from the Team DNA read model. Replace only
 * the avatar primitive/tooltip shell if the monolith already has a better one.
 */
export function TeamShapeContributions({
  contributions = [],
  gaps = [],
  onSelectMember,
}) {
  if (!contributions.length && !gaps.length) {
    return null;
  }

  return (
    <div className="team-shape-block">
      <div
        className="team-shape-contributions"
        aria-label="Team role distribution"
      >
        {contributions.map((contribution) => (
          <div className="team-shape-contribution" key={contribution.key}>
            <span className="team-shape-contribution-faces">
              <TeamShapeFaceCarousel
                members={contribution.members}
                onSelectMember={onSelectMember}
              />
            </span>
            <span className="team-shape-contribution-copy">
              <strong>{contribution.label}</strong>
              <span>{contribution.description}</span>
            </span>
          </div>
        ))}
        {gaps.map((role) => (
          <div
            className="team-shape-contribution"
            data-empty
            key={role.key}
          >
            <span className="team-shape-contribution-faces">
              <span className="team-shape-zero" aria-label="Nobody">
                0
              </span>
            </span>
            <span className="team-shape-contribution-copy">
              <strong>{role.label}</strong>
              <span>{role.description}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
