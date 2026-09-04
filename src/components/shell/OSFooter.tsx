import React from "react";
import { ArrowUp, Terminal, ShieldCheck } from "lucide-react";

interface OSFooterProps {
  onScrollToTop: () => void;
  onNavigate: (sectionId: string) => void;
}

export const OSFooter: React.FC<OSFooterProps> = ({ onScrollToTop, onNavigate }) => {
  return (
    <footer className="border-t border-white/10 bg-[#07080a] py-12 px-6 text-zinc-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-white font-semibold tracking-widest">VICTOR.OS</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">PERSONAL DIGITAL OPERATING SYSTEM</span>
        </div>

        <div className="flex items-center gap-6 text-[11px]">
          {["work", "journal", "lab", "knowledge", "about", "contact"].map((s) => (
            <button
              key={s}
              onClick={() => onNavigate(s)}
              className="hover:text-white uppercase transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] text-zinc-400">© {new Date().getFullYear()} Victor Kinyua</span>
          <button
            onClick={onScrollToTop}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Scroll to Top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
