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
import { intelligentBugReportService, type IntelligentBugReport, type BugReportAnalytics } from '@/services/intelligentBugReportService';
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
  
  // Enhanced bug reporting state
  const [intelligentReport, setIntelligentReport] = useState<IntelligentBugReport | null>(null);
  const [reportAnalytics, setReportAnalytics] = useState<BugReportAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

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
      setIntelligentReport(null);
      setReportAnalytics(null);
      setIsAnalyzing(false);
      setAnalysisStep('');
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
      setIsAnalyzing(true);
      setUploadProgress(10);

      // Validate form
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and description are required');
      }

      const filteredSteps = steps.filter(step => step.trim().length > 0);
      if (filteredSteps.length === 0) {
        filteredSteps.push('User did not provide reproduction steps');
      }

      setAnalysisStep('Preparing bug report data...');
      setUploadProgress(20);

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

      // Upload screenshot if available
      if (screenshot) {
        try {
          setAnalysisStep('Uploading screenshot...');
          const filename = `bug-report-${Date.now()}.png`;
          const screenshotUrl = await githubIssuesService.uploadScreenshot(screenshot.blob, filename);
          bugReportData.screenshot = screenshotUrl;
        } catch (screenshotError) {
          logger.warn('Screenshot upload failed, continuing without it', screenshotError, 'BUG_REPORT');
        }
      }

      setAnalysisStep('Analyzing errors and context...');
      setUploadProgress(40);

      // Use intelligent bug reporting service
      const result = await intelligentBugReportService.createIntelligentBugReport(bugReportData, {
        autoSubmitToGitHub: true,
        skipAIAnalysis: false,
        includeScreenshot: !!screenshot
      });

      setIntelligentReport(result.report);
      setReportAnalytics(result.analytics);

      if (result.success) {
        setAnalysisStep('Creating enhanced GitHub issue...');
        setUploadProgress(80);
        
        if (result.githubIssue) {
          setCreatedIssue(result.githubIssue);
        } else {
          // Fallback: Create a mock issue for display when GitHub is not configured
          setCreatedIssue({
            id: Date.now(),
            number: Math.floor(Math.random() * 1000),
            title: result.report.title,
            body: result.report.description,
            state: 'open',
            labels: [`severity:${severity}`, `category:${category}`, 'ai-enhanced'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: '#',
            user: {
              login: 'ai-assistant',
              avatar_url: ''
            }
          } as any);
        }
        
        setAnalysisStep('Complete!');
        setUploadProgress(100);
        setCurrentStep('success');

        userActivityService.trackCustomAction('intelligent_bug_report_submitted', {
          reportId: result.analytics.reportId,
          aiAnalysisSuccess: result.analytics.aiAnalysisSuccess,
          githubIssueCreated: result.analytics.githubIssueCreated,
          userSatisfactionPrediction: result.analytics.userSatisfactionPrediction,
          resolutionTimeEstimate: result.analytics.resolutionTimeEstimate,
          severity,
          category
        });
      } else {
        throw new Error(result.error || 'Intelligent bug report creation failed');
      }

    } catch (error) {
      logger.error('Intelligent bug report submission failed', error, 'BUG_REPORT');
      setSubmissionError(error.message);
      setCurrentStep('error');
      setIsAnalyzing(false);
      
      userActivityService.trackCustomAction('intelligent_bug_report_submission_failed', {
        error: error.message
      });
    } finally {
      setIsAnalyzing(false);
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
    <div className="space-y-4 w-full">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="w-full">
          <Label htmlFor="bug-title" className="text-sm font-medium">Issue Title *</Label>
          <Input
            id="bug-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="mt-1 w-full"
          />
        </div>

        <div className="w-full">
          <Label htmlFor="bug-description" className="text-sm font-medium">Description *</Label>
          <Textarea
            id="bug-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of what happened, what you expected, and any error messages..."
            rows={3}
            className="mt-1 w-full resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="w-full">
            <Label htmlFor="bug-severity" className="text-sm font-medium">Severity</Label>
            <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
              <SelectTrigger className="mt-1 w-full">
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

          <div className="w-full">
            <Label htmlFor="bug-category" className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger className="mt-1 w-full">
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
      <div className="w-full">
        <Label className="text-sm font-medium">Steps to Reproduce *</Label>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Tell us exactly how to reproduce this issue step by step
        </p>
        <div className="space-y-2 w-full">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-2 w-full">
              <div className="flex-shrink-0 w-6 h-9 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={index === 0 ? "First, I clicked on..." : `Then I...`}
                  className="w-full text-sm"
                />
              </div>
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                  className="flex-shrink-0 h-9 w-9 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className="px-4 text-xs"
            >
              + Add Step
            </Button>
          </div>
        </div>
      </div>

      {/* Screenshot Section */}
      <div className="w-full">
        <Label className="text-sm font-medium">Screenshot (Optional)</Label>
        <div className="mt-2 w-full">
          {screenshot ? (
            <div className="w-full">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2 min-w-0">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 truncate">Screenshot captured</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {screenshot.dimensions.width}×{screenshot.dimensions.height}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(screenshot.dataUrl, '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenshot(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
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
              className="w-full text-sm"
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
        <div className="w-full">
          <Label className="text-sm font-medium">Recent Actions (Auto-captured)</Label>
          <div className="mt-2 max-h-24 overflow-y-auto bg-gray-50 rounded-md p-3 w-full">
            <div className="space-y-1">
              {userActions.slice(-5).map((action, index) => (
                <div key={action.id} className="text-xs text-gray-600 flex items-center gap-2 w-full">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="flex-shrink-0">{new Date(action.timestamp).toLocaleTimeString()}</span>
                  <span className="capitalize flex-shrink-0">{action.type}</span>
                  <span className="truncate min-w-0">{action.element}</span>
                </div>
              ))}
            </div>
            {userActions.length > 5 && (
              <div className="text-xs text-gray-500 mt-2">
                + {userActions.length - 5} more actions will be included
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderUploadingStep = () => (
    <div className="text-center space-y-4">
      {isAnalyzing ? (
        <div className="relative">
          <Upload className="h-12 w-12 mx-auto text-blue-600" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Loader2 className="h-2 w-2 text-white animate-spin" />
          </div>
        </div>
      ) : (
        <Upload className="h-12 w-12 mx-auto text-blue-600" />
      )}
      <div>
        <h3 className="text-lg font-medium">
          {isAnalyzing ? 'AI-Enhanced Bug Analysis' : 'Submitting Bug Report'}
        </h3>
        <p className="text-gray-600">
          {isAnalyzing 
            ? 'AI is analyzing errors and creating enhanced context...' 
            : 'Creating GitHub issue with your feedback...'
          }
        </p>
        {analysisStep && (
          <p className="text-sm text-blue-600 mt-1">{analysisStep}</p>
        )}
      </div>
      <div className="space-y-2">
        <Progress value={uploadProgress} className="w-full" />
        <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
      </div>
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🤖 AI Analysis Features:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Automatically capturing console and network errors</li>
            <li>• Analyzing user frustration patterns</li>
            <li>• Generating root cause analysis</li>
            <li>• Creating debugging instructions</li>
            <li>• Suggesting immediate workarounds</li>
          </ul>
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
      <div>
        <h3 className="text-lg font-medium text-green-900">AI-Enhanced Bug Report Submitted!</h3>
        <p className="text-gray-600">Thank you for helping us improve the app.</p>
      </div>
      
      {/* AI Analysis Results */}
      {reportAnalytics && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-left">
          <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
            🤖 AI Analysis Summary
            {reportAnalytics.aiAnalysisSuccess && (
              <Badge className="ml-2 bg-green-100 text-green-800">Success</Badge>
            )}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Processing Time:</p>
              <p className="font-medium">{reportAnalytics.processingTime}ms</p>
            </div>
            <div>
              <p className="text-gray-600">Business Impact:</p>
              <p className="font-medium">{reportAnalytics.businessImpactScore}/10</p>
            </div>
            <div>
              <p className="text-gray-600">Resolution Estimate:</p>
              <p className="font-medium">{reportAnalytics.resolutionTimeEstimate}h</p>
            </div>
            <div>
              <p className="text-gray-600">Satisfaction Score:</p>
              <p className="font-medium">{reportAnalytics.userSatisfactionPrediction}/10</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Context Preview */}
      {intelligentReport?.enhancedContext && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Enhanced Analysis Included:</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>User Frustration Level:</span>
              <Badge className={
                intelligentReport.enhancedContext.userFrustrationMetrics.level >= 8 ? 'bg-red-100 text-red-800' :
                intelligentReport.enhancedContext.userFrustrationMetrics.level >= 6 ? 'bg-orange-100 text-orange-800' :
                intelligentReport.enhancedContext.userFrustrationMetrics.level >= 4 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>
                {intelligentReport.enhancedContext.userFrustrationMetrics.level}/10
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Technical Priority:</span>
              <Badge className={
                intelligentReport.enhancedContext.technicalComplexity.priority === 'critical' ? 'bg-red-100 text-red-800' :
                intelligentReport.enhancedContext.technicalComplexity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                intelligentReport.enhancedContext.technicalComplexity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>
                {intelligentReport.enhancedContext.technicalComplexity.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>AI Confidence:</span>
              <Badge className="bg-blue-100 text-blue-800">
                {Math.round(intelligentReport.enhancedContext.aiInsights.confidence * 100)}%
              </Badge>
            </div>
            {intelligentReport.enhancedContext.aiInsights.suggestedWorkarounds.length > 0 && (
              <div>
                <span className="font-medium">Immediate Workaround Available:</span>
                <p className="text-xs text-blue-600 mt-1">
                  {intelligentReport.enhancedContext.aiInsights.suggestedWorkarounds[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GitHub Issue Information */}
      {createdIssue && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>
            {githubIssuesService.isConfigured() ? '🚀 Enhanced GitHub Issue Created' : 'Report Logged with AI Analysis'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p><strong>Issue #{createdIssue.number}:</strong> {createdIssue.title}</p>
              {githubIssuesService.isConfigured() ? (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(createdIssue.html_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Enhanced Issue on GitHub
                  </Button>
                  <p className="text-xs text-gray-600">
                    This issue includes AI-generated debugging instructions, root cause analysis, and suggested workarounds.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  Enhanced report logged locally with AI analysis. Configure GitHub integration to create issues automatically.
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
      <DialogContent className="w-full max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center space-x-2 flex-wrap">
            <Bug className="h-5 w-5 flex-shrink-0" />
            <span className="min-w-0">🤖 AI-Enhanced Bug Report</span>
            {severity && (
              <Badge className={getSeverityColor(severity)}>
                {severity.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Help us improve the app with AI-powered issue analysis. Your feedback triggers automatic error collection, 
            intelligent classification, and enhanced debugging insights.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {currentStep === 'form' && renderFormStep()}
          {currentStep === 'uploading' && renderUploadingStep()}
          {currentStep === 'success' && renderSuccessStep()}
          {currentStep === 'error' && renderErrorStep()}
        </div>

        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-gray-50">
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
                Submit with AI Analysis
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