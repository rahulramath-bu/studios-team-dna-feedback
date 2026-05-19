import React, { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
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

function resolveSecondaryNudges(members, selectedIds, faceRefs) {
  const [firstId, secondId] = selectedIds;
  const firstNode = faceRefs.current.get(firstId);
  const secondNode = faceRefs.current.get(secondId);

  if (!firstNode || !secondNode) {
    return {};
  }

  const centers = Object.fromEntries(
    members
      .map((member) => {
        const node = faceRefs.current.get(member.id);
        return node ? [member.id, getLayoutCenter(node)] : null;
      })
      .filter(Boolean)
  );
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

export function TeamFaceField({
  members,
  selectedIds,
  blockedMemberId,
  onSelectMember,
}) {
  const hasSelection = selectedIds.length > 0;
  const fieldRef = useRef(null);
  const faceRefs = useRef(new Map());
  const [duoNudges, setDuoNudges] = useState({});

  const setFaceNode = (memberId) => (node) => {
    if (node) {
      faceRefs.current.set(memberId, node);
    } else {
      faceRefs.current.delete(memberId);
    }
  };

  // Monolith integration tip: the duo nudge measures layout positions, not grid
  // row/column indexes, so this can survive a future horizontal rail.
  useLayoutEffect(() => {
    if (selectedIds.length !== 2) {
      setDuoNudges({});
      return undefined;
    }

    let animationFrame = 0;
    const [firstId, secondId] = selectedIds;

    const updateNudges = () => {
      setDuoNudges(resolveSecondaryNudges(members, selectedIds, faceRefs));
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
    <div className="team-face-field-wrap" ref={fieldRef}>
      <p className="team-face-instruction">
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
            />
          ) : null}
        </AnimatePresence>
        {members.length > 0 ? (
          members.map((member) => (
            <TeamFace
              key={member.id}
              ref={setFaceNode(member.id)}
              member={member}
              isBlocked={blockedMemberId === member.id}
              isSelected={selectedIds.includes(member.id)}
              isDuoSelected={
                selectedIds.length === 2 && selectedIds.includes(member.id)
              }
              nudge={duoNudges[member.id]}
              isDimmed={hasSelection && !selectedIds.includes(member.id)}
              onSelect={() => onSelectMember(member.id)}
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
