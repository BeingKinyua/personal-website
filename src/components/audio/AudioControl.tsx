import React from "react";
import { Volume2, VolumeX, Disc3, Mic } from "lucide-react";
import { AudioMode } from "../../hooks/useAudioPlayer";

interface AudioControlProps {
  isPlaying: boolean;
  isOpen: boolean;
  mode: AudioMode;
  onClick: () => void;
}

export const AudioControl: React.FC<AudioControlProps> = ({
  isPlaying,
  isOpen,
  mode,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      id="reader-audio-btn"
      aria-label="Open reading audio controls"
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
        isPlaying
          ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          : isOpen
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20"
      }`}
    >
      {isPlaying ? (
        <span className="flex items-center gap-0.5 h-3">
          <span className="w-0.5 h-full bg-blue-400 animate-[bounce_0.8s_ease-in-out_infinite]" />
          <span className="w-0.5 h-2/3 bg-blue-400 animate-[bounce_0.6s_ease-in-out_infinite_0.15s]" />
          <span className="w-0.5 h-full bg-blue-400 animate-[bounce_0.9s_ease-in-out_infinite_0.3s]" />
          <span className="w-0.5 h-1/2 bg-blue-400 animate-[bounce_0.7s_ease-in-out_infinite_0.1s]" />
        </span>
      ) : (
        <Volume2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
      )}

      <span className="hidden sm:inline">
        {isPlaying ? (mode === "ambient" ? "AMBIENT" : "NARRATION") : "AUDIO"}
      </span>

      {isPlaying && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping absolute -top-0.5 -right-0.5" />
      )}
    </button>
  );
};
