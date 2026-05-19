import React from 'react';

export function InfoBlock({ label }) {
  // Monolith integration tip: keep this skeletal until the supporting-block
  // content model is real. It is a layout/data slot, not final IA yet.
  return (
    <section className="info-block" aria-label={label}>
      <p>{label}</p>
    </section>
  );
}
