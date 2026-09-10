import React from "react";
import { X, RotateCcw, Type, Maximize2, Palette, Sparkles } from "lucide-react";
import { ReaderSettings, ReaderFontSize, ReaderContentWidth, ReaderTheme, ReaderMotion } from "../../hooks/useReaderSettings";

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  onReset: () => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="reader-settings-backdrop"
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reader-settings-panel"
        className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0e1115] shadow-2xl overflow-hidden p-6 space-y-6 text-zinc-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
              Aa
            </span>
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300">
              READING PREFERENCES
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Typography Size */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>TEXT SIZE</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["small", "medium", "large"] as ReaderFontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => onUpdateSetting("fontSize", size)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono capitalize transition-all cursor-pointer ${
                  settings.fontSize === size
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-200 font-semibold"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Reading Column Width */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CONTENT WIDTH</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["focused", "comfortable", "wide"] as ReaderContentWidth[]).map((w) => (
              <button
                key={w}
                onClick={() => onUpdateSetting("contentWidth", w)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono capitalize transition-all cursor-pointer ${
                  settings.contentWidth === w
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Surface Palette Theme */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>THEME ENVIRONMENT</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["dark", "obsidian", "paper"] as ReaderTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => onUpdateSetting("theme", t)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.theme === t
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-200 font-semibold"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    t === "dark"
                      ? "bg-[#090b0e] border border-white/30"
                      : t === "obsidian"
                      ? "bg-black border border-white/40"
                      : "bg-[#181b22] border border-amber-400"
                  }`}
                />
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Motion Dynamics */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>MOTION PREFERENCE</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["full", "reduced"] as ReaderMotion[]).map((m) => (
              <button
                key={m}
                onClick={() => onUpdateSetting("motion", m)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono capitalize transition-all cursor-pointer ${
                  settings.motion === m
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-200 font-semibold"
                    : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {m === "full" ? "Full Motion" : "Reduced Motion"}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
          <span>Settings persist automatically in local storage</span>
          <button
            onClick={onClose}
            className="text-xs font-mono text-white hover:text-blue-300 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
