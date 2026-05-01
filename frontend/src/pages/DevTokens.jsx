import React from 'react';

export default function DevTokens() {
  return (
    <div className="app-main p-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="text-display-lg text-primary">Tokens Test</h1>
        
        {/* Card */}
        <section>
          <h2 className="text-h2 text-secondary mb-4">Card</h2>
          <div className="bg-surface bg-card-gradient border-subtle rounded-xl shadow-[var(--shadow-card)] p-8">
            <h3 className="text-h3 text-primary mb-2">Glass Surface Card</h3>
            <p className="text-body text-secondary">This card matches the design system parameters.</p>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-h2 text-secondary mb-4">Buttons</h2>
          <div className="flex gap-4">
            <button className="bg-fg-primary text-void rounded-md px-5 py-3 font-body font-medium text-[14px]">Primary Button</button>
            <button className="bg-surface-raised text-primary border border-default rounded-md px-5 py-3 font-body text-[14px]">Secondary Button</button>
            <button className="bg-surface-raised text-danger border border-danger-border rounded-md px-5 py-3 font-body text-[14px]">Destructive Button</button>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-h2 text-secondary mb-4">Inputs</h2>
          <div className="max-w-md">
            <label className="block text-label text-secondary mb-2 tracking-widest uppercase">Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none placeholder:text-tertiary"
            />
          </div>
        </section>

        {/* Status Pills */}
        <section>
          <h2 className="text-h2 text-secondary mb-4">Status Pills</h2>
          <div className="flex gap-4">
            <span className="inline-flex items-center gap-1 px-[10px] py-[4px] rounded-full font-body font-semibold text-[12px] tabular-nums bg-success-bg text-success border border-success-border">
              + 1.09%
            </span>
            <span className="inline-flex items-center gap-1 px-[10px] py-[4px] rounded-full font-body font-semibold text-[12px] tabular-nums bg-danger-bg text-danger border border-danger-border">
              - 0.5%
            </span>
            <span className="inline-flex items-center gap-1 px-[10px] py-[4px] rounded-full font-body font-semibold text-[12px] tabular-nums bg-surface-raised text-secondary border border-default">
              Pending
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
