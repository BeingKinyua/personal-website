import React, { useRef } from "react";
import { useBlurReveal } from "../../hooks/motion/useBlurReveal";
import { motion } from "../../lib/motion/config";

export interface BlurRevealProps {
  children: React.ReactNode;
  trigger?: "scroll" | "load";
  blurAmount?: number;
  duration?: number;
  delay?: number;
  className?: string;
  as?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "section" | "article";
  scrollStart?: string;
  onComplete?: () => void;
}

export const BlurReveal: React.FC<BlurRevealProps> = ({
  children,
  trigger = "scroll",
  blurAmount = 8,
  duration = motion.duration.slow,
  delay = 0,
  className = "",
  as: Component = "div",
  scrollStart = motion.scrollTriggerDefaults.start,
  onComplete,
}) => {
  const targetRef = useRef<HTMLElement>(null);

  useBlurReveal(targetRef, {
    trigger,
    delay,
    duration,
    blurAmount,
    scrollStart,
    onComplete,
  });

  return (
    <Component
      ref={targetRef as any}
      className={`blur-reveal-target ${className}`}
    >
      {children}
    </Component>
  );
};
