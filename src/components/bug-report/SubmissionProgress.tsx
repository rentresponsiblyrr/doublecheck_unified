/**
 * Submission Progress Component
 * Handles upload progress, success, and error states for bug report submission
 */

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";
import type { GitHubIssue } from "@/services/githubIssuesService";

export interface SubmissionProgressProps {
  step: "uploading" | "success" | "error";
  progress?: number;
  error?: string | null;
  createdIssue?: GitHubIssue | null;
  onRetry?: () => void;
  onClose?: () => void;
}

export const SubmissionProgress: React.FC<SubmissionProgressProps> = ({
  step,
  progress = 0,
  error,
  createdIssue,
  onRetry,
  onClose,
}) => {
  // Uploading state
  if (step === "uploading") {
    return (
      <div id="bug-report-uploading" className="space-y-4 p-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">Submitting Bug Report</h3>
            <p className="text-sm text-gray-600">
              Creating GitHub issue and uploading details...
            </p>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
        <p className="text-xs text-gray-500">Progress: {progress}% complete</p>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div id="bug-report-success" className="space-y-4 p-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">
            Thank you for submitting your bug report!
          </AlertTitle>
          <AlertDescription className="text-green-700">
            Our team will review your report and get back to you. We appreciate
            your help in making DoubleCheck better for everyone.
          </AlertDescription>
        </Alert>

        {createdIssue && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Issue Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Issue #:</span>
                  <span className="ml-2 text-gray-600">
                    {createdIssue.number}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="ml-2 text-gray-600">
                    {createdIssue.title}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {createdIssue.state}
                  </span>
                </div>
              </div>
            </div>

            {createdIssue.html_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(createdIssue.html_url, "_blank")}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div id="bug-report-error" className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Submission Failed</AlertTitle>
          <AlertDescription>
            {error ||
              "An unexpected error occurred while submitting your bug report. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">What you can do:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your internet connection and try again</li>
            <li>• Save your bug report details and retry later</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onRetry && <Button onClick={onRetry}>Try Again</Button>}
        </div>
      </div>
    );
  }

  return null;
};
