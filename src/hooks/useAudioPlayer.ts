import { useState, useEffect, useRef, useCallback } from "react";
import { CURATED_AMBIENT_TRACKS, AmbientTrack, generativeAmbient } from "../services/audio";
import { narrationService, Narration, NARRATION_VOICES, NarrationVoice } from "../services/narration";

export type AudioMode = "ambient" | "narration";

export interface AudioPlayerState {
  isOpen: boolean;
  isMinimized: boolean;
  isPlaying: boolean;
  mode: AudioMode;
  currentTrackIndex: number;
  currentTrack: AmbientTrack;
  narration: Narration | null;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  selectedVoice: string;
  volume: number;
}

export function useAudioPlayer(contentId?: string, contentType?: "article" | "project") {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<AudioMode>("ambient");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(NARRATION_VOICES[0].id);
  const [narration, setNarration] = useState<Narration | null>(null);

  const timerRef = useRef<number | null>(null);
  const currentTrack = CURATED_AMBIENT_TRACKS[currentTrackIndex] || CURATED_AMBIENT_TRACKS[0];
  const duration = mode === "ambient" ? currentTrack.durationSeconds : (narration?.durationSeconds || 360);

  // Load narration metadata when switched to narration mode or content changes
  useEffect(() => {
    if (contentId && contentType) {
      narrationService.generateNarration(contentId, contentType, selectedVoice).then((data) => {
        setNarration(data);
      });
    }
  }, [contentId, contentType, selectedVoice]);

  // Audio timer simulation
  useEffect(() => {
    if (isPlaying) {
      if (mode === "ambient") {
        generativeAmbient.start();
      }
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mode === "ambient") {
        generativeAmbient.stop();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration, playbackSpeed, mode]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.min(duration, Math.max(0, time)));
  }, [duration]);

  const setTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setCurrentTime(0);
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % CURATED_AMBIENT_TRACKS.length);
    setCurrentTime(0);
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + CURATED_AMBIENT_TRACKS.length) % CURATED_AMBIENT_TRACKS.length);
    setCurrentTime(0);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    generativeAmbient.stop();
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    if (isPlaying) {
      setIsMinimized(true);
    }
  }, [isPlaying]);

  const dismissPlayer = useCallback(() => {
    stop();
    setIsOpen(false);
    setIsMinimized(false);
  }, [stop]);

  return {
    isOpen,
    isMinimized,
    isPlaying,
    mode,
    currentTrack,
    currentTrackIndex,
    tracks: CURATED_AMBIENT_TRACKS,
    narration,
    currentTime,
    duration,
    playbackSpeed,
    selectedVoice,
    voices: NARRATION_VOICES,
    setMode,
    togglePlay,
    seek,
    setTrack,
    nextTrack,
    prevTrack,
    setPlaybackSpeed,
    setSelectedVoice,
    openPanel,
    closePanel,
    dismissPlayer,
    setIsMinimized,
  };
}
