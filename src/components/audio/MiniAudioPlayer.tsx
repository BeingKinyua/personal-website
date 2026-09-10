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
      className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#0e1116]/95 border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-fadeIn"
    >
      <button
        onClick={onExpand}
        className="flex items-center gap-2.5 text-left cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          {mode === "ambient" ? (
            <Radio className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
          ) : (
            <Volume2 className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`} />
          )}
        </div>

        <div className="max-w-[140px] sm:max-w-[190px]">
          <div className="text-xs font-mono font-medium truncate group-hover:text-blue-300 transition-colors">
            {title}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 truncate">
            {artistOrType}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
        <button
          onClick={onTogglePlay}
          className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </button>

        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Expand audio controls"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Stop & close audio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
