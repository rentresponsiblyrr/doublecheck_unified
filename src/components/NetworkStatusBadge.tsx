import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface NetworkStatusBadgeProps {
  isOnline: boolean;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  isOnline
}) => {
  if (isOnline) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
      <WifiOff className="w-3 h-3 mr-1" />
      Offline
    </Badge>
  );
};