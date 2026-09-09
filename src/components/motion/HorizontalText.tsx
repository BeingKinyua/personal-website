import React, { useRef } from "react";
import { useHorizontalReveal } from "../../hooks/motion/useHorizontalReveal";
import { motion } from "../../lib/motion/config";

export interface HorizontalTextProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  distance?: number;
  trigger?: "scroll" | "load" | "manual";
  duration?: number;
  delay?: number;
  className?: string;
  as?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4";
  scrollStart?: string;
  onComplete?: () => void;
}

export const HorizontalText: React.FC<HorizontalTextProps> = ({
  children,
  direction = "left",
  distance = 48,
  trigger = "scroll",
  duration = motion.duration.slow,
  delay = 0,
  className = "",
  as: Component = "div",
  scrollStart = "top 85%",
  onComplete,
}) => {
  const targetRef = useRef<HTMLElement>(null);

  useHorizontalReveal(targetRef, {
    direction,
    distance,
    trigger,
    duration,
    delay,
    scrollStart,
    onComplete,
  });

  return (
    <Component
      ref={targetRef as any}
      className={`horizontal-text-target inline-block will-change-transform ${className}`}
    >
      {children}
    </Component>
  );
};
