import { useCallback, useRef, useState } from 'react';

const HOLD_HAPTIC_THRESHOLD_MS = 100;
const HAPTIC_DURATION_MS = 10;

/**
 * Local version of BetterApart's press grammar.
 *
 * The visual "press down" is immediate, but selection still commits through the
 * native click event on press-up-inside. When this ports into the monolith, this
 * should either map to a shared Pressable primitive or stay as a tiny Team DNA
 * hook if the broader app is not ready for a global interaction primitive.
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
