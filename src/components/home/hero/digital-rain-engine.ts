import {
  DEFAULT_DIGITAL_RAIN_CONFIG,
  DigitalRainEngineConfig,
  DigitalRainPalette,
  DigitalRainTheme,
  PulseState,
  calculateInfluence,
  calculatePointerOffset,
  calculatePulseRingInfluence,
  clampIntensity,
  clampInteractionRadius,
  mixRgb,
  parseHexColor,
  pickGlyph,
  resolvePalette,
  resolveResponsiveSpacing,
  resolveSpeedMultiplier,
  samplePulse,
} from "./digital-rain-config";

export interface RainColumn {
  x: number;
  y: number;
  baseSpeed: number;
  trailLength: number;
  opacity: number;
  seed: number;
  mutationRate: number;
  colorVariation: number;
  chars: string[];
}

export interface DigitalRainEngineOptions {
  theme?: DigitalRainTheme;
  paletteOverrides?: Partial<DigitalRainPalette>;
  config?: Partial<DigitalRainEngineConfig>;
  reducedMotion?: boolean;
}

export interface DigitalRainEngine {
  start(): void;
  stop(): void;
  resize(width: number, height: number, dpr?: number): void;
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  addPulse(x: number, y: number): void;
  setTheme(theme: DigitalRainTheme, paletteOverrides?: Partial<DigitalRainPalette>): void;
  setReducedMotion(reduced: boolean): void;
  updateConfig(config: Partial<DigitalRainEngineConfig>): void;
  renderStaticFrame(): void;
  destroy(): void;
  // Inspection helpers for testing/diagnostics
  getStateSnapshot(): {
    isRunning: boolean;
    columnCount: number;
    activePulseCount: number;
    theme: DigitalRainTheme;
    width: number;
    height: number;
  };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 91.3458 + 14.123) * 47453.5453;
  return x - Math.floor(x);
}

export function createDigitalRainEngine(
  canvas: HTMLCanvasElement,
  options: DigitalRainEngineOptions = {}
): DigitalRainEngine {
  const ctx = canvas.getContext("2d", { alpha: true });

  let config: DigitalRainEngineConfig = {
    ...DEFAULT_DIGITAL_RAIN_CONFIG,
    ...options.config,
    intensity: clampIntensity(options.config?.intensity),
    interactionRadius: clampInteractionRadius(options.config?.interactionRadius),
  };

  let theme: DigitalRainTheme = options.theme ?? "dark";
  let palette: DigitalRainPalette = resolvePalette(theme, options.paletteOverrides);
  let rgbGlyph = parseHexColor(palette.glyph);
  let rgbMuted = parseHexColor(palette.glyphMuted);
  let rgbAccent = parseHexColor(palette.accent);
  let rgbActive = parseHexColor(palette.active);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastColumnWidth = 0;

  let columns: RainColumn[] = [];
  let pulses: PulseState[] = [];
  let nextPulseId = 1;

  // Pointer state (raw target + smoothly interpolated render cursor)
  let targetPointer = { x: 0, y: 0, active: false };
  let smoothPointer = { x: 0, y: 0, strength: 0 };

  let isRunning = false;
  let isDestroyed = false;
  let reducedMotion = Boolean(options.reducedMotion);
  let rafId: number | null = null;
  let lastFrameTime = 0;
  let elapsedTime = 0;

  function createColumn(index: number, xPos: number, viewportHeight: number): RainColumn {
    const seed = index * 17.31 + 3.7;
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + 1.1);
    const r3 = seededRandom(seed + 2.3);
    const r4 = seededRandom(seed + 3.7);
    const r5 = seededRandom(seed + 4.9);

    const trailLength = Math.floor(8 + r1 * 11); // 8 to 18 glyphs
    const chars: string[] = [];
    for (let i = 0; i < trailLength; i++) {
      chars.push(pickGlyph(seed + i * 2.13));
    }

    const rowHeight = config.fontSize * 1.48;
    const totalCycle = Math.max(viewportHeight, 400) + trailLength * rowHeight;

    return {
      x: xPos + (r2 - 0.5) * 4,
      y: -r3 * totalCycle + r4 * viewportHeight,
      baseSpeed: 26 + r2 * 42, // independent speed per column
      trailLength,
      opacity: 0.45 + r4 * 0.5,
      seed,
      mutationRate: 0.4 + r5 * 1.4,
      colorVariation: r1,
      chars,
    };
  }

  function rebuildColumns(force = false) {
    if (width <= 0 || height <= 0) {
      columns = [];
      return;
    }

    const spacing = resolveResponsiveSpacing(width, config.glyphSpacing, config.intensity);
    const targetCount = Math.max(4, Math.floor(width / spacing));

    if (!force && columns.length > 0 && Math.abs(width - lastColumnWidth) < spacing * 0.6) {
      return;
    }

    lastColumnWidth = width;
    const offset = (width - (targetCount - 1) * spacing) * 0.5;
    const nextCols: RainColumn[] = [];

    for (let i = 0; i < targetCount; i++) {
      const xPos = offset + i * spacing;
      if (i < columns.length && !force) {
        const existing = columns[i];
        nextCols.push({
          ...existing,
          x: xPos + (seededRandom(existing.seed + 1.1) - 0.5) * 4,
        });
      } else {
        nextCols.push(createColumn(i, xPos, height));
      }
    }

    columns = nextCols;
  }

  function refreshColors() {
    rgbGlyph = parseHexColor(palette.glyph);
    rgbMuted = parseHexColor(palette.glyphMuted);
    rgbAccent = parseHexColor(palette.accent);
    rgbActive = parseHexColor(palette.active);
  }

  function drawFrame(now: number, dt: number, isStatic = false) {
    if (!ctx || width <= 0 || height <= 0 || isDestroyed) return;

    ctx.clearRect(0, 0, width, height);

    // Smooth pointer interpolation & decay on exit
    if (!isStatic) {
      const strengthTarget = targetPointer.active ? 1 : 0;
      const strengthRate = targetPointer.active ? 14 : 4.5;
      smoothPointer.strength += (strengthTarget - smoothPointer.strength) * (1 - Math.exp(-dt * strengthRate));

      if (targetPointer.active) {
        const posRate = 18;
        smoothPointer.x += (targetPointer.x - smoothPointer.x) * (1 - Math.exp(-dt * posRate));
        smoothPointer.y += (targetPointer.y - smoothPointer.y) * (1 - Math.exp(-dt * posRate));
      }
    } else {
      smoothPointer.strength = 0;
    }

    // Prune expired pulses & sample active ones
    const activePulses: Array<{
      x: number;
      y: number;
      radius: number;
      alpha: number;
      ringWidth: number;
    }> = [];

    if (!isStatic && pulses.length > 0) {
      const remaining: PulseState[] = [];
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        const sample = samplePulse(p, now);
        if (sample) {
          remaining.push(p);
          activePulses.push({
            x: p.x,
            y: p.y,
            radius: sample.radius,
            alpha: sample.alpha,
            ringWidth: p.ringWidth,
          });
        }
      }
      pulses = remaining;
    }

    const isMobile = width < 640;
    const fontSize = isMobile ? Math.max(12, config.fontSize - 1) : config.fontSize;
    const rowStep = fontSize * 1.48;
    const speedMult = resolveSpeedMultiplier(config.speed);
    const radius = isMobile
      ? Math.min(config.interactionRadius, 92)
      : config.interactionRadius;
    const maxDisp = isMobile ? 8 : config.maxDisplacement;

    ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // Subtle visual pulse ring halo (underneath glyphs, ultra-restrained)
    for (let i = 0; i < activePulses.length; i++) {
      const pulse = activePulses[i];
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgbAccent[0]}, ${rgbAccent[1]}, ${rgbAccent[2]}, ${(
        pulse.alpha * 0.16
      ).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const visibilityBoost = 0.48 + config.intensity * 0.55; // 0.65 -> ~0.84 base multiplier

    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const col = columns[colIdx];

      if (!isStatic) {
        col.y += col.baseSpeed * speedMult * dt;
        const resetThreshold = height + col.trailLength * rowStep + 20;
        if (col.y > resetThreshold) {
          col.y = -rowStep * 2;
        }
      }

      // Stronger visual contrast toward the right side of the hero on wider screens
      const horizontalRatio = width > 0 ? col.x / width : 0.5;
      const sideGain = width >= 768 ? 0.78 + horizontalRatio * 0.44 : 0.92;

      for (let gIdx = 0; gIdx < col.trailLength; gIdx++) {
        const glyphY = col.y - gIdx * rowStep;
        if (glyphY < -rowStep || glyphY > height + rowStep) continue;

        // Subtle organic character cycling over time
        let char = col.chars[gIdx];
        if (!isStatic && gIdx === 0) {
          const tick = Math.floor(elapsedTime * col.mutationRate * 1.6);
          char = pickGlyph(col.seed + tick * 0.73);
        } else if (!isStatic && (gIdx + colIdx) % 5 === 0) {
          const tick = Math.floor(elapsedTime * col.mutationRate * 0.6 + gIdx);
          char = pickGlyph(col.seed + gIdx * 2.13 + tick * 0.37);
        }

        // Trail opacity falloff (lead character brightest)
        const trailRatio = gIdx === 0 ? 1 : Math.pow(1 - gIdx / col.trailLength, 1.35);
        const leadBoost = gIdx === 0 ? 1.28 : 1.0;
        let baseAlpha = col.opacity * trailRatio * leadBoost * visibilityBoost * sideGain;
        baseAlpha = Math.min(theme === "dark" ? 0.88 : 0.76, baseAlpha);

        let offsetX = 0;
        let offsetY = 0;
        let pointerInfluence = 0;
        let pulseInfluence = 0;

        // Cursor proximity interaction
        if (smoothPointer.strength > 0.01) {
          const dx = col.x - smoothPointer.x;
          const dy = glyphY - smoothPointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            pointerInfluence = calculateInfluence(dist, radius) * smoothPointer.strength;
            const offset = calculatePointerOffset(
              dx,
              dy,
              dist,
              pointerInfluence,
              maxDisp,
              config.interactionMode
            );
            offsetX += offset.x;
            offsetY += offset.y;
          }
        }

        // Expanding click/tap energy pulses
        for (let pIdx = 0; pIdx < activePulses.length; pIdx++) {
          const pulse = activePulses[pIdx];
          const pdx = col.x - pulse.x;
          const pdy = glyphY - pulse.y;
          const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
          const ringInf = calculatePulseRingInfluence(
            pDist,
            pulse.radius,
            pulse.ringWidth,
            pulse.alpha
          );
          if (ringInf > 0.005) {
            pulseInfluence = Math.max(pulseInfluence, ringInf);
            if (pDist > 0.001) {
              const push = ringInf * 9;
              offsetX += (pdx / pDist) * push;
              offsetY += (pdy / pDist) * push;
            }
          }
        }

        const totalInfluence = Math.min(1, Math.max(pointerInfluence, pulseInfluence));

        // Base color blend (muted -> normal -> accent on lead/variation)
        let color = mixRgb(rgbMuted, rgbGlyph, 0.35 + col.colorVariation * 0.65);
        if (gIdx === 0) {
          color = mixRgb(color, rgbAccent, 0.45);
        }

        if (totalInfluence > 0.01) {
          const targetColor = totalInfluence > 0.55 ? rgbActive : rgbAccent;
          color = mixRgb(color, targetColor, Math.min(1, totalInfluence * 1.15));
          baseAlpha = Math.min(1, baseAlpha + totalInfluence * 0.52);
        }

        // Apply subtle shadow glow strictly to strongly activated glyphs on non-mobile
        const shouldGlow = !isMobile && totalInfluence > 0.42;
        if (shouldGlow) {
          ctx.shadowColor = palette.glowColor;
          ctx.shadowBlur = Math.round(totalInfluence * (theme === "dark" ? 10 : 5));
        }

        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${baseAlpha.toFixed(3)})`;
        ctx.fillText(char, col.x + offsetX, glyphY + offsetY);

        if (shouldGlow) {
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  function loop(now: number) {
    if (!isRunning || isDestroyed) return;

    const dt = lastFrameTime > 0 ? Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000)) : 0.016;
    lastFrameTime = now;
    elapsedTime += dt;

    drawFrame(now, dt, false);
    rafId = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (isDestroyed || reducedMotion || isRunning) return;
      isRunning = true;
      lastFrameTime = 0;
      rafId = requestAnimationFrame(loop);
    },

    stop() {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastFrameTime = 0;
    },

    resize(nextWidth: number, nextHeight: number, nextDpr = 1) {
      if (isDestroyed) return;
      if (nextWidth <= 0 || nextHeight <= 0 || Number.isNaN(nextWidth) || Number.isNaN(nextHeight)) {
        width = 0;
        height = 0;
        return;
      }

      const clampedDpr = Math.min(config.maxDevicePixelRatio, Math.max(1, nextDpr));
      const widthChangedSignificantly = Math.abs(nextWidth - width) >= 12;
      width = Math.round(nextWidth);
      height = Math.round(nextHeight);
      dpr = clampedDpr;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      rebuildColumns(columns.length === 0 || widthChangedSignificantly);

      if (reducedMotion || !isRunning) {
        drawFrame(performance.now(), 0.016, true);
      }
    },

    setPointer(x: number, y: number) {
      if (isDestroyed || reducedMotion) return;
      if (!targetPointer.active) {
        smoothPointer.x = x;
        smoothPointer.y = y;
      }
      targetPointer.x = x;
      targetPointer.y = y;
      targetPointer.active = true;
    },

    clearPointer() {
      targetPointer.active = false;
    },

    addPulse(x: number, y: number) {
      if (isDestroyed || reducedMotion || !config.enablePulse) return;
      const now = performance.now();
      const pulse: PulseState = {
        id: nextPulseId++,
        x,
        y,
        startTime: now,
        duration: config.pulseDuration,
        maxRadius: config.pulseMaxRadius,
        ringWidth: config.pulseRingWidth,
      };
      if (pulses.length >= config.maxActivePulses) {
        pulses.shift();
      }
      pulses.push(pulse);
    },

    setTheme(nextTheme: DigitalRainTheme, paletteOverrides?: Partial<DigitalRainPalette>) {
      theme = nextTheme;
      palette = resolvePalette(nextTheme, paletteOverrides);
      refreshColors();
      if (reducedMotion || !isRunning) {
        drawFrame(performance.now(), 0.016, true);
      }
    },

    setReducedMotion(reduced: boolean) {
      reducedMotion = reduced;
      if (reduced) {
        this.stop();
        pulses = [];
        targetPointer.active = false;
        smoothPointer.strength = 0;
        drawFrame(performance.now(), 0.016, true);
      } else if (!isDestroyed) {
        this.start();
      }
    },

    updateConfig(partial: Partial<DigitalRainEngineConfig>) {
      const prevIntensity = config.intensity;
      const prevSpacing = config.glyphSpacing;
      config = {
        ...config,
        ...partial,
        intensity: clampIntensity(partial.intensity ?? config.intensity),
        interactionRadius: clampInteractionRadius(
          partial.interactionRadius ?? config.interactionRadius
        ),
      };
      if (prevIntensity !== config.intensity || prevSpacing !== config.glyphSpacing) {
        rebuildColumns(true);
      }
      if (reducedMotion || !isRunning) {
        drawFrame(performance.now(), 0.016, true);
      }
    },

    renderStaticFrame() {
      drawFrame(performance.now(), 0.016, true);
    },

    destroy() {
      this.stop();
      isDestroyed = true;
      columns = [];
      pulses = [];
      if (ctx && width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);
      }
    },

    getStateSnapshot() {
      return {
        isRunning,
        columnCount: columns.length,
        activePulseCount: pulses.length,
        theme,
        width,
        height,
      };
    },
  };
}
