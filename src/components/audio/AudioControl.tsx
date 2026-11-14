import React from "react";
import { Volume2 } from "lucide-react";
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
      type="button"
      onClick={onClick}
      id="reader-audio-btn"
      aria-label="Open reading audio controls"
      aria-expanded={isOpen}
      className={`min-h-[40px] group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-medium transition-colors cursor-pointer ${
        isPlaying
          ? "border-teal-500/45 bg-teal-500/15"
          : isOpen
          ? "border-current/25 bg-current/10"
          : "border-current/15 bg-current/5 hover:bg-current/10"
      }`}
    >
      <Volume2 className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline">
        {isPlaying ? (mode === "ambient" ? "Ambient" : "Narration") : "Audio"}
      </span>
    </button>
  );
};
