import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Github, ExternalLink, ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import { PROJECTS } from "../../data/projects";
import { TextReveal } from "../motion/TextReveal";
import { HorizontalText } from "../motion/HorizontalText";
import { ParallaxBackgroundText } from "../motion/ParallaxBackgroundText";

gsap.registerPlugin(ScrollTrigger);

interface WorkSectionProps {
  selectedSlug: string | null;
  onSelectProject: (slug: string | null) => void;
}

export const WorkSection: React.FC<WorkSectionProps> = ({
  selectedSlug,
  onSelectProject
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Calculate dynamic horizontal distance across all screen layouts
    const getScrollAmount = () => {
      if (!track) return 0;
      const endPadding = window.innerWidth < 640 ? 24 : window.innerWidth < 1024 ? 48 : 96;
      return Math.max(0, track.scrollWidth - window.innerWidth + endPadding);
    };

    const ctx = gsap.context(() => {
      const tween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(
              PROJECTS.length - 1,
              Math.max(0, Math.floor(self.progress * PROJECTS.length))
            );
            setActiveCardIndex(index);
          },
        },
      });

      tweenRef.current = tween;
    }, section);

    return () => {
      ctx.revert();
      tweenRef.current = null;
    };
  }, []);

  const scrollToCard = (index: number) => {
    setActiveCardIndex(index);
    const tween = tweenRef.current;
    if (tween && tween.scrollTrigger) {
      const st = tween.scrollTrigger;
      const progress = index / Math.max(1, PROJECTS.length - 1);
      const targetScroll = st.start + progress * (st.end - st.start);
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  };

  // Support touch swipe gestures on mobile/tablet to seamlessly navigate projects
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          scrollToCard(Math.min(PROJECTS.length - 1, activeCardIndex + 1));
        } else {
          scrollToCard(Math.max(0, activeCardIndex - 1));
        }
      }
    };

    track.addEventListener("touchstart", onTouchStart, { passive: true });
    track.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeCardIndex]);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative h-[100svh] min-h-[560px] max-h-[100svh] bg-[#07090b] text-zinc-100 py-2 sm:py-4 lg:py-6 overflow-hidden flex flex-col justify-between"
    >
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Background Typography Parallax */}
      <ParallaxBackgroundText className="text-[18vw] sm:text-[16vw] absolute top-4 left-6 z-0" triggerId="work">
        WORK
      </ParallaxBackgroundText>

      {/* Top Section Header */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full pt-1 sm:pt-2 pb-2 z-10 flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono tracking-widest text-zinc-400 uppercase">
              WORK // SYSTEM SHOWCASE
            </span>
          </div>
          <TextReveal
            as="h2"
            trigger="scroll"
            duration={0.9}
            className="text-xl sm:text-2xl lg:text-3xl font-mono font-medium text-white tracking-tight"
          >
            Engineered Systems
          </TextReveal>
        </div>

        {/* Navigation Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 font-mono text-xs text-zinc-400 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-white font-semibold">{String(activeCardIndex + 1).padStart(2, "0")}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{String(PROJECTS.length).padStart(2, "0")}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollToCard(Math.max(0, activeCardIndex - 1))}
              disabled={activeCardIndex === 0}
              className="p-1.5 sm:p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              aria-label="Previous project"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
            </button>
            <button
              onClick={() => scrollToCard(Math.min(PROJECTS.length - 1, activeCardIndex + 1))}
              disabled={activeCardIndex === PROJECTS.length - 1}
              className="p-1.5 sm:p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              aria-label="Next project"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Track Container - Viewport Aware Across All Screen Layouts */}
      <div
        ref={trackRef}
        id="work-horizontal-track"
        className="flex gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-8 lg:px-16 overflow-visible scrollbar-none z-10 py-1 sm:py-2 flex-nowrap will-change-transform items-center flex-1 min-h-0"
      >
        {PROJECTS.map((project, index) => (
          <div
            key={project.id}
            id={`work-card-${project.id}`}
            onClick={() => onSelectProject(project.slug)}
            className="w-[88vw] xs:w-[82vw] sm:w-[72vw] md:w-[64vw] lg:w-[58vw] max-w-3xl shrink-0 h-[calc(100svh-110px)] max-h-[520px] sm:max-h-[560px] lg:max-h-[580px] rounded-2xl sm:rounded-3xl border border-white/10 hover:border-blue-500/40 bg-[#0d0f13] transition-all duration-300 p-4 sm:p-6 lg:p-7 flex flex-col justify-between shadow-2xl relative group overflow-hidden cursor-pointer select-none"
          >
            {/* Ambient project background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            {/* Top Container: Header + Title + Summary + Metrics */}
            <div className="shrink-0 flex flex-col">
              {/* Header row: Number + Category + Quick Actions + Top Explore CTA */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b border-white/10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-base sm:text-xl font-mono font-bold text-white tracking-tight">
                    {project.number}
                  </span>
                  <span className="w-px h-3.5 bg-white/10" />
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-blue-400 font-medium">
                    {project.category}
                  </span>
                  {project.version && (
                    <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                      {project.version}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Top Direct Explore CTA on mobile/tablet */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(project.slug);
                    }}
                    className="flex sm:hidden items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-medium hover:bg-blue-500/25 transition-colors"
                  >
                    <span>EXPLORE</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="GitHub Repository"
                    >
                      <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Live System"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title */}
              <HorizontalText
                direction="left"
                distance={30}
                trigger="scroll"
                className="text-lg sm:text-2xl lg:text-3xl font-mono font-medium text-white mb-1.5 sm:mb-2 tracking-tight group-hover:text-blue-300 transition-colors line-clamp-1"
                as="h3"
              >
                {project.title}
              </HorizontalText>

              {/* Summary / Subtitle (Always in prime view) */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-2 sm:mb-3 font-normal line-clamp-2 sm:line-clamp-3">
                {project.subtitle}
              </p>

              {/* Quick Metrics Bar (Immediate scanning value) */}
              {project.metrics && project.metrics.length > 0 && (
                <div className="flex items-center gap-2 mb-2 sm:mb-3 overflow-x-hidden">
                  {project.metrics.slice(0, 2).map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] sm:text-[11px] font-mono"
                    >
                      <span className="text-blue-400 font-semibold">{m.value}</span>
                      <span className="text-zinc-400">{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Architecture Topology SVG Preview Box (Flexibly budgeted height) */}
            <div className="w-full flex-1 min-h-[70px] max-h-[140px] sm:max-h-[170px] lg:max-h-[200px] rounded-xl sm:rounded-2xl border border-white/10 bg-[#090a0d] p-2.5 sm:p-3.5 relative overflow-hidden mb-2 sm:mb-3 shrink-1">
              <div className="absolute top-2 left-3 text-[8px] sm:text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 z-10">
                <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                <span>ARCHITECTURE TOPOLOGY PREVIEW</span>
              </div>

              <svg className="w-full h-full pointer-events-none">
                {project.architectureLines.map((line, lIdx) => {
                  const fromNode = project.architectureNodes.find((n) => n.id === line.from);
                  const toNode = project.architectureNodes.find((n) => n.id === line.to);
                  if (!fromNode || !toNode) return null;
                  return (
                    <line
                      key={lIdx}
                      x1={`${fromNode.x}%`}
                      y1={`${fromNode.y}%`}
                      x2={`${toNode.x}%`}
                      y2={`${toNode.y}%`}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  );
                })}
              </svg>

              {project.architectureNodes.map((node) => (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#13171e] border border-white/15 text-[8px] sm:text-[10px] font-mono text-zinc-300 shadow-md whitespace-nowrap"
                >
                  {node.label}
                </div>
              ))}
            </div>

            {/* Bottom Row: Technologies + Explore CTA (Guaranteed 100% visible) */}
            <div className="pt-2.5 sm:pt-3.5 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {project.technologies.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/5"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <button
                id={`explore-btn-${project.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(project.slug);
                }}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black font-semibold text-[11px] sm:text-xs font-mono tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shrink-0 shadow-lg active:scale-95 group-hover:bg-blue-400 group-hover:text-black"
              >
                <span>EXPLORE PROJECT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
