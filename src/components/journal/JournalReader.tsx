import React, { useState, useRef, useMemo, useEffect } from "react";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Check, RefreshCw } from "lucide-react";
import Markdown from "react-markdown";
import Lenis from "lenis";
import { useArticleBySlug, useArticlesData } from "../../hooks/useContentData";
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
import { resolveMediaUrl } from "../../lib/media/urls";

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

  const { data: article, loading, notFound, error, reload } = useArticleBySlug(slug);
  const { data: allArticles } = useArticlesData();

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [slug]);

  const currentIndex = article
    ? allArticles.findIndex((a) => a.slug === article.slug || a.id === article.id)
    : -1;
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
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
  const audio = useAudioPlayer(article?.slug || article?.id, "article");

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

  const handleCopyLink = () => {
    if (typeof window === "undefined" || !article) return;
    const url = `${window.location.origin}/journal/${article.slug}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

  if (!slug) return null;

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
        moduleLabel="JOURNAL"
        moduleBadge={article ? article.category : "Essay"}
        title={article ? article.title : loading ? "Loading..." : notFound ? "Not Found" : "Unavailable"}
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

      {loading && (
        <main aria-busy="true" className={`mx-auto px-6 sm:px-10 py-14 sm:py-20 ${contentWidthClasses} space-y-6 animate-pulse`}>
          <div className="h-4 w-48 rounded bg-current/10" />
          <div className="h-10 w-5/6 rounded bg-current/10" />
          <div className="h-20 w-full rounded bg-current/10" />
          <div className="space-y-3 pt-6">
            <div className="h-4 w-full rounded bg-current/10" />
            <div className="h-4 w-11/12 rounded bg-current/10" />
            <div className="h-4 w-4/5 rounded bg-current/10" />
          </div>
        </main>
      )}

      {!loading && error && (
        <main className={`mx-auto px-6 sm:px-10 py-20 ${contentWidthClasses}`}>
          <div className={`rounded-2xl border p-8 sm:p-10 space-y-5 ${surfaceClass}`}>
            <p className={`text-[13px] font-mono uppercase tracking-wider ${accentTextClass}`}>
              Failed to Load Essay
            </p>
            <h1 className={`font-display text-2xl sm:text-3xl font-semibold ${headingClass}`}>
              Unable to retrieve journal entry
            </h1>
            <p className={`text-base ${bodyTextClass}`}>{error}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={reload}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] text-sm font-medium cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium cursor-pointer ${surfaceClass} ${headingClass}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Journal</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {!loading && !error && (notFound || !article) && (
        <main className={`mx-auto px-6 sm:px-10 py-20 ${contentWidthClasses}`}>
          <div className={`rounded-2xl border p-8 sm:p-10 space-y-5 ${surfaceClass}`}>
            <p className={`text-[13px] font-mono uppercase tracking-wider ${mutedTextClass}`}>
              404 · Not Found
            </p>
            <h1 className={`font-display text-2xl sm:text-3xl font-semibold ${headingClass}`}>
              Essay &ldquo;{slug}&rdquo; could not be found
            </h1>
            <p className={`text-base ${bodyTextClass}`}>
              The requested article may have been moved, renamed, or unpublished.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-medium cursor-pointer ${surfaceClass} ${headingClass}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Journal</span>
            </button>
          </div>
        </main>
      )}

      {!loading && !error && article && (
        <>
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
                  : audio.narration?.title || article.title
              }
              artistOrType={audio.mode === "ambient" ? audio.currentTrack.artist : "Tovu Voice"}
              onExpand={audio.openPanel}
              onDismiss={audio.dismissPlayer}
            />
          )}

          <main className={`mx-auto px-6 sm:px-10 py-14 sm:py-20 ${contentWidthClasses}`}>
            {/* Editorial Header */}
            <header className="space-y-6 mb-12">
              <div className={`flex flex-wrap items-center gap-3 text-[13px] font-mono ${mutedTextClass}`}>
                <span className={`font-semibold uppercase tracking-wider ${accentTextClass}`}>
                  {article.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {article.date}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {article.readTime}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="ml-auto min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-current/5 transition-colors cursor-pointer"
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

              <h1
                className={`font-display font-semibold tracking-tight leading-[1.1] text-[clamp(2.125rem,4.2vw,3.375rem)] ${headingClass}`}
              >
                {article.title}
              </h1>

              <p className={`text-lg sm:text-xl leading-[1.6] pt-5 border-t ${borderClass} ${bodyTextClass}`}>
                {article.summary}
              </p>

              <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-mono ${mutedTextClass}`}>
                {article.tags.map((tag, idx) => (
                  <React.Fragment key={tag}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <span>{tag}</span>
                  </React.Fragment>
                ))}
              </div>
            </header>

            {/* Article Body */}
            <article className={`space-y-6 pt-8 border-t ${borderClass} ${fontSizeClasses}`}>
              <Markdown
                components={{
                  h2: ({ children, ...props }) => {
                    const text = String(children);
                    const id = "sec-" + text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    return (
                      <h2
                        id={id}
                        className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight pt-10 pb-2 border-b ${borderClass} scroll-mt-24 ${headingClass}`}
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
                        className={`font-display text-xl sm:text-2xl font-semibold pt-6 pb-1 scroll-mt-24 ${headingClass}`}
                        {...props}
                      >
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className={`leading-[1.75] mb-5 ${bodyTextClass}`}>{children}</p>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className={`rounded-xl border p-5 my-6 italic ${surfaceClass} ${headingClass}`}>
                      {children}
                    </blockquote>
                  ),
                  pre: ({ children }) => (
                    <div className={`my-6 rounded-xl border p-5 font-mono text-[13px] sm:text-sm overflow-x-auto leading-relaxed ${insetClass}`}>
                      {children}
                    </div>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code
                        className={`px-1.5 py-0.5 rounded font-mono text-[0.88em] ${surfaceClass} ${accentTextClass}`}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code className="font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className={`list-disc list-outside pl-6 space-y-2.5 my-5 ${bodyTextClass}`}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className={`list-decimal list-outside pl-6 space-y-2.5 my-5 ${bodyTextClass}`}>
                      {children}
                    </ol>
                  ),
                  img: ({ src, alt, ...props }) => {
                    const safeSrc = resolveMediaUrl(typeof src === "string" ? src : undefined);
                    if (!safeSrc) return null;
                    return (
                      <img
                        src={safeSrc}
                        alt={alt || ""}
                        loading="lazy"
                        decoding="async"
                        className={`my-6 w-full rounded-xl border ${borderClass} object-cover`}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {article.content}
              </Markdown>
            </article>

            {/* Footer Navigation */}
            <footer className={`mt-24 pt-10 border-t ${borderClass} space-y-8`}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-sm">
                {prevArticle ? (
                  <button
                    type="button"
                    onClick={() => onSelectArticle(prevArticle.slug)}
                    className={`flex items-center gap-3 p-5 rounded-2xl border text-left transition-colors group cursor-pointer flex-1 ${surfaceClass}`}
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
                    <div className="min-w-0">
                      <span className={`text-[13px] font-mono uppercase block ${mutedTextClass}`}>
                        Previous Essay
                      </span>
                      <span className={`font-display font-semibold truncate block ${headingClass}`}>
                        {prevArticle.title}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="flex-1" />
                )}

                {nextArticle && (
                  <button
                    type="button"
                    onClick={() => onSelectArticle(nextArticle.slug)}
                    className={`flex items-center justify-end text-right gap-3 p-5 rounded-2xl border transition-colors group cursor-pointer flex-1 ${surfaceClass}`}
                  >
                    <div className="min-w-0">
                      <span className={`text-[13px] font-mono uppercase block ${mutedTextClass}`}>
                        Next Essay
                      </span>
                      <span className={`font-display font-semibold truncate block ${headingClass}`}>
                        {nextArticle.title}
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
                  <span>Return to Journal</span>
                </button>
              </div>
            </footer>
          </main>
        </>
      )}
    </ImmersiveOverlay>
  );
};
