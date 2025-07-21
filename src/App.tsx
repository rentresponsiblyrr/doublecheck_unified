
import React, { useEffect, Suspense, Component } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { SimpleAuthForm } from "@/components/SimpleAuthForm";
import { useAppStore, useAuth, useAuthActions } from "@/stores/appStore";
import { useAdvancedPreloader } from "@/lib/performance/preloader";
import { useAdvancedResourceHints } from "@/lib/performance/resource-hints";
import { registerServiceWorker } from "@/lib/performance/service-worker";
import { useCoreWebVitals } from "@/lib/performance/core-web-vitals";
import { usePageSpeedValidator } from "@/lib/performance/pagespeed-validator";
import { log } from "@/lib/logging/enterprise-logger";



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
    log.error('Application error boundary caught an error', error, {
      component: 'SimpleErrorBoundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: 'App'
    }, 'ERROR_BOUNDARY_TRIGGERED');
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
  // PROFESSIONAL STATE MANAGEMENT - NO AMATEUR USESTATE CHAOS
  const { isAuthenticated, isLoading, user, error: authError } = useAuth();
  const { login, logout, refreshSession, clearError } = useAuthActions();

  // BLEEDING EDGE: Advanced preloading and resource hints
  const { startPreloading, metrics: preloadMetrics } = useAdvancedPreloader({
    enablePredictive: true,
    enableResourceHints: true,
    enableIntersectionObserver: true,
    networkAware: true,
    criticalRoutes: ['/', '/inspections', '/properties', '/admin']
  });

  const { hintsManager } = useAdvancedResourceHints({
    enableDnsPrefetch: true,
    enablePreconnect: true,
    enableModulePreload: true,
    enablePreload: true,
    networkAware: true,
    preloadStrategy: 'balanced',
    criticalOrigins: [
      'https://api.openai.com',
      'https://supabase.co',
      'https://fonts.googleapis.com'
    ]
  });

  // BLEEDING EDGE: Core Web Vitals optimization for 100% PageSpeed score
  const { vitals, score, forceOptimization, generateReport } = useCoreWebVitals({
    enableRealTimeMonitoring: true,
    enableAutoOptimization: true,
    performanceBudget: {
      lcp: 1200,  // Ultra-aggressive for 100% score
      fid: 30,    // Instant response
      cls: 0.03,  // Minimal layout shift
      fcp: 800,   // Lightning fast paint
      ttfb: 150,  // Ultra-fast server response
      inp: 50     // Instant interactions
    },
    samplingRate: 1.0
  });

  // BLEEDING EDGE: PageSpeed 100 validation
  const { validatePageSpeed100, runAudit, generateReport: generatePageSpeedReport } = usePageSpeedValidator({
    strategy: 'mobile',
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    enableMonitoring: true,
    monitoringInterval: 60, // Monitor every hour
    alertThreshold: 95 // Alert if score drops below 95
  });

  // BLEEDING EDGE: Initialize advanced preloading and service worker on app start
  useEffect(() => {
    if (startPreloading) {
      log.info('Starting advanced preloading system', {
        component: 'App',
        action: 'startPreloading',
        enablePredictive: true,
        enableResourceHints: true
      }, 'PRELOADING_STARTED');
      startPreloading().catch(error => {
        log.error('Advanced preloading failed', error, {
          component: 'App',
          action: 'startPreloading'
        }, 'PRELOADING_FAILED');
      });
    }

    // BLEEDING EDGE: Register service worker for offline caching
    registerServiceWorker().then(registration => {
      if (registration) {
        log.info('Service worker registered successfully', {
          component: 'App',
          action: 'registerServiceWorker',
          registration: !!registration
        }, 'SERVICE_WORKER_REGISTERED');
      }
    }).catch(error => {
      log.error('Service worker registration failed', error, {
        component: 'App',
        action: 'registerServiceWorker'
      }, 'SERVICE_WORKER_FAILED');
    });

    // BLEEDING EDGE: Force Core Web Vitals optimization for 100% score
    if (forceOptimization) {
      log.info('Forcing Core Web Vitals optimization', {
        component: 'App',
        action: 'forceOptimization',
        performanceBudget: { lcp: 1200, fid: 30, cls: 0.03 }
      }, 'CORE_WEB_VITALS_OPTIMIZATION');
      forceOptimization().catch(error => {
        log.error('Core Web Vitals optimization failed', error, {
          component: 'App',
          action: 'forceOptimization'
        }, 'CORE_WEB_VITALS_FAILED');
      });
    }

    // BLEEDING EDGE: Validate PageSpeed 100 after optimizations
    setTimeout(() => {
      if (validatePageSpeed100) {
        log.info('Running PageSpeed 100 validation', {
          component: 'App',
          action: 'validatePageSpeed100',
          strategy: 'mobile',
          categories: ['performance', 'accessibility', 'best-practices', 'seo']
        }, 'PAGESPEED_VALIDATION_STARTED');
        validatePageSpeed100().then(isPageSpeed100 => {
          if (isPageSpeed100) {
            log.info('PageSpeed 100 achieved!', {
              component: 'App',
              action: 'validatePageSpeed100',
              score: 100,
              achievement: 'pagespeed-100'
            }, 'PAGESPEED_100_ACHIEVED');
          } else {
            log.warn('Working toward PageSpeed 100', {
              component: 'App',
              action: 'validatePageSpeed100',
              score: '<100'
            }, 'PAGESPEED_OPTIMIZATION_NEEDED');
            if (generatePageSpeedReport) {
              const report = generatePageSpeedReport();
              log.info('PageSpeed report generated', {
                component: 'App',
                report: report
              }, 'PAGESPEED_REPORT_GENERATED');
            }
          }
        }).catch(error => {
          log.error('PageSpeed validation failed', error, {
            component: 'App',
            action: 'validatePageSpeed100'
          }, 'PAGESPEED_VALIDATION_FAILED');
        });
      }
    }, 5000); // Wait 5 seconds for optimizations to take effect
  }, [startPreloading, forceOptimization, validatePageSpeed100, generatePageSpeedReport]);

  // PROFESSIONAL SESSION MANAGEMENT - USE STORE ACTIONS
  useEffect(() => {
    log.info('Initializing professional session management', {
      component: 'App',
      action: 'sessionManagement'
    }, 'SESSION_MANAGEMENT_INIT');
    
    // Use professional session refresh from store
    refreshSession().catch(error => {
      log.error('Professional session refresh failed', error, {
        component: 'App',
        action: 'refreshSession'
      }, 'SESSION_REFRESH_FAILED');
    });
    
    // Professional auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.info('Auth state changed', {
          component: 'App',
          action: 'authStateChange',
          event: event,
          hasSession: !!session,
          hasUser: !!session?.user
        }, 'AUTH_STATE_CHANGED');
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await login(session.user);
            
            // BLEEDING EDGE: Trigger route-specific preloading after auth
            if (startPreloading) {
              log.info('Triggering post-auth preloading', {
                component: 'App',
                action: 'postAuthPreloading',
                userId: session.user.id
              }, 'POST_AUTH_PRELOADING');
              startPreloading();
            }
          } catch (error) {
            log.error('Professional login failed', error, {
              component: 'App',
              action: 'login',
              userId: session?.user?.id
            }, 'LOGIN_FAILED');
          }
        } else if (event === 'SIGNED_OUT') {
          await logout();
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, login, logout, startPreloading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div id="app-loading-container" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div id="app-loading-content" className="text-center">
          <div id="app-loading-spinner" className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
        log.info('Professional auth success callback triggered', {
          component: 'App',
          action: 'authSuccessCallback'
        }, 'AUTH_SUCCESS_CALLBACK');
        try {
          const { data: { user: currentUser }, error } = await supabase.auth.getUser();
          if (error) throw error;
          
          log.info('Professional login with current user', {
            component: 'App',
            action: 'authSuccessCallback',
            userEmail: currentUser?.email,
            userId: currentUser?.id
          }, 'AUTH_SUCCESS_LOGIN');
          await login(currentUser!);
          clearError();
        } catch (error) {
          log.error('Professional auth callback failed', error, {
            component: 'App',
            action: 'authSuccessCallback'
          }, 'AUTH_CALLBACK_FAILED');
        }
      }} 
      initialError={authError}
    />;
  }

  // Only load heavy app after authentication with error boundary
  return (
    <SimpleErrorBoundary
      fallback={
        <div id="app-error-container" className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div id="app-error-content" className="text-center">
            <div id="app-error-icon" className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
            <p className="text-gray-600 mb-4">The application encountered an error. Please try refreshing the page.</p>
            <button 
              onClick={() => {
                // Professional app recovery - use store actions
                logout();
                clearError();
              }} 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Reset Application
            </button>
            <div id="app-error-secondary-actions" className="mt-4">
              <button 
                onClick={() => {
                  // Professional return to login
                  logout();
                  clearError();
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
        <div id="app-suspense-container" className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div id="app-suspense-content" className="text-center">
            <div id="app-suspense-spinner" className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
