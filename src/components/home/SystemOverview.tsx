import React, { useState } from "react";
import { CurrentlyItem } from "../../types/common";
import { CurrentlyTelemetryModal } from "./CurrentlyTelemetryModal";
import { HeroSection } from "./hero/hero-section";
import { DigitalRainTheme } from "./hero/digital-rain-config";

interface SystemOverviewProps {
  onNavigate: (sectionId: string) => void;
  onOpenTovu?: () => void;
  onOpenDoom?: () => void;
  theme?: DigitalRainTheme;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({
  onNavigate,
  onOpenTovu,
  onOpenDoom,
  theme,
}) => {
  const handleOpenTovu = onOpenTovu || onOpenDoom || (() => {});
  const [selectedCurrently, setSelectedCurrently] = useState<CurrentlyItem | null>(null);

  return (
    <>
      <HeroSection onNavigate={onNavigate} onOpenTovu={handleOpenTovu} theme={theme} />

      <CurrentlyTelemetryModal
        item={selectedCurrently}
        onClose={() => setSelectedCurrently(null)}
      />
    </>
  );
};
