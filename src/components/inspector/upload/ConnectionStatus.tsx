import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isOnline: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
}) => (
  <div id="connection-status" className="flex items-center gap-2">
    {isOnline ? (
      <>
        <Wifi className="w-4 h-4 text-green-500" />
        <Badge variant="outline" className="text-green-700 border-green-200">
          Online
        </Badge>
      </>
    ) : (
      <>
        <WifiOff className="w-4 h-4 text-red-500" />
        <Badge variant="outline" className="text-red-700 border-red-200">
          Offline
        </Badge>
      </>
    )}
  </div>
);
