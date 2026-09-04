import { useState, FormEvent } from "react";
import { Loader2, Sparkles, Check, HelpCircle, Hammer, Code, Calendar, DollarSign, Mail } from "lucide-react";
import { ScopeEstimation, SystemBlueprint } from "../types";

interface ProjectFormProps {
  onBlueprintCompiled: (blueprint: SystemBlueprint) => void;
}

export default function ProjectForm({ onBlueprintCompiled }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "4",
    budget: "$5,000 - $10,000"
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScopeEstimation | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data: ScopeEstimation = await response.json();
      setResult(data);

      if (data.architectureJson) {
        onBlueprintCompiled(data.architectureJson);
      }
    } catch (err) {
      console.error("Scoping estimator network error:", err);
      alert("Ah, the AI Architect scanner timed out. Make sure your Gemini API key is configured correctly in the Secrets panel!");
    } finally {
      setIsLoading(false);
    }
  };

  const copyEmailDraft = () => {
    if (!result) return;
    const emailBody = `Hey Victor,

I worked through your AI System Scoper for my project "${formData.name}". It generated an awesome architecture!

Here is a summary of what we designed:
- Total Engineering: ~${result.totalHours} hours
- Recommended stack: ${result.stack.map(s => s.name).join(", ")}
- Estimated Timeline: ${result.timelineWeeks} weeks

Project Description: "${formData.description}"

Let's schedule a call to sync up and kick off engineering!

Best,`;
    
    navigator.clipboard.writeText(emailBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const budgetScales = [
    "$1,000 - $5,000",
    "$5,000 - $15,000",
    "$15,000 - $35,000",
    "Enterprise / Flexible"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start" id="project-scoper-hub">
      {/* Left Column: Input Form */}
      <div className="bento-card p-6 md:p-9">
        <div className="mb-6.5">
          <span className="font-mono text-[10px] text-[#c3c0ff] uppercase tracking-widest block mb-2">[ SECURE PROJECT BLUEPRINTER ]</span>
          <h4 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight font-sans">Scope Your Architecture</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Specify your technical goals. Our Gemini API system planner will instantly design a tailored deployment stack, phase checklist, and flow chart blueprints.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider font-mono">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Real-time Telemetry Service"
              className="w-full bg-[#121414] border border-slate-700/60 rounded-xl py-3 px-4.5 text-sm text-white focus:outline-none focus:border-[#c3c0ff] placeholder-slate-600 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider font-mono">Goal / Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain what problems you want Victor's engineering architectures to solve..."
              rows={4}
              className="w-full bg-[#121414] border border-slate-700/60 rounded-xl py-3 px-4.5 text-sm text-white focus:outline-none focus:border-[#c3c0ff] placeholder-slate-605 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider font-mono">Scope duration (weeks)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-[#121414] border border-slate-700/60 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#c3c0ff]"
              >
                <option value="2">2 Weeks (Symmetric POC)</option>
                <option value="4">4 Weeks (Robust Standard)</option>
                <option value="8">8 Weeks (Scale Infrastructure)</option>
                <option value="12">12+ Weeks (Enterprise Core)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider font-mono">Expected Budget scale</label>
              <select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-[#121414] border border-slate-700/60 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#c3c0ff]"
              >
                {budgetScales.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 rounded-full bg-[#c3c0ff] hover:bg-[#dad7ff] text-[#1d00a5] font-mono text-sm font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-40 select-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                DRAFTING HIGH-FIDELITY SCHEMAS...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                COMPILE SYSTEM SCOPE ARCHITECT
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Dynamic AI Scope Result Output */}
      <div className="space-y-6">
        {result ? (
          <div className="bento-card p-6 md:p-8 space-y-7 border border-[#c3c0ff]/30 relative" id="scoper-report-card">
            {/* Stamp */}
            <div className="absolute top-6 right-6 px-3 py-1 bg-[#c3c0ff]/10 border border-[#c3c0ff]/40 text-[#c3c0ff] text-[10px] font-mono rounded-full font-bold uppercase tracking-wider">
              ESTIMATION RESOLVED
            </div>

            <div>
              <span className="font-mono text-[9px] uppercase font-bold text-slate-500 tracking-wider">COMPILED PROPOSAL</span>
              <h4 className="text-2xl font-bold text-white mt-1 leading-snug">{result.title}</h4>
              <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">{result.overview}</p>
            </div>

            {/* Core Stack Recommended */}
            <div className="space-y-3 border-t border-white/5 pt-5">
              <h5 className="font-mono text-xs text-slate-350 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <Code className="w-4 h-4 text-[#c3c0ff]" />
                Selected Technology Architecture
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {result.stack.map((s, idx) => (
                  <div key={idx} className="bg-[#121414] border border-white/5 p-3 rounded-xl">
                    <span className="font-mono text-xs font-bold text-white block">{s.name}</span>
                    <span className="text-[11px] text-slate-450 leading-normal block mt-1">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones listed */}
            <div className="space-y-3 border-t border-white/5 pt-5">
              <h5 className="font-mono text-xs text-slate-350 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <Calendar className="w-4 h-4 text-[#c3c0ff]" />
                Sprint Milestones Breakdown
              </h5>
              <div className="space-y-2.5">
                {result.phases.map((p, idx) => (
                  <div key={idx} className="flex gap-3 justify-between items-start bg-black/15 p-3 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="font-bold text-slate-200 block">{p.name}</span>
                      <span className="text-slate-450 block mt-0.5">{p.deliverables}</span>
                    </div>
                    <span className="font-mono font-semibold text-[#c3c0ff] shrink-0 bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px]">
                      {p.hours} HRS
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total scope hours */}
            <div className="flex justify-between items-center bg-[#121414] border border-white/5 p-4 rounded-xl text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-500 uppercase font-bold block">Aggregated scale</span>
                <span className="text-slate-220 font-bold block text-sm">{result.timelineWeeks} Weeks Timeline</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[#c3c0ff] uppercase font-bold block">Estimated Engineering</span>
                <span className="text-white font-extrabold block text-sm">{result.totalHours} Total Hours</span>
              </div>
            </div>

            {/* Dispatch Action */}
            <div className="flex gap-3.5 border-t border-white/5 pt-5">
              <button 
                onClick={copyEmailDraft}
                className="flex-1 py-3 px-4.5 rounded-full bg-white text-[#0d0e0f] font-mono text-xs font-bold leading-normal text-center hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    COPIED SECURELY!
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    COPY COLLAB MAIL DRAFT
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bento-card p-6 md:p-8 h-full min-h-[380px] flex flex-col items-center justify-center text-center text-slate-500 border border-slate-700/40 border-dashed rounded-3xl" id="scoper-report-empty">
            <HelpCircle className="w-12 h-12 text-slate-655 mb-4 animate-bounce" />
            <h5 className="font-sans font-bold text-white text-base">Uncompiled Scopes Terminal</h5>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-sans">
              Enter your specific objectives on the left panel to scan dependencies, estimate velocity metrics, and render customized system deployment loops!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
