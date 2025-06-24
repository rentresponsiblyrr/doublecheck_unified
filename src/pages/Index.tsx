
import { useIsMobile } from "@/hooks/use-mobile";
import { useFastAuth } from "@/hooks/useFastAuth";
import MobileIndex from "./MobileIndex";
import { PropertyHeader } from "@/components/PropertyHeader";
import { QuickActions } from "@/components/QuickActions";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Zap, Users, Shield } from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();
  const { user, loading } = useFastAuth();

  console.log('📱 Index component:', { hasUser: !!user, loading, isMobile });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Use mobile-optimized version on mobile devices
  if (isMobile) {
    return <MobileIndex />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="DoubleCheck Inspector Portal"
        subtitle="Professional property inspection platform"
      />
      
      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to DoubleCheck
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional property verification for short-term rentals. 
            Ensure accuracy and safety with our AI-guided inspection platform.
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions context="home" />

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Smartphone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Mobile First</h3>
              <p className="text-sm text-gray-600">
                Optimized for field inspections on mobile devices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Fast & Reliable</h3>
              <p className="text-sm text-gray-600">
                Quick property verification with offline capability
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Collaborative</h3>
              <p className="text-sm text-gray-600">
                Multi-inspector support with real-time collaboration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Certified</h3>
              <p className="text-sm text-gray-600">
                AI-verified results with human oversight
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">Fast</div>
                <div className="text-sm text-gray-600">Inspections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">Reliable</div>
                <div className="text-sm text-gray-600">Results</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">Mobile</div>
                <div className="text-sm text-gray-600">Optimized</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 mb-1">Certified</div>
                <div className="text-sm text-gray-600">Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
