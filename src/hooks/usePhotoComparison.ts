// React Hook for Photo Comparison in STR Certified

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { debugLogger } from "@/utils/debugLogger";
import {
  PhotoComparisonEngine,
  createPhotoComparisonEngine,
} from "@/lib/ai/photo-comparison";
import {
  PhotoQualityChecker,
  createPhotoQualityChecker,
} from "@/lib/ai/photo-quality-checker";
import type {
  PhotoComparisonResult,
  PhotoGuidance,
  ComparisonHistory,
  PhotoComparisonConfig,
  QualityCheckConfig,
  BatchComparisonResult,
  PhotoComparisonStats,
} from "@/types/photo";

interface UsePhotoComparisonConfig {
  comparisonConfig?: Partial<PhotoComparisonConfig>;
  qualityConfig?: Partial<QualityCheckConfig>;
  enableHistory?: boolean;
  maxHistoryItems?: number;
  enableBatchComparison?: boolean;
  autoSaveResults?: boolean;
}

interface UsePhotoComparisonReturn {
  // Single comparison
  comparePhotos: (
    inspectorPhoto: File,
    listingPhoto: string,
    roomContext?: string,
  ) => Promise<PhotoComparisonResult>;
  comparisonResult: PhotoComparisonResult | null;
  isComparing: boolean;
  comparisonError: Error | null;

  // Batch comparison
  compareBatch: (
    comparisons: Array<{ inspector: File; listing: string; room: string }>,
  ) => Promise<BatchComparisonResult>;
  batchResult: BatchComparisonResult | null;
  isBatchComparing: boolean;

  // Quality checking
  checkPhotoQuality: (
    photo: File,
    referencePhoto?: string,
  ) => Promise<PhotoGuidance>;
  qualityGuidance: PhotoGuidance | null;
  isCheckingQuality: boolean;

  // Real-time feedback
  startRealTimeFeedback: (videoStream: MediaStream) => void;
  stopRealTimeFeedback: () => void;
  realTimeGuidance: PhotoGuidance | null;

  // History management
  comparisonHistory: ComparisonHistory[];
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  getStatistics: () => PhotoComparisonStats;

  // Utilities
  retryComparison: () => void;
  reset: () => void;
  saveResult: (
    result: PhotoComparisonResult,
    propertyId: string,
    roomId: string,
  ) => void;
}

export const usePhotoComparison = (
  config: UsePhotoComparisonConfig = {},
): UsePhotoComparisonReturn => {
  const {
    comparisonConfig = {},
    qualityConfig = {},
    enableHistory = true,
    maxHistoryItems = 50,
    enableBatchComparison = true,
    autoSaveResults = true,
  } = config;

  // State management
  const [comparisonResult, setComparisonResult] =
    useState<PhotoComparisonResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchComparisonResult | null>(
    null,
  );
  const [qualityGuidance, setQualityGuidance] = useState<PhotoGuidance | null>(
    null,
  );
  const [realTimeGuidance, setRealTimeGuidance] =
    useState<PhotoGuidance | null>(null);
  const [comparisonHistory, setComparisonHistory] = useState<
    ComparisonHistory[]
  >([]);

  // Engine instances
  const comparisonEngineRef = useRef<PhotoComparisonEngine | null>(null);
  const qualityCheckerRef = useRef<PhotoQualityChecker | null>(null);
  const realTimeFeedbackCleanupRef = useRef<(() => void) | null>(null);
  const lastComparisonParamsRef = useRef<{
    inspector: File;
    listing: string;
    room?: string;
  } | null>(null);

  // Initialize engines
  const getComparisonEngine = useCallback(() => {
    if (!comparisonEngineRef.current) {
      comparisonEngineRef.current =
        createPhotoComparisonEngine(comparisonConfig);
    }
    return comparisonEngineRef.current;
  }, [comparisonConfig]);

  const getQualityChecker = useCallback(() => {
    if (!qualityCheckerRef.current) {
      qualityCheckerRef.current = createPhotoQualityChecker(qualityConfig);
    }
    return qualityCheckerRef.current;
  }, [qualityConfig]);

  // Load history from localStorage
  useEffect(() => {
    if (enableHistory) {
      const savedHistory = localStorage.getItem("photoComparisonHistory");
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setComparisonHistory(parsed.slice(0, maxHistoryItems));
        } catch (error) {
          debugLogger.error('usePhotoComparison', 'Failed to parse photo comparison history from localStorage', { error });
        }
      }
    }
  }, [enableHistory, maxHistoryItems]);

  // Save history to localStorage
  useEffect(() => {
    if (enableHistory && comparisonHistory.length > 0) {
      localStorage.setItem(
        "photoComparisonHistory",
        JSON.stringify(comparisonHistory),
      );
    }
  }, [enableHistory, comparisonHistory]);

  // Single photo comparison mutation
  const singleComparisonMutation = useMutation({
    mutationFn: async ({
      inspectorPhoto,
      listingPhoto,
      roomContext,
    }: {
      inspectorPhoto: File;
      listingPhoto: string;
      roomContext?: string;
    }) => {
      const engine = getComparisonEngine();
      lastComparisonParamsRef.current = {
        inspector: inspectorPhoto,
        listing: listingPhoto,
        room: roomContext,
      };

      const result = await engine.compareInspectorPhotoToListing(
        inspectorPhoto,
        listingPhoto,
        roomContext,
      );

      setComparisonResult(result);

      // Auto-save to history if enabled
      if (autoSaveResults && enableHistory) {
        const historyItem: ComparisonHistory = {
          id: `comparison_${Date.now()}`,
          propertyId: "unknown",
          roomId: roomContext || "unknown",
          timestamp: new Date(),
          result,
          inspectorId: "current_user",
          reviewed: false,
        };

        addToHistory(historyItem);
      }

      return result;
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Batch comparison mutation
  const batchComparisonMutation = useMutation({
    mutationFn: async (
      comparisons: Array<{ inspector: File; listing: string; room: string }>,
    ) => {
      const engine = getComparisonEngine();
      const results: PhotoComparisonResult[] = [];

      // Process comparisons in parallel (limited to 3 at a time to avoid overload)
      const batchSize = 3;
      for (let i = 0; i < comparisons.length; i += batchSize) {
        const batch = comparisons.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(({ inspector, listing, room }) =>
            engine.compareInspectorPhotoToListing(inspector, listing, room),
          ),
        );
        results.push(...batchResults);
      }

      const batchResult = await engine.generateComparisonReport(results);
      setBatchResult(batchResult);

      return batchResult;
    },
  });

  // Quality check mutation
  const qualityCheckMutation = useMutation({
    mutationFn: async ({
      photo,
      referencePhoto,
    }: {
      photo: File;
      referencePhoto?: string;
    }) => {
      const checker = getQualityChecker();
      const guidance = await checker.analyzePhotoWithGuidance(
        photo,
        referencePhoto,
      );
      setQualityGuidance(guidance);
      return guidance;
    },
  });

  // Helper functions
  const comparePhotos = useCallback(
    async (
      inspectorPhoto: File,
      listingPhoto: string,
      roomContext?: string,
    ) => {
      return singleComparisonMutation.mutateAsync({
        inspectorPhoto,
        listingPhoto,
        roomContext,
      });
    },
    [singleComparisonMutation],
  );

  const compareBatch = useCallback(
    async (
      comparisons: Array<{ inspector: File; listing: string; room: string }>,
    ) => {
      if (!enableBatchComparison) {
        throw new Error("Batch comparison is not enabled");
      }
      return batchComparisonMutation.mutateAsync(comparisons);
    },
    [batchComparisonMutation, enableBatchComparison],
  );

  const checkPhotoQuality = useCallback(
    async (photo: File, referencePhoto?: string) => {
      return qualityCheckMutation.mutateAsync({ photo, referencePhoto });
    },
    [qualityCheckMutation],
  );

  const startRealTimeFeedback = useCallback(
    (videoStream: MediaStream) => {
      const checker = getQualityChecker();

      // Stop any existing feedback
      if (realTimeFeedbackCleanupRef.current) {
        realTimeFeedbackCleanupRef.current();
      }

      // Start new feedback
      checker
        .provideRealTimeFeedback(videoStream, (guidance) => {
          setRealTimeGuidance(guidance);
        })
        .then((cleanup) => {
          realTimeFeedbackCleanupRef.current = cleanup;
        });
    },
    [getQualityChecker],
  );

  const stopRealTimeFeedback = useCallback(() => {
    if (realTimeFeedbackCleanupRef.current) {
      realTimeFeedbackCleanupRef.current();
      realTimeFeedbackCleanupRef.current = null;
      setRealTimeGuidance(null);
    }
  }, []);

  const addToHistory = useCallback(
    (item: ComparisonHistory) => {
      setComparisonHistory((prev) => {
        const updated = [item, ...prev];
        return updated.slice(0, maxHistoryItems);
      });
    },
    [maxHistoryItems],
  );

  const clearHistory = useCallback(() => {
    setComparisonHistory([]);
    localStorage.removeItem("photoComparisonHistory");
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setComparisonHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getStatistics = useCallback((): PhotoComparisonStats => {
    if (comparisonHistory.length === 0) {
      return {
        totalComparisons: 0,
        averageSimilarity: 0,
        averageQuality: 0,
        commonIssues: [],
        passRate: 0,
        timeRange: { start: new Date(), end: new Date() },
      };
    }

    const stats = comparisonHistory.reduce(
      (acc, item) => {
        acc.totalSimilarity += item.result.similarity_score;
        acc.totalQuality += item.result.quality_score.overall_score;

        if (
          item.result.recommendation === "matches_listing" ||
          item.result.recommendation === "acceptable_differences"
        ) {
          acc.passed++;
        }

        item.result.discrepancies.forEach((d) => {
          if (!acc.issueCount[d.type]) {
            acc.issueCount[d.type] = 0;
          }
          acc.issueCount[d.type]++;
        });

        return acc;
      },
      {
        totalSimilarity: 0,
        totalQuality: 0,
        passed: 0,
        issueCount: {} as Record<string, number>,
      },
    );

    const commonIssues = Object.entries(stats.issueCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sortedHistory = [...comparisonHistory].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    return {
      totalComparisons: comparisonHistory.length,
      averageSimilarity: stats.totalSimilarity / comparisonHistory.length,
      averageQuality: stats.totalQuality / comparisonHistory.length,
      commonIssues,
      passRate: (stats.passed / comparisonHistory.length) * 100,
      timeRange: {
        start: sortedHistory[0].timestamp,
        end: sortedHistory[sortedHistory.length - 1].timestamp,
      },
    };
  }, [comparisonHistory]);

  const retryComparison = useCallback(() => {
    if (lastComparisonParamsRef.current) {
      const { inspector, listing, room } = lastComparisonParamsRef.current;
      comparePhotos(inspector, listing, room);
    }
  }, [comparePhotos]);

  const reset = useCallback(() => {
    setComparisonResult(null);
    setBatchResult(null);
    setQualityGuidance(null);
    setRealTimeGuidance(null);
    stopRealTimeFeedback();
    singleComparisonMutation.reset();
    batchComparisonMutation.reset();
    qualityCheckMutation.reset();
  }, [
    stopRealTimeFeedback,
    singleComparisonMutation,
    batchComparisonMutation,
    qualityCheckMutation,
  ]);

  const saveResult = useCallback(
    (result: PhotoComparisonResult, propertyId: string, roomId: string) => {
      if (!enableHistory) return;

      const historyItem: ComparisonHistory = {
        id: `comparison_${Date.now()}`,
        propertyId,
        roomId,
        timestamp: new Date(),
        result,
        inspectorId: "current_user",
        reviewed: false,
      };

      addToHistory(historyItem);
    },
    [enableHistory, addToHistory],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeFeedback();
    };
  }, [stopRealTimeFeedback]);

  return {
    // Single comparison
    comparePhotos,
    comparisonResult,
    isComparing: singleComparisonMutation.isPending,
    comparisonError: singleComparisonMutation.error,

    // Batch comparison
    compareBatch,
    batchResult,
    isBatchComparing: batchComparisonMutation.isPending,

    // Quality checking
    checkPhotoQuality,
    qualityGuidance,
    isCheckingQuality: qualityCheckMutation.isPending,

    // Real-time feedback
    startRealTimeFeedback,
    stopRealTimeFeedback,
    realTimeGuidance,

    // History management
    comparisonHistory,
    clearHistory,
    removeFromHistory,
    getStatistics,

    // Utilities
    retryComparison,
    reset,
    saveResult,
  };
};

// Specialized hooks for specific use cases

export const usePhotoQualityChecker = (
  config?: Partial<QualityCheckConfig>,
) => {
  const {
    checkPhotoQuality,
    qualityGuidance,
    isCheckingQuality,
    startRealTimeFeedback,
    stopRealTimeFeedback,
    realTimeGuidance,
  } = usePhotoComparison({ qualityConfig: config, enableHistory: false });

  return {
    checkQuality: checkPhotoQuality,
    guidance: qualityGuidance,
    isChecking: isCheckingQuality,
    startRealTime: startRealTimeFeedback,
    stopRealTime: stopRealTimeFeedback,
    realTimeGuidance,
  };
};

export const useComparisonHistory = () => {
  const {
    comparisonHistory,
    clearHistory,
    removeFromHistory,
    getStatistics,
    saveResult,
  } = usePhotoComparison({ enableHistory: true });

  return {
    history: comparisonHistory,
    clearHistory,
    removeFromHistory,
    getStatistics,
    saveResult,
  };
};
