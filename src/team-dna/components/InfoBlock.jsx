import React from 'react';

export function InfoBlock({ label, className = '', isActive = false }) {
  // Monolith integration tip: keep this skeletal until the supporting-block
  // content model is real. It is a layout/data slot, not final IA yet.
  const blockClassName = ['info-block', className].filter(Boolean).join(' ');

  return (
    <section
      className={blockClassName}
      data-snap-active={isActive || undefined}
      aria-label={label}
    >
      <p>{label}</p>
    </section>
  );
}
