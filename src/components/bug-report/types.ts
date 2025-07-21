/**
 * Bug Report Types - Professional Type Definitions
 * Extracted from monolithic BugReportDialog for better maintainability
 */

import type { UserAction } from '@/services/userActivityService'
import type { ScreenshotResult } from '@/utils/screenshotCapture'
import type { GitHubIssue } from '@/services/githubIssuesService'
import type { IntelligentBugReport, BugReportAnalytics } from '@/services/intelligentBugReportService'

export interface BugReportDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTitle?: string
  initialDescription?: string
}

export type SubmissionStep = 'form' | 'screenshot' | 'uploading' | 'success' | 'error'

export type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical'
export type BugReportCategory = 'ui' | 'functionality' | 'performance' | 'security' | 'other'

export interface BugReportFormData {
  title: string
  description: string
  severity: BugReportSeverity
  category: BugReportCategory
  steps: string[]
  screenshot: ScreenshotResult | null
  userActions: UserAction[]
}

export interface BugReportState {
  currentStep: SubmissionStep
  uploadProgress: number
  submissionError: string | null
  createdIssue: GitHubIssue | null
  intelligentReport: IntelligentBugReport | null
  reportAnalytics: BugReportAnalytics | null
  isAnalyzing: boolean
  analysisStep: string
  isCapturingScreenshot: boolean
}