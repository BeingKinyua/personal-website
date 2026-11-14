import React, { useRef } from "react";
import { DigitalRain } from "./digital-rain";
import { HeroContent } from "./hero-content";
import { useHeroEntranceAnimation } from "./hero-animations";
import { DigitalRainTheme } from "./digital-rain-config";

export interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
  onOpenTovu: () => void;
  theme?: DigitalRainTheme;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onOpenTovu,
  theme,
}) => {
  const heroRef = useRef<HTMLElement>(null);

  useHeroEntranceAnimation(heroRef);

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative isolate w-full overflow-hidden bg-[var(--tovu-hero-bg)] pt-28 sm:pt-36 pb-20 sm:pb-24 transition-colors duration-300"
    >
      {/* Layer 2: Reactive Digital Rain Canvas */}
      <DigitalRain
        intensity={0.65}
        interactionRadius={115}
        speed="calm"
        interactionMode="repulsion"
        enablePulse
        theme={theme}
        interactionTargetRef={heroRef}
        className="z-0"
      />

      {/* Layer 3: Responsive Readability Gradient Overlay */}
      {/* Desktop: stronger protection behind left text column, lighter toward right visual field */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block bg-[image:var(--tovu-hero-scrim-desktop)]"
      />
      {/* Mobile: subtle radial protection behind headline/CTAs while keeping rain visible around edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] md:hidden bg-[image:var(--tovu-hero-scrim-mobile)]"
      />
      {/* Bottom edge blend into page background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 z-[1] bg-[image:var(--tovu-hero-bottom-fade)]"
      />

      {/* Layer 4: Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[54vh]">
          <HeroContent onNavigate={onNavigate} onOpenTovu={onOpenTovu} />

          {/* Right visual field left open for Reactive Digital Rain presence */}
          <div
            aria-hidden="true"
            className="hidden lg:block lg:col-span-5 h-[360px] pointer-events-none"
          />
        </div>

        {/* Section Divider */}
        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-white/10 light:via-zinc-900/10 to-transparent" />
      </div>
    </section>
  );
};
