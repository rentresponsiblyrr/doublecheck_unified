/**
 * Elite Admin Dashboard Performance Tests
 * Netflix-grade performance validation and benchmarking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { dashboardCache, CacheKeys } from "@/services/adminDashboardCache";
import {
  validateDashboardMetrics,
  transformRawMetrics,
} from "@/utils/adminDataValidation";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}));

// Mock logger to avoid console noise in tests
vi.mock("@/lib/logger/production-logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdminDashboard Performance Tests", () => {
  beforeEach(() => {
    // Clear cache before each test
    dashboardCache.invalidate();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    dashboardCache.invalidate();
  });

  describe("Database Query Performance", () => {
    it("should load dashboard metrics in under 500ms", async () => {
      // Mock successful RPC response
      const mockMetricsData = {
        inspection_counts: {
          draft: 10,
          in_progress: 5,
          completed: 100,
          total: 115,
        },
        time_analytics: { avg_duration_minutes: 45, total_with_times: 80 },
        ai_metrics: { accuracy_rate: 92.3, total_predictions: 500 },
        user_metrics: { active_inspectors: 12, total_users: 25 },
        revenue_metrics: { monthly_revenue: 15000, completed_this_month: 100 },
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockMetricsData,
        error: null,
      });

      const start = performance.now();

      const result = await dashboardCache.get(
        CacheKeys.DASHBOARD_METRICS,
        async () => {
          const { data, error } = await supabase.rpc(
            "get_admin_dashboard_metrics",
          );
          if (error) throw error;
          return data;
        },
      );

      const loadTime = performance.now() - start;

      expect(loadTime).toBeLessThan(500);
      expect(result).toEqual(mockMetricsData);
      expect(supabase.rpc).toHaveBeenCalledWith("get_admin_dashboard_metrics");
    });

    it("should achieve >80% cache hit rate after warmup", async () => {
      const mockData = { test: "data" };
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      // Warmup cache with multiple requests
      const cacheKey = "test_metric";
      const fetcher = async () => {
        const { data } = await supabase.rpc("get_admin_dashboard_metrics");
        return data;
      };

      // First request - cache miss
      await dashboardCache.get(cacheKey, fetcher);

      // Multiple subsequent requests - should be cache hits
      const promises = Array.from({ length: 10 }, () =>
        dashboardCache.get(cacheKey, fetcher),
      );

      await Promise.all(promises);

      const metrics = dashboardCache.getMetrics();
      expect(metrics.hitRate).toBeGreaterThan(80);
      expect(metrics.hits).toBeGreaterThanOrEqual(9); // 9 out of 10 should be hits
    });

    it("should handle concurrent requests efficiently", async () => {
      const mockData = { concurrent: "test" };
      vi.mocked(supabase.rpc).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: mockData, error: null }), 100),
          ),
      );

      const start = performance.now();

      // 50 concurrent requests for the same data
      const promises = Array.from({ length: 50 }, (_, i) =>
        dashboardCache.get(`concurrent_test_${i % 5}`, async () => {
          const { data } = await supabase.rpc("get_admin_dashboard_metrics");
          return data;
        }),
      );

      const results = await Promise.all(promises);
      const totalTime = performance.now() - start;

      // Should complete in reasonable time despite 50 requests
      expect(totalTime).toBeLessThan(1000);
      expect(results).toHaveLength(50);
      expect(results.every((result) => result === mockData)).toBe(true);

      // Should only make 5 actual database calls (one per unique key)
      expect(supabase.rpc).toHaveBeenCalledTimes(5);
    });
  });

  describe("Data Validation Performance", () => {
    it("should validate dashboard metrics in under 10ms", () => {
      const mockData = {
        inspection_counts: {
          draft: 10,
          in_progress: 5,
          completed: 100,
          total: 115,
        },
        time_analytics: { avg_duration_minutes: 45, total_with_times: 80 },
        ai_metrics: { accuracy_rate: 92.3, total_predictions: 500 },
        user_metrics: { active_inspectors: 12, total_users: 25 },
        revenue_metrics: { monthly_revenue: 15000, completed_this_month: 100 },
      };

      const start = performance.now();
      const validatedData = validateDashboardMetrics(mockData);
      const validationTime = performance.now() - start;

      expect(validationTime).toBeLessThan(10);
      expect(validatedData).toEqual(mockData);
    });

    it("should handle large datasets efficiently", () => {
      // Create a large dataset to test validation performance
      const largeDataset = {
        inspection_counts: {
          draft: 1000,
          in_progress: 500,
          completed: 10000,
          total: 11500,
        },
        time_analytics: { avg_duration_minutes: 45, total_with_times: 8000 },
        ai_metrics: { accuracy_rate: 92.3, total_predictions: 50000 },
        user_metrics: { active_inspectors: 120, total_users: 250 },
        revenue_metrics: {
          monthly_revenue: 1500000,
          completed_this_month: 10000,
        },
      };

      const start = performance.now();
      const transformedData = transformRawMetrics(largeDataset);
      const validatedData = validateDashboardMetrics(transformedData);
      const processingTime = performance.now() - start;

      expect(processingTime).toBeLessThan(50);
      expect(validatedData.inspection_counts.total).toBe(11500);
      expect(validatedData.revenue_metrics.monthly_revenue).toBe(1500000);
    });
  });

  describe("Cache Performance", () => {
    it("should maintain cache performance under load", async () => {
      const entries = 100;
      const mockDataGenerator = (i: number) => ({
        index: i,
        data: `test_${i}`,
      });

      // Fill cache with many entries
      const fillPromises = Array.from({ length: entries }, (_, i) =>
        dashboardCache.set(`test_key_${i}`, mockDataGenerator(i)),
      );

      await Promise.all(fillPromises);

      // Measure access time for cached entries
      const start = performance.now();

      const accessPromises = Array.from({ length: entries }, (_, i) =>
        dashboardCache.get(`test_key_${i}`, () =>
          Promise.resolve(mockDataGenerator(i)),
        ),
      );

      const results = await Promise.all(accessPromises);
      const accessTime = performance.now() - start;

      // Should access 100 cached entries quickly
      expect(accessTime).toBeLessThan(100);
      expect(results).toHaveLength(entries);

      const metrics = dashboardCache.getMetrics();
      expect(metrics.hitRate).toBe(100); // All should be cache hits
    });

    it("should handle cache eviction gracefully", () => {
      // Fill cache beyond capacity to trigger eviction
      const maxEntries = 150; // Above the cache limit of 100

      for (let i = 0; i < maxEntries; i++) {
        dashboardCache.set(`eviction_test_${i}`, { value: i });
      }

      const metrics = dashboardCache.getMetrics();

      // Cache should have evicted some entries
      expect(metrics.cacheSize).toBeLessThanOrEqual(100);
      expect(metrics.evictions).toBeGreaterThan(0);
    });
  });

  describe("Error Recovery Performance", () => {
    it("should recover from database errors quickly", async () => {
      // Mock database error
      vi.mocked(supabase.rpc).mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      const start = performance.now();

      try {
        await dashboardCache.get("error_test", async () => {
          const { data, error } = await supabase.rpc(
            "get_admin_dashboard_metrics",
          );
          if (error) throw error;
          return data;
        });
      } catch (error) {
        const errorTime = performance.now() - start;

        // Should fail quickly, not hang
        expect(errorTime).toBeLessThan(100);
        expect(error.message).toContain("Database connection failed");
      }
    });

    it("should provide fallback data when available", async () => {
      const fallbackData = { fallback: true };

      // Set initial data in cache
      dashboardCache.set("fallback_test", fallbackData, 1000); // 1 second TTL

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Mock database error
      vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error("Network error"));

      const start = performance.now();

      const result = await dashboardCache.get("fallback_test", async () => {
        const { data, error } = await supabase.rpc(
          "get_admin_dashboard_metrics",
        );
        if (error) throw error;
        return data;
      });

      const fallbackTime = performance.now() - start;

      // Should return stale data quickly
      expect(fallbackTime).toBeLessThan(50);
      expect(result).toEqual(fallbackData);
    });
  });

  describe("Memory Usage", () => {
    it("should not leak memory with repeated operations", () => {
      const initialMetrics = dashboardCache.getMetrics();

      // Perform many cache operations
      for (let i = 0; i < 1000; i++) {
        dashboardCache.set(`memory_test_${i % 10}`, { iteration: i });
      }

      const afterMetrics = dashboardCache.getMetrics();

      // Cache size should stabilize, not grow indefinitely
      expect(afterMetrics.cacheSize).toBeLessThanOrEqual(10);
      expect(afterMetrics.evictions).toBeGreaterThan(0);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle dashboard load simulation", async () => {
      // Simulate multiple users loading dashboard simultaneously
      const userCount = 10;
      const metricsPerUser = 5;

      const mockData = {
        inspection_counts: {
          draft: 50,
          in_progress: 25,
          completed: 500,
          total: 575,
        },
        time_analytics: { avg_duration_minutes: 42, total_with_times: 400 },
        ai_metrics: { accuracy_rate: 94.1, total_predictions: 2500 },
        user_metrics: { active_inspectors: 25, total_users: 50 },
        revenue_metrics: { monthly_revenue: 75000, completed_this_month: 500 },
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const start = performance.now();

      // Simulate multiple users each requesting multiple metrics
      const userPromises = Array.from(
        { length: userCount },
        async (_, userId) => {
          const metricPromises = Array.from(
            { length: metricsPerUser },
            (_, metricId) =>
              dashboardCache.get(
                `user_${userId}_metric_${metricId}`,
                async () => {
                  const { data } = await supabase.rpc(
                    "get_admin_dashboard_metrics",
                  );
                  return data;
                },
              ),
          );
          return Promise.all(metricPromises);
        },
      );

      const results = await Promise.all(userPromises);
      const totalTime = performance.now() - start;

      // Should handle load efficiently
      expect(totalTime).toBeLessThan(2000);
      expect(results).toHaveLength(userCount);
      expect(
        results.every((userResults) => userResults.length === metricsPerUser),
      ).toBe(true);

      // Should achieve good cache efficiency
      const metrics = dashboardCache.getMetrics();
      expect(metrics.totalQueries).toBe(userCount * metricsPerUser);
    });
  });
});

// Benchmark helper for manual testing
export const runPerformanceBenchmark = async () => {
  console.log("🚀 Running Elite Dashboard Performance Benchmark...");

  const results: Record<string, number> = {};

  // Test cache performance
  const cacheStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    dashboardCache.set(`bench_${i}`, { value: i });
  }
  results.cacheWrites = performance.now() - cacheStart;

  // Test cache reads
  const readStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    await dashboardCache.get(`bench_${i}`, () => Promise.resolve({ value: i }));
  }
  results.cacheReads = performance.now() - readStart;

  // Test validation performance
  const validationStart = performance.now();
  for (let i = 0; i < 100; i++) {
    validateDashboardMetrics({
      inspection_counts: {
        draft: i,
        in_progress: i,
        completed: i * 10,
        total: i * 12,
      },
      time_analytics: { avg_duration_minutes: 45, total_with_times: i * 5 },
      ai_metrics: { accuracy_rate: 90 + (i % 10), total_predictions: i * 50 },
      user_metrics: { active_inspectors: i, total_users: i * 2 },
      revenue_metrics: {
        monthly_revenue: i * 1000,
        completed_this_month: i * 10,
      },
    });
  }
  results.validation = performance.now() - validationStart;

  console.log("📊 Benchmark Results:", results);
  console.log("✅ Cache Metrics:", dashboardCache.getMetrics());

  return results;
};
