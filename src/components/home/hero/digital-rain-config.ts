export type DigitalRainSpeed = "slow" | "calm" | "dynamic";
export type InteractionMode = "repulsion" | "orbit";
export type DigitalRainTheme = "dark" | "light";

export interface DigitalRainPalette {
  background: string;
  glyph: string;
  glyphMuted: string;
  accent: string;
  active: string;
  glowColor: string;
}

export interface DigitalRainEngineConfig {
  intensity: number;
  interactionRadius: number;
  speed: DigitalRainSpeed;
  interactionMode: InteractionMode;
  enablePulse: boolean;
  glyphSpacing: number;
  fontSize: number;
  maxDevicePixelRatio: number;
  maxDisplacement: number;
  maxActivePulses: number;
  pulseMaxRadius: number;
  pulseDuration: number;
  pulseRingWidth: number;
}

export interface DigitalRainProps {
  intensity?: number;
  interactionRadius?: number;
  speed?: DigitalRainSpeed;
  interactionMode?: InteractionMode;
  enablePulse?: boolean;
  theme?: DigitalRainTheme;
  interactionTargetRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const DIGITAL_RAIN_PALETTES: Record<DigitalRainTheme, DigitalRainPalette> = {
  dark: {
    background: "#080B10",
    glyph: "#8EB7C4",
    glyphMuted: "#5A7D8C",
    accent: "#8CE0BD",
    active: "#8AFFCD",
    glowColor: "rgba(140, 224, 189, 0.55)",
  },
  light: {
    background: "#F5F3EE",
    glyph: "#485662",
    glyphMuted: "#74828E",
    accent: "#0F766E",
    active: "#0D9488",
    glowColor: "rgba(13, 148, 136, 0.25)",
  },
};

export const DEFAULT_DIGITAL_RAIN_CONFIG: DigitalRainEngineConfig = {
  intensity: 0.65,
  interactionRadius: 115,
  speed: "calm",
  interactionMode: "repulsion",
  enablePulse: true,
  glyphSpacing: 23,
  fontSize: 13,
  maxDevicePixelRatio: 2,
  maxDisplacement: 12,
  maxActivePulses: 4,
  pulseMaxRadius: 260,
  pulseDuration: 900,
  pulseRingWidth: 35,
};

// Custom Tovu glyph vocabulary: technical tokens + natural T O V U letters
const CORE_GLYPHS = ["0", "1", "{", "}", "<", ">", "/", "+", "=", "·", "T", "O", "V", "U"] as const;
// Subtle katakana accents (~12% weight) to preserve visual texture without clutter
const ACCENT_GLYPHS = ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "サ", "シ"] as const;

export function pickGlyph(seed: number): string {
  const normalized = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
  if (normalized < 0.12) {
    const idx = Math.floor((normalized / 0.12) * ACCENT_GLYPHS.length) % ACCENT_GLYPHS.length;
    return ACCENT_GLYPHS[idx];
  }
  const idx = Math.floor(((normalized - 0.12) / 0.88) * CORE_GLYPHS.length) % CORE_GLYPHS.length;
  return CORE_GLYPHS[idx];
}

export function clampIntensity(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_DIGITAL_RAIN_CONFIG.intensity;
  }
  return Math.min(1, Math.max(0.1, value));
}

export function clampInteractionRadius(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_DIGITAL_RAIN_CONFIG.interactionRadius;
  }
  return Math.min(300, Math.max(40, value));
}

export function resolveSpeedMultiplier(speed?: DigitalRainSpeed): number {
  switch (speed) {
    case "slow":
      return 0.65;
    case "dynamic":
      return 1.65;
    case "calm":
    default:
      return 1.0;
  }
}

export function resolveResponsiveSpacing(width: number, baseSpacing: number, intensity: number): number {
  const intensityScale = 1.15 - intensity * 0.25; // higher intensity -> slightly tighter columns
  if (width < 640) {
    return Math.round(Math.max(24, baseSpacing * 1.28 * intensityScale));
  }
  if (width < 1024) {
    return Math.round(Math.max(22, baseSpacing * 1.12 * intensityScale));
  }
  return Math.round(Math.max(19, baseSpacing * intensityScale));
}

/**
 * Smooth cubic-eased distance influence bounded to [0, 1].
 */
export function calculateInfluence(distance: number, radius: number): number {
  if (radius <= 0 || distance < 0 || distance >= radius) {
    return 0;
  }
  const linear = Math.max(0, 1 - distance / radius);
  // Smooth falloff curve: faster rise near edge, rich plateau near center
  return linear * linear * (3 - 2 * linear);
}

/**
 * Computes temporary repulsion or orbit rendering offset without mutating column state.
 */
export function calculatePointerOffset(
  dx: number,
  dy: number,
  distance: number,
  influence: number,
  maxDisplacement: number,
  mode: InteractionMode
): { x: number; y: number } {
  if (influence <= 0.001 || distance <= 0.001) {
    return { x: 0, y: 0 };
  }
  const nx = dx / distance;
  const ny = dy / distance;
  const magnitude = influence * maxDisplacement;

  if (mode === "orbit") {
    // Tangential swirl around cursor combined with gentle radial breathing
    const tx = -ny;
    const ty = nx;
    return {
      x: tx * magnitude * 0.85 + nx * magnitude * 0.25,
      y: ty * magnitude * 0.85 + ny * magnitude * 0.25,
    };
  }

  return {
    x: nx * magnitude,
    y: ny * magnitude,
  };
}

export interface PulseState {
  id: number;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
  ringWidth: number;
}

export interface PulseSample {
  radius: number;
  progress: number;
  alpha: number;
}

export function samplePulse(pulse: PulseState, now: number): PulseSample | null {
  const elapsed = now - pulse.startTime;
  if (elapsed < 0) return null;
  if (elapsed >= pulse.duration) return null;

  const progress = elapsed / pulse.duration;
  // Ease-out cubic expansion
  const eased = 1 - Math.pow(1 - progress, 3);
  const radius = eased * pulse.maxRadius;
  const alpha = 1 - progress;

  return { radius, progress, alpha };
}

export function calculatePulseRingInfluence(
  distanceToPulseCenter: number,
  currentRadius: number,
  ringWidth: number,
  pulseAlpha: number
): number {
  if (ringWidth <= 0 || pulseAlpha <= 0) return 0;
  const ringDist = Math.abs(distanceToPulseCenter - currentRadius);
  if (ringDist >= ringWidth) return 0;
  const band = 1 - ringDist / ringWidth;
  return Math.min(1, band * band * pulseAlpha);
}

export function resolvePalette(
  theme: DigitalRainTheme,
  overrides?: Partial<DigitalRainPalette>
): DigitalRainPalette {
  return {
    ...DIGITAL_RAIN_PALETTES[theme],
    ...overrides,
  };
}

/**
 * Hex color parser and linear RGB interpolator for smooth glyph color transitions.
 */
export function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return [142, 183, 196];
}

export function mixRgb(
  base: [number, number, number],
  target: [number, number, number],
  t: number
): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  return [
    Math.round(base[0] + (target[0] - base[0]) * clamped),
    Math.round(base[1] + (target[1] - base[1]) * clamped),
    Math.round(base[2] + (target[2] - base[2]) * clamped),
  ];
}
