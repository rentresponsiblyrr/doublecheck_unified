
import { useAuth } from "@/components/MobileFastAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileIndex from "./MobileIndex";
import OptimizedProperties from "./OptimizedProperties";

const Index = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  console.log('📱 Index component:', { hasUser: !!user, loading, isMobile });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isMobile ? 'Loading DoubleCheck Mobile...' : 'Loading DoubleCheck...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {isMobile ? <MobileIndex /> : <OptimizedProperties />}
    </ProtectedRoute>
  );
};

export default Index;
