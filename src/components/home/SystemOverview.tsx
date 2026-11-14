import React, { useState } from "react";
import { CurrentlyItem } from "../../types/common";
import { CurrentlyTelemetryModal } from "./CurrentlyTelemetryModal";
import { HeroSection } from "./hero/hero-section";

interface SystemOverviewProps {
  onNavigate: (sectionId: string) => void;
  onOpenTovu?: () => void;
  onOpenDoom?: () => void;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({
  onNavigate,
  onOpenTovu,
  onOpenDoom,
}) => {
  const handleOpenTovu = onOpenTovu || onOpenDoom || (() => {});
  const [selectedCurrently, setSelectedCurrently] = useState<CurrentlyItem | null>(null);

  return (
    <>
      <HeroSection onNavigate={onNavigate} onOpenTovu={handleOpenTovu} />

      {/* Selected Telemetry Drawer Modal */}
      <CurrentlyTelemetryModal
        item={selectedCurrently}
        onClose={() => setSelectedCurrently(null)}
      />
    </>
  );
};
