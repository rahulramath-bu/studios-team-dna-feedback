import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TeamDnaTooltipProvider = TooltipPrimitive.Provider;

/**
 * Local copy of the monolith tooltip direction.
 *
 * BetterUp's current `BUTooltip` wraps Radix Tooltip. This standalone version
 * uses the same primitive and a very similar API, but keeps the trigger asChild
 * so keyboard focus on a face button opens the name label too. In the monolith,
 * replace this with `BUTooltip` or a future component-library Tooltip.
 */
export function TeamDnaTooltip({
  text,
  children,
  position = 'top',
  delay = 100,
  sideOffset = 12,
  open,
  onOpenChange,
}) {
  if (!text) {
    return children;
  }

  return (
    <TooltipPrimitive.Root
      delayDuration={delay}
      open={open}
      onOpenChange={onOpenChange}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="team-dna-tooltip"
          side={position}
          sideOffset={sideOffset}
        >
          {text}
          <TooltipPrimitive.Arrow className="team-dna-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
