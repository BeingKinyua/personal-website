import React, { useEffect, useState, useRef } from "react";
import { X, Cpu, Info, ExternalLink, ArrowRight } from "lucide-react";
import { Project } from "../types";
import { gsap } from "gsap";

interface ProjectCaseStudyProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectCaseStudy({ project, onClose }: ProjectCaseStudyProps) {
  const [scrollY, setScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden";
      
      // Cascading reveal for main dialog sections
      gsap.fromTo(".case-section", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: "power2.out", delay: 0.05 }
      );

      // Cascading/sequential scale & zoom entrance for topo nodes
      gsap.fromTo(".arch-node",
        { opacity: 0, scale: 0.72 },
        { opacity: 1, scale: 1, duration: 0.55, stagger: 0.07, ease: "back.out(1.5)", delay: 0.15 }
      );
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [project]);

  if (!project) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  return (
    <div 
      id="project-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        id="project-case-study"
        className="w-full max-w-4xl bg-[#1e2020] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        style={{ borderRadius: "1.75rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Parallax */}
        <div className="relative w-full h-44 overflow-hidden shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" 
            alt="Flow Blueprint Graph"
            className="w-full h-[155%] object-cover absolute left-0 ease-out duration-200"
            style={{ 
              top: "-15%", // Offset start
              transform: `translateY(${scrollY * 0.28}px)` // Silk-smooth reactive parallax
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2020] via-[#1e2020]/25 to-black/45 pointer-events-none" />
          
          <span className="absolute top-4 left-6 z-10 font-mono text-[9px] font-extrabold uppercase bg-emerald-500/25 border border-emerald-400 text-emerald-300 px-2.5 py-0.5 rounded shadow-lg backdrop-blur-md tracking-wider">
            SYSTEM DIAGRAM ONLINE
          </span>
        </div>

        {/* Header containing metadata */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/25 relative z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-wider bg-white/5 border border-[#c3c0ff]/30 px-3 py-1 rounded-full">
              {project.category}
            </span>
            <span className="font-mono text-xs text-slate-500">/ version {project.version}</span>
          </div>
          <button 
            id="proj-modal-close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal scroll contents */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 select-none"
        >
          <div className="case-section">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              {project.title}
            </h2>
            <p className="text-base text-[#c3c0ff] font-sans font-medium">{project.subtitle}</p>
          </div>

          {/* Quick Problem - System Dual Cards */}
          <div className="case-section grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#121414] border border-white/5 p-5.5 rounded-2xl hover:border-red-400/20 hover:shadow-lg transition-all duration-300">
              <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider block mb-2">[ BOTTLENECK SPEC ]</span>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">{project.problem}</p>
            </div>
            
            <div className="bg-[#121414] border border-white/5 p-5.5 rounded-2xl hover:border-emerald-400/20 hover:shadow-lg transition-all duration-300">
              <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">[ SOLVER ORCHESTRATOR ]</span>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">{project.system}</p>
            </div>
          </div>

          {/* Visual Architecture Topology */}
          <div className="case-section space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-450 flex items-center gap-1.5 font-semibold">
                <Cpu className="w-4 h-4 text-[#c3c0ff]" />
                Topological Flow Layout Map
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 font-bold">COORDINATES GRAPH MATCH</span>
            </div>

            <div className="relative w-full h-[270px] bg-[#0c0d0e] border border-white/5 rounded-2xl overflow-hidden blueprint-overlay p-4 flex items-center">
              {/* Dynamic Line SVG Draw paths */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {project.architectureLines.map((line, idx) => {
                  const fromNode = project.architectureNodes.find(n => n.id === line.from);
                  const toNode = project.architectureNodes.find(n => n.id === line.to);
                  if (!fromNode || !toNode) return null;
                  
                  // Calculate dynamic coordinate percentages
                  const x1 = `${fromNode.x}%`;
                  const y1 = `${fromNode.y}%`;
                  const x2 = `${toNode.x}%`;
                  const y2 = `${toNode.y}%`;

                  return (
                    <g key={idx}>
                      <line 
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke={line.active ? "#c3c0ff" : "#2a2d33"} 
                        strokeWidth={line.active ? "2" : "1"}
                        strokeDasharray={line.active ? "5 3" : "none"}
                        className={line.active ? "animate-[dash_12s_linear_infinite]" : "opacity-40"}
                      />
                      {/* Pulse point cascading */}
                      {line.active && (
                        <circle r="3.5" fill="#c3c0ff" className="shadow-[0_0_8px_#c3c0ff]">
                          <animateMotion 
                            path={`M ${fromNode.x},${fromNode.y} L ${toNode.x},${toNode.y}`} 
                            dur="2.5s" 
                            repeatCount="indefinite" 
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Node Placements */}
              {project.architectureNodes.map((node) => (
                <div
                  key={node.id}
                  className={`arch-node absolute -translate-x-1/2 -translate-y-1/2 z-10 px-3.5 py-1.5 rounded-lg border text-center transition-all shadow-md ${
                    node.role === "input"
                      ? "bg-[#181a1c] border-slate-700/80 text-slate-350 text-xs"
                      : node.role === "output"
                      ? "bg-[#11122a] border-[#c3c0ff]/60 text-[#c3c0ff] text-xs font-bold shadow-[0_0_12px_rgba(195,192,255,0.08)]"
                      : "bg-[#121415] border-slate-700/70 text-slate-300 text-xs"
                  }`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <span className="font-mono block tracking-wider font-semibold text-[10px] md:text-xs">
                    {node.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Technical Highlights */}
          <div className="case-section space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-slate-450 flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-[#c3c0ff]" />
              Engineering Deep Dive Specifications
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-sans font-light bg-black/10 p-5 rounded-2xl border border-white/5 leading-loose">
              {project.details}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-black/25 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5 font-md block"><Cpu className="w-3.5 h-3.5 text-[#c3c0ff]" /> STABLE COMPILATION ARCHITECTURE</span>
          {project.url && (
            <a 
              href={project.url}
              className="flex items-center gap-2 text-[#c3c0ff] hover:text-white hover:border-b hover:border-white/30 transition-all cursor-pointer font-bold pb-0.5 tracking-wider"
            >
              VISIT ACTIVE TARGET
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
