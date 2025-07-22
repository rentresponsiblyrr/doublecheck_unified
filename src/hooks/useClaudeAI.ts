import { useState, useCallback } from 'react';
import { createClaudeClient, fileToBase64, validateImageFile } from '@/lib/ai/claude-client';

interface ClaudeAnalysisResult {
  confidence: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
  }>;
  recommendations: string[];
  processingTime: number;
  metadata?: Record<string, unknown>;
}

interface ClaudeTextResult {
  text: string;
  metadata?: Record<string, unknown>;
  processingTime: number;
}

interface ClaudeCodeReview {
  overallRating: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'security' | 'performance' | 'accessibility' | 'type-safety' | 'style';
    description: string;
    line?: number;
    suggestion?: string;
  }>;
  summary: string;
  processingTime: number;
}

type ClaudeResult = ClaudeAnalysisResult | ClaudeTextResult | ClaudeCodeReview | null;

interface UseClaudeAIState {
  isLoading: boolean;
  error: string | null;
  result: ClaudeResult;
}

interface UseClaudeAI {
  // State
  isLoading: boolean;
  error: string | null;
  result: ClaudeResult;
  
  // Actions
  analyzePhoto: (file: File, prompt?: string, context?: Record<string, unknown>) => Promise<void>;
  generateText: (prompt: string, systemPrompt?: string) => Promise<void>;
  reviewCode: (code: string, filePath?: string, context?: string) => Promise<void>;
  clearError: () => void;
  clearResult: () => void;
  reset: () => void;
}

export function useClaudeAI(): UseClaudeAI {
  const [state, setState] = useState<UseClaudeAIState>({
    isLoading: false,
    error: null,
    result: null
  });

  const claudeClient = createClaudeClient();

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setResult = useCallback((result: ClaudeResult) => {
    setState(prev => ({ ...prev, result }));
  }, []);

  const analyzePhoto = useCallback(async (
    file: File, 
    prompt = 'Analyze this property inspection photo for compliance and safety issues',
    context?: Record<string, unknown>
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Convert to base64
      const imageBase64 = await fileToBase64(file);

      // Analyze with Claude
      const result = await claudeClient.analyzeInspectionPhoto({
        imageBase64,
        prompt,
        context: {
          propertyType: 'vacation_rental',
          inspectionType: 'safety_compliance',
          ...context
        }
      });

      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo analysis failed');
    } finally {
      setLoading(false);
    }
  }, [claudeClient, setLoading, setError, setResult]);

  const generateText = useCallback(async (
    prompt: string,
    systemPrompt?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await claudeClient.generateText({
        prompt,
        context: systemPrompt ? { systemPrompt } : undefined
      });

      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Text generation failed');
    } finally {
      setLoading(false);
    }
  }, [claudeClient, setLoading, setError, setResult]);

  const reviewCode = useCallback(async (
    code: string,
    filePath?: string,
    context?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await claudeClient.reviewCode({
        prompt: code,
        context: {
          filePath,
          context,
          focusAreas: ['security', 'performance', 'accessibility', 'type-safety']
        }
      });

      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code review failed');
    } finally {
      setLoading(false);
    }
  }, [claudeClient, setLoading, setError, setResult]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, [setResult]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      result: null
    });
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    result: state.result,
    
    // Actions
    analyzePhoto,
    generateText,
    reviewCode,
    clearError,
    clearResult,
    reset
  };
} 