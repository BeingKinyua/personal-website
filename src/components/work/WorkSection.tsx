import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Github, ExternalLink, ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import { PROJECTS } from "../../data/projects";
import { ProjectDetailModal } from "./ProjectDetailModal";
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
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Check if desktop / wide enough for horizontal pinning
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const scrollAmount = track.scrollWidth - window.innerWidth + 120;

      const tween = gsap.to(track, {
        x: -scrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${scrollAmount}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(
              PROJECTS.length - 1,
              Math.floor(self.progress * PROJECTS.length)
            );
            setActiveCardIndex(index);
          }
        }
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  const scrollToCard = (index: number) => {
    setActiveCardIndex(index);
    if (trackRef.current) {
      const card = trackRef.current.children[index] as HTMLElement;
      if (card) {
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  };

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative min-h-screen bg-[#07090b] text-zinc-100 py-20 lg:py-0 overflow-hidden flex flex-col justify-center"
    >
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Background Typography Parallax */}
      <ParallaxBackgroundText className="text-[16vw] absolute top-4 left-6 z-0" triggerId="work">
        WORK
      </ParallaxBackgroundText>

      {/* Top Section Header */}
      <div className="px-6 max-w-7xl mx-auto w-full mb-8 lg:mb-6 pt-6 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              WORK // SYSTEM SHOWCASE
            </span>
          </div>
          <TextReveal
            as="h2"
            trigger="scroll"
            duration={0.9}
            className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight"
          >
            Engineered Systems
          </TextReveal>
        </div>

        {/* Navigation Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-zinc-500">
            <span>{String(activeCardIndex + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(PROJECTS.length).padStart(2, "0")}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToCard(Math.max(0, activeCardIndex - 1))}
              disabled={activeCardIndex === 0}
              className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-300" />
            </button>
            <button
              onClick={() => scrollToCard(Math.min(PROJECTS.length - 1, activeCardIndex + 1))}
              disabled={activeCardIndex === PROJECTS.length - 1}
              className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Track Container */}
      <div
        ref={trackRef}
        id="work-horizontal-track"
        className="flex gap-6 sm:gap-8 px-6 lg:px-16 overflow-x-auto lg:overflow-x-visible scrollbar-none snap-x snap-mandatory lg:snap-none z-10 py-4"
      >
        {PROJECTS.map((project, index) => (
          <div
            key={project.id}
            id={`work-card-${project.id}`}
            className="w-[85vw] sm:w-[75vw] lg:w-[68vw] max-w-4xl shrink-0 snap-center rounded-3xl border border-white/10 bg-[#0d0f13] hover:border-white/20 transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative group overflow-hidden"
          >
            {/* Ambient project background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div>
              {/* Header row: Number + Category */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
                    {project.number}
                  </span>
                  <span className="w-px h-4 bg-white/10" />
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-400">
                    {project.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="GitHub Repository"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Live System"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <HorizontalText
                direction="left"
                distance={40}
                trigger="scroll"
                className="text-2xl sm:text-3xl lg:text-4xl font-mono font-medium text-white mb-3 tracking-tight group-hover:text-blue-300 transition-colors"
                as="h3"
              >
                {project.title}
              </HorizontalText>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6 max-w-2xl font-normal">
                {project.subtitle}
              </p>

              {/* Architecture Topology SVG Preview Box */}
              <div className="w-full h-40 sm:h-48 rounded-2xl border border-white/10 bg-[#090a0d] p-4 relative overflow-hidden mb-6">
                <div className="absolute top-2 left-3 text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-blue-400" />
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
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-[#13171e] border border-white/15 text-[10px] font-mono text-zinc-300 shadow-md whitespace-nowrap"
                  >
                    {node.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Row: Technologies + Explore CTA */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {project.technologies.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/5"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <button
                id={`explore-btn-${project.id}`}
                onClick={() => onSelectProject(project.slug)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-medium text-xs font-mono tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shrink-0 shadow-lg active:scale-95"
              >
                <span>EXPLORE PROJECT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        slug={selectedSlug}
        onClose={() => onSelectProject(null)}
        onSelectProject={onSelectProject}
      />
    </section>
  );
};
