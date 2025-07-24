/**
 * UTILITY FUNCTIONS TEST SUITE - EXTRACTED FROM GOD TEST FILE
 *
 * Professional test suite for utility functions.
 * Clean separation from massive test file for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import { describe, it, expect } from "vitest";
import {
  formatMetricValue,
  getStatusColorClass,
  calculateExponentialBackoff,
} from "../../systemStatusUtils";

describe("SystemStatusPanel - Utility Functions", () => {
  describe("formatMetricValue", () => {
    it("formats percentages correctly", () => {
      expect(formatMetricValue(99.85, "percentage")).toBe("99.9%");
      expect(formatMetricValue(50, "percentage")).toBe("50%");
      expect(formatMetricValue(0, "percentage")).toBe("0%");
    });

    it("formats durations correctly", () => {
      expect(formatMetricValue(1500, "duration")).toBe("1.5s");
      expect(formatMetricValue(250, "duration")).toBe("250ms");
      expect(formatMetricValue(0, "duration")).toBe("0ms");
    });

    it("formats counts correctly", () => {
      expect(formatMetricValue(1234, "count")).toBe("1,234");
      expect(formatMetricValue(0, "count")).toBe("0");
      expect(formatMetricValue(999999, "count")).toBe("999,999");
    });

    it("formats decimals correctly", () => {
      expect(formatMetricValue(3.14159, "decimal")).toBe(3.14);
      expect(formatMetricValue(1.0, "decimal")).toBe(1);
    });
  });

  describe("getStatusColorClass", () => {
    it("returns correct color classes", () => {
      const thresholds = { good: 90, warning: 70 };

      expect(getStatusColorClass(95, thresholds)).toBe("text-green-600");
      expect(getStatusColorClass(80, thresholds)).toBe("text-yellow-600");
      expect(getStatusColorClass(50, thresholds)).toBe("text-red-600");
    });
  });

  describe("calculateExponentialBackoff", () => {
    it("calculates backoff correctly", () => {
      const result1 = calculateExponentialBackoff(0, 1000);
      const result2 = calculateExponentialBackoff(1, 1000);
      const result3 = calculateExponentialBackoff(3, 1000);

      expect(result1).toBe(1000);
      expect(result2).toBe(2000);
      expect(result3).toBe(8000);
    });

    it("respects maximum backoff limit", () => {
      const result = calculateExponentialBackoff(10, 1000, 30000);
      expect(result).toBeLessThanOrEqual(30000);
    });
  });
});
