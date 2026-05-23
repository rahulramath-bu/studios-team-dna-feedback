import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DuoConnection } from './DuoConnection.jsx';
import { TeamFace } from './TeamFace.jsx';

const PREVIEW_MEMBERS = [
  {
    id: 'preview-mae',
    name: 'Mae',
    avatarUrl: '/team-dna/avatars/mae-gowda.png',
    assessmentComplete: true,
    bigFive: {
      openness: 92,
      conscientiousness: 52,
      extraversion: 38,
      agreeableness: 80,
      neuroticism: 52,
    },
  },
  {
    id: 'preview-darshan',
    name: 'Darshan',
    avatarUrl: '/team-dna/avatars/darshan-bhatt.png',
    assessmentComplete: true,
    bigFive: {
      openness: 94,
      conscientiousness: 92,
      extraversion: 86,
      agreeableness: 82,
      neuroticism: 16,
    },
  },
  {
    id: 'preview-rainy',
    name: 'Rainy',
    avatarUrl: '/team-dna/avatars/rainy-gu-field.png',
    assessmentComplete: true,
    bigFive: {
      openness: 96,
      conscientiousness: 86,
      extraversion: 22,
      agreeableness: 78,
      neuroticism: 14,
    },
  },
];

const PREVIEW_PAIRS = [
  {
    ids: ['preview-mae', 'preview-darshan'],
    insightLabel: '2x impact',
    insightType: 'lines',
    cursorStart: { x: 105, y: 118 },
    cursorTarget: { x: 330, y: 166 },
  },
  {
    ids: ['preview-darshan', 'preview-rainy'],
    insightLabel: 'Pairs well on ideation',
    insightType: 'bars',
    traitBars: [72, 92, 58, 78, 24],
    cursorStart: { x: 330, y: 166 },
    cursorTarget: { x: 176, y: 337 },
  },
  {
    ids: ['preview-rainy', 'preview-mae'],
    insightLabel: 'Watch for friction',
    insightType: 'lines',
    cursorStart: { x: 176, y: 337 },
    cursorTarget: { x: 105, y: 118 },
  },
];

const PREVIEW_PAIR_INTERVAL_MS = 8800;
const PREVIEW_SELECTION_AFTER_CLICK_MS = 1150;
const PREVIEW_INTRO_MS = 3600;

/**
 * Empty-state product preview.
 *
 * What: standalone preview of the real Team DNA interaction language: actual
 * face buttons, measured duo connection lines, and an abstract insight card.
 * How: cycles through fixed sample pairings without changing app state.
 * Port: swap sample-safe people in here if these local fixtures are removed.
 */
export function TeamDnaEmptyPreview() {
  const [pairIndex, setPairIndex] = useState(0);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [hasPreviewStarted, setHasPreviewStarted] = useState(false);
  const [hasActivePair, setHasActivePair] = useState(false);
  const containerRef = useRef(null);
  const hitboxRefs = useRef(new Map());
  const faceRefs = useRef(new Map());
  const pendingSelectionTimeouts = useRef([]);
  const selectedPair = PREVIEW_PAIRS[pairIndex];
  const cursorPair = PREVIEW_PAIRS[cursorIndex];
  const selectedIds = hasActivePair ? selectedPair.ids : [];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setHasPreviewStarted(true);
      setHasActivePair(true);
      return undefined;
    }

    const previewStart = window.setTimeout(() => {
      setHasPreviewStarted(true);
    }, PREVIEW_INTRO_MS);

    const firstSelection = window.setTimeout(() => {
      setHasActivePair(true);
    }, PREVIEW_INTRO_MS + PREVIEW_SELECTION_AFTER_CLICK_MS);

    return () => {
      window.clearTimeout(previewStart);
      window.clearTimeout(firstSelection);
    };
  }, []);

  useEffect(() => {
    if (!hasPreviewStarted) return undefined;

    const interval = window.setInterval(() => {
      setCursorIndex((current) => {
        const next = (current + 1) % PREVIEW_PAIRS.length;
        const timeout = window.setTimeout(() => {
          setPairIndex(next);
          setHasActivePair(true);
        }, PREVIEW_SELECTION_AFTER_CLICK_MS);

        pendingSelectionTimeouts.current.push(timeout);
        return next;
      });
    }, PREVIEW_PAIR_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      pendingSelectionTimeouts.current.forEach((timeout) => window.clearTimeout(timeout));
      pendingSelectionTimeouts.current = [];
    };
  }, [hasPreviewStarted]);

  const setHitboxNode = (memberId) => (node) => {
    if (node) {
      hitboxRefs.current.set(memberId, node);
    } else {
      hitboxRefs.current.delete(memberId);
    }
  };

  const setFaceNode = (memberId) => (node) => {
    if (node) {
      faceRefs.current.set(memberId, node);
    } else {
      faceRefs.current.delete(memberId);
    }
  };

  return (
    <div className="team-dna-empty-preview" aria-hidden="true">
      <div className="team-dna-empty-preview-stage">
        <div className="team-dna-empty-preview-field" ref={containerRef}>
          <AnimatePresence mode="wait">
            {selectedIds.length === 2 ? (
              <DuoConnection
                key={selectedIds.join(':')}
                containerRef={containerRef}
                faceRefs={faceRefs}
                selectedIds={selectedIds}
                variant="selected"
              />
            ) : null}
          </AnimatePresence>
          {PREVIEW_MEMBERS.map((member, index) => {
            const isSelected = selectedIds.includes(member.id);

            return (
              <div
                key={member.id}
                className="team-dna-empty-preview-face-slot"
                data-index={index}
              >
                <TeamFace
                  ref={setHitboxNode(member.id)}
                  visualRef={setFaceNode(member.id)}
                  member={member}
                  isBlocked={false}
                  blockedAttempt={0}
                  isSelected={isSelected}
                  isDuoSelected={isSelected}
                  isEditingTeam={false}
                  isDimmed={hasActivePair && !isSelected}
                  isPreviewObscured={false}
                  nudge={{ x: 0, y: 0 }}
                  nudgeMotion="selection"
                  onHoverChange={() => {}}
                  onRemove={() => {}}
                  onSelect={() => {}}
                />
              </div>
            );
          })}
        </div>
        {hasPreviewStarted ? (
          <span
            key={`cursor-${cursorPair.ids.join(':')}`}
            className="team-dna-empty-preview-cursor"
            style={{
              '--empty-preview-cursor-start-x': `${cursorPair.cursorStart.x}px`,
              '--empty-preview-cursor-start-y': `${cursorPair.cursorStart.y}px`,
              '--empty-preview-cursor-x': `${cursorPair.cursorTarget.x}px`,
              '--empty-preview-cursor-y': `${cursorPair.cursorTarget.y}px`,
            }}
          />
        ) : null}
        {hasActivePair ? (
          <div
            key={`insight-${selectedPair.ids.join(':')}`}
            className="team-dna-empty-preview-insight-card"
            data-pair-index={pairIndex}
          >
            <span className="team-dna-empty-preview-insight-metric">
              {selectedPair.insightLabel}
            </span>
            <b className="team-dna-empty-preview-star" data-star="one" aria-hidden="true" />
            <b className="team-dna-empty-preview-star" data-star="two" aria-hidden="true" />
            <b className="team-dna-empty-preview-star" data-star="three" aria-hidden="true" />
            {selectedPair.insightType === 'bars' ? (
              <div className="team-dna-empty-preview-trait-bars">
                {selectedPair.traitBars.map((value, index) => (
                  <span
                    key={index}
                    data-trait-index={index}
                    style={{ '--empty-preview-trait-height': `${value}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="team-dna-empty-preview-card-lines">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
