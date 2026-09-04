import React from "react";
import { X, Terminal, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import { CurrentlyItem } from "../../types/common";

interface CurrentlyTelemetryModalProps {
  item: CurrentlyItem | null;
  onClose: () => void;
}

export const CurrentlyTelemetryModal: React.FC<CurrentlyTelemetryModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      id="telemetry-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="telemetry-modal-content"
        className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d0f12] p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                {item.category}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {item.techOrSource}
              </span>
            </div>
            <h3 className="text-lg font-medium text-white tracking-wide">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {item.details}
          </p>

          {/* Status Logs Stream */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-mono text-zinc-400">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>ACTIVE STATUS LOGS</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/50 p-3.5 font-mono text-xs space-y-2">
              {item.statusLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-zinc-300">
                  <span className="text-blue-400 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code Snippet if present */}
          {item.snippet && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-zinc-400">
                <span>{item.snippet.filename}</span>
                <span className="text-[10px] uppercase text-zinc-500">{item.snippet.language}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#07080a] p-3.5 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                <pre><code>{item.snippet.code}</code></pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>STATUS: {item.status}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
