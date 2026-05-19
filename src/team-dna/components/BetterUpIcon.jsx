import React from 'react';

const paths = {
  Edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </>
  ),
};

/**
 * Standalone bridge for the monolith icon pattern.
 *
 * The monolith should replace this with:
 * `import { Icon } from '@betterup/icons/src/Icon'`
 * and render `<Icon name="Edit" />` directly.
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
