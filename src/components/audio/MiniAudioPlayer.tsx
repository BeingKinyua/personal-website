import React from "react";
import { Play, Pause, X, Maximize2, Radio, Volume2 } from "lucide-react";
import { AudioMode } from "../../hooks/useAudioPlayer";

interface MiniAudioPlayerProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  mode: AudioMode;
  title: string;
  artistOrType: string;
  onExpand: () => void;
  onDismiss: () => void;
}

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({
  isPlaying,
  onTogglePlay,
  mode,
  title,
  artistOrType,
  onExpand,
  onDismiss,
}) => {
  return (
    <div
      id="mini-audio-player"
      role="region"
      aria-label="Mini audio player"
      className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-strong)] text-[var(--tovu-text-primary)] shadow-2xl backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex items-center gap-3 text-left cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-xl bg-[var(--tovu-accent-subtle)] border border-[var(--tovu-accent-border)] flex items-center justify-center text-[var(--tovu-accent)] shrink-0">
          {mode === "ambient" ? (
            <Radio className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </div>

        <div className="max-w-[140px] sm:max-w-[190px]">
          <div className="text-[13px] font-medium truncate group-hover:text-[var(--tovu-accent)] transition-colors">
            {title}
          </div>
          <div className="text-[12px] font-mono text-[var(--tovu-text-muted)] truncate">
            {artistOrType}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1 pl-2 border-l border-[var(--tovu-border-hairline)]">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </button>

        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand audio controls"
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
          title="Expand audio controls"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Stop and close audio player"
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
          title="Stop & close audio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
