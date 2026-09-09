import React, { useRef } from "react";
import { gsap, ScrollTrigger } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "../../hooks/motion/useGsapContext";
import { useReducedMotion } from "../../hooks/motion/useReducedMotion";

export interface HighlightTextProps {
  children: React.ReactNode;
  trigger?: "scroll" | "load";
  color?: string;
  delay?: number;
  duration?: number;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  children,
  trigger = "scroll",
  color = "rgba(59, 130, 246, 0.22)",
  delay = 0.2,
  duration = motion.duration.normal,
  className = "",
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const sweepRef = useRef<HTMLSpanElement>(null);
  const prefersReduced = useReducedMotion();

  useGsapContext(
    () => {
      const container = containerRef.current;
      const sweep = sweepRef.current;
      if (!container || !sweep) return;

      if (prefersReduced) {
        gsap.set(sweep, { scaleX: 1, opacity: 0.7 });
        return;
      }

      gsap.set(sweep, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      const anim = gsap.to(sweep, {
        scaleX: 1,
        duration,
        delay,
        ease: motion.ease.reveal,
      });

      if (trigger === "scroll") {
        ScrollTrigger.create({
          trigger: container,
          start: motion.scrollTriggerDefaults.start,
          once: true,
          onEnter: () => anim.play(),
        });
        anim.pause();
      }
    },
    containerRef,
    [trigger, delay, duration, prefersReduced]
  );

  return (
    <span
      ref={containerRef}
      className={`relative inline-block px-1 mx-0.5 rounded ${className}`}
    >
      <span
        ref={sweepRef}
        style={{ backgroundColor: color }}
        className="absolute inset-0 -z-10 rounded pointer-events-none will-change-transform"
      />
      <span className="relative z-0">{children}</span>
    </span>
  );
};
