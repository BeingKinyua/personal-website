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
  isPreviewOutlineOnly: boolean;
  sections: NarrationSection[];
}

export interface NarrationVoice {
  id: string;
  name: string;
  tagline: string;
  accent: string;
}

export const NARRATION_VOICES: NarrationVoice[] = [
  { id: "victor-neural", name: "Studio Neutral", tagline: "Measured, calm, deliberate", accent: "Neutral" },
  { id: "studio-analytical", name: "Analytical", tagline: "Paced, academic, precise", accent: "Modern Studio" },
  { id: "serene-contemplative", name: "Contemplative", tagline: "Low timbre, spacious", accent: "Serene" },
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
 * Provides reading outline timestamps when pre-rendered audio assets
 * are not attached. Audio synthesis requires a server TTS endpoint.
 */
class LocalNarrationOutlineService implements NarrationService {
  async generateNarration(
    contentId: string,
    contentType: "article" | "project",
    voiceId: string = "victor-neural"
  ): Promise<Narration> {
    const isProject = contentType === "project";
    const durationSeconds = isProject ? 420 : 520;

    return {
      contentId,
      contentType,
      title: isProject ? "Project Architecture Outline" : "Article Reading Outline",
      author: "Victor Kinyua",
      voice: voiceId,
      durationSeconds,
      isPreviewOutlineOnly: true,
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

export const narrationService = new LocalNarrationOutlineService();
