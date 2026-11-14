/**
 * Tovu — Reactive Digital Rain Test Suite
 * Verifies influence math, repulsion offsets, pulse expansion/expiry/bounds,
 * configuration clamping, invalid dimension safety, and engine lifecycle.
 */

import {
  DEFAULT_DIGITAL_RAIN_CONFIG,
  calculateInfluence,
  calculatePointerOffset,
  calculatePulseRingInfluence,
  clampIntensity,
  clampInteractionRadius,
  pickGlyph,
  resolvePalette,
  resolveSpeedMultiplier,
  samplePulse,
  type PulseState,
} from "../src/components/home/hero/digital-rain-config";
import { createDigitalRainEngine } from "../src/components/home/hero/digital-rain-engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

function createMockCanvas() {
  const ctxMock = {
    clearRect: () => {},
    setTransform: () => {},
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    fillText: () => {},
    font: "",
    textBaseline: "middle",
    textAlign: "center",
    strokeStyle: "",
    lineWidth: 1,
    shadowColor: "",
    shadowBlur: 0,
    fillStyle: "",
  };

  return {
    width: 0,
    height: 0,
    getContext: () => ctxMock,
  } as unknown as HTMLCanvasElement;
}

async function runTests() {
  console.log("\n========================================================");
  console.log("  TOVU — REACTIVE DIGITAL RAIN TEST SUITE");
  console.log("========================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [FAIL] ${name}: ${msg}`);
    }
  }

  // Install minimal RAF / performance globals for Node execution
  let nextRafId = 1;
  const activeRafCallbacks = new Map<number, FrameRequestCallback>();
  let cancelledIds: number[] = [];

  (globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame = (
    cb: FrameRequestCallback
  ) => {
    const id = nextRafId++;
    activeRafCallbacks.set(id, cb);
    return id;
  };
  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (
    id: number
  ) => {
    cancelledIds.push(id);
    activeRafCallbacks.delete(id);
  };

  // 1. Influence Calculations
  await test("Influence calculation produces high values near cursor, zero outside radius, and remains bounded [0,1]", () => {
    const radius = 115;
    const center = calculateInfluence(0, radius);
    const near = calculateInfluence(15, radius);
    const mid = calculateInfluence(57.5, radius);
    const edge = calculateInfluence(115, radius);
    const outside = calculateInfluence(180, radius);
    const negative = calculateInfluence(-10, radius);

    assert(center === 1, `Distance 0 must yield influence 1, got ${center}`);
    assert(near > 0.9, `Near distance must yield high influence (>0.9), got ${near}`);
    assert(Math.abs(mid - 0.5) < 0.01, `Midpoint influence should be ~0.5, got ${mid}`);
    assert(edge === 0, `At boundary radius influence must be 0, got ${edge}`);
    assert(outside === 0, `Outside radius influence must be 0, got ${outside}`);
    assert(negative === 0, `Negative distance must yield 0, got ${negative}`);
  });

  // 2. Repulsion & Orbit Offset Calculations
  await test("Pointer offset computes temporary displacement bounded by maxDisplacement", () => {
    const maxDisp = 12;
    const inf = calculateInfluence(20, 115);
    const repulse = calculatePointerOffset(20, 0, 20, inf, maxDisp, "repulsion");

    assert(repulse.x > 0 && repulse.x <= maxDisp, `Repulsion X must push away (+X) and stay <= ${maxDisp}`);
    assert(Math.abs(repulse.y) < 0.001, "Pure X delta should produce ~0 Y displacement in repulsion mode");

    const orbit = calculatePointerOffset(20, 0, 20, inf, maxDisp, "orbit");
    assert(Math.abs(orbit.y) > 0, "Orbit mode must apply tangential displacement");
  });

  // 3. Pulse Expansion, Fade, and Expiry
  await test("Pulse expands over time, fades out, and expires cleanly", () => {
    const pulse: PulseState = {
      id: 1,
      x: 300,
      y: 200,
      startTime: 1000,
      duration: 900,
      maxRadius: 260,
      ringWidth: 35,
    };

    const s0 = samplePulse(pulse, 1000);
    const sMid = samplePulse(pulse, 1450);
    const sLate = samplePulse(pulse, 1850);
    const sExpired = samplePulse(pulse, 1900);

    assert(s0 !== null && s0.radius === 0 && s0.alpha === 1, "Initial pulse sample must start at radius 0, alpha 1");
    assert(
      sMid !== null && sLate !== null && sLate.radius > sMid.radius && sLate.alpha < sMid.alpha,
      "Pulse must expand in radius and fade in alpha over time"
    );
    assert(sExpired === null, "Expired pulse must return null");

    const ringHit = calculatePulseRingInfluence(100, 100, 35, 0.8);
    const ringMiss = calculatePulseRingInfluence(200, 100, 35, 0.8);
    assert(ringHit > 0.7 && ringHit <= 1, `On-ring glyph must receive high influence, got ${ringHit}`);
    assert(ringMiss === 0, `Off-ring glyph must receive 0 influence, got ${ringMiss}`);
  });

  // 4. Configuration Clamping, Presets & Vocabulary
  await test("Configuration clamping, speed presets, palettes, and glyph vocabulary resolve safely", () => {
    assert(clampIntensity(5) === 1, "Intensity above 1 must clamp to 1");
    assert(clampIntensity(-2) === 0.1, "Intensity below 0.1 must clamp to 0.1");
    assert(clampIntensity(Number.NaN) === DEFAULT_DIGITAL_RAIN_CONFIG.intensity, "NaN intensity falls back to default");

    assert(clampInteractionRadius(999) === 300, "Radius clamps to 300 max");
    assert(clampInteractionRadius(5) === 40, "Radius clamps to 40 min");

    assert(resolveSpeedMultiplier("slow") < resolveSpeedMultiplier("calm"), "slow < calm");
    assert(resolveSpeedMultiplier("calm") < resolveSpeedMultiplier("dynamic"), "calm < dynamic");

    const dark = resolvePalette("dark");
    const light = resolvePalette("light");
    assert(dark.background === "#080B10", "Dark palette background matches spec");
    assert(light.background !== dark.background, "Light palette differs from dark palette");

    const sampleGlyphs = Array.from({ length: 40 }, (_, i) => pickGlyph(i * 1.37));
    assert(sampleGlyphs.every((g) => g.length === 1), "Every generated glyph must be a single character");
  });

  // 5. Engine Lifecycle, Duplicate Loop Guard, Pulse Cap & Invalid Dimensions
  await test("Engine prevents duplicate RAF loops, caps active pulses, and survives invalid dimensions", () => {
    activeRafCallbacks.clear();
    cancelledIds = [];

    const canvas = createMockCanvas();
    const engine = createDigitalRainEngine(canvas);

    // Invalid dimensions should not throw or create broken columns
    engine.resize(0, 0, 2);
    engine.resize(-100, 300, 2);
    engine.resize(Number.NaN, 400, 2);
    assert(engine.getStateSnapshot().columnCount === 0, "Invalid dimensions must yield 0 columns without throwing");

    // Valid resize
    engine.resize(1280, 640, 2);
    assert(engine.getStateSnapshot().columnCount > 10, "Desktop width must generate responsive columns");

    // Start twice -> must only register ONE active RAF callback
    engine.start();
    const countAfterFirstStart = activeRafCallbacks.size;
    engine.start();
    const countAfterSecondStart = activeRafCallbacks.size;
    assert(countAfterFirstStart === 1, `Expected 1 RAF loop after start, got ${countAfterFirstStart}`);
    assert(countAfterSecondStart === 1, `Starting twice must not create a second loop, got ${countAfterSecondStart}`);
    assert(engine.getStateSnapshot().isRunning === true, "Engine should report running");

    // Pulse cap check
    for (let i = 0; i < 10; i++) {
      engine.addPulse(100 + i * 10, 150);
    }
    assert(
      engine.getStateSnapshot().activePulseCount === DEFAULT_DIGITAL_RAIN_CONFIG.maxActivePulses,
      `Active pulses must be capped at ${DEFAULT_DIGITAL_RAIN_CONFIG.maxActivePulses}`
    );

    // Theme switching
    engine.setTheme("light");
    assert(engine.getStateSnapshot().theme === "light", "Theme must update to light without remounting");

    // Stop cancels RAF
    engine.stop();
    assert(engine.getStateSnapshot().isRunning === false, "Stop must mark engine stopped");
    assert(activeRafCallbacks.size === 0 && cancelledIds.length > 0, "Stop must cancel scheduled RAF");

    // Reduced motion prevents continuous animation and pulses
    engine.setReducedMotion(true);
    engine.start();
    engine.addPulse(200, 200);
    assert(engine.getStateSnapshot().isRunning === false, "Reduced motion must prevent continuous animation");
    assert(engine.getStateSnapshot().activePulseCount === 0, "Reduced motion must clear/block pulses");

    // Destroy cleans up
    engine.destroy();
    assert(engine.getStateSnapshot().columnCount === 0, "Destroy must release column state");
  });

  console.log("\n--------------------------------------------------------");
  console.log(`  DIGITAL RAIN TEST RESULTS: ${passed}/${total} PASSED`);
  console.log("--------------------------------------------------------\n");

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Fatal test failure:", err);
  process.exit(1);
});
