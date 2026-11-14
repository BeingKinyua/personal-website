import React, { useState, useRef, useMemo, useEffect } from "react";
import { ArrowLeft, ArrowRight, Github, Terminal, Copy, Check, Share2 } from "lucide-react";
import Lenis from "lenis";
import { PROJECTS } from "../../data/projects";
import { ImmersiveOverlay } from "../immersive/ImmersiveOverlay";
import { ImmersiveHeader } from "../immersive/ImmersiveHeader";
import { ReaderProgress } from "../immersive/ReaderProgress";
import { TableOfContents, ToCItem } from "../immersive/TableOfContents";
import { ReaderSettingsModal } from "../immersive/ReaderSettingsModal";
import { useReaderSettings } from "../../hooks/useReaderSettings";
import { useReaderProgress } from "../../hooks/useReaderProgress";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { AudioPanel } from "../audio/AudioPanel";
import { MiniAudioPlayer } from "../audio/MiniAudioPlayer";

interface ProjectReaderProps {
  slug: string | null;
  onClose: () => void;
  onSelectProject: (slug: string) => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

export const ProjectReader: React.FC<ProjectReaderProps> = ({
  slug,
  onClose,
  onSelectProject,
  lenisRef,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isToCOpen, setIsToCOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const project = useMemo(() => {
    if (!slug) return null;
    return PROJECTS.find((p) => p.slug === slug || p.id === slug) || null;
  }, [slug]);

  const currentIndex = project ? PROJECTS.findIndex((p) => p.id === project.id) : -1;
  const prevProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : null;
  const nextProject =
    currentIndex >= 0 && currentIndex < PROJECTS.length - 1
      ? PROJECTS[currentIndex + 1]
      : null;

  const {
    settings,
    updateSetting,
    resetSettings,
    fontSizeClasses,
    contentWidthClasses,
    themeClasses,
    headerThemeClasses,
    headingClass,
    bodyTextClass,
    mutedTextClass,
    borderClass,
    surfaceClass,
    insetClass,
    accentTextClass,
  } = useReaderSettings();

  const { progress } = useReaderProgress(scrollerRef);
  const audio = useAudioPlayer(project?.id, "project");

  const tocItems = useMemo<ToCItem[]>(() => {
    if (!project) return [];
    return [
      { id: "sec-overview", label: "01. System Intent", level: 2 },
      { id: "sec-problem", label: "02. Inherent Failure Modes", level: 2 },
      { id: "sec-research", label: "03. Invariants & Research", level: 2 },
      { id: "sec-solution", label: "04. Architectural Solution", level: 2 },
      { id: "sec-topology", label: "05. Architecture Topology", level: 2 },
      { id: "sec-implementation", label: "06. Code Implementation", level: 2 },
      { id: "sec-results", label: "07. Empirical Results", level: 2 },
      { id: "sec-lessons", label: "08. Engineering Lessons", level: 2 },
    ];
  }, [project]);

  const handleCopyLink = () => {
    if (typeof window === "undefined" || !project) return;
    const url = `${window.location.origin}/work/${project.slug}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!project?.deepDive.implementationSnippet?.code) return;
    navigator.clipboard.writeText(project.deepDive.implementationSnippet.code);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevProject) {
        onSelectProject(prevProject.slug);
      } else if (e.key === "ArrowRight" && nextProject) {
        onSelectProject(nextProject.slug);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [project, prevProject, nextProject, onSelectProject]);

  if (!project) return null;

  return (
    <ImmersiveOverlay
      isOpen={!!slug}
      onClose={onClose}
      lenisRef={lenisRef}
      scrollerRef={scrollerRef}
      className={themeClasses}
    >
      <ReaderProgress progress={progress} accentColor="bg-teal-400" />

      <ImmersiveHeader
        moduleLabel="WORK"
        moduleBadge={`Project ${project.number}`}
        title={project.title}
        onClose={onClose}
        isAudioPlaying={audio.isPlaying}
        isAudioOpen={audio.isOpen}
        audioMode={audio.mode}
        onToggleAudio={() => (audio.isOpen ? audio.closePanel() : audio.openPanel())}
        hasToC={true}
        isToCOpen={isToCOpen}
        onToggleToC={() => setIsToCOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        headerThemeClasses={headerThemeClasses}
      />

      <TableOfContents
        items={tocItems}
        containerRef={scrollerRef}
        isOpen={isToCOpen}
        onToggle={() => setIsToCOpen((prev) => !prev)}
        onClose={() => setIsToCOpen(false)}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onReset={resetSettings}
      />

      <AudioPanel
        isOpen={audio.isOpen}
        onClose={audio.dismissPlayer}
        onMinimize={audio.closePanel}
        mode={audio.mode}
        setMode={audio.setMode}
        isPlaying={audio.isPlaying}
        onTogglePlay={audio.togglePlay}
        currentTime={audio.currentTime}
        duration={audio.duration}
        onSeek={audio.seek}
        tracks={audio.tracks}
        currentTrack={audio.currentTrack}
        onSelectTrack={audio.setTrack}
        onNextTrack={audio.nextTrack}
        onPrevTrack={audio.prevTrack}
        narration={audio.narration}
        voices={audio.voices}
        selectedVoice={audio.selectedVoice}
        onSelectVoice={audio.setSelectedVoice}
        playbackSpeed={audio.playbackSpeed}
        onSetPlaybackSpeed={audio.setPlaybackSpeed}
      />

      {audio.isMinimized && (
        <MiniAudioPlayer
          isPlaying={audio.isPlaying}
          onTogglePlay={audio.togglePlay}
          mode={audio.mode}
          title={
            audio.mode === "ambient"
              ? audio.currentTrack.title
              : audio.narration?.title || `${project.title} Audio Walkthrough`
          }
          artistOrType={
            audio.mode === "ambient" ? audio.currentTrack.artist : "Architecture Walkthrough"
          }
          onExpand={audio.openPanel}
          onDismiss={audio.dismissPlayer}
        />
      )}

      <main className={`mx-auto px-6 sm:px-10 py-14 sm:py-20 ${contentWidthClasses} space-y-16`}>
        {/* HERO SPECIFICATION */}
        <section id="sec-hero" className="space-y-6">
          <div className={`flex flex-wrap items-center justify-between gap-3 text-[13px] font-mono ${mutedTextClass}`}>
            <div className="flex items-center gap-2.5">
              <span className={`font-semibold uppercase tracking-wider ${accentTextClass}`}>
                Case Study
              </span>
              <span aria-hidden="true">·</span>
              <span>{project.category}</span>
            </div>

            <div className="flex items-center gap-2">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`min-h-[36px] px-3 inline-flex items-center gap-1.5 rounded-lg border transition-colors ${surfaceClass} ${headingClass}`}
                  title="GitHub Repository"
                >
                  <Github className="w-4 h-4" />
                  <span>Source</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`min-h-[36px] px-3 inline-flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer ${surfaceClass}`}
                title="Copy shareable link"
              >
                {isCopied ? (
                  <>
                    <Check className={`w-3.5 h-3.5 ${accentTextClass}`} />
                    <span className={accentTextClass}>Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <h1
            className={`font-display font-semibold tracking-tight leading-[1.05] text-[clamp(2.25rem,4.5vw,3.75rem)] ${headingClass}`}
          >
            {project.title}
          </h1>

          <p className={`text-xl sm:text-2xl leading-[1.55] ${bodyTextClass}`}>
            {project.subtitle}
          </p>

          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-mono ${mutedTextClass}`}>
            {project.technologies.map((tech, idx) => (
              <React.Fragment key={tech}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span>{tech}</span>
              </React.Fragment>
            ))}
          </div>

          {project.metrics && (
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl border mt-6 ${surfaceClass}`}>
              {project.metrics.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className={`text-2xl sm:text-3xl font-mono font-semibold tabular-nums ${accentTextClass}`}>
                    {metric.value}
                  </div>
                  <div className={`text-sm font-medium ${headingClass}`}>
                    {metric.label}
                  </div>
                  <div className={`text-[13px] font-mono ${mutedTextClass}`}>
                    {metric.detail}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 01 // OVERVIEW */}
        <section id="sec-overview" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <p className={`text-[13px] font-mono uppercase tracking-wider ${accentTextClass}`}>
            01 · System Intent
          </p>
          <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
            Architectural Philosophy &amp; Intent
          </h2>
          <p className={`${fontSizeClasses} ${bodyTextClass}`}>
            {project.deepDive.overview}
          </p>
        </section>

        {/* 02 // PROBLEM */}
        <section id="sec-problem" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <p className={`text-[13px] font-mono uppercase tracking-wider ${mutedTextClass}`}>
            02 · Failure Modes
          </p>
          <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
            Structural Vulnerabilities &amp; Scale Friction
          </h2>
          <p className={`${fontSizeClasses} ${bodyTextClass}`}>
            {project.deepDive.problem}
          </p>
        </section>

        {/* 03 // RESEARCH & INVARIANTS */}
        <section id="sec-research" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <p className={`text-[13px] font-mono uppercase tracking-wider ${mutedTextClass}`}>
            03 · Foundational Invariants
          </p>
          <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
            Theoretical Grounding &amp; Boundary Analysis
          </h2>
          <p className={`${fontSizeClasses} ${bodyTextClass}`}>
            {project.deepDive.research}
          </p>
        </section>

        {/* 04 // SOLUTION */}
        <section id="sec-solution" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <p className={`text-[13px] font-mono uppercase tracking-wider ${accentTextClass}`}>
            04 · Architectural Solution
          </p>
          <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
            Deterministic Construction
          </h2>
          <p className={`${fontSizeClasses} ${bodyTextClass}`}>
            {project.deepDive.solution}
          </p>
        </section>

        {/* 05 // ARCHITECTURE & TOPOLOGY DIAGRAM */}
        <section id="sec-topology" className={`space-y-4 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-[13px] font-mono uppercase tracking-wider ${mutedTextClass}`}>
                05 · Architecture &amp; Topology
              </p>
              <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
                Signal Flow &amp; Pipeline Nodes
              </h2>
            </div>
            <span className={`text-[13px] font-mono hidden sm:inline ${mutedTextClass}`}>
              Select nodes to inspect
            </span>
          </div>

          <div className={`relative w-full h-[300px] sm:h-[360px] rounded-2xl border overflow-hidden p-4 ${insetClass}`}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
              {project.architectureLines.map((line, idx) => {
                const fromNode = project.architectureNodes.find((n) => n.id === line.from);
                const toNode = project.architectureNodes.find((n) => n.id === line.to);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={idx}
                    x1={`${fromNode.x}%`}
                    y1={`${fromNode.y}%`}
                    x2={`${toNode.x}%`}
                    y2={`${toNode.y}%`}
                    stroke="currentColor"
                    strokeOpacity="0.22"
                    strokeWidth="1.5"
                    strokeDasharray={line.active ? "4 4" : undefined}
                  />
                );
              })}
            </svg>

            {project.architectureNodes.map((node) => {
              const isSelected = activeNode === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveNode(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl border text-[13px] font-mono cursor-pointer transition-all duration-150 whitespace-nowrap ${
                    isSelected
                      ? "border-teal-400 bg-teal-500/20 scale-105 font-semibold"
                      : `${surfaceClass} ${headingClass}`
                  }`}
                >
                  {node.label}
                </button>
              );
            })}
          </div>

          <p className={`text-[15px] leading-relaxed p-5 rounded-2xl border ${surfaceClass} ${bodyTextClass}`}>
            {project.deepDive.architectureNotes}
          </p>
        </section>

        {/* 06 // IMPLEMENTATION CODE SNIPPET */}
        {project.deepDive.implementationSnippet && (
          <section id="sec-implementation" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
            <div className={`flex items-center justify-between text-[13px] font-mono ${mutedTextClass}`}>
              <span className="inline-flex items-center gap-2">
                <Terminal className={`w-4 h-4 ${accentTextClass}`} />
                06 · {project.deepDive.implementationSnippet.filename}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[13px] transition-colors cursor-pointer ${surfaceClass}`}
              >
                {isCodeCopied ? (
                  <>
                    <Check className={`w-3.5 h-3.5 ${accentTextClass}`} />
                    <span className={accentTextClass}>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className={`rounded-2xl border p-5 sm:p-6 font-mono text-[13px] sm:text-sm overflow-x-auto leading-relaxed ${insetClass}`}>
              <pre>
                <code>{project.deepDive.implementationSnippet.code}</code>
              </pre>
            </div>
          </section>
        )}

        {/* 07 // EMPIRICAL RESULTS */}
        <section id="sec-results" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <p className={`text-[13px] font-mono uppercase tracking-wider ${accentTextClass}`}>
            07 · Empirical Results
          </p>
          <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
            Verified Outcomes &amp; Benchmark Data
          </h2>
          <p className={`${fontSizeClasses} ${bodyTextClass}`}>
            {project.deepDive.results}
          </p>
        </section>

        {/* 08 // LESSONS */}
        <section id="sec-lessons" className={`space-y-3 pt-8 border-t ${borderClass} scroll-mt-24`}>
          <p className={`text-[13px] font-mono uppercase tracking-wider ${mutedTextClass}`}>
            08 · Engineering Lessons
          </p>
          <h2 className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${headingClass}`}>
            Key Architectural Takeaways
          </h2>
          <p className={`${fontSizeClasses} ${bodyTextClass}`}>
            {project.deepDive.lessons}
          </p>
        </section>

        {/* FOOTER NAVIGATION */}
        <footer id="sec-navigation" className={`mt-24 pt-10 border-t ${borderClass} space-y-8`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-sm">
            {prevProject ? (
              <button
                type="button"
                onClick={() => onSelectProject(prevProject.slug)}
                className={`flex items-center gap-3 p-5 rounded-2xl border text-left transition-colors group cursor-pointer flex-1 ${surfaceClass}`}
              >
                <ArrowLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
                <div className="min-w-0">
                  <span className={`text-[13px] font-mono uppercase block ${mutedTextClass}`}>
                    Previous Project
                  </span>
                  <span className={`font-display font-semibold truncate block ${headingClass}`}>
                    {prevProject.number}: {prevProject.title}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextProject && (
              <button
                type="button"
                onClick={() => onSelectProject(nextProject.slug)}
                className={`flex items-center justify-end text-right gap-3 p-5 rounded-2xl border transition-colors group cursor-pointer flex-1 ${surfaceClass}`}
              >
                <div className="min-w-0">
                  <span className={`text-[13px] font-mono uppercase block ${mutedTextClass}`}>
                    Next Project
                  </span>
                  <span className={`font-display font-semibold truncate block ${headingClass}`}>
                    {nextProject.number}: {nextProject.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-medium transition-colors cursor-pointer ${surfaceClass} ${headingClass}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Work</span>
            </button>
          </div>
        </footer>
      </main>
    </ImmersiveOverlay>
  );
};
