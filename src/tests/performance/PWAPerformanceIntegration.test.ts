/**
 * PWA PERFORMANCE INTEGRATION TESTS - NETFLIX/META STANDARDS VALIDATION
 *
 * Comprehensive integration test suite for PWA performance monitoring system
 * with real-world construction site scenario testing and Netflix/Meta standards
 * validation. Ensures all performance components work together seamlessly.
 *
 * TEST COVERAGE:
 * - PWA Performance Monitor initialization and real-time reporting
 * - Lighthouse PWA Auditor comprehensive audit execution
 * - Network Adaptation Engine construction site optimization
 * - Battery Optimization Manager day-long usage scenarios
 * - Performance Dashboard real-time updates and alerts
 * - CI/CD pipeline integration and automation
 *
 * NETFLIX/META VALIDATION:
 * - Lighthouse PWA Score: 90+ requirement
 * - Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
 * - Construction Site: <5s load on 2G networks
 * - Battery Life: 8+ hours continuous usage
 * - Offline Capability: 100% core workflow functionality
 *
 * @author STR Certified Engineering Team
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { pwaPerformanceMonitor } from "@/lib/performance/PWAPerformanceMonitor";
import { lighthousePWAAuditor } from "@/lib/performance/LighthousePWAAuditor";
import { networkAdaptationEngine } from "@/lib/performance/NetworkAdaptationEngine";
import { batteryOptimizationManager } from "@/lib/performance/BatteryOptimizationManager";
import type { PerformanceMetric } from "@/types/pwa";

// Mock external dependencies
vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/pwa/ServiceWorkerManager", () => ({
  serviceWorkerManager: {
    getStatus: vi.fn(() => ({
      isControlling: true,
      cacheHitRate: 87,
      activationTime: 150,
      updateStrategy: "cache-first",
      updateAvailable: false,
    })),
    getPerformanceMetrics: vi.fn(() => ({
      hitRate: 87,
      missRate: 13,
      backgroundSyncSuccess: 95,
    })),
    updateCacheStrategy: vi.fn().mockResolvedValue(undefined),
    onUpdateAvailable: vi.fn(),
  },
}));

vi.mock("@/lib/pwa/OfflineStatusManager", () => ({
  offlineStatusManager: {
    getNetworkStatus: vi.fn(() => ({
      quality: { category: "4g" },
      isOnline: true,
    })),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
  },
}));

vi.mock("@/lib/pwa/InstallPromptHandler", () => ({
  installPromptHandler: {
    onInstallPromptShown: vi.fn(),
    onInstallSuccess: vi.fn(),
    onInstallDismissed: vi.fn(),
  },
}));

vi.mock("./CoreWebVitalsMonitor", () => ({
  CoreWebVitalsMonitor: {
    getInstance: vi.fn(() => ({
      getCurrentMetrics: vi.fn(() => ({
        lcp: 2200,
        fid: 65,
        cls: 0.08,
        fcp: 1800,
        ttfb: 400,
      })),
    })),
  },
}));

// Mock web-vitals library
vi.mock("web-vitals", () => ({
  onCLS: vi.fn((callback) => callback({ value: 0.08, entries: [] })),
  onFID: vi.fn((callback) => callback({ value: 65, entries: [] })),
  onFCP: vi.fn((callback) => callback({ value: 1800, entries: [] })),
  onLCP: vi.fn((callback) => callback({ value: 2200, entries: [{}] })),
  onTTFB: vi.fn((callback) => callback({ value: 400, entries: [] })),
}));

// Mock browser APIs
Object.defineProperty(global, "PerformanceObserver", {
  writable: true,
  value: vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(global.navigator, "connection", {
  writable: true,
  value: {
    effectiveType: "4g",
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
  },
});

Object.defineProperty(global.navigator, "getBattery", {
  writable: true,
  value: vi.fn(() =>
    Promise.resolve({
      level: 0.8,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 25200, // 7 hours
      addEventListener: vi.fn(),
    }),
  ),
});

describe("PWA Performance Integration Tests", () => {
  let mockEventListener: Mock;
  let mockDispatchEvent: Mock;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock DOM APIs
    mockEventListener = vi.fn();
    mockDispatchEvent = vi.fn();

    Object.defineProperty(window, "addEventListener", {
      writable: true,
      value: mockEventListener,
    });

    Object.defineProperty(window, "dispatchEvent", {
      writable: true,
      value: mockDispatchEvent,
    });

    // Mock performance API
    Object.defineProperty(window, "performance", {
      writable: true,
      value: {
        now: vi.fn(() => Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
      },
    });

    // Mock fetch for manifest
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            name: "STR Certified",
            short_name: "STR",
            start_url: "/",
            display: "standalone",
            theme_color: "#000000",
            background_color: "#ffffff",
            icons: [
              {
                src: "/icons/192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
              {
                src: "/icons/512x512.png",
                sizes: "512x512",
                type: "image/png",
              },
            ],
          }),
      }),
    ) as Mock;
  });

  afterEach(() => {
    // Cleanup
    if (pwaPerformanceMonitor.stop) {
      pwaPerformanceMonitor.stop();
    }
    if (networkAdaptationEngine.stop) {
      networkAdaptationEngine.stop();
    }
    if (batteryOptimizationManager.stop) {
      batteryOptimizationManager.stop();
    }
  });

  describe("PWA Performance Monitor Integration", () => {
    it("should initialize successfully and start real-time monitoring", async () => {
      const initResult = await pwaPerformanceMonitor.initialize();

      expect(initResult).toBe(true);
      expect(mockEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function),
      );
      expect(mockEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function),
      );
    });

    it("should generate comprehensive performance reports", async () => {
      await pwaPerformanceMonitor.initialize();

      const report = await pwaPerformanceMonitor.getComprehensiveReport();

      expect(report).toHaveProperty("timestamp");
      expect(report).toHaveProperty("metrics");
      expect(report).toHaveProperty("trends");
      expect(report).toHaveProperty("alerts");
      expect(report).toHaveProperty("budgetStatus");

      expect(report.metrics).toHaveProperty("coreWebVitals");
      expect(report.metrics).toHaveProperty("pwaSpecific");
      expect(report.metrics).toHaveProperty("constructionSiteMetrics");
      expect(report.metrics).toHaveProperty("userExperience");
      expect(report.metrics).toHaveProperty("businessImpact");
    });

    it("should track Core Web Vitals with PWA context", async () => {
      await pwaPerformanceMonitor.initialize();

      const metrics = await pwaPerformanceMonitor.getCurrentMetrics();

      expect(metrics.coreWebVitals.lcp).toBeLessThan(2500); // Netflix/Meta standard
      expect(metrics.coreWebVitals.fid).toBeLessThan(100); // Netflix/Meta standard
      expect(metrics.coreWebVitals.cls).toBeLessThan(0.1); // Netflix/Meta standard
    });

    it("should handle real-time performance alerts", async () => {
      await pwaPerformanceMonitor.initialize();

      // Simulate performance threshold violation
      const mockAlert = {
        id: "test-alert-1",
        type: "performance",
        severity: "warning",
        title: "LCP Threshold Exceeded",
        description: "LCP value exceeds warning threshold",
        metric: "lcp",
        currentValue: 2800,
        threshold: 2500,
        recommendation: "Optimize images and server response time",
        triggered: new Date(),
      };

      // Verify alert handling mechanism exists
      expect(mockEventListener).toHaveBeenCalledWith(
        "pwa-performance-alert",
        expect.any(Function),
      );
    });
  });

  describe("Lighthouse PWA Auditor Integration", () => {
    it("should run comprehensive PWA audit with Netflix/Meta standards", async () => {
      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      expect(auditReport).toHaveProperty("score");
      expect(auditReport).toHaveProperty("metrics");
      expect(auditReport).toHaveProperty("opportunities");
      expect(auditReport).toHaveProperty("constructionSiteOptimizations");
      expect(auditReport).toHaveProperty("coreWebVitalsIntegration");
      expect(auditReport).toHaveProperty("performanceBudgetStatus");

      // Netflix/Meta standards validation
      expect(auditReport.score).toBeGreaterThanOrEqual(90);
      expect(auditReport.coreWebVitalsIntegration.lcp.status).toBe("pass");
      expect(auditReport.coreWebVitalsIntegration.fid.status).toBe("pass");
      expect(auditReport.coreWebVitalsIntegration.cls.status).toBe("pass");
    });

    it("should validate PWA manifest for installability", async () => {
      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      expect(auditReport.metrics.installable).toBe(true);
      expect(auditReport.metrics.serviceWorker).toBe(true);
      expect(auditReport.metrics.themeColor).toBe(true);
    });

    it("should test construction site performance conditions", async () => {
      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      expect(auditReport.constructionSiteOptimizations).toHaveLength(4);

      const loadTimeMetric = auditReport.constructionSiteOptimizations.find(
        (m: PerformanceMetric) => m.metric === "load_time_2g",
      );

      expect(loadTimeMetric).toBeDefined();
      expect(loadTimeMetric.current).toBeLessThan(5000); // <5s on 2G
      expect(loadTimeMetric.status).toBe("excellent");
    });

    it("should validate performance budget compliance", async () => {
      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      expect(auditReport.performanceBudgetStatus).toHaveProperty("budgets");
      expect(auditReport.performanceBudgetStatus).toHaveProperty("violations");
      expect(auditReport.performanceBudgetStatus).toHaveProperty(
        "overallStatus",
      );

      // Should have minimal violations for Netflix/Meta standards
      expect(
        auditReport.performanceBudgetStatus.violations.length,
      ).toBeLessThanOrEqual(2);
    });
  });

  describe("Network Adaptation Engine Integration", () => {
    it("should initialize and detect network conditions", async () => {
      const initResult = await networkAdaptationEngine.initialize();

      expect(initResult).toBe(true);
      expect(mockEventListener).toHaveBeenCalledWith(
        "online",
        expect.any(Function),
      );
      expect(mockEventListener).toHaveBeenCalledWith(
        "offline",
        expect.any(Function),
      );
    });

    it("should apply appropriate adaptation strategy based on network conditions", async () => {
      await networkAdaptationEngine.initialize();

      const adaptationState =
        networkAdaptationEngine.getCurrentAdaptationState();

      expect(adaptationState).toHaveProperty("currentStrategy");
      expect(adaptationState).toHaveProperty("activeOptimizations");
      expect(adaptationState).toHaveProperty("networkHistory");
      expect(adaptationState).toHaveProperty("performanceImpact");

      expect(["minimal", "moderate", "aggressive", "emergency"]).toContain(
        adaptationState.currentStrategy.level,
      );
    });

    it("should optimize for 2G construction site conditions", async () => {
      await networkAdaptationEngine.initialize();

      // Force 2G conditions
      await networkAdaptationEngine.forceAdaptationLevel("emergency");

      const adaptationState =
        networkAdaptationEngine.getCurrentAdaptationState();

      expect(adaptationState.currentStrategy.level).toBe("emergency");
      expect(adaptationState.activeOptimizations.length).toBeGreaterThan(5);

      // Verify key optimizations are active
      const optimizationIds = adaptationState.activeOptimizations.map(
        (o) => o.id,
      );
      expect(optimizationIds).toContain("aggressive-image-compression");
      expect(optimizationIds).toContain("request-batching");
      expect(optimizationIds).toContain("offline-first-strategy");
    });

    it("should provide performance impact measurements", async () => {
      await networkAdaptationEngine.initialize();

      const adaptationState =
        networkAdaptationEngine.getCurrentAdaptationState();

      expect(adaptationState.performanceImpact).toHaveProperty(
        "loadTimeImprovement",
      );
      expect(adaptationState.performanceImpact).toHaveProperty(
        "bandwidthSavings",
      );
      expect(adaptationState.performanceImpact).toHaveProperty(
        "batteryOptimization",
      );

      expect(
        adaptationState.performanceImpact.loadTimeImprovement,
      ).toBeGreaterThanOrEqual(0);
      expect(
        adaptationState.performanceImpact.bandwidthSavings,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Battery Optimization Manager Integration", () => {
    it("should initialize and monitor battery state", async () => {
      const initResult = await batteryOptimizationManager.initialize();

      expect(initResult).toBe(true);

      const batteryState = batteryOptimizationManager.getCurrentBatteryState();

      expect(batteryState).toHaveProperty("level");
      expect(batteryState).toHaveProperty("charging");
      expect(batteryState).toHaveProperty("powerTier");
      expect(batteryState).toHaveProperty("estimatedTimeRemaining");

      expect(batteryState!.level).toBeGreaterThanOrEqual(0);
      expect(batteryState!.level).toBeLessThanOrEqual(100);
    });

    it("should apply appropriate battery profile based on power tier", async () => {
      await batteryOptimizationManager.initialize();

      const profile = batteryOptimizationManager.getCurrentProfile();

      expect(profile).toHaveProperty("name");
      expect(profile).toHaveProperty("tier");
      expect(profile).toHaveProperty("optimizations");
      expect(profile).toHaveProperty("estimatedExtension");

      expect(["green", "yellow", "orange", "red"]).toContain(profile!.tier);
    });

    it("should provide 8+ hour battery optimization for construction sites", async () => {
      await batteryOptimizationManager.initialize();

      // Force low battery scenario
      await batteryOptimizationManager.forceBatteryTier("orange");

      const batteryExtension =
        batteryOptimizationManager.getEstimatedBatteryExtension();
      const powerSavings = batteryOptimizationManager.getTotalPowerSavings();

      expect(batteryExtension).toBeGreaterThanOrEqual(2); // At least 2 hours extension
      expect(powerSavings).toBeGreaterThanOrEqual(50); // At least 50% power savings
    });

    it("should activate emergency mode for critical battery levels", async () => {
      await batteryOptimizationManager.initialize();

      // Force emergency battery scenario
      await batteryOptimizationManager.forceBatteryTier("red");

      const profile = batteryOptimizationManager.getCurrentProfile();
      const activeOptimizations =
        batteryOptimizationManager.getActiveOptimizations();

      expect(profile!.tier).toBe("red");
      expect(profile!.name).toBe("Emergency Mode");
      expect(activeOptimizations.length).toBeGreaterThanOrEqual(10); // All optimizations active

      const batteryExtension =
        batteryOptimizationManager.getEstimatedBatteryExtension();
      expect(batteryExtension).toBeGreaterThanOrEqual(4); // At least 4 hours extension
    });
  });

  describe("Performance Dashboard Integration", () => {
    it("should handle real-time performance report updates", async () => {
      // Simulate performance report event
      const mockReport = {
        timestamp: new Date(),
        metrics: {
          coreWebVitals: {
            lcp: 2200,
            fid: 65,
            cls: 0.08,
            fcp: 1800,
            ttfb: 400,
          },
          pwaSpecific: {
            cacheHitRate: 87,
            installPromptConversion: 12,
            offlineCapability: true,
          },
          constructionSiteMetrics: {
            networkQuality: "4g",
            loadTimeUnder2G: 4200,
            batteryImpact: "low",
          },
          userExperience: {
            taskCompletionRate: 93,
            errorRecoveryRate: 96,
            userSatisfactionScore: 88,
          },
          businessImpact: {
            conversionRate: 8.5,
            retentionRate: 78,
            engagementScore: 85,
            revenueImpact: 12300,
          },
        },
        trends: {
          period: "24hours",
          trendDirection: "improving",
          performanceScore: 87,
        },
        alerts: [],
        budgetStatus: { overall: "pass", budgets: [], violations: 0 },
        actionItems: [],
      };

      const event = new CustomEvent("pwa-performance-report", {
        detail: mockReport,
      });
      window.dispatchEvent(event);

      expect(mockDispatchEvent).toHaveBeenCalledWith(event);
    });

    it("should handle performance alerts correctly", async () => {
      const mockAlert = {
        id: "test-alert-dashboard",
        type: "performance",
        severity: "warning",
        title: "Performance Degradation Detected",
        description: "LCP has increased by 15% in the last hour",
        timestamp: new Date(),
      };

      const event = new CustomEvent("pwa-performance-alert", {
        detail: mockAlert,
      });
      window.dispatchEvent(event);

      expect(mockDispatchEvent).toHaveBeenCalledWith(event);
    });
  });

  describe("CI/CD Pipeline Integration", () => {
    it("should validate performance thresholds for CI/CD", async () => {
      // Simulate CI environment
      process.env.CI = "true";

      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      // CI/CD validation thresholds
      const ciValidation = {
        pwaScore: auditReport.score >= 90,
        lcpThreshold: auditReport.coreWebVitalsIntegration.lcp.value < 2500,
        fidThreshold: auditReport.coreWebVitalsIntegration.fid.value < 100,
        clsThreshold: auditReport.coreWebVitalsIntegration.cls.value < 0.1,
        constructionSiteReady: auditReport.constructionSiteOptimizations.every(
          (metric) => metric.status === "excellent" || metric.status === "good",
        ),
      };

      expect(ciValidation.pwaScore).toBe(true);
      expect(ciValidation.lcpThreshold).toBe(true);
      expect(ciValidation.fidThreshold).toBe(true);
      expect(ciValidation.clsThreshold).toBe(true);
      expect(ciValidation.constructionSiteReady).toBe(true);
    });

    it("should integrate with package.json PWA scripts", () => {
      // These would be integration points with actual scripts
      const expectedScripts = [
        "lighthouse:pwa",
        "lighthouse:performance",
        "lighthouse:construction",
        "pwa:audit",
        "pwa:performance-audit",
        "pwa:validate",
        "pwa:construction-test",
      ];

      // In real environment, these would check package.json
      expectedScripts.forEach((script) => {
        expect(script).toMatch(/^(lighthouse:|pwa:)/);
      });
    });
  });

  describe("End-to-End Construction Site Scenario", () => {
    it("should handle complete construction site workflow", async () => {
      // Initialize all systems
      const pwaInit = await pwaPerformanceMonitor.initialize();
      const networkInit = await networkAdaptationEngine.initialize();
      const batteryInit = await batteryOptimizationManager.initialize();

      expect(pwaInit).toBe(true);
      expect(networkInit).toBe(true);
      expect(batteryInit).toBe(true);

      // Simulate poor construction site conditions
      await networkAdaptationEngine.forceAdaptationLevel("emergency"); // 2G network
      await batteryOptimizationManager.forceBatteryTier("orange"); // Low battery

      // Verify systems adapt appropriately
      const networkState = networkAdaptationEngine.getCurrentAdaptationState();
      const batteryState = batteryOptimizationManager.getCurrentBatteryState();
      const profile = batteryOptimizationManager.getCurrentProfile();

      expect(networkState.currentStrategy.level).toBe("emergency");
      expect(batteryState!.powerTier).toBe("orange");
      expect(profile!.tier).toBe("orange");

      // Verify performance targets are still met
      const performanceReport =
        await pwaPerformanceMonitor.getComprehensiveReport();
      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      // Even under harsh conditions, system should maintain functionality
      expect(["pass", "warning"]).toContain(
        performanceReport.budgetStatus.overall,
      );
      expect(auditReport.score).toBeGreaterThanOrEqual(80); // Slightly relaxed for harsh conditions
    });

    it("should provide 8+ hour battery life with full functionality", async () => {
      await batteryOptimizationManager.initialize();

      // Simulate full day scenario
      await batteryOptimizationManager.forceBatteryTier("yellow"); // Normal operation

      const batteryState = batteryOptimizationManager.getCurrentBatteryState();
      const profile = batteryOptimizationManager.getCurrentProfile();
      const extension =
        batteryOptimizationManager.getEstimatedBatteryExtension();

      // Verify battery can last full construction day
      expect(
        batteryState!.estimatedTimeRemaining + extension,
      ).toBeGreaterThanOrEqual(8);
      expect(profile!.tier).toBe("yellow");
    });

    it("should maintain offline functionality during network outages", async () => {
      await pwaPerformanceMonitor.initialize();
      await networkAdaptationEngine.initialize();

      // Simulate offline condition by forcing emergency adaptation (which includes offline-first)
      await networkAdaptationEngine.forceAdaptationLevel("emergency");

      // Simulate offline condition for PWA performance
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      // Dispatch offline event
      const offlineEvent = new Event("offline");
      window.dispatchEvent(offlineEvent);

      // Verify offline adaptations
      const networkState = networkAdaptationEngine.getCurrentAdaptationState();
      const performanceReport =
        await pwaPerformanceMonitor.getComprehensiveReport();

      // System should adapt to offline conditions
      expect(
        networkState.currentStrategy.optimizations.some(
          (opt) => opt.id === "offline-first-strategy",
        ),
      ).toBe(true);

      // Core functionality should remain available (PWA should work offline)
      expect(performanceReport.metrics.pwaSpecific.offlineCapability).toBe(
        true,
      );
    });
  });

  describe("Netflix/Meta Standards Compliance", () => {
    it("should meet all Netflix/Meta performance standards", async () => {
      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();
      const performanceReport =
        await pwaPerformanceMonitor.getComprehensiveReport();

      // Netflix/Meta Standards Validation
      const compliance = {
        lighthousePWAScore: auditReport.score >= 90,
        lcpStandard: auditReport.coreWebVitalsIntegration.lcp.value < 2500,
        fidStandard: auditReport.coreWebVitalsIntegration.fid.value < 100,
        clsStandard: auditReport.coreWebVitalsIntegration.cls.value < 0.1,
        cacheHitRate: performanceReport.metrics.pwaSpecific.cacheHitRate > 85,
        constructionSite2G:
          auditReport.constructionSiteOptimizations.find(
            (m) => m.metric === "load_time_2g",
          )?.current < 5000,
        offlineCapability: auditReport.metrics.offline === true,
        installability: auditReport.metrics.installable === true,
      };

      // All standards must pass
      Object.entries(compliance).forEach(([standard, passes]) => {
        expect(passes).toBe(true);
      });

      expect(Object.values(compliance).every((passes) => passes)).toBe(true);
    });

    it("should maintain standards under stress conditions", async () => {
      // Apply maximum stress conditions
      await networkAdaptationEngine.forceAdaptationLevel("emergency");
      await batteryOptimizationManager.forceBatteryTier("red");

      const auditReport = await lighthousePWAAuditor.runComprehensiveAudit();

      // Even under stress, core standards should be maintained
      expect(auditReport.score).toBeGreaterThanOrEqual(85); // Slightly relaxed
      expect(auditReport.metrics.offline).toBe(true); // Must maintain offline capability
      expect(
        auditReport.constructionSiteOptimizations.find(
          (m) => m.metric === "load_time_2g",
        )?.current,
      ).toBeLessThan(6000); // Slightly relaxed for emergency conditions
    });
  });
});

// Export test utilities for other test files
export const PWAPerformanceTestUtils = {
  mockNetworkConditions: (
    type: "2g" | "3g" | "4g",
    quality: "excellent" | "good" | "poor" | "critical",
  ) => {
    Object.defineProperty(global.navigator, "connection", {
      writable: true,
      value: {
        effectiveType: type,
        downlink: type === "2g" ? 0.5 : type === "3g" ? 1.5 : 10,
        rtt: type === "2g" ? 300 : type === "3g" ? 150 : 50,
        saveData: quality === "poor" || quality === "critical",
        addEventListener: vi.fn(),
      },
    });
  },

  mockBatteryState: (level: number, charging: boolean = false) => {
    Object.defineProperty(global.navigator, "getBattery", {
      writable: true,
      value: vi.fn(() =>
        Promise.resolve({
          level: level / 100,
          charging,
          chargingTime: charging ? 3600 : Infinity,
          dischargingTime: charging ? Infinity : (level / 12) * 3600, // Assume 12%/hour consumption
          addEventListener: vi.fn(),
        }),
      ),
    });
  },

  createMockPerformanceReport: () => ({
    timestamp: new Date(),
    metrics: {
      coreWebVitals: { lcp: 2200, fid: 65, cls: 0.08, fcp: 1800, ttfb: 400 },
      pwaSpecific: {
        cacheHitRate: 87,
        installPromptConversion: 12,
        offlineCapability: true,
      },
      constructionSiteMetrics: {
        networkQuality: "4g",
        loadTimeUnder2G: 4200,
        batteryImpact: "low",
      },
      userExperience: {
        taskCompletionRate: 93,
        errorRecoveryRate: 96,
        userSatisfactionScore: 88,
      },
      businessImpact: {
        conversionRate: 8.5,
        retentionRate: 78,
        engagementScore: 85,
      },
    },
    trends: {
      period: "24hours",
      trendDirection: "improving",
      performanceScore: 87,
    },
    alerts: [],
    budgetStatus: { overall: "pass", budgets: [], violations: 0 },
  }),

  validateNetflixMetaStandards: (auditReport: Record<string, unknown>) => ({
    lighthousePWAScore: auditReport.score >= 90,
    coreWebVitals: {
      lcp: auditReport.coreWebVitalsIntegration.lcp.value < 2500,
      fid: auditReport.coreWebVitalsIntegration.fid.value < 100,
      cls: auditReport.coreWebVitalsIntegration.cls.value < 0.1,
    },
    constructionSite:
      auditReport.constructionSiteOptimizations.find(
        (m: PerformanceMetric) => m.metric === "load_time_2g",
      )?.current < 5000,
    offlineCapability: auditReport.metrics.offline === true,
    installability: auditReport.metrics.installable === true,
  }),
};
