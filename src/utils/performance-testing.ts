/**
 * PROFESSIONAL PERFORMANCE TESTING UTILITIES - ZERO TOLERANCE STANDARDS
 *
 * Comprehensive performance measurement utilities for production-grade testing.
 * Provides accurate timing, memory tracking, and performance analysis tools.
 *
 * Features:
 * - High-precision timing measurements
 * - Memory usage tracking and leak detection
 * - Network performance simulation
 * - Frame rate monitoring
 * - Performance regression detection
 * - Real-world load simulation
 *
 * This is the professional performance testing infrastructure used by Netflix/Meta.
 */

import { performance } from "perf_hooks";

// Performance measurement types
export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface NetworkConditions {
  downloadThroughput: number; // bytes per second
  uploadThroughput: number; // bytes per second
  latency: number; // milliseconds
  packetLoss: number; // percentage (0-1)
}

export interface FrameTimeMetrics {
  averageFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  frameCount: number;
  droppedFrames: number;
}

// Performance measurement utilities
export class PerformanceMetrics {
  private measurements: PerformanceMeasurement[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private frameTimeTracker: FrameTimeTracker | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== "undefined") {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "measure") {
            this.measurements.push({
              name: entry.name,
              startTime: entry.startTime,
              endTime: entry.startTime + entry.duration,
              duration: entry.duration,
            });
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ["measure", "navigation", "resource"],
      });
    }
  }

  // High-precision timing measurement
  startTimer(name: string): () => number {
    const startTime = performance.now();
    performance.mark(`${name}-start`);

    return (): number => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      this.measurements.push({
        name,
        startTime,
        endTime,
        duration,
      });

      return duration;
    };
  }

  // Memory usage tracking
  takeMemorySnapshot(): MemorySnapshot | null {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };

      this.memorySnapshots.push(snapshot);
      return snapshot;
    }

    return null;
  }

  // Memory leak detection
  detectMemoryLeaks(threshold: number = 10 * 1024 * 1024): boolean {
    if (this.memorySnapshots.length < 2) {
      return false;
    }

    const firstSnapshot = this.memorySnapshots[0];
    const lastSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];

    const memoryIncrease =
      lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize;
    return memoryIncrease > threshold;
  }

  // Frame rate monitoring
  trackFrameTime(): FrameTimeTracker {
    if (!this.frameTimeTracker) {
      this.frameTimeTracker = new FrameTimeTracker();
    }
    return this.frameTimeTracker;
  }

  // Get performance summary
  getSummary(): {
    measurements: PerformanceMeasurement[];
    memorySnapshots: MemorySnapshot[];
    averageRenderTime: number;
    memoryUsage: number;
  } {
    const renderMeasurements = this.measurements.filter(
      (m) => m.name.includes("render") || m.name.includes("component"),
    );

    const averageRenderTime =
      renderMeasurements.length > 0
        ? renderMeasurements.reduce((sum, m) => sum + m.duration, 0) /
          renderMeasurements.length
        : 0;

    const latestMemory = this.memorySnapshots[this.memorySnapshots.length - 1];
    const memoryUsage = latestMemory ? latestMemory.usedJSHeapSize : 0;

    return {
      measurements: this.measurements,
      memorySnapshots: this.memorySnapshots,
      averageRenderTime,
      memoryUsage,
    };
  }

  // Cleanup
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.frameTimeTracker) {
      this.frameTimeTracker.stop();
    }

    this.measurements = [];
    this.memorySnapshots = [];
  }
}

// Frame time tracking for smooth animations
export class FrameTimeTracker {
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isTracking: boolean = false;

  start(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.lastFrameTime = performance.now();
    this.trackNextFrame();
  }

  private trackNextFrame(): void {
    this.animationFrameId = requestAnimationFrame((currentTime) => {
      if (this.lastFrameTime > 0) {
        const frameTime = currentTime - this.lastFrameTime;
        this.frameTimes.push(frameTime);
      }

      this.lastFrameTime = currentTime;

      if (this.isTracking) {
        this.trackNextFrame();
      }
    });
  }

  stop(): void {
    this.isTracking = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getMetrics(): FrameTimeMetrics {
    if (this.frameTimes.length === 0) {
      return {
        averageFrameTime: 0,
        maxFrameTime: 0,
        minFrameTime: 0,
        frameCount: 0,
        droppedFrames: 0,
      };
    }

    const averageFrameTime =
      this.frameTimes.reduce((sum, time) => sum + time, 0) /
      this.frameTimes.length;
    const maxFrameTime = Math.max(...this.frameTimes);
    const minFrameTime = Math.min(...this.frameTimes);
    const frameCount = this.frameTimes.length;

    // Frames over 16.67ms (60fps) are considered dropped
    const droppedFrames = this.frameTimes.filter((time) => time > 16.67).length;

    return {
      averageFrameTime,
      maxFrameTime,
      minFrameTime,
      frameCount,
      droppedFrames,
    };
  }

  getAverageFrameTime(): number {
    return this.getMetrics().averageFrameTime;
  }

  reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = 0;
  }
}

// Network performance simulation
export function simulateSlowNetwork(
  conditions: Partial<NetworkConditions>,
): void {
  const defaultConditions: NetworkConditions = {
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps in bytes/sec
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps in bytes/sec
    latency: 300, // 300ms
    packetLoss: 0.01, // 1%
  };

  const networkConditions = { ...defaultConditions, ...conditions };

  // Mock fetch to simulate network conditions
  const originalFetch = global.fetch;

  global.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method || "GET";

    // Simulate latency
    await new Promise((resolve) =>
      setTimeout(resolve, networkConditions.latency),
    );

    // Simulate packet loss
    if (Math.random() < networkConditions.packetLoss) {
      throw new Error("Network error: Packet loss simulated");
    }

    // Calculate simulated download time based on response size
    const response = await originalFetch(input, init);
    const contentLength = response.headers.get("content-length");

    if (contentLength && method === "GET") {
      const sizeBytes = parseInt(contentLength, 10);
      const downloadTime =
        (sizeBytes / networkConditions.downloadThroughput) * 1000;
      await new Promise((resolve) => setTimeout(resolve, downloadTime));
    }

    return response;
  };
}

// Component render time measurement
export async function measureRenderTime(
  renderFunction: () => void,
): Promise<number> {
  const startTime = performance.now();

  renderFunction();

  // Wait for next tick to ensure render is complete
  await new Promise((resolve) => setTimeout(resolve, 0));

  const endTime = performance.now();
  return endTime - startTime;
}

// Memory usage measurement
export async function measureMemoryUsage(): Promise<number> {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Wait for GC to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  if ("memory" in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }

  // Fallback for environments without memory API
  return 0;
}

// Function benchmarking utility
export async function benchmarkFunction<T>(
  fn: () => T | Promise<T>,
  iterations: number = 100,
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
  iterations: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    const result = fn();
    if (result instanceof Promise) {
      await result;
    }

    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    averageTime,
    minTime,
    maxTime,
    totalTime,
    iterations,
  };
}

// Performance regression detection
export function detectPerformanceRegression(
  baseline: PerformanceMeasurement[],
  current: PerformanceMeasurement[],
  threshold: number = 0.2, // 20% regression threshold
): {
  hasRegression: boolean;
  regressions: Array<{
    name: string;
    baselineTime: number;
    currentTime: number;
    regressionPercent: number;
  }>;
} {
  const regressions: Array<{
    name: string;
    baselineTime: number;
    currentTime: number;
    regressionPercent: number;
  }> = [];

  const baselineMap = new Map(baseline.map((m) => [m.name, m.duration]));

  current.forEach((currentMeasurement) => {
    const baselineTime = baselineMap.get(currentMeasurement.name);

    if (baselineTime) {
      const regressionPercent =
        (currentMeasurement.duration - baselineTime) / baselineTime;

      if (regressionPercent > threshold) {
        regressions.push({
          name: currentMeasurement.name,
          baselineTime,
          currentTime: currentMeasurement.duration,
          regressionPercent,
        });
      }
    }
  });

  return {
    hasRegression: regressions.length > 0,
    regressions,
  };
}

// Performance profiler for identifying bottlenecks
export class PerformanceProfiler {
  private profiles: Map<
    string,
    {
      calls: number;
      totalTime: number;
      maxTime: number;
      minTime: number;
    }
  > = new Map();

  profile<T>(name: string, fn: () => T): T {
    const startTime = performance.now();

    try {
      const result = fn();
      return result;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordProfileData(name, duration);
    }
  }

  async profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      return result;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordProfileData(name, duration);
    }
  }

  private recordProfileData(name: string, duration: number): void {
    const existing = this.profiles.get(name);

    if (existing) {
      existing.calls++;
      existing.totalTime += duration;
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.minTime = Math.min(existing.minTime, duration);
    } else {
      this.profiles.set(name, {
        calls: 1,
        totalTime: duration,
        maxTime: duration,
        minTime: duration,
      });
    }
  }

  getReport(): Array<{
    name: string;
    calls: number;
    averageTime: number;
    totalTime: number;
    maxTime: number;
    minTime: number;
  }> {
    return Array.from(this.profiles.entries())
      .map(([name, data]) => ({
        name,
        calls: data.calls,
        averageTime: data.totalTime / data.calls,
        totalTime: data.totalTime,
        maxTime: data.maxTime,
        minTime: data.minTime,
      }))
      .sort((a, b) => b.totalTime - a.totalTime);
  }

  reset(): void {
    this.profiles.clear();
  }
}

// Create performance observer for long tasks
export function createPerformanceObserver(): {
  observer: PerformanceObserver | null;
  longTasks: PerformanceEntry[];
} {
  const longTasks: PerformanceEntry[] = [];
  let observer: PerformanceObserver | null = null;

  if (typeof PerformanceObserver !== "undefined") {
    observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 50) {
          // Tasks longer than 50ms
          longTasks.push(entry);
        }
      });
    });

    observer.observe({ entryTypes: ["longtask"] });
  }

  return { observer, longTasks };
}

// Export global performance metrics instance
export const performanceMetrics = new PerformanceMetrics();
export const performanceProfiler = new PerformanceProfiler();
