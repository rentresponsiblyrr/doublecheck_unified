
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileFastAuthProvider } from "@/components/MobileFastAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "./pages/Index";
import OptimizedPropertySelection from "./pages/OptimizedPropertySelection";
import AddProperty from "./pages/AddProperty";
import Inspection from "./pages/Inspection";
import InspectionComplete from "./pages/InspectionComplete";
import NotFound from "./pages/NotFound";

// Mobile-optimized query client with aggressive caching
const createQueryClient = (isMobile: boolean) => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Fewer retries on mobile
        return failureCount < (isMobile ? 1 : 2);
      },
      staleTime: isMobile ? 2 * 60 * 1000 : 60 * 1000, // 2 minutes on mobile, 1 minute on desktop
      gcTime: isMobile ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10 minutes on mobile, 5 minutes on desktop
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const AppContent = () => {
  const isMobile = useIsMobile();
  const queryClient = createQueryClient(isMobile);

  console.log('📱 App loading, mobile detected:', isMobile);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MobileFastAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
            </BrowserRouter>
          </TooltipProvider>
        </MobileFastAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

const App = () => <AppContent />;

export default App;
