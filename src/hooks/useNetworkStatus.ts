
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('🌐 Network: Offline');
      setIsOnline(false);
      toast({
        title: "Network Issue",
        description: "You appear to be offline. Please check your connection.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return isOnline;
};
