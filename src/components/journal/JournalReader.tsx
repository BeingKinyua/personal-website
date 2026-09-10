import React, { useState, useRef, useMemo, useEffect } from "react";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Check, Tag, BookOpen, Layers } from "lucide-react";
import Markdown from "react-markdown";
import Lenis from "lenis";
import { Article } from "../../types/article";
import { ARTICLES } from "../../data/articles";
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

interface JournalReaderProps {
  slug: string | null;
  onClose: () => void;
  onSelectArticle: (slug: string) => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

export const JournalReader: React.FC<JournalReaderProps> = ({
  slug,
  onClose,
  onSelectArticle,
  lenisRef,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isToCOpen, setIsToCOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Current article resolution
  const article = useMemo(() => {
    if (!slug) return null;
    return ARTICLES.find((a) => a.slug === slug || a.id === slug) || null;
  }, [slug]);

  const currentIndex = article ? ARTICLES.findIndex((a) => a.id === article.id) : -1;
  const prevArticle = currentIndex > 0 ? ARTICLES[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < ARTICLES.length - 1 ? ARTICLES[currentIndex + 1] : null;

  // Reader Settings & Progress
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

  // Audio Experience Hook
  const audio = useAudioPlayer(article?.id, "article");

  // Parse Table of Contents from markdown headings
  const tocItems = useMemo<ToCItem[]>(() => {
    if (!article?.content) return [];
    const lines = article.content.split("\n");
    const items: ToCItem[] = [];

    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        const raw = h2Match[1].trim();
        const id = "sec-" + raw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        items.push({ id, label: raw, level: 2 });
      } else if (h3Match) {
        const raw = h3Match[1].trim();
        const id = "sec-" + raw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        items.push({ id, label: raw, level: 3 });
      }
    });

    return items;
  }, [article?.content]);

  // Handle Share / Copy Link
  const handleCopyLink = () => {
    if (typeof window === "undefined" || !article) return;
    const url = `${window.location.origin}/journal/${article.slug}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Keyboard navigation for Prev/Next
  useEffect(() => {
    if (!article) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevArticle) {
        onSelectArticle(prevArticle.slug);
      } else if (e.key === "ArrowRight" && nextArticle) {
        onSelectArticle(nextArticle.slug);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [article, prevArticle, nextArticle, onSelectArticle]);

  if (!article) return null;

  return (
    <ImmersiveOverlay
      isOpen={!!slug}
      onClose={onClose}
      lenisRef={lenisRef}
      scrollerRef={scrollerRef}
      className={themeClasses}
    >
      {/* Pinned Reading Progress Bar */}
      <ReaderProgress progress={progress} accentColor="bg-amber-400" />

      {/* Reader Chrome */}
      <ImmersiveHeader
        moduleLabel="JOURNAL"
        moduleBadge={article.category}
        title={article.title}
        onClose={onClose}
        isAudioPlaying={audio.isPlaying}
        isAudioOpen={audio.isOpen}
        audioMode={audio.mode}
        onToggleAudio={() => (audio.isOpen ? audio.closePanel() : audio.openPanel())}
        hasToC={tocItems.length > 0}
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
          title={audio.mode === "ambient" ? audio.currentTrack.title : (audio.narration?.title || article.title)}
          artistOrType={audio.mode === "ambient" ? audio.currentTrack.artist : "VictorOS Voice"}
          onExpand={audio.openPanel}
          onDismiss={audio.dismissPlayer}
        />
      )}

      {/* Main Reading Chamber Body */}
      <main className={`mx-auto px-6 sm:px-10 py-12 sm:py-20 ${contentWidthClasses}`}>
        {/* Article Metadata Bar */}
        <div className="space-y-4 mb-10">
          <BlurReveal duration={0.6}>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase font-semibold">
                {article.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {article.date}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {article.readTime}
              </span>
              <span className="text-zinc-600">·</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer ml-auto"
                title="Copy shareable link"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">LINK COPIED</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>SHARE</span>
                  </>
                )}
              </button>
            </div>
          </BlurReveal>

          {/* Article Title */}
          <TextReveal
            as="h1"
            trigger="load"
            duration={0.8}
            className="text-3xl sm:text-4xl lg:text-5xl font-mono font-medium text-white tracking-tight leading-[1.2] pt-2"
          >
            {article.title}
          </TextReveal>

          {/* Editorial Abstract */}
          <p className="text-lg sm:text-xl text-zinc-300 font-normal leading-relaxed pt-4 border-t border-white/10">
            {article.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Markdown Content Section */}
        <article className={`space-y-6 pt-6 border-t border-white/10 ${fontSizeClasses}`}>
          <Markdown
            components={{
              h2: ({ children, ...props }) => {
                const text = String(children);
                const id = "sec-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return (
                  <h2
                    id={id}
                    className="text-2xl sm:text-3xl font-mono font-semibold text-white tracking-tight pt-10 pb-2 border-b border-white/5 scroll-mt-24"
                    {...props}
                  >
                    {children}
                  </h2>
                );
              },
              h3: ({ children, ...props }) => {
                const text = String(children);
                const id = "sec-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                return (
                  <h3
                    id={id}
                    className="text-xl sm:text-2xl font-mono font-medium text-zinc-100 pt-6 pb-1 scroll-mt-24"
                    {...props}
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ children }) => (
                <p className="leading-relaxed text-zinc-300 mb-4">{children}</p>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-amber-400/70 pl-5 py-2 my-6 bg-amber-400/[0.03] rounded-r-2xl italic text-zinc-200">
                  {children}
                </blockquote>
              ),
              pre: ({ children }) => (
                <div className="my-6 rounded-2xl border border-white/10 bg-[#06080b] p-5 font-mono text-xs overflow-x-auto text-zinc-300 shadow-inner">
                  {children}
                </div>
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200 font-mono text-[0.9em]" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              ul: ({ children }) => (
                <ul className="list-disc list-outside pl-6 space-y-2 text-zinc-300 my-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside pl-6 space-y-2 text-zinc-300 my-4">
                  {children}
                </ol>
              ),
            }}
          >
            {article.content}
          </Markdown>
        </article>

        {/* Next / Previous Article Footer */}
        <footer className="mt-24 pt-10 border-t border-white/10 space-y-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
            {prevArticle ? (
              <button
                onClick={() => onSelectArticle(prevArticle.slug)}
                className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-left text-zinc-300 hover:text-white transition-all group cursor-pointer flex-1"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 uppercase block">PREVIOUS ESSAY</span>
                  <span className="font-medium truncate block">{prevArticle.title}</span>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextArticle && (
              <button
                onClick={() => onSelectArticle(nextArticle.slug)}
                className="flex items-center justify-end text-right gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-zinc-300 hover:text-white transition-all group cursor-pointer flex-1"
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 uppercase block">NEXT ESSAY</span>
                  <span className="font-medium truncate block">{nextArticle.title}</span>
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
              <span>RETURN TO VICTOR.OS JOURNAL</span>
            </button>
          </div>
        </footer>
      </main>
    </ImmersiveOverlay>
  );
};
