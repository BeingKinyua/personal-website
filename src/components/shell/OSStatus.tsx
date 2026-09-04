import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Wifi } from "lucide-react";

export const OSStatus: React.FC = () => {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="os-status-bar"
      className="hidden lg:flex fixed bottom-3 right-5 z-30 items-center gap-3 px-3.5 py-1.5 rounded-full border border-white/5 bg-[#090b0d]/70 text-[11px] font-mono text-zinc-500 backdrop-blur-md select-none"
    >
      <div className="flex items-center gap-1.5 text-zinc-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>KERNEL v2.4</span>
      </div>

      <span className="text-zinc-700">|</span>

      <div className="flex items-center gap-1 text-zinc-400">
        <Activity className="w-3 h-3 text-blue-400" />
        <span>SYS: NORMAL</span>
      </div>

      <span className="text-zinc-700">|</span>

      <div className="flex items-center gap-1 text-zinc-400">
        <Wifi className="w-3 h-3 text-zinc-500" />
        <span>LATENCY: 12ms</span>
      </div>

      <span className="text-zinc-700">|</span>

      <span className="text-zinc-300 font-medium">{time} UTC</span>
    </div>
  );
};
