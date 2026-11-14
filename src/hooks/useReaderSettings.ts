import { useState, useEffect } from "react";

export type ReaderFontSize = "small" | "medium" | "large";
export type ReaderContentWidth = "focused" | "comfortable" | "wide";
export type ReaderTheme = "dark" | "obsidian" | "paper";
export type ReaderMotion = "full" | "reduced";

export interface ReaderSettings {
  fontSize: ReaderFontSize;
  contentWidth: ReaderContentWidth;
  theme: ReaderTheme;
  motion: ReaderMotion;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: "medium",
  contentWidth: "comfortable",
  theme: "dark",
  motion: "full",
};

const STORAGE_KEY = "tovu_reader_settings";
const LEGACY_STORAGE_KEY = "victoros_reader_settings";

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Failed to load reader settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to save reader settings", e);
    }
  }, [settings]);

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const fontSizeClasses = {
    small: "text-[16px] sm:text-[17px] leading-[1.7]",
    medium: "text-[17px] sm:text-[19px] leading-[1.75]",
    large: "text-[19px] sm:text-[21px] leading-[1.8]",
  }[settings.fontSize];

  const contentWidthClasses = {
    focused: "max-w-[60ch]",
    comfortable: "max-w-[68ch]",
    wide: "max-w-[82ch]",
  }[settings.contentWidth];

  const themeClasses = {
    dark: "bg-[#080B10] text-slate-200 selection:bg-teal-400/25 selection:text-teal-200",
    obsidian: "bg-[#000000] text-zinc-200 selection:bg-white/20 selection:text-white",
    paper: "bg-[#F5F3EE] text-[#1E252B] selection:bg-teal-700/15 selection:text-teal-900",
  }[settings.theme];

  const headerThemeClasses = {
    dark: "bg-[#0B0F16]/90 border-white/10 text-slate-100",
    obsidian: "bg-[#050505]/95 border-white/10 text-white",
    paper: "bg-[#F5F3EE]/92 border-zinc-900/10 text-[#11161B]",
  }[settings.theme];

  const isPaper = settings.theme === "paper";
  const headingClass = isPaper ? "text-[#11161B]" : "text-white";
  const bodyTextClass = isPaper ? "text-[#2A333C]" : "text-slate-300";
  const mutedTextClass = isPaper ? "text-[#52606D]" : "text-slate-400";
  const borderClass = isPaper ? "border-zinc-900/12" : "border-white/10";
  const surfaceClass = isPaper ? "bg-[#ECE9E1] border-zinc-900/12" : "bg-[#0F1319] border-white/10";
  const insetClass = isPaper ? "bg-[#E4E0D6] border-zinc-900/12 text-[#1E252B]" : "bg-[#06090E] border-white/10 text-slate-200";
  const accentTextClass = isPaper ? "text-teal-700" : "text-[#8CE0BD]";

  return {
    settings,
    updateSetting,
    resetSettings,
    fontSizeClasses,
    contentWidthClasses,
    themeClasses,
    headerThemeClasses,
    headingClass,
    bodyTextClass,
    mutedTextClass,
    borderClass,
    surfaceClass,
    insetClass,
    accentTextClass,
  };
}
