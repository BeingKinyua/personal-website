import React from "react";

interface ReaderProgressProps {
  progress: number;
  accentColor?: string;
}

export const ReaderProgress: React.FC<ReaderProgressProps> = ({
  progress,
  accentColor = "bg-blue-500",
}) => {
  return (
    <div
      id="reader-progress-track"
      className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-[105] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${accentColor} transition-[width] duration-75 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
