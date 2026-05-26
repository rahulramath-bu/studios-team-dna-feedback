import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BetterUpIcon } from './BetterUpIcon.jsx';
import { DuoConnection } from './DuoConnection.jsx';
import { TeamFace } from './TeamFace.jsx';

const DUO_MIN_CENTER_DISTANCE = 176;
const DUO_MAX_NUDGE = 32;
const SECONDARY_MIN_CENTER_DISTANCE = 126;
const SECONDARY_MAX_NUDGE = 24;
const NUDGE_RELAXATION_STEPS = 3;
const TEAM_FACE_SWAP_EXIT_MS = 240;
const TAP_HINT_INITIAL_DELAY_MS = 5000;
const TAP_HINT_VISIBLE_MS = 3300;
const TAP_HINT_GAP_MS = 2600;

function getLayoutCenter(node) {
  return {
    x: node.offsetLeft + node.offsetWidth / 2,
    y: node.offsetTop + node.offsetHeight / 2,
  };
}

function getMeasuredFaceCenter(container, node) {
  const containerRect = container.getBoundingClientRect();
  const rect = node.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left + rect.width / 2,
    y: rect.top - containerRect.top + rect.height / 2,
    radius: Math.min(rect.width, rect.height) / 2,
  };
}

function getDistanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (!lengthSquared) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
    )
  );
  const closest = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function getConnectionObscuredIds(members, connectionIds, fieldRef, faceRefs) {
  if (!connectionIds) return new Set();

  const container = fieldRef.current;
  const [firstId, secondId] = connectionIds;
  const firstNode = faceRefs.current.get(firstId);
  const secondNode = faceRefs.current.get(secondId);

  if (!container || !firstNode || !secondNode) {
    return new Set();
  }

  const selectedSet = new Set(connectionIds);
  const start = getMeasuredFaceCenter(container, firstNode);
  const end = getMeasuredFaceCenter(container, secondNode);
  const obscuredIds = new Set();

  members.forEach((member) => {
    if (selectedSet.has(member.id)) return;

    const node = faceRefs.current.get(member.id);
    if (!node) return;

    const center = getMeasuredFaceCenter(container, node);
    const distance = getDistanceToSegment(center, start, end);

    if (distance <= center.radius + 8) {
      obscuredIds.add(member.id);
    }
  });

  return obscuredIds;
}

function areSetsEqual(first, second) {
  if (first.size !== second.size) return false;

  for (const value of first) {
    if (!second.has(value)) return false;
  }

  return true;
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
 * What: renders the selectable team cluster, team-name editor, add/remove
 * controls, hover preview line, selected duo line, and selected-pair nudge
 * behavior.
 * How: keeps stable button hitboxes while inner visual layers scale; stores DOM
 * refs for each face so DuoConnection and nudge math can measure real positions
 * instead of assuming a specific grid.
 * Port: keep this as Team DNA-owned interaction code. Team roster management
 * now lives in the route-level overlay, so this component should stay focused
 * on selecting people and showing the current team/person/duo context.
 */
export function TeamFaceField({
  teamId,
  members,
  selectedIds,
  blockedAttempt,
  entityEyebrow,
  entityTitle,
  introActive,
  showIntroHint = false,
  onSelectMember,
  onSelectTeam,
}) {
  const hasSelection = selectedIds.length > 0;
  const fieldRef = useRef(null);
  const faceRefs = useRef(new Map());
  const hitboxRefs = useRef(new Map());
  const previousSelectedCount = useRef(selectedIds.length);
  const previousTeamId = useRef(teamId);
  const [faceNudges, setFaceNudges] = useState({});
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const [isTeamSwapWaiting, setIsTeamSwapWaiting] = useState(false);
  const [displayedMembers, setDisplayedMembers] = useState(members);
  const [connectionObscuredIds, setConnectionObscuredIds] = useState(new Set());
  const [activeTapHint, setActiveTapHint] = useState({
    cycle: 0,
    memberId: null,
  });
  const [useSelectionNudgeMotion, setUseSelectionNudgeMotion] = useState(
    selectedIds.length === 2
  );
  const tapHintMemberIds = useMemo(
    () =>
      displayedMembers
        .filter((member) => member.assessmentComplete !== false)
        .map((member) => member.id),
    [displayedMembers]
  );
  const tapHintMemberKey = tapHintMemberIds.join(':');
  const previewMember = displayedMembers.find((member) => member.id === hoveredMemberId);
  const previewSelectedIds =
    selectedIds.length === 1 &&
    previewMember &&
    previewMember.assessmentComplete !== false &&
    !selectedIds.includes(previewMember.id)
      ? [selectedIds[0], previewMember.id]
      : null;
  const activeConnectionIds =
    selectedIds.length === 2 ? selectedIds : previewSelectedIds;
  const activeConnectionKey = activeConnectionIds?.join(':') ?? '';

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
    if (previousTeamId.current === teamId) {
      setDisplayedMembers(members);
      return undefined;
    }

    previousTeamId.current = teamId;
    setHoveredMemberId(null);
    setConnectionObscuredIds(new Set());
    setFaceNudges({});
    setIsTeamSwapWaiting(true);
    setDisplayedMembers([]);

    const timeout = window.setTimeout(() => {
      setDisplayedMembers(members);
      setIsTeamSwapWaiting(false);
    }, TEAM_FACE_SWAP_EXIT_MS);

    return () => window.clearTimeout(timeout);
  }, [teamId, members]);

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
    const canShowTapHint =
      showIntroHint &&
      selectedIds.length === 0 &&
      tapHintMemberIds.length > 0;

    if (!canShowTapHint) {
      setActiveTapHint({ cycle: 0, memberId: null });
      return undefined;
    }

    let cancelled = false;
    let currentCycle = 0;
    let previousMemberId = null;
    const timeouts = [];

    const setManagedTimeout = (callback, delay) => {
      const timeout = window.setTimeout(callback, delay);
      timeouts.push(timeout);
    };

    const queueHint = (delay) => {
      setManagedTimeout(() => {
        if (cancelled) return;

        const candidateMemberIds =
          tapHintMemberIds.length > 1
            ? tapHintMemberIds.filter((memberId) => memberId !== previousMemberId)
            : tapHintMemberIds;
        const memberId =
          candidateMemberIds[
            Math.floor(Math.random() * candidateMemberIds.length)
          ];

        previousMemberId = memberId;
        currentCycle += 1;
        setActiveTapHint({ cycle: currentCycle, memberId });

        setManagedTimeout(() => {
          if (cancelled) return;

          setActiveTapHint({ cycle: currentCycle, memberId: null });
          queueHint(TAP_HINT_GAP_MS);
        }, TAP_HINT_VISIBLE_MS);
      }, delay);
    };

    queueHint(TAP_HINT_INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      setActiveTapHint({ cycle: 0, memberId: null });
    };
  }, [
    selectedIds.length,
    showIntroHint,
    tapHintMemberIds,
    tapHintMemberKey,
  ]);

  // Layout note: duo nudges measure positions, not grid row/column indexes, so
  // this can survive a future horizontal rail.
  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateNudges = () => {
      setFaceNudges(
        resolveFaceNudges(displayedMembers, selectedIds, hitboxRefs)
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
  }, [displayedMembers, selectedIds]);

  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateObscuredIds = () => {
      const nextObscuredIds = getConnectionObscuredIds(
        displayedMembers,
        activeConnectionIds,
        fieldRef,
        faceRefs
      );

      setConnectionObscuredIds((currentObscuredIds) =>
        areSetsEqual(currentObscuredIds, nextObscuredIds)
          ? currentObscuredIds
          : nextObscuredIds
      );
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateObscuredIds);
    };

    scheduleUpdate();
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [displayedMembers, activeConnectionKey]);

  return (
    <motion.div className="team-face-field-wrap" ref={fieldRef} layout>
      <div className="team-face-context-header">
        {hasSelection ? (
          <button
            type="button"
            className="team-face-context-back"
            onClick={onSelectTeam}
            aria-label="Back to team view"
          >
            <BetterUpIcon name="ChevronLeft" size={13} strokeWidth={2.2} />
            Team
          </button>
        ) : (
          <p className="team-face-context-eyebrow">
            {entityEyebrow}
          </p>
        )}
        <h2 className="team-face-context-title">
          <span style={getEntityTitleStyle(entityTitle)}>
            {entityTitle}
          </span>
        </h2>
      </div>
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
              isObstructed={connectionObscuredIds.size > 0}
              selectedIds={previewSelectedIds}
              variant="preview"
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence initial={introActive}>
          {displayedMembers.length > 0 ? (
            displayedMembers.map((member, index) => {
              const isSelectedMember = selectedIds.includes(member.id);

              return (
                <TeamFace
                  key={member.id}
                  ref={setHitboxNode(member.id)}
                  visualRef={setFaceNode(member.id)}
                  member={member}
                  isBlocked={blockedAttempt?.memberId === member.id}
                  blockedAttempt={blockedAttempt?.attempt ?? 0}
                  isSelected={isSelectedMember}
                  isDuoSelected={
                    selectedIds.length === 2 && isSelectedMember
                  }
                  introDelay={introActive ? 0.24 + index * 0.055 : 0}
                  showTapHint={activeTapHint.memberId === member.id}
                  tapHintCycle={activeTapHint.cycle}
                  nudge={faceNudges[member.id]}
                  nudgeMotion={useSelectionNudgeMotion ? 'selection' : 'idle'}
                  isDimmed={hasSelection && !isSelectedMember}
                  isPreviewObscured={connectionObscuredIds.has(member.id)}
                  onSelect={() => onSelectMember(member.id)}
                  onHoverChange={(isHovered) =>
                    setHoveredMemberId((current) => {
                      if (isHovered) return member.id;
                      return current === member.id ? null : current;
                    })
                  }
                />
              );
            })
          ) : isTeamSwapWaiting ? null : (
            <motion.div className="team-face-empty-state" layout>
              <p>No team members</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
