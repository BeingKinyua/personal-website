export const easings = {
  enter: "power4.out",
  reveal: "power3.out",
  smooth: "power2.inOut",
  exit: "power3.in",
  cinematic: "power4.out",
  snappy: "power2.out",
  linear: "none",
} as const;

export type MotionEasing = keyof typeof easings;
