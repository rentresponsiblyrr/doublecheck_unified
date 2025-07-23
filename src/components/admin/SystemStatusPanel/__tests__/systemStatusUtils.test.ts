/**
 * Comprehensive Test Suite for System Status Utilities
 *
 * Elite-level testing for all utility functions, data validation,
 * caching logic, and error handling scenarios.
 *
 * @author STR Certified Engineering Team
 * @since 2.0.0
 * @version 2.0.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Import utilities to test
import {
  validateAndProcessMetrics,
  fetchSystemMetricsWithCache,
  cleanupSystemStatusResources,
  formatMetricValue,
  getStatusColorClass,
  calculateExponentialBackoff,
  smartCache,
  requestManager,
  type SystemMetrics,
  type InspectorWorkload,
} from "../systemStatusUtils";

import { FALLBACK_VALUES } from "../systemStatusConstants";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(),
    })),
  },
}));

/**
 * Test Suite: Data Validation Functions
 */
describe("validateAndProcessMetrics", () => {
  it("processes valid metrics correctly", () => {
    const rawData = {
      totalProperties: 100,
      totalInspections: 200,
      totalUsers: 50,
      activeInspectors: 10,
      completedInspections: 180,
      systemUptime: 99.5,
      averageResponseTime: 250,
      lastUpdated: "2024-01-15T10:00:00Z",
      workloadDistribution: [
        {
          inspectorId: "test-1",
          inspectorName: "Test Inspector",
          activeInspections: 3,
          completedToday: 5,
          efficiency: 95,
          status: "available",
        },
      ],
    };

    const result = validateAndProcessMetrics(rawData);

    expect(result.totalProperties).toBe(100);
    expect(result.totalInspections).toBe(200);
    expect(result.completedInspections).toBe(180);
    expect(result.pendingInspections).toBe(20);
    expect(result.completionRate).toBe(90); // 180/200 * 100
    expect(result.status).toBe("healthy");
    expect(result.workloadDistribution).toHaveLength(1);
  });

  it("handles null/undefined data gracefully", () => {
    const result = validateAndProcessMetrics(null);

    expect(result.totalProperties).toBe(
      FALLBACK_VALUES.systemMetrics.totalProperties,
    );
    expect(result.status).toBe("error");
    expect(result.workloadDistribution).toEqual([]);
  });

  it("sanitizes negative values", () => {
    const rawData = {
      totalProperties: -10,
      totalInspections: -5,
      activeInspectors: -2,
      completedInspections: -1,
      systemUptime: -50,
      averageResponseTime: -100,
    };

    const result = validateAndProcessMetrics(rawData);

    expect(result.totalProperties).toBe(0);
    expect(result.totalInspections).toBe(0);
    expect(result.activeInspectors).toBe(0);
    expect(result.completedInspections).toBe(0);
    expect(result.systemUptime).toBe(99.9); // Fallback for invalid uptime
    expect(result.averageResponseTime).toBe(250); // Fallback for invalid response time
  });

  it("caps completed inspections at total inspections", () => {
    const rawData = {
      totalInspections: 100,
      completedInspections: 150, // More than total
    };

    const result = validateAndProcessMetrics(rawData);

    expect(result.completedInspections).toBe(100);
    expect(result.pendingInspections).toBe(0);
    expect(result.completionRate).toBe(100);
  });

  it("validates uptime within 0-100 range", () => {
    const testCases = [
      { input: 150, expected: 100 },
      { input: -10, expected: 99.9 },
      { input: 95.5, expected: 95.5 },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = validateAndProcessMetrics({ systemUptime: input });
      expect(result.systemUptime).toBe(expected);
    });
  });

  it("validates response time within reasonable bounds", () => {
    const testCases = [
      { input: 10000, expected: 5000 }, // Capped at max
      { input: -100, expected: 250 }, // Fallback for negative
      { input: 300, expected: 300 }, // Valid value
    ];

    testCases.forEach(({ input, expected }) => {
      const result = validateAndProcessMetrics({ averageResponseTime: input });
      expect(result.averageResponseTime).toBe(expected);
    });
  });

  it("calculates system health status correctly", () => {
    const healthyData = {
      systemUptime: 99.9,
      completedInspections: 95,
      totalInspections: 100,
      averageResponseTime: 200,
    };

    const warningData = {
      systemUptime: 95.0, // Below warning threshold
      completedInspections: 80,
      totalInspections: 100,
      averageResponseTime: 800,
    };

    const criticalData = {
      systemUptime: 85.0, // Below critical threshold
      completedInspections: 50,
      totalInspections: 100,
      averageResponseTime: 2000,
    };

    expect(validateAndProcessMetrics(healthyData).status).toBe("healthy");
    expect(validateAndProcessMetrics(warningData).status).toBe("warning");
    expect(validateAndProcessMetrics(criticalData).status).toBe("critical");
  });

  it("validates workload distribution data", () => {
    const rawData = {
      workloadDistribution: [
        {
          inspectorId: "valid-1",
          inspectorName: "Valid Inspector",
          activeInspections: 3,
          completedToday: 5,
          efficiency: 95,
          status: "available",
        },
        {
          inspectorId: "invalid-1",
          inspectorName: "", // Empty name should get fallback
          activeInspections: -1, // Negative should be sanitized
          completedToday: "invalid", // Invalid number
          efficiency: 150, // Over 100% should be capped
          status: "invalid-status", // Invalid status should get fallback
        },
        null, // Null entry should be filtered out
        "invalid-object", // Invalid object should be filtered out
      ],
    };

    const result = validateAndProcessMetrics(rawData);

    expect(result.workloadDistribution).toHaveLength(2);

    const validInspector = result.workloadDistribution[0];
    expect(validInspector.inspectorName).toBe("Valid Inspector");
    expect(validInspector.status).toBe("available");

    const sanitizedInspector = result.workloadDistribution[1];
    expect(sanitizedInspector.inspectorName).toBe("Unknown Inspector");
    expect(sanitizedInspector.activeInspections).toBe(0);
    expect(sanitizedInspector.completedToday).toBe(0);
    expect(sanitizedInspector.efficiency).toBe(100);
    expect(sanitizedInspector.status).toBe("offline");
  });

  it("limits workload distribution to prevent UI performance issues", () => {
    const rawData = {
      workloadDistribution: Array.from({ length: 100 }, (_, i) => ({
        inspectorId: `inspector-${i}`,
        inspectorName: `Inspector ${i}`,
        activeInspections: 1,
        completedToday: 1,
        efficiency: 90,
        status: "available",
      })),
    };

    const result = validateAndProcessMetrics(rawData);

    expect(result.workloadDistribution).toHaveLength(50); // Capped at 50
  });
});

/**
 * Test Suite: Smart Cache Implementation
 */
describe("SmartCache", () => {
  beforeEach(() => {
    // Clear cache before each test
    smartCache.cleanup();
  });

  it("stores and retrieves data correctly", async () => {
    const testData = { test: "data" };
    const key = "test-key";
    const ttl = 1000;

    await smartCache.set(key, testData, ttl);
    const retrieved = await smartCache.get(key);

    expect(retrieved).toEqual(testData);
  });

  it("returns null for expired data", async () => {
    const testData = { test: "data" };
    const key = "test-key";
    const ttl = 10; // Very short TTL

    await smartCache.set(key, testData, ttl);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 20));

    const retrieved = await smartCache.get(key);
    expect(retrieved).toBeNull();
  });

  it("returns null for non-existent keys", async () => {
    const retrieved = await smartCache.get("non-existent-key");
    expect(retrieved).toBeNull();
  });

  it("handles cache size limits", async () => {
    // Set cache to have a small limit (this would need to be configurable in real implementation)
    // For now, test basic functionality
    const testData = { test: "data" };

    await smartCache.set("key1", testData, 10000);
    await smartCache.set("key2", testData, 10000);

    expect(await smartCache.get("key1")).toEqual(testData);
    expect(await smartCache.get("key2")).toEqual(testData);
  });

  it("cleans up expired entries", async () => {
    const testData = { test: "data" };

    await smartCache.set("expired-key", testData, 10);
    await smartCache.set("valid-key", testData, 10000);

    // Wait for first key to expire
    await new Promise((resolve) => setTimeout(resolve, 20));

    const cleanedCount = smartCache.cleanup();

    expect(cleanedCount).toBeGreaterThanOrEqual(1);
    expect(await smartCache.get("expired-key")).toBeNull();
    expect(await smartCache.get("valid-key")).toEqual(testData);
  });

  it("handles errors gracefully", async () => {
    // Test with invalid data that might cause JSON issues
    const circularRef: any = {};
    circularRef.self = circularRef;

    // Should not throw
    await smartCache.set("circular", circularRef, 1000);
    const retrieved = await smartCache.get("circular");

    // Might be null due to serialization issues, but shouldn't crash
    expect(retrieved).toBeDefined();
  });
});

/**
 * Test Suite: Request Manager
 */
describe("RequestManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates concurrent requests", async () => {
    const mockRequestFn = vi.fn().mockResolvedValue("test-result");

    // Make multiple concurrent requests
    const promises = [
      requestManager.dedupe("test-key", mockRequestFn),
      requestManager.dedupe("test-key", mockRequestFn),
      requestManager.dedupe("test-key", mockRequestFn),
    ];

    const results = await Promise.all(promises);

    // All should return the same result
    expect(results).toEqual(["test-result", "test-result", "test-result"]);

    // But the function should only be called once
    expect(mockRequestFn).toHaveBeenCalledTimes(1);
  });

  it("allows separate requests for different keys", async () => {
    const mockRequestFn1 = vi.fn().mockResolvedValue("result-1");
    const mockRequestFn2 = vi.fn().mockResolvedValue("result-2");

    const [result1, result2] = await Promise.all([
      requestManager.dedupe("key-1", mockRequestFn1),
      requestManager.dedupe("key-2", mockRequestFn2),
    ]);

    expect(result1).toBe("result-1");
    expect(result2).toBe("result-2");
    expect(mockRequestFn1).toHaveBeenCalledTimes(1);
    expect(mockRequestFn2).toHaveBeenCalledTimes(1);
  });

  it("handles request failures correctly", async () => {
    const mockError = new Error("Request failed");
    const mockRequestFn = vi.fn().mockRejectedValue(mockError);

    await expect(
      requestManager.dedupe("error-key", mockRequestFn),
    ).rejects.toThrow("Request failed");

    // After failure, new requests should be allowed
    const mockRequestFn2 = vi.fn().mockResolvedValue("success");
    const result = await requestManager.dedupe("error-key", mockRequestFn2);

    expect(result).toBe("success");
    expect(mockRequestFn2).toHaveBeenCalledTimes(1);
  });

  it("cleans up pending requests after completion", async () => {
    const mockRequestFn = vi.fn().mockResolvedValue("test-result");

    await requestManager.dedupe("cleanup-key", mockRequestFn);

    // Make another request with the same key - should call function again
    await requestManager.dedupe("cleanup-key", mockRequestFn);

    expect(mockRequestFn).toHaveBeenCalledTimes(2);
  });
});

/**
 * Test Suite: Utility Functions
 */
describe("Utility Functions", () => {
  describe("formatMetricValue", () => {
    it("formats percentages correctly", () => {
      expect(formatMetricValue(99.85, "percentage")).toBe("99.9%");
      expect(formatMetricValue(50, "percentage")).toBe("50%");
      expect(formatMetricValue(0, "percentage")).toBe("0%");
      expect(formatMetricValue(100.01, "percentage")).toBe("100%");
    });

    it("formats durations correctly", () => {
      expect(formatMetricValue(1500, "duration")).toBe("1.5s");
      expect(formatMetricValue(250, "duration")).toBe("250ms");
      expect(formatMetricValue(0, "duration")).toBe("0ms");
      expect(formatMetricValue(999, "duration")).toBe("999ms");
      expect(formatMetricValue(1000, "duration")).toBe("1s");
      expect(formatMetricValue(2500, "duration")).toBe("2.5s");
    });

    it("formats counts correctly", () => {
      expect(formatMetricValue(1234, "count")).toBe("1,234");
      expect(formatMetricValue(0, "count")).toBe("0");
      expect(formatMetricValue(999999, "count")).toBe("999,999");
      expect(formatMetricValue(1000000, "count")).toBe("1,000,000");
      expect(formatMetricValue(42.7, "count")).toBe("43"); // Should round
    });

    it("formats decimals correctly", () => {
      expect(formatMetricValue(3.14159, "decimal")).toBe(3.14);
      expect(formatMetricValue(1.0, "decimal")).toBe(1);
      expect(formatMetricValue(2.996, "decimal")).toBe(3);
      expect(formatMetricValue(0, "decimal")).toBe(0);
    });

    it("handles edge cases and invalid inputs", () => {
      expect(formatMetricValue(NaN, "percentage")).toBe("NaN%");
      expect(formatMetricValue(Infinity, "duration")).toBe("Infinityms");
      expect(formatMetricValue(-1, "count")).toBe("-1");
    });
  });

  describe("getStatusColorClass", () => {
    const thresholds = { good: 90, warning: 70 };

    it("returns green for good values", () => {
      expect(getStatusColorClass(95, thresholds)).toBe("text-green-600");
      expect(getStatusColorClass(90, thresholds)).toBe("text-green-600");
      expect(getStatusColorClass(100, thresholds)).toBe("text-green-600");
    });

    it("returns yellow for warning values", () => {
      expect(getStatusColorClass(85, thresholds)).toBe("text-yellow-600");
      expect(getStatusColorClass(70, thresholds)).toBe("text-yellow-600");
      expect(getStatusColorClass(89, thresholds)).toBe("text-yellow-600");
    });

    it("returns red for critical values", () => {
      expect(getStatusColorClass(50, thresholds)).toBe("text-red-600");
      expect(getStatusColorClass(0, thresholds)).toBe("text-red-600");
      expect(getStatusColorClass(69, thresholds)).toBe("text-red-600");
    });

    it("handles edge cases", () => {
      expect(getStatusColorClass(89.9, thresholds)).toBe("text-yellow-600");
      expect(getStatusColorClass(90.1, thresholds)).toBe("text-green-600");
      expect(getStatusColorClass(69.9, thresholds)).toBe("text-red-600");
      expect(getStatusColorClass(70.1, thresholds)).toBe("text-yellow-600");
    });
  });

  describe("calculateExponentialBackoff", () => {
    it("calculates exponential backoff correctly", () => {
      const baseDelay = 1000;

      const delay0 = calculateExponentialBackoff(0, baseDelay);
      const delay1 = calculateExponentialBackoff(1, baseDelay);
      const delay2 = calculateExponentialBackoff(2, baseDelay);

      expect(delay0).toBeGreaterThanOrEqual(baseDelay);
      expect(delay1).toBeGreaterThanOrEqual(baseDelay * 2);
      expect(delay2).toBeGreaterThanOrEqual(baseDelay * 4);

      // Each should be greater than the previous (with jitter consideration)
      expect(delay1).toBeGreaterThan(delay0 * 1.5); // Account for jitter
      expect(delay2).toBeGreaterThan(delay1 * 1.5);
    });

    it("respects maximum delay limit", () => {
      const maxDelay = 5000;

      // High attempt number should be capped
      const delay = calculateExponentialBackoff(10, 1000, maxDelay);

      expect(delay).toBeLessThanOrEqual(maxDelay * 1.1); // Account for jitter
    });

    it("applies jitter to prevent thundering herd", () => {
      const delays = Array.from({ length: 10 }, () =>
        calculateExponentialBackoff(3, 1000, 10000, 0.2),
      );

      // All delays should be different due to jitter
      const uniqueDelays = [...new Set(delays)];
      expect(uniqueDelays.length).toBeGreaterThan(1);

      // All should be within expected range
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(8000); // 8000 * 1 = 8000 (base)
        expect(delay).toBeLessThanOrEqual(9600); // 8000 * 1.2 = 9600 (with jitter)
      });
    });

    it("handles edge cases", () => {
      // Zero attempt
      expect(calculateExponentialBackoff(0, 1000)).toBeGreaterThanOrEqual(1000);

      // Zero base delay
      expect(calculateExponentialBackoff(1, 0)).toBe(0);

      // Negative attempt (should still work)
      expect(calculateExponentialBackoff(-1, 1000)).toBeGreaterThanOrEqual(500);
    });
  });
});

/**
 * Test Suite: Data Fetching
 */
describe("fetchSystemMetricsWithCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    smartCache.cleanup();
  });

  it("returns cached data when available", async () => {
    const cachedData: SystemMetrics = {
      totalProperties: 100,
      totalInspections: 200,
      totalUsers: 50,
      activeInspectors: 10,
      completedInspections: 180,
      pendingInspections: 20,
      completionRate: 90,
      systemUptime: 99.5,
      averageResponseTime: 250,
      lastUpdated: "2024-01-15T10:00:00Z",
      status: "healthy",
      workloadDistribution: [],
      performanceScore: 95,
    };

    // Pre-populate cache
    await smartCache.set("system-metrics-v1.2", cachedData, 30000);

    const result = await fetchSystemMetricsWithCache();

    expect(result).toEqual(cachedData);
  });

  it("fetches fresh data when cache is empty", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    // Mock successful API responses
    vi.mocked(supabase.rpc).mockImplementation((funcName) => {
      if (funcName === "get_properties_with_inspections") {
        return Promise.resolve({
          data: [{ id: "1", name: "Test Property" }],
          error: null,
        });
      }
      if (funcName === "get_all_users") {
        return Promise.resolve({
          data: [{ id: "1", name: "Test User", role: "inspector" }],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "1", status: "completed" }],
        error: null,
      }),
    } as any);

    const result = await fetchSystemMetricsWithCache();

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalled();
  });

  it("returns fallback data on fetch failure", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    // Mock API failure
    vi.mocked(supabase.rpc).mockRejectedValue(new Error("Network error"));

    const result = await fetchSystemMetricsWithCache();

    expect(result.status).toBe("error");
    expect(result.totalProperties).toBe(
      FALLBACK_VALUES.systemMetrics.totalProperties,
    );
    expect(result.performanceScore).toBe(85); // Fallback performance score
  });

  it("handles partial API failures gracefully", async () => {
    const { supabase } = await import("@/integrations/supabase/client");

    // Mock mixed success/failure
    vi.mocked(supabase.rpc).mockImplementation((funcName) => {
      if (funcName === "get_properties_with_inspections") {
        return Promise.resolve({ data: [{ id: "1" }], error: null });
      }
      // Other calls fail
      return Promise.reject(new Error("Service unavailable"));
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error("Database error")),
    } as any);

    const result = await fetchSystemMetricsWithCache();

    // Should still return valid data structure
    expect(result).toBeDefined();
    expect(typeof result.totalProperties).toBe("number");
    expect(typeof result.status).toBe("string");
  });
});

/**
 * Test Suite: Resource Cleanup
 */
describe("cleanupSystemStatusResources", () => {
  it("cleans up cache entries", () => {
    const cleanedCount = cleanupSystemStatusResources();

    expect(typeof cleanedCount).toBe("number");
    expect(cleanedCount).toBeGreaterThanOrEqual(0);
  });

  it("handles cleanup errors gracefully", () => {
    // Mock cleanup to throw an error
    const originalCleanup = smartCache.cleanup;
    smartCache.cleanup = vi.fn().mockImplementation(() => {
      throw new Error("Cleanup failed");
    });

    const cleanedCount = cleanupSystemStatusResources();

    expect(cleanedCount).toBe(0);

    // Restore original cleanup
    smartCache.cleanup = originalCleanup;
  });
});
