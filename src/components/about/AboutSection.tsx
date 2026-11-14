import React from "react";
import { ArrowRight } from "lucide-react";
import { TIMELINE_MILESTONES } from "../../data/timeline";

interface AboutSectionProps {
  onNavigateToContact: () => void;
}

const TENETS = [
  {
    number: "01",
    title: "Systems Over Silos",
    body: "A feature never exists in isolation. Every product sits inside a feedback loop connecting hardware latency, storage write amplification, and human cognitive flow.",
  },
  {
    number: "02",
    title: "Determinism Before Generation",
    body: "Never trust an unconstrained model to perform a state mutation that belongs to a compiler, a finite state machine, or a strict schema boundary.",
  },
  {
    number: "03",
    title: "Relentless Restraint",
    body: "Quality comes from what you refuse to add. Clear defaults, disciplined typographic scale, and thoughtful architecture outlast superficial embellishment.",
  },
];

export const AboutSection: React.FC<AboutSectionProps> = ({ onNavigateToContact }) => {
  return (
    <section
      id="about"
      className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto text-[var(--tovu-text-primary)] border-t border-[var(--tovu-border-hairline)]"
    >
      {/* Section Header */}
      <div className="mb-16 max-w-3xl">
        <p className="text-[13px] font-mono tracking-[0.14em] uppercase text-[var(--tovu-accent)] mb-3">
          05 · About
        </p>
        <h2 className="font-display font-semibold tracking-[-0.025em] text-[var(--tovu-text-primary)] leading-[1.06] text-[clamp(2.25rem,4.4vw,4rem)]">
          Systems. Curiosity. Craft.
        </h2>
      </div>

      {/* 1. Narrative & Tenets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-24">
        <div className="lg:col-span-6 space-y-6">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
            Who I Am
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--tovu-text-primary)] leading-snug">
            Software Engineer, AI Builder, Data Thinker
          </h3>
          <div className="space-y-5 text-[17px] sm:text-[18px] text-[var(--tovu-text-secondary)] leading-[1.7] max-w-[62ch]">
            <p>
              I am Victor Kinyua. I am drawn to foundational technical questions: how to build distributed software that stays correct under network partitions, how to bound AI systems with deterministic state machines, and how to design interfaces that respect human attention.
            </p>
            <p className="text-[var(--tovu-text-muted)]">
              My work spans low-level infrastructure in Go and Rust, applied computer vision in PyTorch, and expressive software environments in TypeScript and React.
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
            How I Think
          </p>
          <div className="divide-y divide-[var(--tovu-border-hairline)] border-y border-[var(--tovu-border-hairline)]">
            {TENETS.map((tenet) => (
              <div key={tenet.number} className="py-6 flex gap-5">
                <span className="font-mono text-sm font-semibold text-[var(--tovu-accent)] tabular-nums shrink-0 pt-1">
                  {tenet.number}
                </span>
                <div className="space-y-1.5">
                  <h4 className="font-display text-lg sm:text-xl font-semibold text-[var(--tovu-text-primary)]">
                    {tenet.title}
                  </h4>
                  <p className="text-base text-[var(--tovu-text-secondary)] leading-[1.65]">
                    {tenet.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Experience & Milestones */}
      <div className="mb-20">
        <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)] mb-8">
          Path &amp; Milestones
        </p>

        <div className="divide-y divide-[var(--tovu-border-hairline)] border-y border-[var(--tovu-border-hairline)]">
          {TIMELINE_MILESTONES.map((milestone, idx) => (
            <div
              key={idx}
              className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8"
            >
              <div className="lg:col-span-4 space-y-1">
                <div className="font-mono text-sm text-[var(--tovu-accent)] tabular-nums">
                  {milestone.year} · {milestone.quarter}
                </div>
                <div className="font-display text-xl font-semibold text-[var(--tovu-text-primary)]">
                  {milestone.role}
                </div>
                <div className="text-[15px] text-[var(--tovu-text-muted)]">
                  {milestone.organization}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <p className="text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65]">
                  {milestone.description}
                </p>

                {milestone.impactHighlight && (
                  <p className="text-[15px] font-medium text-[var(--tovu-text-primary)]">
                    <span className="font-mono text-[13px] uppercase tracking-wider text-[var(--tovu-accent)] mr-2.5">
                      Impact
                    </span>
                    {milestone.impactHighlight}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                  {milestone.skills.map((skill, sIdx) => (
                    <React.Fragment key={skill}>
                      {sIdx > 0 && <span aria-hidden="true">·</span>}
                      <span>{skill}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Forward Direction */}
      <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-accent)]">
            Looking Ahead
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--tovu-text-primary)] leading-tight">
            Exploring edge verification, responsive agent systems, and accessible computer vision
          </h3>
          <p className="text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65]">
            Focused on zero-knowledge verifiers at the edge, low-latency agent coordination, and bringing automated sports telemetry to grassroots athletes.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToContact}
          className="min-h-[48px] inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] font-medium text-[15px] hover:opacity-90 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
        >
          <span>Get in Touch</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
