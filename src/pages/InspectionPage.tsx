import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSimplifiedInspectionData } from "@/hooks/useSimplifiedInspectionData";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { InspectionContent } from "@/components/InspectionContent";
import { InspectionErrorBoundary } from "@/components/InspectionErrorBoundary";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery.tsx";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { debugLogger } from "@/utils/debugLogger";

export const InspectionPage = () => {
  debugLogger.info("InspectionPage", "Component rendering");

  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const inspectionId = params.id;

  const { user, loading: authLoading, error: authError } = useAuth();
  const isAuthenticated = !!user;

  /**
   * WCAG 2.1 AA Compliance: Screen reader announcements
   * Announces all status changes to assistive technology users
   */
  const announceToScreenReader = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = message;
      document.body.appendChild(announcement);

      // Clean up announcement after screen readers have processed it
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 2000);
    },
    [],
  );

  debugLogger.info("InspectionPage", "Auth and route state", {
    inspectionId,
    isAuthenticated,
    authLoading,
    hasAuthError: !!authError,
    userId: user?.id,
  });

  // Early validation - missing inspection ID
  if (!inspectionId) {
    debugLogger.error("InspectionPage", "No inspection ID in route params");

    // WCAG 2.1 AA: Announce error to screen readers
    announceToScreenReader(
      "Error: Invalid inspection URL. No inspection ID found.",
      "assertive",
    );

    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        role="main"
        aria-labelledby="invalid-inspection-title"
      >
        <div
          className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            aria-hidden="true"
          />
          <h2
            id="invalid-inspection-title"
            className="text-xl font-semibold text-gray-900 mb-2"
          >
            Invalid Inspection URL
          </h2>
          <p className="text-gray-600 mb-4" role="status">
            No inspection ID found in the URL. Please check the link and try
            again.
          </p>
          <Button
            onClick={() => {
              announceToScreenReader(
                "Navigating back to properties page.",
                "polite",
              );
              navigate("/properties");
            }}
            className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Return to properties page to select a valid inspection"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Return to Properties
          </Button>
        </div>
      </div>
    );
  }

  // Auth loading state
  if (authLoading) {
    debugLogger.info("InspectionPage", "Showing auth loading state");

    // WCAG 2.1 AA: Announce loading state
    announceToScreenReader("Authenticating user, please wait...", "polite");

    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        role="main"
        aria-labelledby="auth-loading-title"
      >
        <div
          className="text-center"
          role="status"
          aria-live="polite"
          aria-label="Authentication in progress"
        >
          <div
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            aria-hidden="true"
          />
          <h2 id="auth-loading-title" className="sr-only">
            Authentication Loading
          </h2>
          <p className="text-gray-600" aria-label="Authentication status">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    debugLogger.error("InspectionPage", "Authentication error", authError);

    // WCAG 2.1 AA: Announce authentication error
    announceToScreenReader(`Authentication error: ${authError}`, "assertive");

    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        role="main"
        aria-labelledby="auth-error-title"
      >
        <div
          className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            aria-hidden="true"
          />
          <h2
            id="auth-error-title"
            className="text-xl font-semibold text-gray-900 mb-2"
          >
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4" role="status">
            {authError}
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => {
                announceToScreenReader("Retrying authentication...", "polite");
                // WCAG 2.1 AA: Professional error recovery - trigger auth refresh without nuclear reload
                navigate("/", { replace: true });
              }}
              className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Retry authentication to access inspection"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                announceToScreenReader(
                  "Navigating to properties page.",
                  "polite",
                );
                navigate("/properties");
              }}
              className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Return to properties page without retrying authentication"
            >
              Return to Properties
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    debugLogger.warn("InspectionPage", "User not authenticated");

    // WCAG 2.1 AA: Announce authentication requirement
    announceToScreenReader(
      "Authentication required to view inspection. Please sign in.",
      "assertive",
    );

    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        role="main"
        aria-labelledby="auth-required-title"
      >
        <div
          className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle
            className="w-12 h-12 text-orange-500 mx-auto mb-4"
            aria-hidden="true"
          />
          <h2
            id="auth-required-title"
            className="text-xl font-semibold text-gray-900 mb-2"
          >
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4" role="status">
            Please sign in to view this inspection. You need to be authenticated
            to access inspection data.
          </p>
          <Button
            onClick={() => {
              announceToScreenReader("Navigating to sign in page.", "polite");
              navigate("/");
            }}
            className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Go to sign in page to authenticate and access inspection"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InspectionErrorBoundary inspectionId={inspectionId}>
      <InspectionDataLoader inspectionId={inspectionId} />
    </InspectionErrorBoundary>
  );
};

// Default export for lazy loading
export default InspectionPage;

const InspectionDataLoader = ({ inspectionId }: { inspectionId: string }) => {
  const navigate = useNavigate();
  const { checklistItems, isLoading, refetch, error } =
    useSimplifiedInspectionData(inspectionId);

  debugLogger.info("InspectionDataLoader", "Data loader state", {
    inspectionId,
    isLoading,
    itemCount: checklistItems.length,
    hasError: !!error,
  });

  // Handle data loading errors
  if (error) {
    debugLogger.error("InspectionDataLoader", "Data loading error", error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <MobileErrorRecovery
          error={error}
          onRetry={refetch}
          onNavigateHome={() => navigate("/properties")}
          onNavigateBack={() => navigate("/properties")}
          showBackButton={true}
          context="Loading inspection data"
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    debugLogger.info("InspectionDataLoader", "Showing loading state");
    return <InspectionLoadingState inspectionId={inspectionId} />;
  }

  // Show success state with data
  debugLogger.info("InspectionDataLoader", "Rendering inspection content", {
    itemCount: checklistItems.length,
  });

  return (
    <InspectionErrorBoundary inspectionId={inspectionId} onRetry={refetch}>
      <InspectionContent
        inspectionId={inspectionId}
        checklistItems={checklistItems}
        onRefetch={refetch}
        isRefetching={false}
      />
    </InspectionErrorBoundary>
  );
};
