
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MobileFastAuthProvider } from "./components/MobileFastAuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundaryWithRecovery } from "./components/ErrorBoundaryWithRecovery";
import { NavigationErrorBoundary } from "./components/NavigationErrorBoundary";
import { PropertyErrorBoundary } from "./components/PropertyErrorBoundary";
import { InspectionErrorBoundary } from "./components/InspectionErrorBoundary";
import { FormErrorBoundary } from "./components/FormErrorBoundary";
import { MobileNavigationOptimizer } from "./components/MobileNavigationOptimizer";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import PropertySelection from "./pages/PropertySelection";
import AddProperty from "./pages/AddProperty";
import Inspection from "./pages/Inspection";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds for mobile
      gcTime: 300000, // 5 minutes for mobile
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Mobile-friendly retry logic
        if (failureCount < 2) {
          console.log(`🔄 Mobile query retry (attempt ${failureCount + 1})`);
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Max 5 second delay
    },
    mutations: {
      retry: 1, // Only retry mutations once on mobile
      retryDelay: 2000
    }
  },
});

function App() {
  return (
    <ErrorBoundaryWithRecovery>
      <QueryClientProvider client={queryClient}>
        <MobileFastAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NavigationErrorBoundary>
              <BrowserRouter>
                <MobileNavigationOptimizer>
                  <div className="min-h-screen bg-gray-50">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route 
                        path="/properties" 
                        element={
                          <ProtectedRoute>
                            <PropertyErrorBoundary>
                              <PropertySelection />
                            </PropertyErrorBoundary>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/add-property" 
                        element={
                          <ProtectedRoute>
                            <FormErrorBoundary formType="Property">
                              <AddProperty />
                            </FormErrorBoundary>
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/inspection/:id" 
                        element={
                          <ProtectedRoute>
                            <InspectionErrorBoundary>
                              <Inspection />
                            </InspectionErrorBoundary>
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    
                    <PerformanceMonitor />
                  </div>
                </MobileNavigationOptimizer>
              </BrowserRouter>
            </NavigationErrorBoundary>
          </TooltipProvider>
        </MobileFastAuthProvider>
      </QueryClientProvider>
    </ErrorBoundaryWithRecovery>
  );
}

export default App;
