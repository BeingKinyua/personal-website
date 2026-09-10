import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Github, 
  ExternalLink, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  Copy, 
  Check, 
  Layers, 
  Share2,
  Network
} from "lucide-react";
import Lenis from "lenis";
import { Project } from "../../types/project";
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
import { TextReveal } from "../motion/TextReveal";
import { BlurReveal } from "../motion/BlurReveal";

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

  // Project lookup
  const project = useMemo(() => {
    if (!slug) return null;
    return PROJECTS.find((p) => p.slug === slug || p.id === slug) || null;
  }, [slug]);

  const currentIndex = project ? PROJECTS.findIndex((p) => p.id === project.id) : -1;
  const prevProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : null;
  const nextProject = currentIndex >= 0 && currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : null;

  // Settings & Progress
  const {
    settings,
    updateSetting,
    resetSettings,
    fontSizeClasses,
    contentWidthClasses,
    themeClasses,
    headerThemeClasses,
  } = useReaderSettings();

  const { progress } = useReaderProgress(scrollerRef);

  // Audio Hook
  const audio = useAudioPlayer(project?.id, "project");

  // Table of Contents for Case Studies
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

  // Handle Share / Copy Link
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

  // Keyboard navigation for Prev/Next
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
      {/* Pinned Reading Progress Bar */}
      <ReaderProgress progress={progress} accentColor="bg-blue-500" />

      {/* Reader Chrome */}
      <ImmersiveHeader
        moduleLabel="WORK"
        moduleBadge={`PROJECT ${project.number}`}
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

      {/* Table of Contents Popover */}
      <TableOfContents
        items={tocItems}
        containerRef={scrollerRef}
        isOpen={isToCOpen}
        onToggle={() => setIsToCOpen((prev) => !prev)}
        onClose={() => setIsToCOpen(false)}
      />

      {/* Reader Settings Modal */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onReset={resetSettings}
      />

      {/* Audio Panel Modal */}
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

      {/* Minimized Audio Player Float */}
      {audio.isMinimized && (
        <MiniAudioPlayer
          isPlaying={audio.isPlaying}
          onTogglePlay={audio.togglePlay}
          mode={audio.mode}
          title={audio.mode === "ambient" ? audio.currentTrack.title : (audio.narration?.title || `${project.title} Audio Walkthrough`)}
          artistOrType={audio.mode === "ambient" ? audio.currentTrack.artist : "Architecture Walkthrough"}
          onExpand={audio.openPanel}
          onDismiss={audio.dismissPlayer}
        />
      )}

      {/* Main Project Case Study Body */}
      <main className={`mx-auto px-6 sm:px-10 py-12 sm:py-20 ${contentWidthClasses} space-y-16`}>
        {/* HERO SPECIFICATION */}
        <section id="sec-hero" className="space-y-6">
          <BlurReveal duration={0.6}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase font-semibold">
                  SYSTEM ARCHITECTURE SPECIFICATION
                </span>
                <span>// {project.category}</span>
              </div>

              <div className="flex items-center gap-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    title="GitHub Repository"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                  title="Copy shareable link"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-xs font-mono">LINK COPIED</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-xs font-mono">SHARE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </BlurReveal>

          {/* Project Title */}
          <TextReveal
            as="h1"
            trigger="load"
            duration={0.8}
            className="text-4xl sm:text-6xl font-mono font-medium text-white tracking-tight leading-[1.1]"
          >
            {project.title}
          </TextReveal>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-zinc-300 font-normal leading-relaxed">
            {project.subtitle}
          </p>

          {/* Technologies Stack Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full text-xs font-mono text-zinc-300 bg-white/5 border border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Empirical Key Metrics Banner */}
          {project.metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 sm:p-6 rounded-3xl border border-white/10 bg-[#0b0e12]/80 mt-8 shadow-xl">
              {project.metrics.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-mono font-semibold text-blue-400">
                    {metric.value}
                  </div>
                  <div className="text-xs font-medium text-white">
                    {metric.label}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {metric.detail}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 01 // OVERVIEW */}
        <section id="sec-overview" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest">
            <span>01 // THE SYSTEM INTENT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
            Architectural Philosophy & Intent
          </h2>
          <p className={`leading-relaxed text-zinc-300 ${fontSizeClasses}`}>
            {project.deepDive.overview}
          </p>
        </section>

        {/* 02 // PROBLEM */}
        <section id="sec-problem" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-widest">
            <span>02 // THE PROBLEM & INHERENT FAILURE MODES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
            Structural Vulnerabilities & Scale Friction
          </h2>
          <p className={`leading-relaxed text-zinc-300 ${fontSizeClasses}`}>
            {project.deepDive.problem}
          </p>
        </section>

        {/* 03 // RESEARCH & INVARIANTS */}
        <section id="sec-research" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
            <span>03 // RESEARCH & FOUNDATIONAL INVARIANTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
            Theoretical Grounding & Boundary Analysis
          </h2>
          <p className={`leading-relaxed text-zinc-300 ${fontSizeClasses}`}>
            {project.deepDive.research}
          </p>
        </section>

        {/* 04 // SOLUTION */}
        <section id="sec-solution" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest">
            <span>04 // THE ARCHITECTURAL SOLUTION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
            Deterministic Construction
          </h2>
          <p className={`leading-relaxed text-zinc-300 ${fontSizeClasses}`}>
            {project.deepDive.solution}
          </p>
        </section>

        {/* 05 // ARCHITECTURE & TOPOLOGY DIAGRAM */}
        <section id="sec-topology" className="space-y-4 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                05 // ARCHITECTURE & TOPOLOGY
              </span>
              <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
                Signal Flow & Pipeline Nodes
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              CLICK NODES TO INSPECT
            </span>
          </div>

          <div className="relative w-full h-[300px] sm:h-[350px] rounded-3xl border border-white/10 bg-[#07090c] overflow-hidden p-4 shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {project.architectureLines.map((line, idx) => {
                const fromNode = project.architectureNodes.find((n) => n.id === line.from);
                const toNode = project.architectureNodes.find((n) => n.id === line.to);
                if (!fromNode || !toNode) return null;

                return (
                  <g key={idx}>
                    <line
                      x1={`${fromNode.x}%`}
                      y1={`${fromNode.y}%`}
                      x2={`${toNode.x}%`}
                      y2={`${toNode.y}%`}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="1.5"
                      strokeDasharray={line.active ? "4 4" : undefined}
                    />
                    {line.active && (
                      <circle r="3" fill="#3b82f6" className="animate-pulse">
                        <animateMotion
                          path={`M ${fromNode.x * 8} ${fromNode.y * 3} L ${toNode.x * 8} ${toNode.y * 3}`}
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {project.architectureNodes.map((node) => {
              const isSelected = activeNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-all duration-200 shadow-lg ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-400 scale-105 shadow-blue-500/25"
                      : "bg-[#101318] text-zinc-300 border-white/10 hover:border-blue-400/50 hover:bg-[#151920]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        node.role === "input"
                          ? "bg-emerald-400"
                          : node.role === "process"
                          ? "bg-blue-400"
                          : "bg-amber-400"
                      }`}
                    />
                    <span>{node.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            {project.deepDive.architectureNotes}
          </p>
        </section>

        {/* 06 // IMPLEMENTATION CODE SNIPPET */}
        {project.deepDive.implementationSnippet && (
          <section id="sec-implementation" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                06 // IMPLEMENTATION SPECIFICATION: {project.deepDive.implementationSnippet.filename}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {isCodeCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>COPY CODE</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#06080b] p-5 sm:p-6 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed shadow-inner">
              <pre><code>{project.deepDive.implementationSnippet.code}</code></pre>
            </div>
          </section>
        )}

        {/* 07 // EMPIRICAL RESULTS */}
        <section id="sec-results" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest">
            <span>07 // EMPIRICAL RESULTS & PRODUCTION IMPACT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
            Verified Outcomes & Benchmark Data
          </h2>
          <p className={`leading-relaxed text-zinc-300 ${fontSizeClasses}`}>
            {project.deepDive.results}
          </p>
        </section>

        {/* 08 // LESSONS */}
        <section id="sec-lessons" className="space-y-3 pt-6 border-t border-white/10 scroll-mt-24">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest">
            <span>08 // ENGINEERING LESSONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight">
            Key Architectural Takeaways
          </h2>
          <p className={`leading-relaxed text-zinc-300 ${fontSizeClasses}`}>
            {project.deepDive.lessons}
          </p>
        </section>

        {/* FOOTER NAVIGATION */}
        <footer id="sec-navigation" className="mt-24 pt-10 border-t border-white/10 space-y-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
            {prevProject ? (
              <button
                onClick={() => onSelectProject(prevProject.slug)}
                className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-left text-zinc-300 hover:text-white transition-all group cursor-pointer flex-1"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 uppercase block">PREVIOUS PROJECT</span>
                  <span className="font-medium truncate block">PROJECT {prevProject.number}: {prevProject.title}</span>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextProject && (
              <button
                onClick={() => onSelectProject(nextProject.slug)}
                className="flex items-center justify-end text-right gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-zinc-300 hover:text-white transition-all group cursor-pointer flex-1"
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 uppercase block">NEXT PROJECT</span>
                  <span className="font-medium truncate block">PROJECT {nextProject.number}: {nextProject.title}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO VICTOR.OS WORK</span>
            </button>
          </div>
        </footer>
      </main>
    </ImmersiveOverlay>
  );
};
