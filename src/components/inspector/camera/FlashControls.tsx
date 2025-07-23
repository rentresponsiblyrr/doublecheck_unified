import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, ZapOff } from "lucide-react";
import { logger } from "@/utils/logger";

interface FlashControlsProps {
  cameraStream: MediaStream | null;
  onFlashToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export const FlashControls: React.FC<FlashControlsProps> = ({
  cameraStream,
  onFlashToggle,
  disabled = false,
}) => {
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);

  useEffect(() => {
    checkFlashSupport();
  }, [cameraStream]);

  const checkFlashSupport = async () => {
    if (!cameraStream) {
      setFlashSupported(false);
      return;
    }

    try {
      const videoTrack = cameraStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      const hasFlash = capabilities.torch === true;
      setFlashSupported(hasFlash);

      logger.info("Flash support checked", {
        component: "FlashControls",
        flashSupported: hasFlash,
        capabilities: Object.keys(capabilities),
        action: "flash_capability_check",
      });
    } catch (error) {
      logger.warn("Could not check flash capabilities", {
        component: "FlashControls",
        error: (error as Error).message,
        action: "flash_capability_check",
      });
      setFlashSupported(false);
    }
  };

  const toggleFlash = async () => {
    if (!cameraStream || !flashSupported) return;

    try {
      const videoTrack = cameraStream.getVideoTracks()[0];
      const newFlashState = !flashEnabled;

      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashState }],
      });

      setFlashEnabled(newFlashState);
      onFlashToggle(newFlashState);

      logger.info("Flash toggled", {
        component: "FlashControls",
        flashEnabled: newFlashState,
        action: "flash_toggle",
      });
    } catch (error) {
      logger.error("Failed to toggle flash", {
        component: "FlashControls",
        error: (error as Error).message,
        action: "flash_toggle",
      });
    }
  };

  if (!flashSupported) {
    return null;
  }

  return (
    <div id="flash-controls-container">
      <Button
        onClick={toggleFlash}
        disabled={disabled || !cameraStream}
        variant={flashEnabled ? "default" : "outline"}
        size="sm"
        className="flex items-center space-x-2"
        id="flash-toggle-button"
      >
        {flashEnabled ? (
          <Zap className="h-4 w-4" />
        ) : (
          <ZapOff className="h-4 w-4" />
        )}
        <span>{flashEnabled ? "Flash On" : "Flash Off"}</span>
      </Button>
    </div>
  );
};
