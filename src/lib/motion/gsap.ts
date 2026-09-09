import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

export function initGsap() {
  if (typeof window !== "undefined") {
    (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
    if (!isRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      isRegistered = true;
    }
  }
  return { gsap, ScrollTrigger };
}

// Auto-initialize if running in browser
if (typeof window !== "undefined") {
  initGsap();
}

export { gsap, ScrollTrigger };
