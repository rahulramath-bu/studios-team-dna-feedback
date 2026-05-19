import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DuoConnection } from './DuoConnection.jsx';
import { TeamFace } from './TeamFace.jsx';

const DUO_MIN_CENTER_DISTANCE = 176;
const DUO_MAX_NUDGE = 32;
const SECONDARY_MIN_CENTER_DISTANCE = 126;
const SECONDARY_MAX_NUDGE = 24;
const NUDGE_RELAXATION_STEPS = 3;
const HOVER_MIN_CENTER_DISTANCE = 134;
const HOVER_MAX_NUDGE = 12;

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

function resolveHoverNudges(members, hoveredMemberId, selectedIds, centers, baseNudges) {
  if (!hoveredMemberId || selectedIds.includes(hoveredMemberId) || !centers[hoveredMemberId]) {
    return baseNudges;
  }

  const nudges = { ...baseNudges };
  const hoveredNudge = nudges[hoveredMemberId] ?? { x: 0, y: 0 };
  const hoveredCenter = {
    x: centers[hoveredMemberId].x + hoveredNudge.x,
    y: centers[hoveredMemberId].y + hoveredNudge.y,
  };

  for (const member of members) {
    if (member.id === hoveredMemberId || !centers[member.id]) continue;

    const memberNudge = nudges[member.id] ?? { x: 0, y: 0 };
    const memberCenter = {
      x: centers[member.id].x + memberNudge.x,
      y: centers[member.id].y + memberNudge.y,
    };
    const dx = memberCenter.x - hoveredCenter.x;
    const dy = memberCenter.y - hoveredCenter.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= HOVER_MIN_CENTER_DISTANCE) continue;

    const safeDistance = distance || 1;
    const amount = Math.min(
      HOVER_MAX_NUDGE,
      (HOVER_MIN_CENTER_DISTANCE - safeDistance) / 2
    );

    addNudge(nudges, member.id, {
      x: (dx / safeDistance) * amount,
      y: (dy / safeDistance) * amount,
    });
    nudges[member.id] = limitNudge(
      nudges[member.id],
      Math.max(HOVER_MAX_NUDGE, Math.hypot(memberNudge.x, memberNudge.y))
    );
  }

  return nudges;
}

function resolveFaceNudges(members, selectedIds, hoveredMemberId, hitboxRefs) {
  const centers = getCenters(members, hitboxRefs);
  const duoNudges =
    selectedIds.length === 2
      ? resolveDuoNudges(members, selectedIds, hitboxRefs, centers)
      : {};

  return resolveHoverNudges(
    members,
    hoveredMemberId,
    selectedIds,
    centers,
    duoNudges
  );
}

export function TeamFaceField({
  members,
  selectedIds,
  blockedAttempt,
  onSelectMember,
}) {
  const hasSelection = selectedIds.length > 0;
  const fieldRef = useRef(null);
  const faceRefs = useRef(new Map());
  const hitboxRefs = useRef(new Map());
  const previousSelectedCount = useRef(selectedIds.length);
  const [faceNudges, setFaceNudges] = useState({});
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const [useSelectionNudgeMotion, setUseSelectionNudgeMotion] = useState(
    selectedIds.length === 2
  );
  const previewMember = members.find((member) => member.id === hoveredMemberId);
  const previewSelectedIds =
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

  // Monolith integration tip: nudges measure layout positions, not grid
  // row/column indexes, so this can survive a future horizontal rail.
  useLayoutEffect(() => {
    let animationFrame = 0;

    const updateNudges = () => {
      setFaceNudges(
        resolveFaceNudges(members, selectedIds, hoveredMemberId, hitboxRefs)
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
  }, [members, selectedIds, hoveredMemberId]);

  return (
    <div className="team-face-field-wrap" ref={fieldRef}>
      <p
        className="team-face-instruction"
        data-hidden={selectedIds.length === 2 || undefined}
      >
        {hasSelection ? 'Select another to pair' : 'Select to explore'}
      </p>
      <div className="team-face-grid" aria-label="Team members">
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
              nudge={faceNudges[member.id]}
              nudgeMotion={useSelectionNudgeMotion ? 'selection' : 'hover'}
              isDimmed={hasSelection && !selectedIds.includes(member.id)}
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
          <div className="team-face-empty-state">
            <p>No team members</p>
          </div>
        )}
      </div>
    </div>
  );
}
