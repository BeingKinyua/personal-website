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
    <div className="lg:col-span-7 relative z-10 py-6">
      {/* Tovu Identity & Eyebrow */}
      <div
        data-hero-eyebrow
        className="flex items-center gap-2.5 text-xs font-mono tracking-widest text-zinc-400 light:text-zinc-600 uppercase mb-6"
      >
        <span className="text-teal-400 light:text-teal-700 font-semibold">TOVU</span>
        <span aria-hidden="true" className="text-zinc-600 light:text-zinc-400">·</span>
        <span>Digital Operating Environment</span>
      </div>

      {/* Masked Line-by-Line Headline Reveal */}
      <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white light:text-zinc-900 mb-8 font-mono leading-[1.1] text-balance">
        {HEADLINE_LINES.map((line) => (
          <span key={line} className="block overflow-hidden py-0.5">
            <span data-hero-line className="inline-block will-change-transform">
              {line}
            </span>
          </span>
        ))}
      </h1>

      {/* Primary CTA Actions */}
      <div data-hero-cta className="flex flex-wrap items-center gap-3.5">
        <button
          id="hero-explore-work-btn"
          type="button"
          onClick={() => onNavigate("work")}
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-black light:bg-zinc-900 light:text-white font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 hover:bg-zinc-200 light:hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] light:hover:shadow-[0_6px_20px_rgba(15,23,42,0.18)] active:scale-95 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B10]"
        >
          <span>Explore Work</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          id="hero-ask-tovu-btn"
          type="button"
          onClick={onOpenTovu}
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-teal-500/12 hover:bg-teal-500/20 border border-teal-400/30 text-teal-200 light:bg-teal-700/10 light:hover:bg-teal-700/15 light:border-teal-700/25 light:text-teal-800 font-mono text-xs sm:text-sm tracking-wide transition-all duration-200 hover:shadow-[0_0_20px_rgba(140,224,189,0.22)] active:scale-95 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B10]"
        >
          <Sparkles className="w-4 h-4 text-teal-300 light:text-teal-700" />
          <span>Ask Tovu</span>
        </button>
      </div>
    </div>
  );
};
