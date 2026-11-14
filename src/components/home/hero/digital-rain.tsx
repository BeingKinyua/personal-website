import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import {
  DEFAULT_DIGITAL_RAIN_CONFIG,
  DigitalRainPalette,
  DigitalRainProps,
  DigitalRainTheme,
} from "./digital-rain-config";
import { DigitalRainEngine, createDigitalRainEngine } from "./digital-rain-engine";

function detectActiveTheme(
  explicitTheme: DigitalRainTheme | undefined,
  element: HTMLElement | null
): DigitalRainTheme {
  if (explicitTheme === "light" || explicitTheme === "dark") {
    return explicitTheme;
  }
  if (typeof document === "undefined") {
    return "dark";
  }

  const root = document.documentElement;
  const body = document.body;
  const rootTheme = root.getAttribute("data-theme") || body?.getAttribute("data-theme");

  if (rootTheme === "light" || rootTheme === "paper" || root.classList.contains("light") || body?.classList.contains("light")) {
    return "light";
  }
  if (rootTheme === "dark" || root.classList.contains("dark") || body?.classList.contains("dark")) {
    return "dark";
  }

  // Fallback: inspect computed background luminance on parent/body so dark-first apps never flip falsely
  const target = element || body;
  if (target && typeof window !== "undefined" && window.getComputedStyle) {
    let current: HTMLElement | null = target;
    while (current) {
      const bg = window.getComputedStyle(current).backgroundColor;
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
        if (alpha > 0.1) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.55 ? "light" : "dark";
        }
      }
      current = current.parentElement;
    }
  }

  return "dark";
}

function readCssPaletteOverrides(): Partial<DigitalRainPalette> | undefined {
  if (typeof document === "undefined" || typeof window === "undefined") return undefined;
  const styles = window.getComputedStyle(document.documentElement);
  const glyph = styles.getPropertyValue("--tovu-rain-glyph").trim();
  const glyphMuted = styles.getPropertyValue("--tovu-rain-glyph-muted").trim();
  const accent = styles.getPropertyValue("--tovu-rain-accent").trim();
  const active = styles.getPropertyValue("--tovu-rain-active").trim();

  if (!glyph && !glyphMuted && !accent && !active) {
    return undefined;
  }

  const overrides: Partial<DigitalRainPalette> = {};
  if (glyph) overrides.glyph = glyph;
  if (glyphMuted) overrides.glyphMuted = glyphMuted;
  if (accent) overrides.accent = accent;
  if (active) overrides.active = active;
  return overrides;
}

export const DigitalRain: React.FC<DigitalRainProps> = ({
  intensity = DEFAULT_DIGITAL_RAIN_CONFIG.intensity,
  interactionRadius = DEFAULT_DIGITAL_RAIN_CONFIG.interactionRadius,
  speed = DEFAULT_DIGITAL_RAIN_CONFIG.speed,
  interactionMode = DEFAULT_DIGITAL_RAIN_CONFIG.interactionMode,
  enablePulse = DEFAULT_DIGITAL_RAIN_CONFIG.enablePulse,
  theme,
  interactionTargetRef,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DigitalRainEngine | null>(null);
  const isIntersectingRef = useRef<boolean>(true);
  const isTabVisibleRef = useRef<boolean>(
    typeof document !== "undefined" ? document.visibilityState !== "hidden" : true
  );
  const prefersReducedMotion = useReducedMotion();

  const syncPlaybackState = (reduced: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (reduced || !isIntersectingRef.current || !isTabVisibleRef.current) {
      engine.stop();
    } else {
      engine.start();
    }
  };

  // Initialize Canvas engine, observers, and pointer listeners once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hostElement = interactionTargetRef?.current || canvas.parentElement;
    const initialTheme = detectActiveTheme(theme, hostElement);
    const cssOverrides = readCssPaletteOverrides();

    const engine = createDigitalRainEngine(canvas, {
      theme: initialTheme,
      paletteOverrides: cssOverrides,
      reducedMotion: prefersReducedMotion,
      config: {
        intensity,
        interactionRadius,
        speed,
        interactionMode,
        enablePulse,
      },
    });
    engineRef.current = engine;

    const measureAndResize = () => {
      const target = canvas.parentElement || canvas;
      const rect = target.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      if (rect.width > 0 && rect.height > 0) {
        engine.resize(rect.width, rect.height, dpr);
      }
    };

    measureAndResize();
    if (!prefersReducedMotion) {
      engine.start();
    } else {
      engine.renderStaticFrame();
    }

    // ResizeObserver for responsive container dimension changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        measureAndResize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    // IntersectionObserver to pause rendering when hero leaves viewport
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isIntersectingRef.current = entry.isIntersecting;
          }
          syncPlaybackState(prefersReducedMotion);
        },
        { threshold: 0.02 }
      );
      intersectionObserver.observe(canvas.parentElement || canvas);
    }

    // Pause when browser tab becomes hidden
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState !== "hidden";
      syncPlaybackState(prefersReducedMotion);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Observe theme class/attribute changes on <html> and <body> without remounting
    let themeObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      themeObserver = new MutationObserver(() => {
        const nextTheme = detectActiveTheme(theme, hostElement);
        engine.setTheme(nextTheme, readCssPaletteOverrides());
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "style"],
      });
      if (document.body) {
        themeObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ["class", "data-theme", "style"],
        });
      }
    }

    // Pointer listeners attached to hero interaction surface (never blocking links/buttons)
    const pointerSurface = hostElement || canvas;
    const getLocalCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch scrolling should not act as hover
      const { x, y } = getLocalCoords(e.clientX, e.clientY);
      engine.setPointer(x, y);
    };

    const handlePointerLeave = () => {
      engine.clearPointer();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const { x, y } = getLocalCoords(e.clientX, e.clientY);
      engine.addPulse(x, y);
    };

    pointerSurface.addEventListener("pointermove", handlePointerMove, { passive: true });
    pointerSurface.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    pointerSurface.addEventListener("pointercancel", handlePointerLeave, { passive: true });
    pointerSurface.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      pointerSurface.removeEventListener("pointermove", handlePointerMove);
      pointerSurface.removeEventListener("pointerleave", handlePointerLeave);
      pointerSurface.removeEventListener("pointercancel", handlePointerLeave);
      pointerSurface.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      themeObserver?.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // Intentionally initialize engine once; prop/theme updates use imperative engine methods below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionTargetRef]);

  // Update configuration dynamically without remounting
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.updateConfig({
      intensity,
      interactionRadius,
      speed,
      interactionMode,
      enablePulse,
    });
  }, [intensity, interactionRadius, speed, interactionMode, enablePulse]);

  // Update theme dynamically without remounting
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const hostElement = interactionTargetRef?.current || canvasRef.current?.parentElement || null;
    const resolvedTheme = detectActiveTheme(theme, hostElement);
    engine.setTheme(resolvedTheme, readCssPaletteOverrides());
  }, [theme, interactionTargetRef]);

  // Update reduced motion dynamically
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setReducedMotion(prefersReducedMotion);
    if (!prefersReducedMotion) {
      syncPlaybackState(false);
    }
  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className={`pointer-events-none select-none absolute inset-0 w-full h-full block ${className}`}
    />
  );
};
