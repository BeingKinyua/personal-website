import React, { useRef } from "react";
import { gsap } from "../../lib/motion/gsap";
import { useGsapContext } from "../../hooks/motion/useGsapContext";
import { useReducedMotion } from "../../hooks/motion/useReducedMotion";

export interface ParallaxBackgroundTextProps {
  children: string;
  speed?: number; // Distance in pixels it travels relative to scroll
  className?: string;
  triggerId?: string;
}

export const ParallaxBackgroundText: React.FC<ParallaxBackgroundTextProps> = ({
  children,
  speed = 100,
  className = "",
  triggerId,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useGsapContext(
    () => {
      const el = textRef.current;
      if (!el || prefersReduced) return;

      const triggerEl = triggerId ? document.getElementById(triggerId) || el.parentElement : el.parentElement;

      gsap.fromTo(
        el,
        { y: -speed / 2 },
        {
          y: speed / 2,
          ease: "none",
          scrollTrigger: {
            trigger: triggerEl || el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );
    },
    textRef,
    [speed, triggerId, prefersReduced]
  );

  return (
    <div
      ref={textRef}
      aria-hidden="true"
      className={`select-none pointer-events-none font-mono font-black tracking-tighter opacity-[0.035] will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};
