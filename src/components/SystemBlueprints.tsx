import { useState } from "react";
import { Play, RotateCcw, Cpu, CheckCircle2, AlertCircle, Info, Hammer } from "lucide-react";
import { SystemBlueprint, BlueprintNode } from "../types";
import { DEFAULT_BLUEPRINT } from "../data";

interface SystemBlueprintsProps {
  customBlueprint?: SystemBlueprint | null;
}

export default function SystemBlueprints({ customBlueprint }: SystemBlueprintsProps) {
  const [activeBlueprint, setActiveBlueprint] = useState<SystemBlueprint>(DEFAULT_BLUEPRINT);
  const [simulationState, setSimulationState] = useState<"idle" | "running" | "completed">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<BlueprintNode | null>(null);

  // Sync to custom blueprint if loaded from AI Copilot
  useState(() => {
    if (customBlueprint) {
      setActiveBlueprint(customBlueprint);
      setLogs([`[SYSTEM] Loaded AI Generated Blueprint: "${customBlueprint.name}"`]);
    }
  });

  const handleSelectBlueprint = (bp: SystemBlueprint) => {
    setActiveBlueprint(bp);
    setSimulationState("idle");
    setLogs([`[SYSTEM] Swapped layout view boundary. Ready to execute.`]);
    setActiveNode(null);
  };

  const runSimulation = () => {
    if (simulationState === "running") return;
    setSimulationState("running");
    setLogs(["[ENG] Launching active orchestration simulation..."]);

    const nodes = activeBlueprint.nodes;
    let index = 0;

    const interval = setInterval(() => {
      if (index < nodes.length) {
        const node = nodes[index];
        setActiveNode(node);
        setLogs(prev => [
          ...prev,
          `[OK] Activated [${node.role.toUpperCase()}] node "${node.label}" - processing frame telemetry...`
        ]);
        index++;
      } else {
        setLogs(prev => [
          ...prev,
          `[SUCCESS] Flow complete. Output report generated. Metrics standard optimal.`
        ]);
        setSimulationState("completed");
        setActiveNode(null);
        clearInterval(interval);
      }
    }, 1200);
  };

  const resetSimulation = () => {
    setSimulationState("idle");
    setLogs(["[SYSTEM] Re-synchronized pipeline metrics. Await telemetry launch."]);
    setActiveNode(null);
  };

  return (
    <div className="bento-card p-6 md:p-10 blueprint-overlay relative w-full" id="blueprints-studio">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8.5">
        <div>
          <span className="font-label-mono text-label-sm text-[#c3c0ff] uppercase tracking-widest block mb-2">[ INTROSPECT LAYOUT ]</span>
          <h3 className="font-headline-lg text-2xl text-on-surface tracking-tight">Interactive Systems Studio</h3>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Visualize, select, and simulate dynamic multi-lane software architectures.
          </p>
        </div>

        {/* Floating Actions */}
        <div className="flex items-center gap-3">
          {customBlueprint && (
            <button
              onClick={() => handleSelectBlueprint(customBlueprint)}
              className={`px-4.5 py-2 rounded-full border text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeBlueprint.name === customBlueprint.name
                  ? "bg-[#c3c0ff]/10 border-[#c3c0ff] text-[#c3c0ff]"
                  : "bg-transparent border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              AI Gen Spec
            </button>
          )}

          <button
            onClick={() => handleSelectBlueprint(DEFAULT_BLUEPRINT)}
            className={`px-4.5 py-2 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer ${
              activeBlueprint.name === DEFAULT_BLUEPRINT.name
                ? "bg-[#c3c0ff]/10 border-[#c3c0ff] text-[#c3c0ff]"
                : "bg-transparent border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            Football CV Scout
          </button>
        </div>
      </div>

      {/* Main Studio Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Flow Canvas Diagram */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative w-full h-[380px] bg-[#0c0d10] border border-slate-700/60 rounded-3xl overflow-hidden shadow-inner flex items-center select-none">
            {/* SVG Connecting lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {activeBlueprint.lines.map((line, idx) => {
                const fromNode = activeBlueprint.nodes.find(n => n.id === line.from);
                const toNode = activeBlueprint.nodes.find(n => n.id === line.to);
                if (!fromNode || !toNode) return null;

                const isLineActive = 
                  simulationState === "running" && 
                  (activeNode?.id === fromNode.id || activeNode?.id === toNode.id);

                return (
                  <g key={idx}>
                    <line
                      x1={`${fromNode.x}%`}
                      y1={`${fromNode.y}%`}
                      x2={`${toNode.x}%`}
                      y2={`${toNode.y}%`}
                      stroke={isLineActive ? "#c3c0ff" : line.active ? "#4f46e5" : "#343535"}
                      strokeWidth={isLineActive ? "2.5" : "1.5"}
                      className={simulationState === "running" ? "animate-[dash_8s_linear_infinite]" : ""}
                      strokeDasharray={simulationState === "running" ? "4 4" : "none"}
                    />
                    {simulationState === "running" && isLineActive && (
                      <circle r="4.5" fill="#dad7ff" className="animate-ping">
                        <animateMotion
                          path={`M ${fromNode.x},${fromNode.y} L ${toNode.x},${toNode.y}`}
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Layout Nodes */}
            {activeBlueprint.nodes.map((node) => {
              const isProcessing = activeNode?.id === node.id;
              
              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNode(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl p-4 border text-left transition-all z-10 w-44 hover:-translate-y-1.5 focus:outline-none pointer ${
                    isProcessing
                      ? "bg-[#1d00a5] border-[#c3c0ff] text-white shadow-lg shadow-[#c3c0ff]/20 scale-105"
                      : node.role === "input"
                      ? "bg-[#1a1c1c] border-slate-700/85 hover:border-slate-500 text-slate-300"
                      : node.role === "output"
                      ? "bg-slate-900 border-[#4f46e5]/60 hover:border-[#c3c0ff] text-[#c3c0ff]"
                      : "bg-[#121414] border-slate-800/80 hover:border-slate-600 text-slate-300"
                  }`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">{node.role}</span>
                    {isProcessing && <Cpu className="w-3.5 h-3.5 text-white animate-spin" />}
                  </div>
                  <h4 className="text-xs font-bold leading-tight truncate">{node.label}</h4>
                </button>
              );
            })}

            {/* Empty Context placeholder on grid */}
            <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[10px] font-mono text-slate-550">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>GRID CALIBRATOR ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right Column: Controller Controls & syslog */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between min-h-[380px]">
          {/* Node Spec Panel */}
          <div className="bg-[#121414] rounded-2xl p-5 border border-white/5 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#c3c0ff] flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-[#c3c0ff]" />
              Selected Node Inspector
            </span>

            {activeNode ? (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white font-sans">{activeNode.label}</h4>
                <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-mono text-slate-400 w-fit uppercase font-bold">
                  {activeNode.role} MODULE
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mt-2.5">
                  {activeNode.description || "No supplemental hardware specifications available on host interface."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-sans leading-relaxed italic">
                Click any layout node on the architecture map canvas to inspect structural endpoints, roles, and operations.
              </p>
            )}
          </div>

          {/* Simulation controller actions */}
          <div className="bg-[#121414] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-slate-500 font-bold">FLOW CONTROL</span>
              <div className="flex items-center gap-1.5">
                {simulationState === "running" && <span className="w-2 h-2 rounded-full bg-[#c3c0ff] animate-ping" />}
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {simulationState}
                </span>
              </div>
            </div>

            <div className="flex gap-3.5">
              <button
                onClick={runSimulation}
                disabled={simulationState === "running"}
                className="flex-1 py-3 px-4.5 rounded-full bg-[#c3c0ff] hover:bg-[#dad7ff] text-[#1d00a5] text-xs font-mono font-extrabold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                EXECUTE PIPELINE
              </button>
              
              <button
                onClick={resetSimulation}
                disabled={simulationState === "idle"}
                className="py-3 px-4.5 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                title="Reset Flow"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* System status logs stream console */}
          <div className="bg-[#0b0c0d] border border-white/5 rounded-2xl p-4.5 h-[135px] overflow-y-auto flex flex-col gap-1.5 font-mono text-[10px] scrollbar-thin">
            <div className="font-bold text-slate-500 border-b border-white/5 pb-1 uppercase font-mono tracking-wider mb-1 mr-auto shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Live Telemetry Streams
            </div>
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`${
                  log.includes("[SUCCESS]") 
                    ? "text-emerald-400" 
                    : log.includes("[SYSTEM]")
                    ? "text-blue-400"
                    : log.includes("[OK]")
                    ? "text-slate-350"
                    : "text-slate-450"
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
