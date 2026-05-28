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
  Trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
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
  Dna: (
    <>
      <path d="m10 16 1.5 1.5" />
      <path d="m14 8-1.5-1.5" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="m16.5 10.5 1 1" />
      <path d="m17 6-2.891-2.891" />
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="m20 9 .891.891" />
      <path d="M3.109 14.109 4 15" />
      <path d="m6.5 12.5 1 1" />
      <path d="m7 18 2.891 2.891" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    </>
  ),
  ChevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  ArrowUp: (
    <>
      <path d="m12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  Info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7.5v.01" />
    </>
  ),
  Search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  Users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  UserMinus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M23 11h-6" />
    </>
  ),
  MinusCircle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
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
