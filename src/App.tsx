
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

// Highly optimized query client for mobile performance
const createMobileOptimizedQueryClient = (isMobile: boolean) => new QueryClient({
  defaultOptions: {
    queries: {
      retry: isMobile ? 1 : 2, // Fewer retries on mobile
      staleTime: isMobile ? 60 * 1000 : 30 * 1000, // 1 minute on mobile, 30 seconds on desktop
      gcTime: isMobile ? 10 * 60 * 1000 : 5 * 60 * 1000, // 10 minutes on mobile
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: isMobile ? 1 : 2,
      networkMode: 'online',
    },
  },
});

const AppContent = () => {
  const isMobile = useIsMobile();
  const queryClient = createMobileOptimizedQueryClient(isMobile);

  console.log('📱 App optimized for mobile:', isMobile);

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
