
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
  // REMOVED: App component logging to prevent infinite render loops
  // console.log('🚀 STR Certified App - Authentication-First Architecture v4 - DEBUG MODE');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with true - check session first
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // REMOVED: App state logging to prevent infinite render loops
  // console.log('🔍 App State:', { isAuthenticated, isLoading, hasUser: !!user, userEmail: user?.email });

  // Authentication setup - always start with login page
  useEffect(() => {
    console.log('🔍 Setting up auth listener - forcing login page');
    
    // Check if there's an existing valid session with timeout protection
    const checkSession = async () => {
      console.log('🚀 Starting session check...');
      
      try {
        // Add timeout protection to prevent hanging
        const sessionCheckPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout after 5 seconds')), 5000)
        );
        
        console.log('🔍 Calling supabase.auth.getSession() with 5s timeout...');
        const { data: { session }, error } = await Promise.race([sessionCheckPromise, timeoutPromise]) as any;
        console.log('✅ Session check completed:', { session: session?.user?.email, error });
        
        if (error) {
          console.error('Session check error:', error);
          await supabase.auth.signOut();
          return;
        }
        
        // If we have a valid session, verify user with robust fallback
        if (session?.user) {
          console.log('🔍 Verifying user session...', session.user.id);
          
          let userValid = false;
          
          try {
            console.log('🔍 Calling RPC get_user_role_simple with 3s timeout...');
            // Use the RPC function with timeout protection
            const rpcPromise = supabase.rpc('get_user_role_simple', { 
              _user_id: session.user.id 
            });
            const rpcTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('RPC timeout after 3 seconds')), 3000)
            );
            
            const { data: userRole, error: roleError } = await Promise.race([rpcPromise, rpcTimeoutPromise]) as any;
            console.log('✅ RPC call completed:', { userRole, roleError });
            
            if (!roleError && userRole) {
              console.log('✅ User validated via RPC function with role:', userRole);
              userValid = true;
            } else {
              console.log('⚠️ User role validation failed, allowing auth session...', roleError?.message);
              // Still allow login if they have a valid auth session
              userValid = true;
            }
          } catch (rpcError) {
            console.log('⚠️ RPC validation failed (possibly timeout), allowing auth session...', rpcError);
            // Still allow login if they have a valid auth session
            userValid = true;
          }
          
          // Final fallback: allow login if user has valid auth session
          if (!userValid) {
            console.log('⚠️ No user data found in tables, allowing login with auth session only');
            userValid = true;
          }
          
          if (userValid) {
            console.log('✅ Valid session found, authenticating user');
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            console.log('❌ User session invalid, requiring fresh login');
            await supabase.auth.signOut();
          }
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('🚨 Session check error (possibly timeout):', error);
        if (error.message?.includes('timeout')) {
          console.error('🕐 TIMEOUT DETECTED - Auth service may be hanging');
        }
        // Don't sign out on timeout - just continue without auth
      } finally {
        console.log('🏁 Session check completed, setting loading to false');
        setIsLoading(false);
      }
    };

    checkSession().catch(error => {
      console.error('🚨 Failed to check session:', error);
      setIsLoading(false);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);
      
      try {
        // Only set authenticated on explicit SIGNED_IN event
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in, loading authenticated app');
          setUser(session.user);
          setIsAuthenticated(true);
          setAuthError(null);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out, returning to login');
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(null);
        } else {
          // For other events, maintain current state but don't auto-authenticate
          console.log('🔄 Auth event processed:', event);
        }
      } catch (error: any) {
        console.error('🚨 Auth state change error:', error);
        setAuthError(`Authentication error: ${error.message}`);
        setIsAuthenticated(false);
        setUser(null);
      }
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
      onAuthSuccess={async () => {
        console.log('🔄 Auth success callback triggered, getting current user...');
        try {
          const { data: { user: currentUser }, error } = await supabase.auth.getUser();
          if (error) throw error;
          
          console.log('✅ Got current user:', currentUser?.email);
          setUser(currentUser);
          setIsAuthenticated(true);
          setAuthError(null);
        } catch (error) {
          console.error('❌ Failed to get user after auth success:', error);
          setAuthError('Failed to complete authentication');
        }
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
