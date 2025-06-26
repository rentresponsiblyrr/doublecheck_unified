
import { Wifi, WifiOff } from "lucide-react";

interface NetworkStatusBadgeProps {
  isOnline: boolean;
}

export const NetworkStatusBadge = ({ isOnline }: NetworkStatusBadgeProps) => {
  return (
    <div className="flex items-center">
      {isOnline ? (
        <Wifi className="w-3 h-3 text-green-600" />
      ) : (
        <WifiOff className="w-3 h-3 text-red-600" />
      )}
    </div>
  );
};
