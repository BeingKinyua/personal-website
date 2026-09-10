import React from "react";
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
  Sparkles,
  ExternalLink,
  Info
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
  // Ambient mode
  tracks: AmbientTrack[];
  currentTrack: AmbientTrack;
  onSelectTrack: (index: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  // Narration mode
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
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onMinimize();
      }}
    >
      <div 
        id="reader-audio-panel"
        className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0d0f14] shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
              AUDIO EXPERIENCE // VICTOR.OS
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onMinimize}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Minimize player"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close audio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-black/40 border-b border-white/5 text-xs font-mono">
          <button
            onClick={() => setMode("ambient")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all cursor-pointer ${
              mode === "ambient"
                ? "bg-white/10 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>♪ Ambient Sound</span>
          </button>
          <button
            onClick={() => setMode("narration")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all cursor-pointer ${
              mode === "narration"
                ? "bg-white/10 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>🔊 Listen to Article</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6">
          {mode === "ambient" ? (
            /* Mode A: Ambient Focus Music */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 block mb-1">
                    NOW PLAYING // CURATED DRONE
                  </span>
                  <h3 className="text-lg font-mono font-medium text-white">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {currentTrack.artist} · {currentTrack.bpm} BPM
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Radio className={`w-6 h-6 ${isPlaying ? "animate-pulse" : ""}`} />
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-normal bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                {currentTrack.description}
              </p>

              {/* Track Playlist Selector */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  SELECT SOUNDSCAPE (FUTURE SPOTIFY ARCHITECTURE)
                </span>
                <div className="space-y-1">
                  {tracks.map((track, idx) => (
                    <button
                      key={track.id}
                      onClick={() => onSelectTrack(idx)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer ${
                        track.id === currentTrack.id
                          ? "bg-blue-500/15 border-blue-500/30 text-white"
                          : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-medium">{track.title}</span>
                        <span className="text-[11px] text-zinc-500 ml-2">({track.genre})</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {Math.floor(track.durationSeconds / 60)}:{track.durationSeconds % 60 < 10 ? "0" : ""}{track.durationSeconds % 60}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode B: AI Narration Read-Aloud */
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                  NEURAL NARRATION ENGINE
                </span>
                <h3 className="text-lg font-mono font-medium text-white">
                  {narration?.title || "Article Audio Readout"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Synthesized voice pacing with automated architectural pauses
                </p>
              </div>

              {/* Voice Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  VOICE PROFILE
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onSelectVoice(v.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        v.id === selectedVoice
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                          : "bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="font-medium font-mono text-[11px]">{v.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{v.tagline}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Speed */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  PLAYBACK SPEED
                </span>
                <div className="flex items-center gap-2">
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => onSetPlaybackSpeed(spd)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        playbackSpeed === spd
                          ? "bg-white text-black font-semibold shadow"
                          : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
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
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="relative group">
              <input
                type="range"
                min={0}
                max={duration || 1}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
              />
              <div
                className="absolute top-0 left-0 h-1.5 bg-blue-500 rounded-lg pointer-events-none transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-center gap-6 pt-2">
            {mode === "ambient" && (
              <button
                onClick={onPrevTrack}
                className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Previous soundscape"
              >
                <SkipBack className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onTogglePlay}
              className="w-14 h-14 rounded-full bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 flex items-center justify-center shadow-lg shadow-white/10 cursor-pointer"
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
                onClick={onNextTrack}
                className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Next soundscape"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-zinc-500" />
              Audio will never autoplay on page entry.
            </span>
            <span>MODULAR ARCHITECTURE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
