
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import { SimplifiedInspectionPage } from "@/components/SimplifiedInspectionPage";
import { DebugInspectionPage } from "@/components/DebugInspectionPage";
import AddProperty from "./pages/AddProperty";
import InspectionComplete from "./pages/InspectionComplete";
import PropertySelection from "./pages/PropertySelection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
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
                  <PropertySelection />
                </ProtectedRoute>
              } />
              <Route path="/inspection/:id" element={
                <ProtectedRoute>
                  <SimplifiedInspectionPage />
                </ProtectedRoute>
              } />
              <Route path="/debug-inspection/:id" element={
                <ProtectedRoute>
                  <DebugInspectionPage />
                </ProtectedRoute>
              } />
              <Route path="/add-property" element={
                <ProtectedRoute>
                  <AddProperty />
                </ProtectedRoute>
              } />
              <Route path="/inspection-complete/:id" element={
                <ProtectedRoute>
                  <InspectionComplete />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
