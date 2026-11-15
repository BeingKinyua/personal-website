import React, { useEffect } from "react";
import {
  X,
  Minus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
  Radio,
  Volume2,
  Info,
} from "lucide-react";
import { AudioMode } from "../../hooks/useAudioPlayer";
import { AmbientTrack } from "../../services/audio";
import { Narration, NarrationVoice } from "../../services/narration";

interface AudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  mode: AudioMode;
  setMode: (m: AudioMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  tracks: AmbientTrack[];
  currentTrack: AmbientTrack;
  onSelectTrack: (index: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  narration: Narration | null;
  voices: NarrationVoice[];
  selectedVoice: string;
  onSelectVoice: (id: string) => void;
  playbackSpeed: number;
  onSetPlaybackSpeed: (speed: number) => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  isOpen,
  onClose,
  onMinimize,
  mode,
  setMode,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  tracks,
  currentTrack,
  onSelectTrack,
  onNextTrack,
  onPrevTrack,
  narration,
  voices,
  selectedVoice,
  onSelectVoice,
  playbackSpeed,
  onSetPlaybackSpeed,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMinimize();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onMinimize]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="reader-audio-panel-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-audio-title"
      className="fixed inset-0 z-[120] bg-[var(--tovu-bg-overlay)] backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onMinimize();
      }}
    >
      <div
        id="reader-audio-panel"
        className="w-full max-w-lg rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-elevated)] shadow-2xl overflow-hidden flex flex-col text-[var(--tovu-text-primary)]"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)]">
          <div className="flex items-center gap-2.5">
            <Headphones className="w-4 h-4 text-[var(--tovu-accent)]" />
            <span
              id="reader-audio-title"
              className="text-[13px] font-mono uppercase tracking-[0.12em] text-[var(--tovu-text-secondary)]"
            >
              Audio Companion
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize audio player"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
              title="Minimize player"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close audio player"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
              title="Close audio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div
          role="tablist"
          aria-label="Audio mode"
          className="grid grid-cols-2 p-1.5 bg-[var(--tovu-bg-inset)] border-b border-[var(--tovu-border-hairline)] text-sm font-medium"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "ambient"}
            onClick={() => setMode("ambient")}
            className={`min-h-[40px] flex items-center justify-center gap-2 py-2 rounded-xl transition-colors cursor-pointer ${
              mode === "ambient"
                ? "bg-[var(--tovu-bg-surface)] text-[var(--tovu-text-primary)] shadow-sm border border-[var(--tovu-border-hairline)]"
                : "text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)]"
            }`}
          >
            <Radio className="w-4 h-4 text-[var(--tovu-accent)]" />
            <span>Ambient Sound</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "narration"}
            onClick={() => setMode("narration")}
            className={`min-h-[40px] flex items-center justify-center gap-2 py-2 rounded-xl transition-colors cursor-pointer ${
              mode === "narration"
                ? "bg-[var(--tovu-bg-surface)] text-[var(--tovu-text-primary)] shadow-sm border border-[var(--tovu-border-hairline)]"
                : "text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)]"
            }`}
          >
            <Volume2 className="w-4 h-4 text-[var(--tovu-accent)]" />
            <span>Article Narration</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {mode === "ambient" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[13px] font-mono uppercase tracking-[0.1em] text-[var(--tovu-accent)] block mb-1">
                    Now Playing
                  </span>
                  <h3 className="font-display text-xl font-semibold text-[var(--tovu-text-primary)]">
                    {currentTrack.title}
                  </h3>
                  <p className="text-[13px] text-[var(--tovu-text-muted)] mt-0.5 font-mono">
                    {currentTrack.artist} · {currentTrack.bpm} BPM
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[var(--tovu-accent-subtle)] border border-[var(--tovu-accent-border)] flex items-center justify-center text-[var(--tovu-accent)] shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
              </div>

              <p className="text-[14px] text-[var(--tovu-text-secondary)] leading-relaxed bg-[var(--tovu-bg-inset)] border border-[var(--tovu-border-hairline)] p-3.5 rounded-xl">
                {currentTrack.description}
              </p>

              {/* Track Playlist Selector */}
              <div className="space-y-2 pt-1">
                <span className="text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)] block">
                  Soundscapes
                </span>
                <div className="space-y-1.5">
                  {tracks.map((track, idx) => (
                    <button
                      type="button"
                      key={track.id}
                      onClick={() => onSelectTrack(idx)}
                      className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left text-sm transition-colors cursor-pointer ${
                        track.id === currentTrack.id
                          ? "bg-[var(--tovu-accent-subtle)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)] font-medium"
                          : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:border-[var(--tovu-border-strong)] hover:text-[var(--tovu-text-primary)]"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span>{track.title}</span>
                        <span className="text-[13px] text-[var(--tovu-text-muted)] ml-2">
                          {track.genre}
                        </span>
                      </div>
                      <span className="text-[13px] font-mono text-[var(--tovu-text-muted)] shrink-0">
                        {Math.floor(track.durationSeconds / 60)}:
                        {track.durationSeconds % 60 < 10 ? "0" : ""}
                        {track.durationSeconds % 60}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-[13px] font-mono uppercase tracking-[0.1em] text-[var(--tovu-accent)] block mb-1">
                    Reading Pacer
                  </span>
                  <h3 className="font-display text-xl font-semibold text-[var(--tovu-text-primary)]">
                    {narration?.title || "Article Reading Outline"}
                  </h3>
                  <p className="text-[14px] text-[var(--tovu-text-secondary)] mt-1">
                    {narration?.audioUrl
                      ? "Audio readout ready for playback."
                      : "Silent reading pacer preview — server TTS audio files are not yet attached to this entry."}
                  </p>
                </div>

              {/* Voice Selector */}
              <div className="space-y-2">
                <span className="text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)] block">
                  Voice Profile
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {voices.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => onSelectVoice(v.id)}
                      className={`min-h-[48px] p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        v.id === selectedVoice
                          ? "bg-[var(--tovu-accent-subtle)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                          : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)]"
                      }`}
                    >
                      <div className="font-medium text-sm">{v.name}</div>
                      <div className="text-[13px] text-[var(--tovu-text-muted)] truncate">
                        {v.tagline}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Speed */}
              <div className="space-y-2">
                <span className="text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)] block">
                  Playback Speed
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      type="button"
                      key={spd}
                      onClick={() => onSetPlaybackSpeed(spd)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-[13px] font-mono transition-colors cursor-pointer ${
                        playbackSpeed === spd
                          ? "bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] font-semibold"
                          : "bg-[var(--tovu-bg-surface)] border border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)]"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scrubber & Time */}
          <div className="space-y-2 pt-3 border-t border-[var(--tovu-border-hairline)]">
            <div className="relative group">
              <input
                type="range"
                aria-label="Audio playback position"
                min={0}
                max={duration || 1}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--tovu-border-strong)] rounded-lg appearance-none cursor-pointer accent-[var(--tovu-accent)] focus:outline-none"
              />
              <div
                className="absolute top-0 left-0 h-1.5 bg-[var(--tovu-accent)] rounded-lg pointer-events-none transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[13px] font-mono text-[var(--tovu-text-muted)]">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-center gap-6 pt-1">
            {mode === "ambient" && (
              <button
                type="button"
                onClick={onPrevTrack}
                aria-label="Previous soundscape"
                className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
                title="Previous soundscape"
              >
                <SkipBack className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
              className="w-14 h-14 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] hover:opacity-90 transition-transform active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            {mode === "ambient" && (
              <button
                type="button"
                onClick={onNextTrack}
                aria-label="Next soundscape"
                className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
                title="Next soundscape"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-between text-[13px] text-[var(--tovu-text-muted)] pt-3 border-t border-[var(--tovu-border-hairline)]">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              {mode === "ambient"
                ? "Synthesized in-browser via Web Audio. Never autoplays."
                : "Silent section pacer. Audio never autoplays on entry."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
