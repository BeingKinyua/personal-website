export interface NarrationSection {
  id: string;
  title: string;
  timestampStart: number;
  timestampEnd: number;
  snippet?: string;
}

export interface Narration {
  contentId: string;
  contentType: "article" | "project";
  title: string;
  author: string;
  voice: string;
  durationSeconds: number;
  audioUrl?: string;
  sections: NarrationSection[];
}

export interface NarrationVoice {
  id: string;
  name: string;
  tagline: string;
  accent: string;
}

export const NARRATION_VOICES: NarrationVoice[] = [
  { id: "victor-neural", name: "VictorOS Neural Architect", tagline: "Calm, technical, deliberate", accent: "East African / Neutral" },
  { id: "studio-analytical", name: "Deep Systems Voice", tagline: "Paced, academic, precise", accent: "Modern Studio" },
  { id: "serene-contemplative", name: "Contemplative Sage", tagline: "Low timbre, reverent, spacious", accent: "Serene" },
];

export interface NarrationService {
  generateNarration(
    contentId: string,
    contentType: "article" | "project",
    voiceId?: string
  ): Promise<Narration>;
  
  getAvailableVoices(): Promise<NarrationVoice[]>;
}

/**
 * Mock Narration Service implementation
 * Ready for future backend TTS / Supabase Storage integration
 */
class MockNarrationService implements NarrationService {
  async generateNarration(
    contentId: string,
    contentType: "article" | "project",
    voiceId: string = "victor-neural"
  ): Promise<Narration> {
    // Artificial lightweight latency to simulate network synthesis check
    await new Promise((res) => setTimeout(res, 300));

    const isProject = contentType === "project";
    const durationSeconds = isProject ? 420 : 520;

    return {
      contentId,
      contentType,
      title: isProject ? "Project Architecture Walkthrough" : "Journal Essay Deep Narration",
      author: "Victor Kinyua",
      voice: voiceId,
      durationSeconds,
      sections: [
        { id: "sec-intro", title: "Introduction & Context", timestampStart: 0, timestampEnd: 75 },
        { id: "sec-problem", title: "Problem & Invariants", timestampStart: 76, timestampEnd: 190 },
        { id: "sec-arch", title: "Architecture & Pipelines", timestampStart: 191, timestampEnd: 360 },
        { id: "sec-conclusion", title: "Key Learnings & Verdict", timestampStart: 361, timestampEnd: durationSeconds },
      ],
    };
  }

  async getAvailableVoices(): Promise<NarrationVoice[]> {
    return NARRATION_VOICES;
  }
}

export const narrationService = new MockNarrationService();
