import React, { Suspense } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { SimpleAuthForm } from "@/components/SimpleAuthForm";

// Lazy load the authenticated app
const LazyAuthenticatedApp = React.lazy(() => import('./AuthenticatedApp'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading STR Certified...</p>
        </div>
      </div>
    );
  }

  // Authentication state
  if (!isAuthenticated) {
    return <SimpleAuthForm onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  // Authenticated app
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    }>
      <LazyAuthenticatedApp />
    </Suspense>
  );
}

export default App;