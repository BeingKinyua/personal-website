import React from "react";
import { ArrowLeft, X, List, SlidersHorizontal } from "lucide-react";
import { AudioControl } from "../audio/AudioControl";
import { AudioMode } from "../../hooks/useAudioPlayer";

interface ImmersiveHeaderProps {
  moduleLabel: string;
  moduleBadge: string;
  title: string;
  onClose: () => void;
  // Audio
  isAudioPlaying: boolean;
  isAudioOpen: boolean;
  audioMode: AudioMode;
  onToggleAudio: () => void;
  // ToC
  hasToC: boolean;
  isToCOpen: boolean;
  onToggleToC: () => void;
  // Settings
  onOpenSettings: () => void;
  // Theme classes
  headerThemeClasses: string;
}

export const ImmersiveHeader: React.FC<ImmersiveHeaderProps> = ({
  moduleLabel,
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
      className={`sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b backdrop-blur-xl transition-colors duration-200 ${headerThemeClasses}`}
    >
      {/* Left: Back Action */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onClose}
          id="reader-back-btn"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          aria-label="Return to VictorOS"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span className="font-semibold hidden sm:inline">BACK</span>
          <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">ESC</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5 uppercase text-[10px]">
            {moduleBadge}
          </span>
          <span className="text-zinc-500 text-[11px] truncate max-w-[200px] lg:max-w-xs">
            {title}
          </span>
        </div>
      </div>

      {/* Right: Controls (Audio, ToC, Aa, Close) */}
      <div className="flex items-center gap-2">
        {/* Audio Experience Control */}
        <AudioControl
          isPlaying={isAudioPlaying}
          isOpen={isAudioOpen}
          mode={audioMode}
          onClick={onToggleAudio}
        />

        {/* Table of Contents button */}
        {hasToC && (
          <button
            onClick={onToggleToC}
            id="reader-toc-btn"
            aria-label="Toggle Table of Contents"
            className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              isToCOpen
                ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Table of Contents"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">CONTENTS</span>
          </button>
        )}

        {/* Reading Settings Aa button */}
        <button
          onClick={onOpenSettings}
          id="reader-settings-btn"
          aria-label="Open reading appearance settings"
          className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1"
          title="Appearance & Typography (Aa)"
        >
          <span>Aa</span>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          id="reader-close-btn"
          aria-label="Close reader overlay"
          className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all cursor-pointer"
          title="Close (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
