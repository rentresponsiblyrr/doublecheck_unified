
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
