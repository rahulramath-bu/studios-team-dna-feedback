import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

function getCenterWithin(containerRect, node) {
  const rect = node.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left + rect.width / 2,
    y: rect.top - containerRect.top + rect.height / 2,
  };
}

function makeLine(start, end) {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

/**
 * Measured connection between two selected faces.
 *
 * What: draws the selected-duo line, or a lighter hover preview line, behind
 * two face visuals.
 * How: measures actual DOM positions relative to the face-field container on
 * every animation frame while visible. Face movement is transform-driven, so
 * event-based layout checks miss the in-between frames and make the line snap.
 * Port: keep this local to Team DNA and retest after changing shell height,
 * CSS layout, or a future horizontal/mobile rail.
 */
export function DuoConnection({ containerRef, faceRefs, selectedIds, variant = 'selected' }) {
  const [connection, setConnection] = useState(null);
  const previousPathRef = useRef('');

  useLayoutEffect(() => {
    if (selectedIds.length !== 2) {
      setConnection(null);
      previousPathRef.current = '';
      return undefined;
    }

    let animationFrame = 0;
    const [firstId, secondId] = selectedIds;

    const updateConnection = () => {
      const container = containerRef.current;
      const firstNode = faceRefs.current.get(firstId);
      const secondNode = faceRefs.current.get(secondId);

      if (!container || !firstNode || !secondNode) {
        setConnection(null);
        previousPathRef.current = '';
        animationFrame = window.requestAnimationFrame(updateConnection);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const start = getCenterWithin(containerRect, firstNode);
      const end = getCenterWithin(containerRect, secondNode);
      const path = makeLine(start, end);

      if (path !== previousPathRef.current) {
        previousPathRef.current = path;
        setConnection({
          path,
          start,
          end,
        });
      }

      animationFrame = window.requestAnimationFrame(updateConnection);
    };

    animationFrame = window.requestAnimationFrame(updateConnection);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [containerRef, faceRefs, selectedIds]);

  if (!connection) {
    return null;
  }

  return (
    <svg className="duo-connection-layer" aria-hidden="true">
      <motion.path
        className={`duo-connection-line duo-connection-line-${variant}`}
        d={connection.path}
        initial={{ opacity: variant === 'preview' ? 0.4 : 0 }}
        animate={
          variant === 'preview'
            ? { opacity: 0.4, transition: { duration: 0 } }
            : {
                opacity: 1,
                transition: { delay: 0.22, duration: 1, ease: [0.22, 1, 0.36, 1] },
              }
        }
        exit={{ opacity: 0, transition: { duration: 0.05, ease: 'linear' } }}
      />
    </svg>
  );
}
