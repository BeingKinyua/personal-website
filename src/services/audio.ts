export interface AmbientTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  durationSeconds: number;
  bpm: number;
  description: string;
  artwork?: string;
  source?: string;
}

export const CURATED_AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: "night-drive",
    title: "Night Drive",
    artist: "Curated for VictorOS",
    genre: "Low-Key Synthwave",
    durationSeconds: 248,
    bpm: 86,
    description: "Deep analog warmth and low-pass bassline engineered for focused architectural deep work.",
  },
  {
    id: "lsm-engine-drift",
    title: "Storage Physics Drift",
    artist: "VictorOS Sound Lab",
    genre: "Minimal Ambient",
    durationSeconds: 310,
    bpm: 64,
    description: "Calm subterranean drone mimicking the mechanical precision of immutable SSTables and disks.",
  },
  {
    id: "deterministic-flow",
    title: "Deterministic Resonance",
    artist: "Nairobi Modular Collective",
    genre: "Binaural Focus",
    durationSeconds: 280,
    bpm: 72,
    description: "Gentle 432Hz sine harmonics calibrated for prolonged reading and deep conceptual absorption.",
  },
];

/**
 * Web Audio Ambient Tone Generator (Fallback)
 * Generates a calm, pleasant, non-intrusive harmonic drone when user presses play,
 * ensuring real audio can be heard without external copyrighted MP3 assets.
 */
class GenerativeAmbientEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning: boolean = false;

  public start() {
    if (this.isRunning) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 2.5);

      // Low harmonic oscillator (root note A2 ~ 110Hz)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(110, this.ctx.currentTime);

      // Warm overtone oscillator (E3 ~ 164.8Hz with subtle detune)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(164.81, this.ctx.currentTime);
      this.osc2.detune.setValueAtTime(4, this.ctx.currentTime);

      // Low pass filter to keep it warm and soft
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.osc1.connect(filter);
      this.osc2.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc1.start();
      this.osc2.start();
      this.isRunning = true;
    } catch (e) {
      console.warn("Generative ambient audio could not start", e);
    }
  }

  public stop() {
    if (!this.isRunning || !this.gainNode || !this.ctx) return;
    try {
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
      setTimeout(() => {
        this.osc1?.stop();
        this.osc2?.stop();
        this.ctx?.close();
        this.ctx = null;
        this.isRunning = false;
      }, 1000);
    } catch (e) {
      this.isRunning = false;
    }
  }

  public getStatus() {
    return this.isRunning;
  }
}

export const generativeAmbient = new GenerativeAmbientEngine();
