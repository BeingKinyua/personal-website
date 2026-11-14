import React from "react";
import { ArrowLeft, X, List } from "lucide-react";
import { AudioControl } from "../audio/AudioControl";
import { AudioMode } from "../../hooks/useAudioPlayer";

interface ImmersiveHeaderProps {
  moduleLabel: string;
  moduleBadge: string;
  title: string;
  onClose: () => void;
  isAudioPlaying: boolean;
  isAudioOpen: boolean;
  audioMode: AudioMode;
  onToggleAudio: () => void;
  hasToC: boolean;
  isToCOpen: boolean;
  onToggleToC: () => void;
  onOpenSettings: () => void;
  headerThemeClasses: string;
}

export const ImmersiveHeader: React.FC<ImmersiveHeaderProps> = ({
  moduleBadge,
  title,
  onClose,
  isAudioPlaying,
  isAudioOpen,
  audioMode,
  onToggleAudio,
  hasToC,
  isToCOpen,
  onToggleToC,
  onOpenSettings,
  headerThemeClasses,
}) => {
  return (
    <header
      id="reader-sticky-chrome"
      className={`sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 h-16 border-b backdrop-blur-xl transition-colors duration-200 ${headerThemeClasses}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onClose}
          id="reader-back-btn"
          className="min-h-[40px] group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-current/5 hover:bg-current/10 text-sm font-medium border border-current/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          aria-label="Return to Tovu"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-current/15 text-[13px] font-mono min-w-0">
          <span className="opacity-75 shrink-0">{moduleBadge}</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="opacity-90 truncate max-w-[240px] lg:max-w-sm">
            {title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <AudioControl
          isPlaying={isAudioPlaying}
          isOpen={isAudioOpen}
          mode={audioMode}
          onClick={onToggleAudio}
        />

        {hasToC && (
          <button
            type="button"
            onClick={onToggleToC}
            id="reader-toc-btn"
            aria-label="Toggle Table of Contents"
            className={`min-h-[40px] px-3 py-2 rounded-xl border text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              isToCOpen
                ? "border-teal-400/50 bg-teal-400/15"
                : "border-current/15 bg-current/5 hover:bg-current/10"
            }`}
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Contents</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          id="reader-settings-btn"
          aria-label="Open reading appearance settings"
          className="min-h-[40px] px-3 py-2 rounded-xl border border-current/15 bg-current/5 hover:bg-current/10 text-sm font-mono font-medium transition-colors cursor-pointer flex items-center gap-1"
          title="Appearance & Typography"
        >
          <span>Aa</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          id="reader-close-btn"
          aria-label="Close reader overlay"
          className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-current/15 bg-current/5 hover:bg-current/15 transition-colors cursor-pointer"
          title="Close (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
