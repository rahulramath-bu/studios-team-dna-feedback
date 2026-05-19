import React, { useLayoutEffect, useState } from 'react';
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
 * Monolith integration tip: this layer measures actual face button positions.
 * It does not assume a grid, so the same selected-duo effect can survive a
 * future horizontal/mobile rail without rewriting the connection math.
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
      const start = getCenterWithin(containerRect, firstNode);
      const end = getCenterWithin(containerRect, secondNode);

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
