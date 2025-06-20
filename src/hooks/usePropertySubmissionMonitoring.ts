
import { useState } from "react";

interface SubmissionMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  attempts: number;
  errors: any[];
  success: boolean;
}

interface MonitoringState {
  currentSubmission: SubmissionMetrics | null;
  recentSubmissions: SubmissionMetrics[];
}

export const usePropertySubmissionMonitoring = () => {
  const [state, setState] = useState<MonitoringState>({
    currentSubmission: null,
    recentSubmissions: []
  });

  const startSubmissionTracking = () => {
    const submission: SubmissionMetrics = {
      startTime: Date.now(),
      attempts: 1,
      errors: [],
      success: false
    };

    setState(prev => ({
      ...prev,
      currentSubmission: submission
    }));

    console.log('📊 Started submission tracking:', {
      startTime: new Date(submission.startTime).toISOString(),
      submissionId: submission.startTime
    });

    return submission.startTime; // Return as submission ID
  };

  const recordError = (error: any) => {
    setState(prev => {
      if (!prev.currentSubmission) return prev;

      const updatedSubmission = {
        ...prev.currentSubmission,
        errors: [...prev.currentSubmission.errors, {
          timestamp: Date.now(),
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        }]
      };

      console.log('❌ Recorded submission error:', {
        submissionId: updatedSubmission.startTime,
        errorCount: updatedSubmission.errors.length,
        latestError: updatedSubmission.errors[updatedSubmission.errors.length - 1]
      });

      return {
        ...prev,
        currentSubmission: updatedSubmission
      };
    });
  };

  const recordRetry = () => {
    setState(prev => {
      if (!prev.currentSubmission) return prev;

      const updatedSubmission = {
        ...prev.currentSubmission,
        attempts: prev.currentSubmission.attempts + 1
      };

      console.log('🔄 Recorded submission retry:', {
        submissionId: updatedSubmission.startTime,
        attemptNumber: updatedSubmission.attempts
      });

      return {
        ...prev,
        currentSubmission: updatedSubmission
      };
    });
  };

  const completeSubmission = (success: boolean) => {
    setState(prev => {
      if (!prev.currentSubmission) return prev;

      const completedSubmission: SubmissionMetrics = {
        ...prev.currentSubmission,
        endTime: Date.now(),
        duration: Date.now() - prev.currentSubmission.startTime,
        success
      };

      console.log(`${success ? '✅' : '❌'} Completed submission tracking:`, {
        submissionId: completedSubmission.startTime,
        success,
        duration: completedSubmission.duration,
        attempts: completedSubmission.attempts,
        errorCount: completedSubmission.errors.length
      });

      // Keep only the last 10 submissions for memory efficiency
      const recentSubmissions = [
        completedSubmission,
        ...prev.recentSubmissions.slice(0, 9)
      ];

      return {
        currentSubmission: null,
        recentSubmissions
      };
    });
  };

  const getSubmissionStats = () => {
    const { recentSubmissions } = state;
    
    if (recentSubmissions.length === 0) {
      return {
        totalSubmissions: 0,
        successRate: 0,
        averageDuration: 0,
        commonErrors: []
      };
    }

    const successCount = recentSubmissions.filter(s => s.success).length;
    const submissionsWithDuration = recentSubmissions.filter(s => s.duration && typeof s.duration === 'number');
    
    // Calculate total duration
    const totalDuration = submissionsWithDuration.reduce((sum: number, s) => {
      return sum + (s.duration as number);
    }, 0);
    
    const allErrors = recentSubmissions.flatMap(s => s.errors);
    const errorCounts = allErrors.reduce((acc, errorEntry) => {
      const errorKey = errorEntry.error?.message || 'Unknown error';
      acc[errorKey] = (acc[errorKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    // Calculate average duration
    const averageDuration = submissionsWithDuration.length > 0 
      ? totalDuration / submissionsWithDuration.length 
      : 0;

    return {
      totalSubmissions: recentSubmissions.length,
      successRate: (successCount / recentSubmissions.length) * 100,
      averageDuration,
      commonErrors
    };
  };

  return {
    startSubmissionTracking,
    recordError,
    recordRetry,
    completeSubmission,
    getSubmissionStats,
    currentSubmission: state.currentSubmission,
    recentSubmissions: state.recentSubmissions
  };
};
