
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import MobileIndex from "./pages/MobileIndex";
import Inspection from "./pages/Inspection";
import AddProperty from "./pages/AddProperty";
import PropertySelection from "./pages/PropertySelection";
import "./styles/mobile.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useMobileAuth();

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mobile-spinner mx-auto mb-4" />
          <p className="text-gray-600">Loading DoubleCheck...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            DoubleCheck Mobile
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access the inspection platform.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Authentication is required to use DoubleCheck. Please contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Navigate to="/properties" replace />} />
        <Route path="/properties" element={<MobileIndex />} />
        <Route path="/property-selection" element={<PropertySelection />} />
        <Route path="/inspection/:id" element={<Inspection />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="*" element={<Navigate to="/properties" replace />} />
      </Routes>
    </div>
  );
}

export default App;
