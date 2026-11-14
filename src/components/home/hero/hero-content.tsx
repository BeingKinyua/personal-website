import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export interface HeroContentProps {
  onNavigate: (sectionId: string) => void;
  onOpenTovu: () => void;
}

const HEADLINE_LINES = ["Learning,", "Exploring,", "Building."];

export const HeroContent: React.FC<HeroContentProps> = ({
  onNavigate,
  onOpenTovu,
}) => {
  return (
    <div className="lg:col-span-8 relative z-10 py-4 sm:py-6">
      {/* Editorial Eyebrow */}
      <div
        data-hero-eyebrow
        className="flex items-center gap-3 text-[13px] font-mono tracking-[0.14em] text-[var(--tovu-text-muted)] uppercase mb-7"
      >
        <span className="text-[var(--tovu-accent)] font-semibold">Tovu</span>
        <span aria-hidden="true" className="text-[var(--tovu-border-strong)]">·</span>
        <span>Victor Kinyua</span>
      </div>

      {/* Monumental Fluid Display Headline */}
      <h1 className="font-display font-semibold tracking-[-0.03em] text-[var(--tovu-text-primary)] mb-8 leading-[0.98] text-[clamp(3rem,6.6vw,6.25rem)] text-balance">
        {HEADLINE_LINES.map((line) => (
          <span key={line} className="block overflow-hidden py-0.5">
            <span data-hero-line className="inline-block will-change-transform">
              {line}
            </span>
          </span>
        ))}
      </h1>

      {/* Concise Human Introduction */}
      <p
        data-hero-description
        className="text-[clamp(1.0625rem,1.35vw,1.25rem)] text-[var(--tovu-text-secondary)] max-w-xl leading-[1.6] mb-10 font-normal"
      >
        A living digital environment for distributed software systems, applied intelligence, technical writing, and active research.
      </p>

      {/* Primary CTA Actions */}
      <div data-hero-cta className="flex flex-wrap items-center gap-4">
        <button
          id="hero-explore-work-btn"
          type="button"
          onClick={() => onNavigate("work")}
          className="group min-h-[48px] inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] font-medium text-[15px] tracking-tight transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tovu-hero-bg)]"
        >
          <span>Explore Work</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          id="hero-ask-tovu-btn"
          type="button"
          onClick={onOpenTovu}
          className="group min-h-[48px] inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[var(--tovu-accent-soft)] hover:bg-[var(--tovu-accent)] border border-[var(--tovu-accent-border)] text-[var(--tovu-accent)] hover:text-[var(--tovu-accent-ink)] font-medium text-[15px] tracking-tight transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tovu-hero-bg)]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask Tovu</span>
        </button>
      </div>
    </div>
  );
};
