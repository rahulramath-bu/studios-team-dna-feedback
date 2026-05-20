import React from 'react';

const paths = {
  Edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </>
  ),
  X: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  Plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  Check: (
    <>
      <path d="m20 6-11 11-5-5" />
    </>
  ),
  ChevronLeft: (
    <>
      <path d="m15 18-6-6 6-6" />
    </>
  ),
  Info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7.5v.01" />
    </>
  ),
};

/**
 * Standalone icon bridge.
 *
 * What: tiny local SVG map for the few icons this prototype needs.
 * How: keeps call sites shaped like BetterUp's icon API without adding a third
 * party icon package to the standalone app.
 * Port: delete this file and replace usage with
 * `import { Icon } from '@betterup/icons/src/Icon'`, then render
 * `<Icon name="Edit" />` directly.
 */
export function BetterUpIcon({ name, size = 20, strokeWidth = 1.8, ...props }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
