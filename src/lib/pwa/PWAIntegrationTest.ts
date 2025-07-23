/**
 * PWA INTEGRATION TEST - ELITE VALIDATION SYSTEM
 *
 * Comprehensive PWA integration testing and validation for Netflix/Meta
 * reliability standards. Tests all PWA managers and their integration
 * with the main application lifecycle.
 *
 * @author STR Certified Engineering Team
 */

import { logger } from "@/utils/logger";
import { serviceWorkerManager } from "./ServiceWorkerManager";
import { offlineStatusManager } from "./OfflineStatusManager";
import { installPromptHandler } from "./InstallPromptHandler";

export interface PWAIntegrationTestResult {
  passed: boolean;
  score: number; // 0-100
  category: "excellent" | "good" | "fair" | "poor" | "failed";
  results: {
    serviceWorker: TestResult;
    offlineManager: TestResult;
    installPrompt: TestResult;
    integration: TestResult;
    performance: TestResult;
  };
  recommendations: string[];
  errors: string[];
}

interface TestResult {
  passed: boolean;
  score: number;
  tests: {
    name: string;
    passed: boolean;
    message: string;
    critical: boolean;
  }[];
}

export class PWAIntegrationTester {
  private static instance: PWAIntegrationTester;

  static getInstance(): PWAIntegrationTester {
    if (!PWAIntegrationTester.instance) {
      PWAIntegrationTester.instance = new PWAIntegrationTester();
    }
    return PWAIntegrationTester.instance;
  }

  /**
   * Run comprehensive PWA integration tests
   */
  async runIntegrationTests(): Promise<PWAIntegrationTestResult> {
    logger.info("🧪 Starting PWA Integration Tests", {}, "PWA_TEST");

    const results = {
      serviceWorker: await this.testServiceWorker(),
      offlineManager: await this.testOfflineManager(),
      installPrompt: await this.testInstallPrompt(),
      integration: await this.testIntegration(),
      performance: await this.testPerformance(),
    };

    // Calculate overall score
    const totalScore = Object.values(results).reduce(
      (sum, result) => sum + result.score,
      0,
    );
    const avgScore = totalScore / Object.keys(results).length;

    // Determine category
    let category: PWAIntegrationTestResult["category"];
    if (avgScore >= 90) category = "excellent";
    else if (avgScore >= 80) category = "good";
    else if (avgScore >= 70) category = "fair";
    else if (avgScore >= 60) category = "poor";
    else category = "failed";

    // Check if all critical tests passed
    const criticalTestsFailed = Object.values(results).some((result) =>
      result.tests.some((test) => test.critical && !test.passed),
    );

    const passed = !criticalTestsFailed && avgScore >= 70;

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, avgScore);

    // Collect errors
    const errors = Object.values(results).flatMap((result) =>
      result.tests
        .filter((test) => !test.passed && test.critical)
        .map((test) => test.message),
    );

    const finalResult: PWAIntegrationTestResult = {
      passed,
      score: Math.round(avgScore),
      category,
      results,
      recommendations,
      errors,
    };

    logger.info(
      "🎯 PWA Integration Tests Complete",
      {
        passed,
        score: finalResult.score,
        category,
        errorCount: errors.length,
      },
      "PWA_TEST",
    );

    return finalResult;
  }

  private async testServiceWorker(): Promise<TestResult> {
    const tests = [];

    // Test 1: Service Worker Support
    tests.push({
      name: "Browser supports Service Workers",
      passed: "serviceWorker" in navigator,
      message:
        "serviceWorker" in navigator
          ? "Service Worker API supported"
          : "Service Worker not supported in this browser",
      critical: true,
    });

    // Test 2: Manager initialization
    let swStatus = null;
    try {
      swStatus = serviceWorkerManager.getStatus();
      tests.push({
        name: "Service Worker Manager accessible",
        passed: true,
        message: "Service Worker Manager initialized successfully",
        critical: true,
      });
    } catch (error) {
      tests.push({
        name: "Service Worker Manager accessible",
        passed: false,
        message: `Service Worker Manager initialization failed: ${error.message}`,
        critical: true,
      });
    }

    // Test 3: Service Worker registration
    if (swStatus) {
      tests.push({
        name: "Service Worker registration",
        passed: swStatus.isRegistered,
        message: swStatus.isRegistered
          ? "Service Worker registered successfully"
          : "Service Worker not registered",
        critical: false,
      });

      // Test 4: Service Worker controlling
      tests.push({
        name: "Service Worker controlling",
        passed: swStatus.isControlling,
        message: swStatus.isControlling
          ? "Service Worker is controlling the page"
          : "Service Worker not controlling (may be first load)",
        critical: false,
      });
    }

    // Test 5: Cache strategies
    try {
      const cacheNames = await caches.keys();
      const hasAppShellCache = cacheNames.some((name) =>
        name.includes("app-shell"),
      );
      tests.push({
        name: "Cache strategies active",
        passed: hasAppShellCache,
        message: hasAppShellCache
          ? "App shell cache found"
          : "No app shell cache found",
        critical: false,
      });
    } catch (error) {
      tests.push({
        name: "Cache strategies active",
        passed: false,
        message: `Cache test failed: ${error.message}`,
        critical: false,
      });
    }

    const passedCount = tests.filter((t) => t.passed).length;
    const score = (passedCount / tests.length) * 100;

    return {
      passed: tests.filter((t) => t.critical).every((t) => t.passed),
      score: Math.round(score),
      tests,
    };
  }

  private async testOfflineManager(): Promise<TestResult> {
    const tests = [];

    // Test 1: Manager accessibility
    let networkStatus = null;
    try {
      networkStatus = offlineStatusManager.getNetworkStatus();
      tests.push({
        name: "Offline Manager accessible",
        passed: true,
        message: "Offline Status Manager accessible",
        critical: true,
      });
    } catch (error) {
      tests.push({
        name: "Offline Manager accessible",
        passed: false,
        message: `Offline Manager failed: ${error.message}`,
        critical: true,
      });
    }

    // Test 2: Network status detection
    if (networkStatus) {
      tests.push({
        name: "Network status detection",
        passed: typeof networkStatus.isOnline === "boolean",
        message: `Network online status: ${networkStatus.isOnline}`,
        critical: true,
      });

      // Test 3: Network quality assessment
      tests.push({
        name: "Network quality assessment",
        passed:
          networkStatus.quality && networkStatus.quality.category !== undefined,
        message: `Network quality: ${networkStatus.quality?.category || "unknown"}`,
        critical: false,
      });

      // Test 4: Connection type detection
      tests.push({
        name: "Connection type detection",
        passed: typeof networkStatus.connectionType === "string",
        message: `Connection type: ${networkStatus.connectionType}`,
        critical: false,
      });
    }

    // Test 5: Retry queue functionality
    try {
      const queueStatus = offlineStatusManager.getRetryQueueStatus();
      tests.push({
        name: "Retry queue functional",
        passed: typeof queueStatus.totalItems === "number",
        message: `Retry queue items: ${queueStatus.totalItems}`,
        critical: false,
      });
    } catch (error) {
      tests.push({
        name: "Retry queue functional",
        passed: false,
        message: `Retry queue test failed: ${error.message}`,
        critical: false,
      });
    }

    const passedCount = tests.filter((t) => t.passed).length;
    const score = (passedCount / tests.length) * 100;

    return {
      passed: tests.filter((t) => t.critical).every((t) => t.passed),
      score: Math.round(score),
      tests,
    };
  }

  private async testInstallPrompt(): Promise<TestResult> {
    const tests = [];

    // Test 1: Manager accessibility
    let installState = null;
    try {
      installState = await installPromptHandler.getInstallState();
      tests.push({
        name: "Install Prompt Manager accessible",
        passed: true,
        message: "Install Prompt Handler accessible",
        critical: true,
      });
    } catch (error) {
      tests.push({
        name: "Install Prompt Manager accessible",
        passed: false,
        message: `Install Prompt Manager failed: ${error.message}`,
        critical: true,
      });
    }

    // Test 2: Installation state detection
    if (installState) {
      tests.push({
        name: "Installation state detection",
        passed: typeof installState.isInstalled === "boolean",
        message: `App installed: ${installState.isInstalled}`,
        critical: false,
      });

      // Test 3: Prompt capability detection
      tests.push({
        name: "Prompt capability detection",
        passed: typeof installState.canPrompt === "boolean",
        message: `Can show prompt: ${installState.canPrompt}`,
        critical: false,
      });

      // Test 4: Platform detection
      tests.push({
        name: "Platform detection",
        passed: typeof installState.isIOS === "boolean",
        message: `iOS platform: ${installState.isIOS}`,
        critical: false,
      });
    }

    // Test 5: BeforeInstallPrompt support
    const hasBeforeInstallPrompt = "onbeforeinstallprompt" in window;
    tests.push({
      name: "BeforeInstallPrompt support",
      passed: hasBeforeInstallPrompt,
      message: hasBeforeInstallPrompt
        ? "BeforeInstallPrompt event supported"
        : "BeforeInstallPrompt not supported (may be iOS)",
      critical: false,
    });

    const passedCount = tests.filter((t) => t.passed).length;
    const score = (passedCount / tests.length) * 100;

    return {
      passed: tests.filter((t) => t.critical).every((t) => t.passed),
      score: Math.round(score),
      tests,
    };
  }

  private async testIntegration(): Promise<TestResult> {
    const tests = [];

    // Test 1: Global PWA status
    const globalPWAStatus = (window as any).__PWA_STATUS__;
    tests.push({
      name: "Global PWA status available",
      passed: !!globalPWAStatus,
      message: globalPWAStatus
        ? "Global PWA status initialized"
        : "Global PWA status not found",
      critical: true,
    });

    // Test 2: All managers initialized
    if (globalPWAStatus) {
      tests.push({
        name: "Service Worker initialized",
        passed: globalPWAStatus.serviceWorker === true,
        message: `Service Worker: ${globalPWAStatus.serviceWorker}`,
        critical: true,
      });

      tests.push({
        name: "Offline Manager initialized",
        passed: globalPWAStatus.offlineManager === true,
        message: `Offline Manager: ${globalPWAStatus.offlineManager}`,
        critical: true,
      });

      tests.push({
        name: "Install Prompt initialized",
        passed: globalPWAStatus.installPrompt === true,
        message: `Install Prompt: ${globalPWAStatus.installPrompt}`,
        critical: true,
      });

      // Test 3: All systems ready
      tests.push({
        name: "All PWA systems ready",
        passed: globalPWAStatus.allSystemsReady === true,
        message: `All systems ready: ${globalPWAStatus.allSystemsReady}`,
        critical: true,
      });
    }

    // Test 4: PWA manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    tests.push({
      name: "PWA manifest linked",
      passed: !!manifestLink,
      message: manifestLink
        ? `Manifest linked: ${manifestLink.getAttribute("href")}`
        : "No manifest link found",
      critical: true,
    });

    // Test 5: Viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    tests.push({
      name: "Viewport meta tag",
      passed: !!viewportMeta,
      message: viewportMeta
        ? "Viewport meta tag present"
        : "Viewport meta tag missing",
      critical: false,
    });

    const passedCount = tests.filter((t) => t.passed).length;
    const score = (passedCount / tests.length) * 100;

    return {
      passed: tests.filter((t) => t.critical).every((t) => t.passed),
      score: Math.round(score),
      tests,
    };
  }

  private async testPerformance(): Promise<TestResult> {
    const tests = [];

    // Test 1: Service Worker performance
    try {
      const swMetrics = serviceWorkerManager.getPerformanceMetrics();
      tests.push({
        name: "Service Worker metrics available",
        passed: typeof swMetrics.averageResponseTime === "number",
        message: `Avg response time: ${swMetrics.averageResponseTime}ms`,
        critical: false,
      });

      // Test 2: Cache hit rate (if available)
      if (swMetrics.hitRate > 0 || swMetrics.missRate > 0) {
        const hitRate =
          (swMetrics.hitRate / (swMetrics.hitRate + swMetrics.missRate)) * 100;
        tests.push({
          name: "Cache hit rate acceptable",
          passed: hitRate >= 50,
          message: `Cache hit rate: ${Math.round(hitRate)}%`,
          critical: false,
        });
      }
    } catch (error) {
      tests.push({
        name: "Service Worker metrics available",
        passed: false,
        message: `Performance metrics failed: ${error.message}`,
        critical: false,
      });
    }

    // Test 3: Storage quota
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usagePercent =
          estimate.usage && estimate.quota
            ? (estimate.usage / estimate.quota) * 100
            : 0;

        tests.push({
          name: "Storage usage reasonable",
          passed: usagePercent < 80,
          message: `Storage usage: ${Math.round(usagePercent)}%`,
          critical: false,
        });
      } catch (error) {
        tests.push({
          name: "Storage usage reasonable",
          passed: false,
          message: `Storage test failed: ${error.message}`,
          critical: false,
        });
      }
    }

    // Test 4: Network connectivity
    tests.push({
      name: "Network connectivity",
      passed: navigator.onLine,
      message: `Online: ${navigator.onLine}`,
      critical: false,
    });

    // Test 5: PWA display mode
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    tests.push({
      name: "PWA display mode",
      passed: isPWA,
      message: isPWA ? "Running in PWA mode" : "Running in browser mode",
      critical: false,
    });

    const passedCount = tests.filter((t) => t.passed).length;
    const score = tests.length > 0 ? (passedCount / tests.length) * 100 : 0;

    return {
      passed: tests.filter((t) => t.critical).every((t) => t.passed),
      score: Math.round(score),
      tests,
    };
  }

  private generateRecommendations(
    results: Record<string, unknown>,
    avgScore: number,
  ): string[] {
    const recommendations = [];

    if (avgScore < 90) {
      if (!(results.serviceWorker as Record<string, unknown>)?.passed) {
        recommendations.push(
          "Service Worker initialization failed - check browser support and HTTPS",
        );
      }

      if (!results.offlineManager.passed) {
        recommendations.push(
          "Offline Manager not functioning - verify network status detection",
        );
      }

      if (!results.installPrompt.passed) {
        recommendations.push(
          "Install Prompt Handler not accessible - check manager initialization",
        );
      }

      if (!results.integration.passed) {
        recommendations.push(
          "PWA integration incomplete - ensure all managers are initialized in main.tsx",
        );
      }
    }

    if (avgScore >= 80 && avgScore < 90) {
      recommendations.push(
        "Consider adding PWA status indicators to improve user experience",
      );
      recommendations.push(
        "Implement offline detection banners for better offline UX",
      );
    }

    if (avgScore >= 90) {
      recommendations.push(
        "PWA integration excellent - consider advanced features like background sync",
      );
      recommendations.push("Monitor performance metrics and cache hit rates");
    }

    return recommendations;
  }
}

// Export singleton instance
export const pwaIntegrationTester = PWAIntegrationTester.getInstance();
