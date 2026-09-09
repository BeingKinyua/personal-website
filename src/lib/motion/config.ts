import { durations, staggers } from "./durations";
import { easings } from "./easings";

export const motion = {
  duration: durations,
  stagger: staggers,
  ease: easings,
  scrollTriggerDefaults: {
    start: "top 85%",
    once: true,
  },
} as const;

export default motion;
