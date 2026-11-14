import React, { useEffect } from "react";
import { X, RotateCcw, Type, Maximize2, Palette, Sparkles } from "lucide-react";
import {
  ReaderSettings,
  ReaderFontSize,
  ReaderContentWidth,
  ReaderTheme,
  ReaderMotion,
} from "../../hooks/useReaderSettings";

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
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="reader-settings-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-settings-title"
      className="fixed inset-0 z-[120] bg-[var(--tovu-bg-overlay)] backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reader-settings-panel"
        className="w-full max-w-md rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-elevated)] shadow-2xl overflow-hidden p-6 space-y-6 text-[var(--tovu-text-primary)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--tovu-border-hairline)]">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-mono font-semibold text-[var(--tovu-accent)]">
              Aa
            </span>
            <h3
              id="reader-settings-title"
              className="text-sm font-mono uppercase tracking-[0.12em] text-[var(--tovu-text-secondary)]"
            >
              Reading Preferences
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset reading preferences to defaults"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close reading preferences"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
              title="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Typography Size */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)]">
            <Type className="w-3.5 h-3.5 text-[var(--tovu-accent)]" />
            <span>Text Size</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["small", "medium", "large"] as ReaderFontSize[]).map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => onUpdateSetting("fontSize", size)}
                aria-pressed={settings.fontSize === size}
                className={`min-h-[42px] py-2 px-3 rounded-xl border text-sm font-medium capitalize transition-colors cursor-pointer ${
                  settings.fontSize === size
                    ? "bg-[var(--tovu-accent-subtle)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                    : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Reading Column Width */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)]">
            <Maximize2 className="w-3.5 h-3.5 text-[var(--tovu-accent)]" />
            <span>Content Width</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["focused", "comfortable", "wide"] as ReaderContentWidth[]).map((w) => (
              <button
                type="button"
                key={w}
                onClick={() => onUpdateSetting("contentWidth", w)}
                aria-pressed={settings.contentWidth === w}
                className={`min-h-[42px] py-2 px-3 rounded-xl border text-sm font-medium capitalize transition-colors cursor-pointer ${
                  settings.contentWidth === w
                    ? "bg-[var(--tovu-accent-subtle)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                    : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Surface Palette Theme */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)]">
            <Palette className="w-3.5 h-3.5 text-[var(--tovu-accent)]" />
            <span>Reader Surface</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["dark", "obsidian", "paper"] as ReaderTheme[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => onUpdateSetting("theme", t)}
                aria-pressed={settings.theme === t}
                className={`min-h-[42px] py-2 px-3 rounded-xl border text-sm font-medium capitalize transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  settings.theme === t
                    ? "bg-[var(--tovu-accent-subtle)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                    : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-2.5 h-2.5 rounded-full border ${
                    t === "dark"
                      ? "bg-[#0d1015] border-white/30"
                      : t === "obsidian"
                      ? "bg-[#050608] border-white/40"
                      : "bg-[#f5f3ee] border-stone-400"
                  }`}
                />
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Motion Dynamics */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--tovu-text-muted)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--tovu-accent)]" />
            <span>Motion Preference</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["full", "reduced"] as ReaderMotion[]).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => onUpdateSetting("motion", m)}
                aria-pressed={settings.motion === m}
                className={`min-h-[42px] py-2 px-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                  settings.motion === m
                    ? "bg-[var(--tovu-accent-subtle)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                    : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:border-[var(--tovu-border-strong)]"
                }`}
              >
                {m === "full" ? "Full Motion" : "Reduced Motion"}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[var(--tovu-border-hairline)] text-[13px] text-[var(--tovu-text-muted)] flex items-center justify-between">
          <span>Saved locally in your browser</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg text-sm font-medium text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
