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

const STORAGE_KEY = "victoros_reader_settings";

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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

  // Utility classes mapping
  const fontSizeClasses = {
    small: "text-sm sm:text-base leading-relaxed",
    medium: "text-base sm:text-lg leading-relaxed",
    large: "text-lg sm:text-xl leading-relaxed",
  }[settings.fontSize];

  const contentWidthClasses = {
    focused: "max-w-[62ch]",
    comfortable: "max-w-[72ch]",
    wide: "max-w-[86ch]",
  }[settings.contentWidth];

  const themeClasses = {
    dark: "bg-[#08090b] text-zinc-200 selection:bg-blue-500/30 selection:text-blue-200",
    obsidian: "bg-[#000000] text-zinc-200 selection:bg-white/20 selection:text-white",
    paper: "bg-[#0d0f14] text-[#e3e6eb] selection:bg-amber-500/30 selection:text-amber-200",
  }[settings.theme];

  const headerThemeClasses = {
    dark: "bg-[#0a0c0f]/90 border-white/10 text-white",
    obsidian: "bg-[#000000]/95 border-white/10 text-white",
    paper: "bg-[#101318]/90 border-white/10 text-[#f0f2f5]",
  }[settings.theme];

  return {
    settings,
    updateSetting,
    resetSettings,
    fontSizeClasses,
    contentWidthClasses,
    themeClasses,
    headerThemeClasses,
  };
}
