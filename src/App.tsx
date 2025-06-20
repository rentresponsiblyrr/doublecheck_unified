
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FastAuthProvider } from "@/components/FastAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import OptimizedPropertySelection from "./pages/OptimizedPropertySelection";
import AddProperty from "./pages/AddProperty";
import Inspection from "./pages/Inspection";
import InspectionComplete from "./pages/InspectionComplete";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors (reduced from 3)
        return failureCount < 2;
      },
      staleTime: 60 * 1000, // 1 minute (reduced from 5 minutes)
      gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10 minutes)
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      refetchOnReconnect: true, // Keep refetch on reconnect for better UX
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <FastAuthProvider>
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
      </FastAuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
