import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Github, ExternalLink, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useProjectsData } from "../../hooks/useContentData";
import { useReducedMotion } from "../../hooks/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

interface WorkSectionProps {
  selectedSlug: string | null;
  onSelectProject: (slug: string | null) => void;
}

export const WorkSection: React.FC<WorkSectionProps> = ({
  selectedSlug: _selectedSlug,
  onSelectProject,
}) => {
  const { data: projects, loading, error, isFixture, reload } = useProjectsData();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setActiveCardIndex((prev) =>
      projects.length === 0 ? 0 : Math.min(prev, projects.length - 1)
    );
  }, [projects.length]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion || loading || error || projects.length === 0) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const getScrollAmount = () => {
        if (!track) return 0;
        return Math.max(0, track.scrollWidth - window.innerWidth + 120);
      };

      const tween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 0.9,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(
              projects.length - 1,
              Math.max(0, Math.floor(self.progress * projects.length))
            );
            setActiveCardIndex(index);
          },
        },
      });

      tweenRef.current = tween;
      ScrollTrigger.refresh();

      return () => {
        tweenRef.current = null;
      };
    });

    return () => {
      mm.revert();
      tweenRef.current = null;
    };
  }, [prefersReducedMotion, loading, error, projects.length]);

  const scrollToCard = (index: number) => {
    setActiveCardIndex(index);
    const tween = tweenRef.current;
    if (tween && tween.scrollTrigger) {
      const st = tween.scrollTrigger;
      const progress = index / Math.max(1, projects.length - 1);
      const targetScroll = st.start + progress * (st.end - st.start);
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative bg-[var(--tovu-bg-canvas)] text-[var(--tovu-text-primary)] py-20 sm:py-24 lg:py-0 lg:h-[100svh] lg:min-h-[680px] lg:flex lg:flex-col lg:justify-between overflow-hidden transition-colors duration-200"
    >
      {/* Section Header */}
      <div className="px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto w-full lg:pt-24 pb-8 lg:pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 shrink-0">
        <div>
          <p className="text-[13px] font-mono tracking-[0.14em] uppercase text-[var(--tovu-accent)] mb-3">
            01 · Selected Work
            {isFixture && (
              <span className="ml-3 text-[12px] tracking-[0.06em] text-[var(--tovu-text-muted)]">
                (Dev Fixture Mode)
              </span>
            )}
          </p>
          <h2 className="font-display font-semibold tracking-[-0.025em] text-[var(--tovu-text-primary)] leading-[1.05] text-[clamp(2.25rem,4.4vw,4rem)]">
            Engineered Systems
          </h2>
        </div>

        {/* Desktop Pinned Track Controls */}
        {!prefersReducedMotion && !loading && !error && projects.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <span className="font-mono text-sm tabular-nums text-[var(--tovu-text-muted)] mr-2">
              <strong className="text-[var(--tovu-text-primary)] font-semibold">
                {String(activeCardIndex + 1).padStart(2, "0")}
              </strong>{" "}
              / {String(projects.length).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={() => scrollToCard(Math.max(0, activeCardIndex - 1))}
              disabled={activeCardIndex === 0}
              aria-label="Previous project"
              className="w-11 h-11 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-border-strong)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToCard(Math.min(projects.length - 1, activeCardIndex + 1))}
              disabled={activeCardIndex === projects.length - 1}
              aria-label="Next project"
              className="w-11 h-11 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-border-strong)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Loading / Error / Empty / Track */}
      {loading && (
        <div
          aria-busy="true"
          aria-label="Loading engineered systems"
          className="px-5 sm:px-8 lg:px-10 max-w-7xl lg:max-w-none mx-auto w-full grid grid-cols-1 gap-8 lg:flex lg:flex-nowrap lg:gap-8 lg:px-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:flex-1 lg:min-h-0 lg:pb-10"
        >
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-6 sm:p-8 lg:p-9 flex flex-col justify-between gap-6 lg:w-[62vw] lg:max-w-[800px] lg:shrink-0 lg:max-h-[560px] animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-4 w-48 rounded bg-[var(--tovu-bg-inset)]" />
                <div className="h-8 w-2/3 rounded bg-[var(--tovu-bg-inset)]" />
                <div className="h-4 w-full max-w-xl rounded bg-[var(--tovu-bg-inset)]" />
              </div>
              <div className="h-[140px] w-full rounded-xl bg-[var(--tovu-bg-inset)]" />
              <div className="h-10 w-40 rounded-full bg-[var(--tovu-bg-inset)] self-end" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto w-full lg:flex-1 lg:flex lg:items-center lg:pb-16">
          <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-10 w-full max-w-2xl space-y-4">
            <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-accent)]">
              Work Service Unavailable
            </p>
            <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-relaxed">
              {error}
            </p>
            <button
              type="button"
              onClick={reload}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto w-full lg:flex-1 lg:flex lg:items-center lg:pb-16">
          <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-10 w-full max-w-2xl space-y-2">
            <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
              No Published Systems
            </p>
            <p className="text-base text-[var(--tovu-text-secondary)]">
              No published case studies are currently available in the canonical repository.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div
          ref={trackRef}
          id="work-horizontal-track"
          className={`px-5 sm:px-8 lg:px-10 max-w-7xl lg:max-w-none mx-auto w-full ${
            prefersReducedMotion
              ? "grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12"
              : "grid grid-cols-1 gap-8 lg:flex lg:flex-nowrap lg:gap-8 lg:px-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:items-stretch lg:flex-1 lg:min-h-0 lg:pb-10 will-change-transform"
          }`}
        >
          {projects.map((project) => (
            <article
              key={project.id}
              id={`work-card-${project.id}`}
              className={`group rounded-2xl border border-[var(--tovu-border-hairline)] hover:border-[var(--tovu-accent-border)] bg-[var(--tovu-bg-surface)] transition-colors duration-300 p-6 sm:p-8 lg:p-9 flex flex-col justify-between gap-6 ${
                prefersReducedMotion
                  ? ""
                  : "lg:w-[62vw] lg:max-w-[800px] lg:shrink-0 lg:max-h-[560px]"
              }`}
            >
              {/* Top Metadata & Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--tovu-border-hairline)]">
                  <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                    <span className="font-semibold text-[var(--tovu-text-primary)] tabular-nums">
                      {project.number}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[var(--tovu-accent)] font-medium">
                      {project.category}
                    </span>
                    {project.version && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{project.version}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${project.title} GitHub repository`}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {project.liveUrl && project.liveUrl !== "#" && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${project.title} live deployment`}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Project Title & Subtitle */}
                <div className="space-y-2.5">
                  <h3 className="font-display font-semibold tracking-tight text-[var(--tovu-text-primary)] text-[clamp(1.625rem,2.4vw,2.25rem)] leading-[1.12]">
                    <button
                      type="button"
                      onClick={() => onSelectProject(project.slug)}
                      className="text-left hover:text-[var(--tovu-accent)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                    >
                      {project.title}
                    </button>
                  </h3>
                  <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-[1.6] max-w-2xl">
                    {project.subtitle}
                  </p>
                </div>

                {/* Key Metrics Row (Unboxed, Tabular) */}
                {project.metrics && project.metrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    {project.metrics.slice(0, 3).map((m, mIdx) => (
                      <div key={mIdx} className="space-y-0.5">
                        <div className="font-mono text-lg sm:text-xl font-semibold text-[var(--tovu-accent)] tabular-nums">
                          {m.value}
                        </div>
                        <div className="text-[13px] text-[var(--tovu-text-muted)]">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Architecture Schematic Preview */}
              <div className="w-full h-[130px] sm:h-[150px] rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-inset)] relative overflow-hidden">
                <svg className="w-full h-full pointer-events-none" aria-hidden="true">
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
                        stroke="var(--tovu-border-strong)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>

                {project.architectureNodes.map((node) => (
                  <div
                    key={node.id}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-hairline)] text-[12px] sm:text-[13px] font-mono text-[var(--tovu-text-secondary)] whitespace-nowrap shadow-sm"
                  >
                    {node.label}
                  </div>
                ))}
              </div>

              {/* Footer: Unboxed Stack Metadata & Case Study CTA */}
              <div className="pt-4 border-t border-[var(--tovu-border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                  {project.technologies.slice(0, 4).map((tech, idx) => (
                    <React.Fragment key={tech}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span>{tech}</span>
                    </React.Fragment>
                  ))}
                </div>

                <button
                  id={`explore-btn-${project.id}`}
                  type="button"
                  onClick={() => onSelectProject(project.slug)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] font-medium text-sm hover:opacity-90 transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
