export const durations = {
  instant: 0.15,
  fast: 0.3,
  normal: 0.6,
  slow: 0.9,
  cinematic: 1.2,
  scramble: 0.45,
} as const;

export const staggers = {
  tight: 0.04,
  normal: 0.08,
  relaxed: 0.12,
  line: 0.1,
} as const;

export type MotionDuration = keyof typeof durations;
export type MotionStagger = keyof typeof staggers;
