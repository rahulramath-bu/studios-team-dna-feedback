import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { DuoConnection } from './DuoConnection.jsx';
import { TeamFace } from './TeamFace.jsx';

const DUO_MIN_CENTER_DISTANCE = 176;
const DUO_MAX_NUDGE = 32;
const SECONDARY_MIN_CENTER_DISTANCE = 126;
const SECONDARY_MAX_NUDGE = 24;
const NUDGE_RELAXATION_STEPS = 3;

function getLayoutCenter(node) {
  return {
    x: node.offsetLeft + node.offsetWidth / 2,
    y: node.offsetTop + node.offsetHeight / 2,
  };
}

function getPrimaryDuoNudges(first, second) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const distance = Math.hypot(dx, dy);

  if (distance >= DUO_MIN_CENTER_DISTANCE) {
    return null;
  }

  const safeDistance = distance || 1;
  const amount = Math.min(
    DUO_MAX_NUDGE,
    (DUO_MIN_CENTER_DISTANCE - safeDistance) / 2
  );
  const ux = dx / safeDistance;
  const uy = dy / safeDistance;

  return {
    first: { x: -ux * amount, y: -uy * amount },
    second: { x: ux * amount, y: uy * amount },
  };
}

function addNudge(nudges, id, delta) {
  const current = nudges[id] ?? { x: 0, y: 0 };

  nudges[id] = {
    x: current.x + delta.x,
    y: current.y + delta.y,
  };
}

function limitNudge(nudge, max) {
  const length = Math.hypot(nudge.x, nudge.y);

  if (length <= max || length === 0) {
    return nudge;
  }

  const scale = max / length;

  return {
    x: nudge.x * scale,
    y: nudge.y * scale,
  };
}

function getCenters(members, hitboxRefs) {
  return Object.fromEntries(
    members
      .map((member) => {
        const node = hitboxRefs.current.get(member.id);
        return node ? [member.id, getLayoutCenter(node)] : null;
      })
      .filter(Boolean)
  );
}

function resolveDuoNudges(members, selectedIds, hitboxRefs, centers) {
  const [firstId, secondId] = selectedIds;
  const firstNode = hitboxRefs.current.get(firstId);
  const secondNode = hitboxRefs.current.get(secondId);

  if (!firstNode || !secondNode) {
    return {};
  }

  const selectedSet = new Set(selectedIds);
  const nudges = {};
  const primaryNudges = getPrimaryDuoNudges(
    centers[firstId],
    centers[secondId]
  );

  if (!primaryNudges) {
    return {};
  }

  nudges[firstId] = primaryNudges.first;
  nudges[secondId] = primaryNudges.second;

  // Let the selected-pair movement ripple gently into nearby dimmed faces.
  // This is a tiny local relaxation pass, not a full physics layout.
  for (let step = 0; step < NUDGE_RELAXATION_STEPS; step += 1) {
    for (const member of members) {
      if (selectedSet.has(member.id) || !centers[member.id]) continue;

      for (const selectedId of selectedIds) {
        const selectedNudge = nudges[selectedId] ?? { x: 0, y: 0 };
        const selectedCenter = {
          x: centers[selectedId].x + selectedNudge.x,
          y: centers[selectedId].y + selectedNudge.y,
        };
        const memberNudge = nudges[member.id] ?? { x: 0, y: 0 };
        const memberCenter = {
          x: centers[member.id].x + memberNudge.x,
          y: centers[member.id].y + memberNudge.y,
        };
        const dx = memberCenter.x - selectedCenter.x;
        const dy = memberCenter.y - selectedCenter.y;
        const distance = Math.hypot(dx, dy);

        if (distance >= SECONDARY_MIN_CENTER_DISTANCE) continue;

        const safeDistance = distance || 1;
        const amount = Math.min(
          SECONDARY_MAX_NUDGE / NUDGE_RELAXATION_STEPS,
          (SECONDARY_MIN_CENTER_DISTANCE - safeDistance) / 2
        );

        addNudge(nudges, member.id, {
          x: (dx / safeDistance) * amount,
          y: (dy / safeDistance) * amount,
        });
        nudges[member.id] = limitNudge(
          nudges[member.id],
          SECONDARY_MAX_NUDGE
        );
      }
    }
  }

  return nudges;
}

function resolveFaceNudges(members, selectedIds, hitboxRefs) {
  const centers = getCenters(members, hitboxRefs);
  return selectedIds.length === 2
    ? resolveDuoNudges(members, selectedIds, hitboxRefs, centers)
    : {};
}

function getEntityTitleStyle(title) {
  const length = title?.length ?? 0;

  if (length <= 13) {
    return { '--team-face-context-title-size': '48px' };
  }

  if (length <= 18) {
    return { '--team-face-context-title-size': '42px' };
  }

  if (length <= 24) {
    return { '--team-face-context-title-size': '36px' };
  }

  return {
    '--team-face-context-title-size': '32px',
    '--team-face-context-title-wrap': 'normal',
  };
}

/**
 * Left-side team face field.
 *
 * What: renders the selectable team cluster, edit affordance, team-name editor,
 * add/remove controls, hover preview line, selected duo line, and selected-pair
 * nudge behavior.
 * How: keeps stable button hitboxes while inner visual layers scale; stores DOM
 * refs for each face so DuoConnection and nudge math can measure real positions
 * instead of assuming a specific grid.
 * Port: keep this as Team DNA-owned interaction code. Wire add/remove/name
 * actions to monolith mutations at the route layer, and replace BetterUpIcon
 * with the monolith icon component.
 */
export function TeamFaceField({
  members,
  selectedIds,
  blockedAttempt,
  entityEyebrow,
  entityTitle,
  isEditingTeam,
  teamName,
  onAddMember,
  onEditTeam,
  onCancelEditing,
  onDoneEditing,
  onRemoveMember,
  onSelectMember,
  onTeamNameChange,
}) {
  const hasSelection = selectedIds.length > 0;
  const fieldRef = useRef(null);
  const faceRefs = useRef(new Map());
  const hitboxRefs = useRef(new Map());
  const previousSelectedCount = useRef(selectedIds.length);
  const previousMemberCount = useRef(members.length);
  const [faceNudges, setFaceNudges] = useState({});
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [useSelectionNudgeMotion, setUseSelectionNudgeMotion] = useState(
    selectedIds.length === 2
  );
  const previewMember = members.find((member) => member.id === hoveredMemberId);
  const previewSelectedIds =
    !isEditingTeam &&
    selectedIds.length === 1 &&
    previewMember &&
    previewMember.assessmentComplete !== false &&
    !selectedIds.includes(previewMember.id)
      ? [selectedIds[0], previewMember.id]
      : null;

  const setFaceNode = (memberId) => (node) => {
    if (node) {
      faceRefs.current.set(memberId, node);
    } else {
      faceRefs.current.delete(memberId);
    }
  };

  const setHitboxNode = (memberId) => (node) => {
    if (node) {
      hitboxRefs.current.set(memberId, node);
    } else {
      hitboxRefs.current.delete(memberId);
    }
  };

  useEffect(() => {
    const wasDuo = previousSelectedCount.current === 2;
    const isDuo = selectedIds.length === 2;
    previousSelectedCount.current = selectedIds.length;

    if (isDuo || wasDuo) {
      setUseSelectionNudgeMotion(true);
    }

    if (!isDuo && wasDuo) {
      const timeout = window.setTimeout(() => {
        setUseSelectionNudgeMotion(false);
      }, 360);

      return () => window.clearTimeout(timeout);
    }

    if (!isDuo) {
      setUseSelectionNudgeMotion(false);
    }

    return undefined;
  }, [selectedIds.length]);

  useEffect(() => {
    const wasRemovingMember = members.length < previousMemberCount.current;
    previousMemberCount.current = members.length;

    if (!isEditingTeam || !wasRemovingMember) return undefined;

    setIsAddButtonHidden(true);
    const timeout = window.setTimeout(() => {
      setIsAddButtonHidden(false);
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [isEditingTeam, members.length]);

  // Layout note: duo nudges measure positions, not grid row/column indexes, so
  // this can survive a future horizontal rail.
  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateNudges = () => {
      setFaceNudges(
        resolveFaceNudges(members, selectedIds, hitboxRefs)
      );
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateNudges);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [members, selectedIds]);

  return (
    <motion.div className="team-face-field-wrap" ref={fieldRef} layout>
      {!isEditingTeam && (
        <div className="team-face-context-header">
          <p className="team-face-context-eyebrow">
            {entityEyebrow}
          </p>
          <div className="team-face-context-title-row">
            <h2 className="team-face-context-title">
              <span style={getEntityTitleStyle(entityTitle)}>
                {entityTitle}
              </span>
            </h2>
            {!hasSelection && (
              <button
                type="button"
                className="team-face-edit-button"
                aria-label={`Edit ${teamName}`}
                onClick={onEditTeam}
              >
                <BetterUpIcon name="Edit" size={19} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      )}
      {isEditingTeam && (
        <div className="team-edit-header">
          <div className="team-edit-name-control">
            <input
              className="team-edit-name-input"
              value={teamName}
              onChange={(event) => onTeamNameChange?.(event.target.value)}
              aria-label="Team name"
            />
            <button
              type="button"
              className="team-edit-name-action team-edit-cancel-button"
              onClick={onCancelEditing}
              aria-label="Discard team edits"
            >
              <BetterUpIcon name="X" size={15} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="team-edit-name-action team-edit-done-button"
              onClick={onDoneEditing}
              aria-label="Save team edits"
            >
              <BetterUpIcon name="Check" size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}
      <motion.div className="team-face-grid" aria-label="Team members" layout>
        <AnimatePresence>
          {selectedIds.length === 2 ? (
            <DuoConnection
              key={selectedIds.join(':')}
              containerRef={fieldRef}
              faceRefs={faceRefs}
              selectedIds={selectedIds}
              variant="selected"
            />
          ) : previewSelectedIds ? (
            <DuoConnection
              key={`preview-${previewSelectedIds.join(':')}`}
              containerRef={fieldRef}
              faceRefs={faceRefs}
              selectedIds={previewSelectedIds}
              variant="preview"
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {members.length > 0 ? (
            members.map((member) => (
              <TeamFace
                key={member.id}
                ref={setHitboxNode(member.id)}
                visualRef={setFaceNode(member.id)}
                member={member}
                isBlocked={blockedAttempt?.memberId === member.id}
                blockedAttempt={blockedAttempt?.attempt ?? 0}
                isSelected={selectedIds.includes(member.id)}
                isDuoSelected={
                  selectedIds.length === 2 && selectedIds.includes(member.id)
                }
                isEditingTeam={isEditingTeam}
                nudge={faceNudges[member.id]}
                nudgeMotion={useSelectionNudgeMotion ? 'selection' : 'idle'}
                isDimmed={hasSelection && !selectedIds.includes(member.id)}
                onRemove={() => onRemoveMember?.(member.id)}
                onSelect={() => onSelectMember(member.id)}
                onHoverChange={(isHovered) =>
                  setHoveredMemberId((current) => {
                    if (isHovered) return member.id;
                    return current === member.id ? null : current;
                  })
                }
              />
            ))
          ) : (
            <motion.div className="team-face-empty-state" layout>
              <p>No team members</p>
            </motion.div>
          )}
        </AnimatePresence>
        {isEditingTeam && (
          <motion.button
            type="button"
            className="team-edit-add-member-button"
            onClick={onAddMember}
            aria-label="Add team member"
            animate={{
              opacity: isAddButtonHidden ? 0 : 1,
              scale: isAddButtonHidden ? 0.88 : 1,
            }}
            disabled={isAddButtonHidden}
            initial={false}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <BetterUpIcon name="Plus" size={24} strokeWidth={1.7} />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
