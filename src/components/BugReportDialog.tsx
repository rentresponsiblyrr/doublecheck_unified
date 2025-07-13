/**
 * @fileoverview Bug Report Dialog Component
 * Provides interface for users to submit bug reports with screenshots and context
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Send,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Clock,
  User,
  FileText,
  Loader2,
  Upload,
  ExternalLink,
  Bug
} from 'lucide-react';
import { userActivityService, type BugReportData, type UserAction } from '@/services/userActivityService';
import { screenshotCaptureService, type ScreenshotResult } from '@/utils/screenshotCapture';
import { githubIssuesService, type GitHubIssue } from '@/services/githubIssuesService';
import { useAuthState } from '@/hooks/useAuthState';
import { logger } from '@/utils/logger';

interface BugReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialDescription?: string;
}

type SubmissionStep = 'form' | 'screenshot' | 'uploading' | 'success' | 'error';

export const BugReportDialog: React.FC<BugReportDialogProps> = ({
  isOpen,
  onClose,
  initialTitle = '',
  initialDescription = ''
}) => {
  const { user } = useAuthState();
  
  // Form state
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<'ui' | 'functionality' | 'performance' | 'security' | 'other'>('functionality');
  const [steps, setSteps] = useState<string[]>(['']);
  
  // Screenshot state
  const [screenshot, setScreenshot] = useState<ScreenshotResult | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  
  // Submission state
  const [currentStep, setCurrentStep] = useState<SubmissionStep>('form');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<GitHubIssue | null>(null);
  
  // User actions state
  const [userActions, setUserActions] = useState<UserAction[]>([]);

  // Load user actions when dialog opens
  useEffect(() => {
    if (isOpen) {
      const recentActions = userActivityService.getRecentActions(20);
      setUserActions(recentActions);
      userActivityService.trackCustomAction('bug_report_dialog_opened', { 
        timestamp: new Date().toISOString() 
      });
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setSeverity('medium');
      setCategory('functionality');
      setSteps(['']);
      setScreenshot(null);
      setCurrentStep('form');
      setUploadProgress(0);
      setSubmissionError(null);
      setCreatedIssue(null);
    }
  }, [isOpen, initialTitle, initialDescription]);

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const captureScreenshot = useCallback(async () => {
    try {
      setIsCapturingScreenshot(true);
      userActivityService.trackCustomAction('screenshot_capture_initiated', {});
      
      const result = await screenshotCaptureService.captureScreenshot({
        quality: 0.8,
        format: 'png',
        maxWidth: 1920,
        maxHeight: 1080,
        includeCurrentElement: true
      });

      // Compress if too large
      const compressedResult = await screenshotCaptureService.compressScreenshot(result, 500);
      setScreenshot(compressedResult);
      
      userActivityService.trackCustomAction('screenshot_captured', {
        dimensions: compressedResult.dimensions,
        size: compressedResult.blob.size
      });

    } catch (error) {
      logger.error('Screenshot capture failed', error, 'BUG_REPORT');
      setSubmissionError(`Screenshot capture failed: ${error.message}`);
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, []);

  const submitBugReport = useCallback(async () => {
    try {
      setCurrentStep('uploading');
      setUploadProgress(10);

      // Validate form
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and description are required');
      }

      const filteredSteps = steps.filter(step => step.trim().length > 0);
      if (filteredSteps.length === 0) {
        filteredSteps.push('User did not provide reproduction steps');
      }

      setUploadProgress(30);

      // Prepare bug report data
      const bugReportData: BugReportData = {
        title: title.trim(),
        description: description.trim(),
        severity,
        category,
        steps: filteredSteps,
        userActions,
        systemInfo: userActivityService.getSystemInfo(),
        userInfo: {
          userId: user?.id,
          userRole: user?.user_metadata?.role || 'user',
          email: user?.email
        }
      };

      setUploadProgress(50);

      // Check if GitHub is configured
      if (githubIssuesService.isConfigured()) {
        // Upload screenshot if available
        if (screenshot) {
          try {
            const filename = `bug-report-${Date.now()}.png`;
            const screenshotUrl = await githubIssuesService.uploadScreenshot(screenshot.blob, filename);
            bugReportData.screenshot = screenshotUrl;
          } catch (screenshotError) {
            logger.warn('Screenshot upload failed, continuing without it', screenshotError, 'BUG_REPORT');
          }
        }

        setUploadProgress(80);

        // Create GitHub issue
        const issue = await githubIssuesService.createBugReportIssue(bugReportData);
        
        setUploadProgress(100);
        setCreatedIssue(issue);
        setCurrentStep('success');

        userActivityService.trackCustomAction('bug_report_submitted', {
          issueNumber: issue.number,
          title: issue.title,
          severity,
          category
        });
      } else {
        // Fallback: Log to console and show success (for development/testing)
        setUploadProgress(80);
        
        console.log('🐛 Bug Report Submitted (GitHub not configured):', {
          ...bugReportData,
          screenshot: screenshot ? 'Screenshot captured' : 'No screenshot'
        });
        
        // Create a mock issue for display
        setCreatedIssue({
          id: Date.now(),
          number: Math.floor(Math.random() * 1000),
          title: bugReportData.title,
          body: bugReportData.description,
          state: 'open',
          labels: [`severity:${severity}`, `category:${category}`],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          html_url: '#',
          user: {
            login: 'user',
            avatar_url: ''
          }
        } as any);
        
        setUploadProgress(100);
        setCurrentStep('success');

        userActivityService.trackCustomAction('bug_report_submitted_offline', {
          title: bugReportData.title,
          severity,
          category
        });
      }

    } catch (error) {
      logger.error('Bug report submission failed', error, 'BUG_REPORT');
      setSubmissionError(error.message);
      setCurrentStep('error');
      
      userActivityService.trackCustomAction('bug_report_submission_failed', {
        error: error.message
      });
    }
  }, [title, description, severity, category, steps, screenshot, userActions, user]);

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderFormStep = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="bug-title">Issue Title *</Label>
          <Input
            id="bug-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bug-description">Description *</Label>
          <Textarea
            id="bug-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of what happened, what you expected, and any error messages..."
            rows={4}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bug-severity">Severity</Label>
            <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor issue</SelectItem>
                <SelectItem value="medium">Medium - Notable issue</SelectItem>
                <SelectItem value="high">High - Major issue</SelectItem>
                <SelectItem value="critical">Critical - Blocks work</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bug-category">Category</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ui">UI/Visual</SelectItem>
                <SelectItem value="functionality">Functionality</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Steps to Reproduce */}
      <div>
        <Label>Steps to Reproduce *</Label>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Tell us exactly how to reproduce this issue step by step
        </p>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-9 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <Input
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={index === 0 ? "First, I clicked on..." : `Then I...`}
                  className="w-full"
                />
              </div>
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className="px-6"
            >
              + Add Another Step
            </Button>
          </div>
        </div>
      </div>

      {/* Screenshot Section */}
      <div>
        <Label>Screenshot (Optional)</Label>
        <div className="mt-2">
          {screenshot ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Screenshot captured</span>
                  <Badge variant="outline" className="text-xs">
                    {screenshot.dimensions.width}x{screenshot.dimensions.height}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(screenshot.dataUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenshot(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={captureScreenshot}
              disabled={isCapturingScreenshot}
              className="w-full"
            >
              {isCapturingScreenshot ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {isCapturingScreenshot ? 'Capturing...' : 'Capture Screenshot'}
            </Button>
          )}
        </div>
      </div>

      {/* User Actions Preview */}
      {userActions.length > 0 && (
        <div>
          <Label>Recent Actions (Auto-captured)</Label>
          <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded-md p-3">
            <div className="space-y-1">
              {userActions.slice(-5).map((action, index) => (
                <div key={action.id} className="text-xs text-gray-600 flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(action.timestamp).toLocaleTimeString()}</span>
                  <span className="capitalize">{action.type}</span>
                  <span className="truncate">{action.element}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              + {Math.max(0, userActions.length - 5)} more actions will be included
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUploadingStep = () => (
    <div className="text-center space-y-4">
      <Upload className="h-12 w-12 mx-auto text-blue-600" />
      <div>
        <h3 className="text-lg font-medium">Submitting Bug Report</h3>
        <p className="text-gray-600">Creating GitHub issue with your feedback...</p>
      </div>
      <div className="space-y-2">
        <Progress value={uploadProgress} className="w-full" />
        <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
      <div>
        <h3 className="text-lg font-medium text-green-900">Bug Report Submitted!</h3>
        <p className="text-gray-600">Thank you for helping us improve the app.</p>
      </div>
      {createdIssue && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>
            {githubIssuesService.isConfigured() ? 'GitHub Issue Created' : 'Report Logged'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p><strong>Issue #{createdIssue.number}:</strong> {createdIssue.title}</p>
              {githubIssuesService.isConfigured() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(createdIssue.html_url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on GitHub
                </Button>
              ) : (
                <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  Report logged locally. Configure GitHub integration to create issues automatically.
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-4">
      <AlertTriangle className="h-12 w-12 mx-auto text-red-600" />
      <div>
        <h3 className="text-lg font-medium text-red-900">Submission Failed</h3>
        <p className="text-gray-600">We couldn't submit your bug report, but your data is saved.</p>
      </div>
      {submissionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription>
            {submissionError}
            {!githubIssuesService.isConfigured() && (
              <div className="mt-2 text-sm">
                <strong>Note:</strong> GitHub integration is not configured. Contact your administrator to set up automated issue creation.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Your Report Details:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Title:</strong> {title}</p>
          <p><strong>Description:</strong> {description.substring(0, 100)}...</p>
          <p><strong>Severity:</strong> {severity}</p>
          {screenshot && <p><strong>Screenshot:</strong> Captured</p>}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5" />
            <span>Report a Bug</span>
            {severity && (
              <Badge className={getSeverityColor(severity)}>
                {severity.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Help us improve the app by reporting issues. Your feedback is valuable!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {currentStep === 'form' && renderFormStep()}
          {currentStep === 'uploading' && renderUploadingStep()}
          {currentStep === 'success' && renderSuccessStep()}
          {currentStep === 'error' && renderErrorStep()}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          {currentStep === 'form' && (
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={submitBugReport}
                disabled={!title.trim() || !description.trim()}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Report
              </Button>
            </div>
          )}
          {currentStep === 'uploading' && (
            <div className="w-full text-center">
              <p className="text-sm text-gray-600">Please wait while we submit your report...</p>
            </div>
          )}
          {currentStep === 'success' && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
          {currentStep === 'error' && (
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setCurrentStep('form')} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportDialog;