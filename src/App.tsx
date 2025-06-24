
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileFastAuthProvider } from "@/components/MobileFastAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundaryWithRecovery } from "@/components/ErrorBoundaryWithRecovery";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "./pages/Index";
import OptimizedPropertySelection from "./pages/OptimizedPropertySelection";
import AddProperty from "./pages/AddProperty";
import Inspection from "./pages/Inspection";
import InspectionComplete from "./pages/InspectionComplete";
import NotFound from "./pages/NotFound";

// Enhanced query client with better error handling and mobile optimization
const createOptimizedQueryClient = (isMobile: boolean) => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.message?.includes('JWT') || error?.status === 401) {
          return false;
        }
        // Fewer retries on mobile to save battery/data
        return failureCount < (isMobile ? 1 : 2);
      },
      staleTime: isMobile ? 2 * 60 * 1000 : 60 * 1000, // 2 minutes on mobile, 1 minute on desktop
      gcTime: isMobile ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15 minutes on mobile for offline capability
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Better offline support
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('JWT') || error?.status === 401) {
          return false;
        }
        return failureCount < 1;
      },
      networkMode: 'offlineFirst',
    },
  },
});

const AppContent = () => {
  const isMobile = useIsMobile();
  const queryClient = createOptimizedQueryClient(isMobile);

  const handleGlobalError = (error: Error) => {
    console.error('🚨 Global error:', error);
    // Could integrate with error monitoring service here
  };

  console.log('📱 App optimized for mobile with enhanced error handling:', isMobile);

  return (
    <ErrorBoundaryWithRecovery onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <MobileFastAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <NetworkStatusIndicator />
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/properties" element={
                    <ProtectedRoute>
                      <OptimizedPropertySelection />
                    </ProtectedRoute>
                  } />
                  <Route path="/add-property" element={
                    <ProtectedRoute>
                      <AddProperty />
                    </ProtectedRoute>
                  } />
                  <Route path="/inspection/:inspectionId" element={
                    <ProtectedRoute>
                      <Inspection />
                    </ProtectedRoute>
                  } />
                  <Route path="/inspection/:inspectionId/complete" element={
                    <ProtectedRoute>
                      <InspectionComplete />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </MobileFastAuthProvider>
      </QueryClientProvider>
    </ErrorBoundaryWithRecovery>
  );
};

const App = () => <AppContent />;

export default App;
