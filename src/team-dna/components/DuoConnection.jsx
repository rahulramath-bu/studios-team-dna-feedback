import React, { useLayoutEffect, useState } from 'react';
import { motion } from 'motion/react';

function getCenterWithin(containerRect, node) {
  const rect = node.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left + rect.width / 2,
    y: rect.top - containerRect.top + rect.height / 2,
    radius: Math.min(rect.width, rect.height) / 2,
  };
}

function makeLine(start, end) {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function getEdgeConnection(start, end, radiusOffset = 0) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);

  if (!distance) {
    return { start, end };
  }

  const ux = dx / distance;
  const uy = dy / distance;

  return {
    start: {
      x: start.x + ux * (start.radius + radiusOffset),
      y: start.y + uy * (start.radius + radiusOffset),
    },
    end: {
      x: end.x - ux * (end.radius + radiusOffset),
      y: end.y - uy * (end.radius + radiusOffset),
    },
  };
}

/**
 * Measured connection between two selected faces.
 *
 * What: draws the selected-duo line, or a lighter hover preview line, behind
 * two face visuals.
 * How: measures actual DOM positions relative to the face-field container on
 * layout, resize, and selection changes. It does not assume a grid.
 * Port: keep this local to Team DNA and retest after changing shell height,
 * CSS layout, or a future horizontal/mobile rail.
 */
export function DuoConnection({ containerRef, faceRefs, selectedIds, variant = 'selected' }) {
  const [connection, setConnection] = useState(null);

  useLayoutEffect(() => {
    if (selectedIds.length !== 2) {
      setConnection(null);
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
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const startCenter = getCenterWithin(containerRect, firstNode);
      const endCenter = getCenterWithin(containerRect, secondNode);
      const { start, end } = getEdgeConnection(
        startCenter,
        endCenter,
        variant === 'preview' ? 8 : 0
      );

      setConnection({
        path: makeLine(start, end),
        start,
        end,
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateConnection);
    };

    scheduleUpdate();
    const settleTimer = window.setTimeout(scheduleUpdate, 260);
    window.addEventListener('resize', scheduleUpdate);

    const observer = new ResizeObserver(scheduleUpdate);
    const nodes = [
      containerRef.current,
      faceRefs.current.get(firstId),
      faceRefs.current.get(secondId),
    ].filter(Boolean);

    nodes.forEach((node) => observer.observe(node));

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', scheduleUpdate);
      observer.disconnect();
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
