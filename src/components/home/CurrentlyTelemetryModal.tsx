import React, { useEffect, useRef } from "react";
import { X, Terminal } from "lucide-react";
import { CurrentlyItem } from "../../types/common";
import { useScrollLock } from "../../hooks/useScrollLock";

interface CurrentlyTelemetryModalProps {
  item: CurrentlyItem | null;
  onClose: () => void;
}

export const CurrentlyTelemetryModal: React.FC<CurrentlyTelemetryModalProps> = ({
  item,
  onClose,
}) => {
  useScrollLock({
    lock: !!item,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  useEffect(() => {
    if (!item) return;
    const el = scrollRef.current;
    if (!el) return;

    const stopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    el.addEventListener("wheel", stopPropagation, { passive: true });
    el.addEventListener("touchmove", stopPropagation, { passive: true });

    return () => {
      el.removeEventListener("wheel", stopPropagation);
      el.removeEventListener("touchmove", stopPropagation);
    };
  }, [item]);

  if (!item) return null;

  return (
    <div
      id="telemetry-modal-backdrop"
      data-lenis-prevent="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="currently-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--tovu-bg-overlay)] backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="telemetry-modal-content"
        data-lenis-prevent="true"
        className="relative w-full max-w-xl rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-elevated)] p-6 shadow-2xl text-[var(--tovu-text-primary)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--tovu-border-hairline)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-mono text-[var(--tovu-text-muted)] mb-1.5">
              <span className="text-[var(--tovu-accent)] font-medium">{item.category}</span>
              <span aria-hidden="true">·</span>
              <span>{item.techOrSource}</span>
            </div>
            <h3
              id="currently-modal-title"
              className="font-display text-xl font-semibold text-[var(--tovu-text-primary)] tracking-tight"
            >
              {item.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail dialog"
            className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div
          ref={scrollRef}
          data-lenis-prevent="true"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-5 space-y-5 scrollbar-thin outline-none"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <p className="text-[16px] text-[var(--tovu-text-secondary)] leading-relaxed">
            {item.details}
          </p>

          {/* Activity notes */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 text-[13px] font-mono uppercase tracking-[0.1em] text-[var(--tovu-text-muted)]">
              <Terminal className="w-3.5 h-3.5 text-[var(--tovu-accent)]" />
              <span>Working Notes</span>
            </div>
            <div className="rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-inset)] p-4 font-mono text-[13px] space-y-2">
              {item.statusLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[var(--tovu-text-secondary)]">
                  <span className="text-[var(--tovu-accent)] select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code Snippet if present */}
          {item.snippet && (
            <div>
              <div className="flex items-center justify-between mb-2 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                <span>{item.snippet.filename}</span>
                <span className="uppercase">{item.snippet.language}</span>
              </div>
              <div className="rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-inset)] p-4 font-mono text-[13px] text-[var(--tovu-text-secondary)] overflow-x-auto">
                <pre><code>{item.snippet.code}</code></pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--tovu-border-hairline)] flex items-center justify-between text-[13px] font-mono text-[var(--tovu-text-muted)]">
          <span>Status: {item.status}</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:bg-[var(--tovu-bg-inset)] text-[var(--tovu-text-primary)] font-sans text-sm font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
