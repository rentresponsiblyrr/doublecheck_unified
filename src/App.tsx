
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MobileFastAuthProvider } from "./components/MobileFastAuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundaryWithRecovery } from "./components/ErrorBoundaryWithRecovery";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import PropertySelection from "./pages/PropertySelection";
import AddProperty from "./pages/AddProperty";
import Inspection from "./pages/Inspection";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount < 2) {
          console.log(`🔄 Retrying query (attempt ${failureCount + 1})`);
          return true;
        }
        return false;
      },
    },
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
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route 
                    path="/properties" 
                    element={
                      <ProtectedRoute>
                        <PropertySelection />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/add-property" 
                    element={
                      <ProtectedRoute>
                        <AddProperty />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/inspection/:id" 
                    element={
                      <ProtectedRoute>
                        <Inspection />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                
                {/* Performance Monitor for admins */}
                <PerformanceMonitor />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </MobileFastAuthProvider>
      </QueryClientProvider>
    </ErrorBoundaryWithRecovery>
  );
}

export default App;
