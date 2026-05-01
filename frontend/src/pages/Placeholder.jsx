import React from 'react';

export default function Placeholder({ title }) {
  return (
    <div className="bg-surface bg-card-gradient border border-subtle rounded-2xl p-8 shadow-[var(--shadow-card)]">
      <h1 className="text-h1 text-primary mb-4 font-display">{title}</h1>
      <p className="text-body text-secondary">
        This is a placeholder for the {title} screen. It will be built in the upcoming phases.
      </p>
    </div>
  );
}
