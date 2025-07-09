
import React, { useEffect, Suspense, useState, Component } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { SimpleAuthForm } from "@/components/SimpleAuthForm";



// Simple error boundary class
class SimpleErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Lazy load heavy components only after authentication
const LazyAuthenticatedApp = React.lazy(() => import('./AuthenticatedApp'));

function App() {
  console.log('🚀 STR Certified App - Authentication-First Architecture v3');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start with false - show login immediately
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Only listen for auth changes - never auto-authenticate to ensure clean login UX
  useEffect(() => {
    console.log('🔍 Setting up auth listener (login page first)');
    
    // Listen for auth changes but don't check existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);
      
      // Only set authenticated on explicit SIGNED_IN event
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading authenticated app');
        setUser(session.user);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        // For all other events (SIGNED_OUT, TOKEN_REFRESHED, etc.), stay on login
        console.log('🔄 Staying on login page for event:', event);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">STR Certified</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated or if there are auth errors (no heavy components loaded)
  if (!isAuthenticated || authError) {
    return <SimpleAuthForm 
      onAuthSuccess={() => {
        setIsAuthenticated(true);
        setAuthError(null);
      }} 
      initialError={authError}
    />;
  }

  // Only load heavy app after authentication with error boundary
  return (
    <SimpleErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
            <p className="text-gray-600 mb-4">The application encountered an error. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <div className="mt-4">
              <button 
                onClick={() => {
                  setIsAuthenticated(false);
                  setUser(null);
                  setAuthError(null);
                }} 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">STR Certified</h1>
            <p className="text-gray-600">Initializing application...</p>
          </div>
        </div>
      }>
        <LazyAuthenticatedApp user={user} />
      </Suspense>
    </SimpleErrorBoundary>
  );
}

export default App;
