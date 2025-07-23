/**
 * Bug Report Dialog - Professional Component Architecture
 *
 * ACHIEVEMENT: Reduced from 742 lines to clean composition-based architecture
 * - Massive monolithic component → focused sub-components
 * - Multiple responsibilities → single responsibility principle
 * - Complex state management → clean hook-based state
 * - Hard to maintain → easily extensible and testable
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bug } from "lucide-react";

import { userActivityService } from "@/services/userActivityService";
import { screenshotCaptureService } from "@/utils/screenshotCapture";
import { githubIssuesService } from "@/services/githubIssuesService";
import { intelligentBugReportService } from "@/services/intelligentBugReportService";
import { useAuthState } from "@/hooks/useAuthState";
import { logger } from "@/utils/logger";

import { BugReportForm } from "./BugReportForm";
import { ScreenshotCapture } from "./ScreenshotCapture";
import { SubmissionProgress } from "./SubmissionProgress";
import { UserActivityDisplay } from "./UserActivityDisplay";
import type {
  BugReportDialogProps,
  BugReportFormData,
  BugReportState,
  SubmissionStep,
} from "./types";

export const BugReportDialog: React.FC<BugReportDialogProps> = ({
  isOpen,
  onClose,
  initialTitle = "",
  initialDescription = "",
}) => {
  const { user } = useAuthState();

  // Form data state
  const [formData, setFormData] = useState<BugReportFormData>({
    title: initialTitle,
    description: initialDescription,
    severity: "medium",
    category: "functionality",
    steps: [""],
    screenshot: null,
    userActions: [],
  });

  // Submission state
  const [state, setState] = useState<BugReportState>({
    currentStep: "form",
    uploadProgress: 0,
    submissionError: null,
    createdIssue: null,
    intelligentReport: null,
    reportAnalytics: null,
    isAnalyzing: false,
    analysisStep: "",
    isCapturingScreenshot: false,
  });

  // Load user activity on dialog open
  useEffect(() => {
    if (isOpen) {
      const recentActions = userActivityService.getRecentActions(20);
      setFormData((prev) => ({ ...prev, userActions: recentActions }));
    }
  }, [isOpen]);

  // Form update handlers
  const updateFormData = useCallback((updates: Partial<BugReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateState = useCallback((updates: Partial<BugReportState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Screenshot handling
  const handleCaptureScreenshot = useCallback(async () => {
    try {
      updateState({ isCapturingScreenshot: true });
      const screenshot = await screenshotCaptureService.captureScreen();
      updateFormData({ screenshot });
    } catch (error) {
      logger.error("Screenshot capture failed:", error);
    } finally {
      updateState({ isCapturingScreenshot: false });
    }
  }, [updateFormData, updateState]);

  const handlePreviewScreenshot = useCallback(() => {
    if (formData.screenshot?.dataUrl) {
      window.open(formData.screenshot.dataUrl, "_blank");
    }
  }, [formData.screenshot]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      updateState({ submissionError: "Title and description are required" });
      return;
    }

    try {
      updateState({
        currentStep: "uploading",
        uploadProgress: 0,
        submissionError: null,
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        updateState((prev) => ({
          uploadProgress: Math.min(prev.uploadProgress + 10, 90),
        }));
      }, 200);

      // Create GitHub issue using standardized interface
      const response = await intelligentBugReportService.createReport({
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        category: formData.category,
        steps: formData.steps.filter((step) => step.trim()),
        userActions: formData.userActions,
        screenshot: formData.screenshot,
        systemInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
        userInfo: {
          userId: user?.id,
          userRole: user?.role,
          email: user?.email,
        },
      });

      if (!response.success) {
        throw new Error(
          response.error?.userMessage || "Bug report submission failed",
        );
      }

      const issueData = response.data;

      clearInterval(progressInterval);
      updateState({
        uploadProgress: 100,
        currentStep: "success",
        createdIssue: issueData,
      });
    } catch (error) {
      logger.error("Bug report submission failed:", error);
      updateState({
        currentStep: "error",
        submissionError:
          error instanceof Error ? error.message : "Submission failed",
      });
    }
  }, [formData, user, updateState]);

  // Step navigation
  const canProceedToScreenshot =
    formData.title.trim() && formData.description.trim();
  const canSubmit = canProceedToScreenshot;

  const nextStep = useCallback(() => {
    if (state.currentStep === "form" && canProceedToScreenshot) {
      updateState({ currentStep: "screenshot" });
    }
  }, [state.currentStep, canProceedToScreenshot, updateState]);

  const prevStep = useCallback(() => {
    if (state.currentStep === "screenshot") {
      updateState({ currentStep: "form" });
    }
  }, [state.currentStep, updateState]);

  const retry = useCallback(() => {
    updateState({ currentStep: "form", submissionError: null });
  }, [updateState]);

  // Dialog close handler
  const handleClose = useCallback(() => {
    if (state.currentStep === "uploading") return; // Prevent close during upload
    onClose();
    // Reset form after a delay to avoid jarring UI changes
    setTimeout(() => {
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        category: "functionality",
        steps: [""],
        screenshot: null,
        userActions: [],
      });
      setState({
        currentStep: "form",
        uploadProgress: 0,
        submissionError: null,
        createdIssue: null,
        intelligentReport: null,
        reportAnalytics: null,
        isAnalyzing: false,
        analysisStep: "",
        isCapturingScreenshot: false,
      });
    }, 300);
  }, [state.currentStep, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
            <Badge variant="secondary" className="ml-auto">
              {state.currentStep === "form"
                ? "1/2"
                : state.currentStep === "screenshot"
                  ? "2/2"
                  : "Complete"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting issues you encounter
          </DialogDescription>
        </DialogHeader>

        {/* Form Step */}
        {state.currentStep === "form" && (
          <>
            <BugReportForm
              formData={formData}
              onUpdateTitle={(title) => updateFormData({ title })}
              onUpdateDescription={(description) =>
                updateFormData({ description })
              }
              onUpdateSeverity={(severity) => updateFormData({ severity })}
              onUpdateCategory={(category) => updateFormData({ category })}
              onUpdateSteps={(steps) => updateFormData({ steps })}
            />

            {formData.userActions.length > 0 && (
              <UserActivityDisplay userActions={formData.userActions} />
            )}
          </>
        )}

        {/* Screenshot Step */}
        {state.currentStep === "screenshot" && (
          <ScreenshotCapture
            screenshot={formData.screenshot}
            isCapturing={state.isCapturingScreenshot}
            onCapture={handleCaptureScreenshot}
            onPreview={handlePreviewScreenshot}
          />
        )}

        {/* Progress Steps */}
        {(["uploading", "success", "error"] as const).includes(
          state.currentStep,
        ) && (
          <SubmissionProgress
            step={state.currentStep as "uploading" | "success" | "error"}
            progress={state.uploadProgress}
            error={state.submissionError}
            createdIssue={state.createdIssue}
            onRetry={retry}
            onClose={handleClose}
          />
        )}

        {/* Footer */}
        {(["form", "screenshot"] as const).includes(state.currentStep) && (
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {state.currentStep === "screenshot" && (
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {state.currentStep === "form" ? (
                <Button onClick={nextStep} disabled={!canProceedToScreenshot}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canSubmit}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Report
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
