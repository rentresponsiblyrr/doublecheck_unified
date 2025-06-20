
import { useAuth } from "@/components/FastAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import OptimizedProperties from "./OptimizedProperties";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DoubleCheck...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <OptimizedProperties />
    </ProtectedRoute>
  );
};

export default Index;
