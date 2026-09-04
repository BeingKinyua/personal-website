import { useState, useEffect } from "react";
import { X, Play, Code2, Terminal, ShieldAlert, Cpu } from "lucide-react";
import { FocusItem } from "../types";

interface FocusDetailModalProps {
  item: FocusItem | null;
  onClose: () => void;
}

export default function FocusDetailModal({ item, onClose }: FocusDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "code" | "terminal">("overview");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (item) {
      setActiveTab("overview");
      setTerminalLogs(item.statusLogs);
      setIsRunning(false);
    }
  }, [item]);

  if (!item) return null;

  const triggerMockCompilation = () => {
    setIsRunning(true);
    const startLogs = [
      `$ tsx verify-pipeline --source=${item.snippet?.filename || "main.go"}`,
      `[INFO] Starting execution module bounds...`,
      `[DEBUG] Loading compiler packages (v1.22 optimized)`,
      `[DEBUG] Verifying AST correctness...`
    ];

    setTerminalLogs(startLogs);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < item.statusLogs.length) {
        setTerminalLogs(prev => [...prev, `[SUCCESS] ${item.statusLogs[idx]}`]);
        idx++;
      } else {
        setTerminalLogs(prev => [...prev, `[COMPLETE] Process exited successfully with status 0. Checked OK.`]);
        setIsRunning(false);
        clearInterval(interval);
      }
    }, 800);
  };

  return (
    <div 
      id="focus-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        id="focus-modal-container"
        className="w-full max-w-2xl bg-[#1e2020] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
        style={{ borderRadius: "2rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div id="focus-modal-header" className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full border border-[#c3c0ff]/30 text-xs text-[#c3c0ff] uppercase tracking-wider font-mono">
              {item.category}
            </div>
            <span className="text-slate-500 font-mono text-sm">/ {item.id}</span>
          </div>
          <button 
            id="focus-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Tabs */}
        <div id="focus-modal-tabs" className="px-6 border-b border-white/5 flex items-center gap-6 bg-black/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-[#c3c0ff] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Overview
          </button>
          
          {item.snippet && (
            <button
              onClick={() => setActiveTab("code")}
              className={`py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all ${
                activeTab === "code"
                  ? "border-[#c3c0ff] text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Source Block
            </button>
          )}

          <button
            onClick={() => setActiveTab("terminal")}
            className={`py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "terminal"
                ? "border-[#c3c0ff] text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Active Logs
          </button>
        </div>

        {/* Scrollable Content inside modal */}
        <div id="focus-modal-body" className="p-6 overflow-y-auto flex-1 text-slate-200">
          {activeTab === "overview" && (
            <div id="focus-tab-overview" className="space-y-6">
              <h3 className="text-2xl font-bold tracking-tight text-white">{item.title}</h3>
              <p className="text-base text-slate-300 leading-relaxed font-sans">{item.longDescription}</p>
              
              <div className="bg-[#121414] border border-white/5 rounded-2xl p-4 flex gap-3.5">
                <Cpu className="w-5 h-5 text-[#c3c0ff] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#c3c0ff] mb-1 font-mono">Dynamic Context</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This vector focuses directly on high-concurrency constraints, ensuring low thread locking and non-blocking operation buffers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "code" && item.snippet && (
            <div id="focus-tab-code" className="space-y-4">
              <div className="flex items-center justify-between px-4 py-2 bg-[#121414] border border-white/5 rounded-t-xl border-b-0 -mb-4 font-mono text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                  {item.snippet.filename}
                </span>
                <span className="text-[10px] uppercase">{item.snippet.language}</span>
              </div>
              <pre className="bg-[#0d0e0f] border border-white/5 p-4 rounded-xl text-xs overflow-auto font-mono text-emerald-400/90 leading-relaxed max-h-[350px]">
                <code>{item.snippet.code}</code>
              </pre>
            </div>
          )}

          {activeTab === "terminal" && (
            <div id="focus-tab-terminal" className="space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 uppercase font-mono">
                  <Terminal className="w-3.5 h-3.5 text-[#c3c0ff]" />
                  Internal Syslog Standard Out
                </span>
                <button
                  disabled={isRunning}
                  onClick={triggerMockCompilation}
                  className="px-3.5 py-1.5 rounded-full bg-[#c3c0ff] text-[#1d00a5] font-mono text-xs font-bold flex items-center gap-1 hover:bg-[#dad7ff] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Run Compiler Check
                </button>
              </div>

              <div className="bg-[#0d0e0f] border border-white/5 p-4 rounded-xl text-xs h-[250px] overflow-y-auto space-y-2 font-mono scrollbar-thin">
                {terminalLogs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`${
                      log.startsWith("$") 
                        ? "text-blue-400 font-bold" 
                        : log.includes("[SUCCESS]") || log.includes("[COMPLETE]")
                        ? "text-emerald-400"
                        : log.includes("[INFO]")
                        ? "text-slate-400"
                        : "text-slate-300"
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info line */}
        <div id="focus-modal-footer" className="px-6 py-4.5 bg-black/20 border-t border-white/5 text-center text-xs text-slate-500 font-mono flex items-center justify-between">
          <span>COORDINATE SCANNER: ACTIVE</span>
          <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-slate-500" /> SECURE HANDSHAKE OK</span>
        </div>
      </div>
    </div>
  );
}
