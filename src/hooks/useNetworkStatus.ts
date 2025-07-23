import { useState, useEffect, useCallback } from "react";
import { logger } from "@/utils/logger";

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  wasOffline: boolean;
  reconnectedAt: Date | null;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  retryConnection: () => Promise<boolean>;
  getConnectionQuality: () => "good" | "poor" | "offline";
}

/**
 * Enhanced network status hook with offline management capabilities
 */
export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: "unknown",
    effectiveType: "unknown",
    wasOffline: false,
    reconnectedAt: null,
  });

  /**
   * Updates network status with current connection information
   */
  const updateNetworkStatus = useCallback(() => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const isOnline = navigator.onLine;

    setNetworkStatus((prevStatus) => {
      const wasOffline = !prevStatus.isOnline && isOnline;

      const newStatus: NetworkStatus = {
        isOnline,
        isSlowConnection: connection
          ? connection.effectiveType === "2g" ||
            connection.effectiveType === "slow-2g"
          : false,
        connectionType: connection ? connection.type || "unknown" : "unknown",
        effectiveType: connection
          ? connection.effectiveType || "unknown"
          : "unknown",
        wasOffline,
        reconnectedAt: wasOffline ? new Date() : prevStatus.reconnectedAt,
      };

      // Log connection changes
      if (wasOffline) {
        logger.info(
          "📶 Network connection restored",
          {
            connectionType: newStatus.connectionType,
            effectiveType: newStatus.effectiveType,
          },
          "NETWORK_STATUS",
        );
      } else if (!isOnline && prevStatus.isOnline) {
        logger.warn("📵 Network connection lost", {}, "NETWORK_STATUS");
      }

      return newStatus;
    });
  }, []); // Remove dependencies to prevent infinite loops

  /**
   * Tests connection by attempting to fetch a small resource
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/manifest.webmanifest", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn("Connection test failed", error, "NETWORK_STATUS");
      return false;
    }
  }, []);

  /**
   * Attempts to retry connection
   */
  const retryConnection = useCallback(async (): Promise<boolean> => {
    logger.info("🔄 Retrying connection...", {}, "NETWORK_STATUS");

    const isConnected = await testConnection();
    updateNetworkStatus();

    if (isConnected) {
      logger.info("✅ Connection retry successful", {}, "NETWORK_STATUS");
    } else {
      logger.warn("❌ Connection retry failed", {}, "NETWORK_STATUS");
    }

    return isConnected;
  }, [testConnection, updateNetworkStatus]);

  /**
   * Gets connection quality assessment
   */
  const getConnectionQuality = useCallback((): "good" | "poor" | "offline" => {
    if (!networkStatus.isOnline) {
      return "offline";
    }

    if (networkStatus.isSlowConnection) {
      return "poor";
    }

    return "good";
  }, [networkStatus]);

  /**
   * Set up event listeners for network changes
   */
  useEffect(() => {
    const handleOnline = () => {
      logger.info("Browser online event", {}, "NETWORK_STATUS");
      updateNetworkStatus();
    };

    const handleOffline = () => {
      logger.warn("Browser offline event", {}, "NETWORK_STATUS");
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      logger.info("Connection change event", {}, "NETWORK_STATUS");
      updateNetworkStatus();
    };

    // Browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Connection API events
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    // Initial status update
    updateNetworkStatus();

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, [updateNetworkStatus]);

  return {
    ...networkStatus,
    retryConnection,
    getConnectionQuality,
  };
};

/**
 * Simple hook that returns just the online status (for backward compatibility)
 */
export const useSimpleNetworkStatus = (): boolean => {
  const { isOnline } = useNetworkStatus();
  return isOnline;
};
