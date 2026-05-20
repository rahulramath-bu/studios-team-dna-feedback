import { useCallback, useRef, useState } from 'react';

const HOLD_HAPTIC_THRESHOLD_MS = 100;
const HAPTIC_DURATION_MS = 10;

/**
 * Team DNA press feedback hook.
 *
 * What: gives face buttons immediate press-down feedback while preserving
 * normal click semantics.
 * How: pointer-down sets local pressed state and optional haptic feedback;
 * selection still commits through the browser's native click on press-up-inside.
 * Port: map this to a shared BetterUp Pressable primitive if one exists. If not,
 * keep it as a tiny Team DNA hook rather than creating a global primitive from
 * this prototype alone.
 */
export function useTeamDnaPressable({ disabled = false } = {}) {
  const isPressedRef = useRef(false);
  const pressDownTimeRef = useRef(0);
  const [pressed, setPressed] = useState(false);

  const vibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(HAPTIC_DURATION_MS);
    }
  }, []);

  const onPointerDown = useCallback(() => {
    if (disabled) return;
    isPressedRef.current = true;
    pressDownTimeRef.current = Date.now();
    setPressed(true);
    vibrate();
  }, [disabled, vibrate]);

  const onPointerUp = useCallback(() => {
    if (!isPressedRef.current) return;
    const heldMs = Date.now() - pressDownTimeRef.current;
    isPressedRef.current = false;
    setPressed(false);
    if (heldMs >= HOLD_HAPTIC_THRESHOLD_MS) vibrate();
  }, [vibrate]);

  const onPointerLeave = useCallback(() => {
    if (!isPressedRef.current) return;
    isPressedRef.current = false;
    setPressed(false);
  }, []);

  return {
    pressed,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel: onPointerLeave,
    },
  };
}
